import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PropertyDocument {
  id: string;
  property_id: string;
  file_name: string;
  document_type: string;
  file_path: string;
  verification_status: "pending" | "verified" | "rejected";
  verification_notes?: string;
  properties: {
    id: string;
    title: string;
    user_id: string;
  } | null;
}

interface PendingDocument extends PropertyDocument {
  expandedNotes: string;
}

const DocumentVerification = () => {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    setLoading(true);
    try {
      const { data: docs, error } = await (supabase as any)
        .from("property_documents")
        .select("*, properties(id, title, user_id)")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const docsArr = (docs || []) as any[];
      setDocuments(
        docsArr.map((d) => ({
          ...d,
          expandedNotes: d.verification_notes || "",
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (docId: string, status: "verified" | "rejected") => {
    setVerifying(docId);
    try {
      const { error } = await (supabase as any)
        .from("property_documents")
        .update({
          verification_status: status,
          verification_notes: notes[docId] || null,
        })
        .eq("id", docId);

      if (error) throw error;

      toast.success(`Document ${status === "verified" ? "verified" : "rejected"} successfully`);

      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                verification_status: status,
                verification_notes: notes[docId] || "",
              }
            : d
        )
      );

      // Create notification for property owner
      const doc = documents.find((d) => d.id === docId);
      if (doc?.properties?.user_id) {
        const { error: notifErr } = await (supabase as any).from("notifications").insert({
          user_id: doc.properties.user_id,
          type: "document_verified",
          title: status === "verified" ? "Document Verified" : "Document Rejected",
          message:
            status === "verified"
              ? `Your document "${doc.file_name}" has been verified.`
              : `Your document "${doc.file_name}" was rejected. ${notes[docId] ? "Reason: " + notes[docId] : ""}`,
          property_id: doc.property_id,
        });

        if (notifErr) console.error("Failed to create notification:", notifErr);
      }

      setNotes((prev) => ({ ...prev, [docId]: "" }));
      setExpandedId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update document");
    } finally {
      setVerifying(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and verify documents submitted by users
          </p>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Document Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">{doc.file_name}</h3>
                          </div>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span>Property: <strong>{doc.properties?.title || "Unknown"}</strong></span>
                            <span>Type: <strong className="capitalize">{doc.document_type}</strong></span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`gap-1 capitalize ${getStatusColor(doc.verification_status)}`}
                        >
                          {getStatusIcon(doc.verification_status)}
                          {doc.verification_status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {/* Verification Notes (if expanded) */}
                      {expandedId === doc.id && (
                        <div className="space-y-3 pt-3 border-t border-border">
                          {doc.verification_notes && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Current Notes</p>
                              <p className="text-sm bg-muted p-2 rounded">{doc.verification_notes}</p>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Add/Update Notes
                            </label>
                            <Textarea
                              placeholder="Add verification notes or rejection reason"
                              value={notes[doc.id] || ""}
                              onChange={(e) =>
                                setNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))
                              }
                              className="min-h-20 text-sm"
                            />
                          </div>

                          {/* Action Buttons */}
                          {doc.verification_status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={verifying === doc.id}
                                onClick={() => verifyDocument(doc.id, "verified")}
                              >
                                {verifying === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={verifying === doc.id}
                                onClick={() => verifyDocument(doc.id, "rejected")}
                              >
                                {verifying === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setExpandedId(null)}
                          >
                            Close
                          </Button>
                        </div>
                      )}

                      {/* Expand Button */}
                      {expandedId !== doc.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setExpandedId(doc.id)}
                        >
                          {doc.verification_status === "pending" ? "Review" : "View Details"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentVerification;
