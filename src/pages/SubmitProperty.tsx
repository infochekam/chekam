import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileUp, Link2, PenLine, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DocumentUploadTab from "@/components/property/DocumentUploadTab";
import PropertyLinkTab from "@/components/property/PropertyLinkTab";
import ManualEntryTab from "@/components/property/ManualEntryTab";
import logo from "@/assets/chekamlogo.png";

type SubmissionMethod = "document_upload" | "property_link" | "manual_entry";

interface UploadedFile {
  file: File;
  documentType: string;
}

const SubmitProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<SubmissionMethod>("document_upload");
  const [title, setTitle] = useState("");

  // Document upload state
  const [files, setFiles] = useState<UploadedFile[]>([]);

  // Link state
  const [propertyLink, setPropertyLink] = useState("");

  // Manual entry state
  const [manualData, setManualData] = useState({
    address: "",
    city: "",
    state: "",
    propertyType: "",
    description: "",
  });

  const validate = (): boolean => {
    if (!title.trim()) {
      toast.error("Please enter a property title");
      return false;
    }
    if (tab === "document_upload" && files.length === 0) {
      toast.error("Please upload at least one document");
      return false;
    }
    if (tab === "property_link") {
      try {
        new URL(propertyLink);
      } catch {
        toast.error("Please enter a valid URL");
        return false;
      }
    }
    if (tab === "manual_entry" && !manualData.address.trim()) {
      toast.error("Please enter the property address");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !validate()) return;
    setSubmitting(true);

    try {
      // 1. Insert property
      const { data: property, error: propError } = await supabase
        .from("properties")
        .insert({
          user_id: user.id,
          title: title.trim(),
          submission_method: tab,
          property_link: tab === "property_link" ? propertyLink : null,
          address: tab === "manual_entry" ? manualData.address : null,
          city: tab === "manual_entry" ? manualData.city : null,
          state: tab === "manual_entry" ? manualData.state : null,
          property_type: tab === "manual_entry" ? manualData.propertyType : null,
          description: tab === "manual_entry" ? manualData.description : null,
          status: "submitted",
        })
        .select("id")
        .single();

      if (propError) throw propError;

      // 2. Upload documents if applicable
      if (tab === "document_upload" && files.length > 0) {
        for (const f of files) {
          const filePath = `${user.id}/${property.id}/${Date.now()}-${f.file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("property-documents")
            .upload(filePath, f.file);

          if (uploadErr) throw uploadErr;

          const { error: docErr } = await supabase
            .from("property_documents")
            .insert({
              property_id: property.id,
              user_id: user.id,
              file_name: f.file.name,
              file_path: filePath,
              file_type: f.file.type,
              document_type: f.documentType,
            });

          if (docErr) throw docErr;
        }
      }

      toast.success("Property submitted successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={logo} alt="Chekam" className="h-7" />
          <h1 className="text-lg font-display font-bold">Submit Property</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                placeholder="e.g. 3-Bedroom Flat at Lekki Phase 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Submission method tabs */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as SubmissionMethod)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="document_upload" className="gap-1.5 text-xs sm:text-sm">
                  <FileUp className="h-4 w-4" /> Upload Docs
                </TabsTrigger>
                <TabsTrigger value="property_link" className="gap-1.5 text-xs sm:text-sm">
                  <Link2 className="h-4 w-4" /> Paste Link
                </TabsTrigger>
                <TabsTrigger value="manual_entry" className="gap-1.5 text-xs sm:text-sm">
                  <PenLine className="h-4 w-4" /> Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="document_upload" className="mt-5">
                <DocumentUploadTab files={files} onFilesChange={setFiles} />
              </TabsContent>
              <TabsContent value="property_link" className="mt-5">
                <PropertyLinkTab link={propertyLink} onLinkChange={setPropertyLink} />
              </TabsContent>
              <TabsContent value="manual_entry" className="mt-5">
                <ManualEntryTab data={manualData} onChange={setManualData} />
              </TabsContent>
            </Tabs>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit Property"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitProperty;
