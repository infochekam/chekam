import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/chekamlogo.png";

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

interface PropertyDoc {
  id: string;
  file_name: string;
  file_type: string | null;
  document_type: string | null;
  created_at: string;
  verification_status: string;
  verification_result: VerificationResult | null;
  verified_at: string | null;
  property_id: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Shield }> = {
  pending: { label: "Pending", variant: "outline", icon: Shield },
  processing: { label: "Processing…", variant: "secondary", icon: Shield },
  verified: { label: "Verified", variant: "default", icon: ShieldCheck },
  flagged: { label: "Flagged", variant: "destructive", icon: ShieldAlert },
  failed: { label: "Failed", variant: "destructive", icon: ShieldX },
};

const PropertyDocuments = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuth();
  const [docs, setDocs] = useState<PropertyDoc[]>([]);
  const [propertyTitle, setPropertyTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDocs = async () => {
    if (!propertyId) return;
    const { data: prop } = await supabase
      .from("properties")
      .select("title")
      .eq("id", propertyId)
      .single();
    if (prop) setPropertyTitle(prop.title);

    const { data, error } = await supabase
      .from("property_documents")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load documents");
    } else {
      setDocs((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [propertyId]);

  const handleVerify = async (docId: string) => {
    setVerifyingId(docId);
    try {
      const { data, error } = await supabase.functions.invoke("verify-document", {
        body: { document_id: docId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Document verified successfully");
      await fetchDocs();
      setExpandedId(docId);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={logo} alt="Chekam" className="h-7" />
          <h1 className="text-lg font-display font-bold truncate">Documents — {propertyTitle || "Property"}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : docs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No documents uploaded for this property.</CardContent></Card>
        ) : (
          docs.map((doc) => {
            const config = statusConfig[doc.verification_status] || statusConfig.pending;
            const isExpanded = expandedId === doc.id;
            const result = doc.verification_result as VerificationResult | null;

            return (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium truncate">{doc.file_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.document_type || "Unknown type"} · {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon status={doc.verification_status} />
                        {config.label}
                      </Badge>
                      {doc.verification_status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleVerify(doc.id)}
                          disabled={verifyingId === doc.id}
                        >
                          {verifyingId === doc.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Verifying…</> : "Verify"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {result && (
                  <>
                    <CardContent className="pt-0 pb-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? "Hide" : "View"} verification details
                      </button>
                    </CardContent>

                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4 border-t border-border pt-4">
                        {/* Summary */}
                        <p className="text-sm">{result.summary}</p>

                        {/* Confidence */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Confidence Score</span>
                            <span className="font-medium">{result.confidence_score}%</span>
                          </div>
                          <Progress value={result.confidence_score} className="h-2" />
                        </div>

                        {/* Checks */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            {result.is_authentic ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldX className="h-3.5 w-3.5 text-destructive" />}
                            <span>{result.is_authentic ? "Appears Authentic" : "Authenticity Concerns"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {result.document_type_match ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldAlert className="h-3.5 w-3.5 text-accent-foreground" />}
                            <span>{result.document_type_match ? "Type Matches" : "Type Mismatch"}</span>
                          </div>
                        </div>

                        {/* Extracted Info */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Information</h4>
                          <div className="text-sm bg-muted/50 rounded-lg p-3 space-y-1.5">
                            {result.key_details.names.length > 0 && (
                              <p><span className="font-medium">Names:</span> {result.key_details.names.join(", ")}</p>
                            )}
                            {result.key_details.dates.length > 0 && (
                              <p><span className="font-medium">Dates:</span> {result.key_details.dates.join(", ")}</p>
                            )}
                            {result.key_details.registration_numbers.length > 0 && (
                              <p><span className="font-medium">Reg. Numbers:</span> {result.key_details.registration_numbers.join(", ")}</p>
                            )}
                            {result.key_details.issuing_authority && (
                              <p><span className="font-medium">Issuing Authority:</span> {result.key_details.issuing_authority}</p>
                            )}
                          </div>
                        </div>

                        {/* OCR Summary */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">OCR Text Summary</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{result.extracted_text_summary}</p>
                        </div>

                        {/* Red Flags */}
                        {result.red_flags.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">⚠ Red Flags</h4>
                            <ul className="text-sm space-y-1">
                              {result.red_flags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-destructive">
                                  <span className="shrink-0">•</span>
                                  <span>{flag}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </>
                )}
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default PropertyDocuments;
