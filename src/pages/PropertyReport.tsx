import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Video,
  MapPin,
  Calendar,
  BarChart3,
} from "lucide-react";
import logo from "@/assets/chekamlogo.png";

interface Property {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  property_type: string | null;
  description: string | null;
  status: string;
  submission_method: string;
  created_at: string;
}

interface VerificationResult {
  is_authentic: boolean;
  confidence_score: number;
  document_type_match: boolean;
  extracted_text_summary: string;
  key_details: {
    names: string[];
    dates: string[];
    registration_numbers: string[];
    issuing_authority: string;
  };
  red_flags: string[];
  summary: string;
}

interface DocRecord {
  id: string;
  file_name: string;
  document_type: string | null;
  verification_status: string;
  verification_result: VerificationResult | null;
  verified_at: string | null;
}

interface InspectionRecord {
  id: string;
  status: string;
  overall_score: number | null;
  ai_summary: string | null;
  created_at: string;
  scores: { category: string; score: number; remarks: string | null }[];
}

const PropertyReport = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user, hasRole } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!propertyId || !user) return;

      // Admins may view any property's report; regular users may view only their own
      const isAdmin = hasRole("admin");
      let propQuery = supabase.from("properties").select("*").eq("id", propertyId);
      if (!isAdmin) propQuery = propQuery.eq("user_id", user.id);
      const { data: prop } = await propQuery.single();

      if (!prop) {
        setLoading(false);
        return;
      }
      setProperty(prop as Property);

      const { data: docData } = await supabase
        .from("property_documents")
        .select("id, file_name, document_type, verification_status, verification_result, verified_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      setDocs((docData as any[]) || []);

      const { data: inspData } = await supabase
        .from("inspections")
        .select("id, status, overall_score, ai_summary, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      const inspectionsWithScores: InspectionRecord[] = [];
      for (const insp of inspData || []) {
        const { data: scoreData } = await supabase
          .from("inspection_scores")
          .select("category, score, remarks")
          .eq("inspection_id", insp.id)
          .order("created_at");
        inspectionsWithScores.push({
          ...insp,
          scores: (scoreData as any[]) || [],
        });
      }
      setInspections(inspectionsWithScores);
      setLoading(false);
    };
    load();
  }, [propertyId, user]);

  const handlePrint = () => {
    window.print();
  };

  const verifiedDocs = docs.filter((d) => d.verification_status === "verified");
  const flaggedDocs = docs.filter((d) => d.verification_status === "flagged");
  const allRedFlags = docs
    .flatMap((d) => d.verification_result?.red_flags || []);
  const avgConfidence =
    docs.filter((d) => d.verification_result?.confidence_score)
      .reduce((sum, d, _, arr) => sum + (d.verification_result!.confidence_score / arr.length), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Property not found.</p>
            <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — hidden in print */}
      <header className="border-b border-border bg-card print:hidden">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <img src={logo} alt="Chekam" className="h-7" />
            <h1 className="text-lg font-display font-bold truncate">Property Report</h1>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </header>

      <main ref={reportRef} className="container mx-auto px-4 py-8 max-w-3xl space-y-6 print:px-0 print:max-w-none">
        {/* Report Header */}
        <div className="text-center space-y-2 pb-4 border-b border-border">
          <img src={logo} alt="Chekam" className="h-10 mx-auto hidden print:block" />
          <h1 className="text-2xl font-display font-bold">{property.title}</h1>
          <p className="text-muted-foreground text-sm">
            Property Verification & Inspection Report
          </p>
          <p className="text-xs text-muted-foreground">
            Generated on {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Property Details */}
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Property Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Address</span>
                <p className="font-medium">
                  {[property.address, property.city, property.state].filter(Boolean).join(", ") || "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Property Type</span>
                <p className="font-medium">{property.property_type || "Not specified"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{property.status.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <p className="font-medium">{new Date(property.created_at).toLocaleDateString()}</p>
              </div>
              {property.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description</span>
                  <p className="font-medium">{property.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Overview */}
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Summary Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{docs.length}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">{verifiedDocs.length}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-destructive">{flaggedDocs.length}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{avgConfidence ? `${Math.round(avgConfidence)}%` : "N/A"}</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Verification Results */}
        {docs.length > 0 && (
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Document Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {docs.map((doc) => {
                const result = doc.verification_result;
                return (
                  <div key={doc.id} className="border border-border rounded-lg p-4 space-y-3 print:break-inside-avoid">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_type || "Unknown type"}</p>
                      </div>
                      <Badge
                        variant={doc.verification_status === "verified" ? "default" : doc.verification_status === "flagged" ? "destructive" : "outline"}
                        className="capitalize shrink-0"
                      >
                        {doc.verification_status}
                      </Badge>
                    </div>

                    {result && (
                      <>
                        <p className="text-sm">{result.summary}</p>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{result.confidence_score}%</span>
                          </div>
                          <Progress value={result.confidence_score} className="h-2" />
                        </div>

                        <div className="flex gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            {result.is_authentic ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldX className="h-3.5 w-3.5 text-destructive" />}
                            {result.is_authentic ? "Authentic" : "Concerns"}
                          </span>
                          <span className="flex items-center gap-1">
                            {result.document_type_match ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldAlert className="h-3.5 w-3.5 text-accent-foreground" />}
                            {result.document_type_match ? "Type Match" : "Type Mismatch"}
                          </span>
                        </div>

                        {result.key_details && (
                          <div className="text-xs bg-muted/50 rounded-lg p-3 space-y-1">
                            {result.key_details.names.length > 0 && <p><span className="font-medium">Names:</span> {result.key_details.names.join(", ")}</p>}
                            {result.key_details.dates.length > 0 && <p><span className="font-medium">Dates:</span> {result.key_details.dates.join(", ")}</p>}
                            {result.key_details.registration_numbers.length > 0 && <p><span className="font-medium">Reg #:</span> {result.key_details.registration_numbers.join(", ")}</p>}
                            {result.key_details.issuing_authority && <p><span className="font-medium">Authority:</span> {result.key_details.issuing_authority}</p>}
                          </div>
                        )}

                        {result.red_flags.length > 0 && (
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-destructive">Red Flags:</p>
                            <ul className="list-disc list-inside text-destructive space-y-0.5">
                              {result.red_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Inspection Scores */}
        {inspections.length > 0 && (
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" /> Inspection Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {inspections.map((insp) => (
                <div key={insp.id} className="space-y-3 print:break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Inspection — {new Date(insp.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{insp.status.replace("_", " ")}</Badge>
                      {insp.overall_score !== null && (
                        <Badge variant="default">{insp.overall_score}/100</Badge>
                      )}
                    </div>
                  </div>

                  {insp.ai_summary && (
                    <p className="text-sm text-muted-foreground">{insp.ai_summary}</p>
                  )}

                  {insp.scores.length > 0 && (
                    <div className="grid gap-2">
                      {insp.scores.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-32 shrink-0">{s.category}</span>
                          <Progress value={s.score} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8 text-right">{s.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Red Flags Summary */}
        {allRedFlags.length > 0 && (
          <Card className="border-destructive/30 print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="text-base text-destructive">⚠ All Red Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 list-disc list-inside text-destructive">
                {allRedFlags.map((flag, i) => <li key={i}>{flag}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border print:mt-8">
          <p>This report was generated by Chekam AI-Powered Property Verification Platform.</p>
          <p>Report ID: {propertyId} · {new Date().toISOString()}</p>
        </div>
      </main>
    </div>
  );
};

export default PropertyReport;
