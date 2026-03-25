import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Link2, Map, AlertCircle, CheckCircle2, Clock, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  property_type?: string;
  property_link?: string;
  submission_method: "document_upload" | "property_link" | "manual_entry";
  status: "draft" | "submitted" | "under_review" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
}

interface PropertyDocument {
  id: string;
  file_name: string;
  document_type: string;
  verification_status: "pending" | "verified" | "rejected";
}

interface Inspection {
  id: string;
  status: "pending" | "in_progress" | "completed" | "scored";
  inspector_id?: string;
  overall_score?: number;
  notes?: string;
  ai_summary?: string;
  updated_at: string;
}

interface Inspector {
  first_name?: string;
  last_name?: string;
}

const PropertyDetails = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [inspector, setInspector] = useState<Inspector | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || !user) return;

      try {
        // Fetch property
        const { data: prop, error: propErr } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .eq("user_id", user.id)
          .single();

        if (propErr) throw propErr;
        setProperty(prop);

        // Fetch documents if document_upload method
        if (prop.submission_method === "document_upload") {
          const { data: docs } = await supabase
            .from("property_documents")
            .select("id, file_name, document_type, verification_status")
            .eq("property_id", propertyId);
          setDocuments((docs as PropertyDocument[]) || []);
        }

        // Fetch inspection
        const { data: insp } = await supabase
          .from("inspections")
          .select("*")
          .eq("property_id", propertyId)
          .single();

        if (insp) {
          setInspection(insp);

          // Fetch inspector details if assigned
          if (insp.inspector_id) {
            const { data: inspectorData } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("user_id", insp.inspector_id)
              .single();
            setInspector(inspectorData);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load property");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Property Not Found</h2>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInspectionStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-orange-500" />;
      case "scored":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-display font-bold">Property Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Property Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl">{property.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted {new Date(property.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">
                  {property.submission_method.replace(/_/g, " ")}
                </Badge>
                <Badge className="capitalize">
                  {property.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Inspection Status */}
        {inspection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getInspectionStatusIcon(inspection.status)}
                Inspection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Timeline */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {["pending", "in_progress", "completed", "scored"].map((status, idx) => (
                    <div key={status} className="flex items-center flex-1">
                      <div
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          ["pending", "in_progress", "completed", "scored"].indexOf(inspection.status) >= idx
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      {idx < 3 && <div className="w-1 h-1" />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pending</span>
                  <span>In Progress</span>
                  <span>Completed</span>
                  <span>Scored</span>
                </div>
              </div>

              {/* Status Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Current Status</p>
                  <p className="text-sm font-medium capitalize">{inspection.status.replace(/_/g, " ")}</p>
                </div>
                {inspection.inspector_id && inspector && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Assigned Inspector</p>
                    <p className="text-sm font-medium">
                      {inspector.first_name} {inspector.last_name}
                    </p>
                  </div>
                )}
                {inspection.overall_score !== null && inspection.overall_score !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Risk Score</p>
                    <p className="text-sm font-medium text-primary">{inspection.overall_score}/10</p>
                  </div>
                )}
              </div>

              {/* Inspector Notes */}
              {inspection.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Inspector Notes</p>
                  <p className="text-sm">{inspection.notes}</p>
                </div>
              )}

              {/* AI Summary */}
              {inspection.ai_summary && (
                <div className="pt-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">AI Summary</p>
                  <p className="text-sm">{inspection.ai_summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submission Details Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={property.submission_method} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="document_upload" className="gap-1.5">
                  <FileText className="h-4 w-4" /> Documents
                </TabsTrigger>
                <TabsTrigger value="property_link" className="gap-1.5">
                  <Link2 className="h-4 w-4" /> Link
                </TabsTrigger>
                <TabsTrigger value="manual_entry" className="gap-1.5">
                  <Map className="h-4 w-4" /> Manual
                </TabsTrigger>
              </TabsList>

              {/* Documents Tab */}
              <TabsContent value="document_upload" className="mt-6 space-y-4">
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {doc.verification_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded</p>
                )}
              </TabsContent>

              {/* Property Link Tab */}
              <TabsContent value="property_link" className="mt-6 space-y-4">
                {property.property_link ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Listed Property URL</p>
                    <a
                      href={property.property_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {property.property_link}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No property link provided</p>
                )}
              </TabsContent>

              {/* Manual Entry Tab */}
              <TabsContent value="manual_entry" className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {property.address && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Address</p>
                      <p className="text-sm">{property.address}</p>
                    </div>
                  )}
                  {property.city && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">City</p>
                      <p className="text-sm">{property.city}</p>
                    </div>
                  )}
                  {property.state && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">State</p>
                      <p className="text-sm">{property.state}</p>
                    </div>
                  )}
                  {property.property_type && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Property Type</p>
                      <p className="text-sm">{property.property_type}</p>
                    </div>
                  )}
                </div>
                {property.description && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{property.description}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" asChild>
            <Link to={`/property/${property.id}/report`}>
              <FileBarChart className="h-4 w-4 mr-2" /> View Report
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
