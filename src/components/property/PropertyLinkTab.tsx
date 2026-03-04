import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";

interface PropertyLinkTabProps {
  link: string;
  onLinkChange: (link: string) => void;
}

const PropertyLinkTab = ({ link, onLinkChange }: PropertyLinkTabProps) => (
  <div className="space-y-4">
    <div className="rounded-lg bg-accent/40 border border-border p-4 flex items-start gap-3">
      <Link2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">Paste a property listing link</p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported: PropertyPro, Jiji, Nigeria Property Centre, or any public listing URL.
        </p>
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="property-link">Property URL</Label>
      <Input
        id="property-link"
        type="url"
        placeholder="https://example.com/property/123"
        value={link}
        onChange={(e) => onLinkChange(e.target.value)}
      />
    </div>
  </div>
);

export default PropertyLinkTab;
