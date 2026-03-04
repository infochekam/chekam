import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ManualEntryData {
  address: string;
  city: string;
  state: string;
  propertyType: string;
  description: string;
}

interface ManualEntryTabProps {
  data: ManualEntryData;
  onChange: (data: ManualEntryData) => void;
}

const PROPERTY_TYPES = ["Residential", "Commercial", "Industrial", "Mixed-Use", "Land"];
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const ManualEntryTab = ({ data, onChange }: ManualEntryTabProps) => {
  const update = (field: keyof ManualEntryData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="property-type">Property Type</Label>
          <Select value={data.propertyType} onValueChange={(v) => update("propertyType", v)}>
            <SelectTrigger id="property-type"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={data.state} onValueChange={(v) => update("state", v)}>
            <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City / LGA</Label>
        <Input id="city" placeholder="e.g. Ikeja" value={data.city} onChange={(e) => update("city", e.target.value)} maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Full Address</Label>
        <Input id="address" placeholder="e.g. 12 Adeniyi Jones Ave, Ikeja" value={data.address} onChange={(e) => update("address", e.target.value)} maxLength={255} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the property — bedrooms, features, land size, etc."
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>
    </div>
  );
};

export default ManualEntryTab;
