import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  documentType: string;
}

interface DocumentUploadTabProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const DOCUMENT_TYPES = [
  "Title Deed",
  "Certificate of Occupancy",
  "Survey Plan",
  "Purchase Receipt",
  "Building Approval",
  "Tax Clearance",
  "Other",
];

const DocumentUploadTab = ({ files, onFilesChange }: DocumentUploadTabProps) => {
  const [docType, setDocType] = useState("Title Deed");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      newFiles.push({ file, documentType: docType });
    }
    onFilesChange([...files, ...newFiles]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Document Type</Label>
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/40 transition-colors"
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Click to upload documents</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files ({files.length})</Label>
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">{f.documentType} · {(f.file.size / 1024).toFixed(0)}KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeFile(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadTab;
