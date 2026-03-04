import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MediaUploaderProps {
  inspectionId: string;
  userId: string;
  onUploadComplete: () => void;
}

const MEDIA_LABELS = [
  "Front Exterior",
  "Back Exterior",
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Rooftop",
  "Compound",
  "Electrical Panel",
  "Plumbing",
  "Full Walkthrough",
  "Other",
];

const MediaUploader = ({ inspectionId, userId, onUploadComplete }: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("Front Exterior");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 50MB limit`);
          continue;
        }

        const isVideo = file.type.startsWith("video/");
        const mediaType = isVideo ? "video" : "image";
        const filePath = `${userId}/${inspectionId}/${Date.now()}-${file.name}`;

        const { error: uploadErr } = await supabase.storage
          .from("inspection-media")
          .upload(filePath, file);
        if (uploadErr) throw uploadErr;

        const { error: dbErr } = await supabase.from("inspection_media").insert({
          inspection_id: inspectionId,
          uploaded_by: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          media_type: mediaType,
          label,
        });
        if (dbErr) throw dbErr;
      }

      toast.success("Media uploaded successfully");
      onUploadComplete();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1 flex-1">
          <Label>Area / Label</Label>
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDIA_LABELS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="gap-2"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload Media"}
          </Button>
          <Input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
