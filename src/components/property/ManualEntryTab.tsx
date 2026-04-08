import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ManualEntryData {
  address?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  description?: string;

  // structured fields
  power_reliability?: number; // 0-10
  water_availability?: boolean;
  garbage_collection?: boolean;
  drainage_quality?: number; // 0-10
  drainage_altitude_risk?: number; // 0-1

  fenced?: boolean;
  in_estate?: boolean;
  gate_quality?: number; // 0-10
  guards_present?: boolean;
  cctv_present?: boolean;
  guard_hours_per_day?: number; // 0-24

  proximity_km?: number;
  neighborhood_score?: number; // 0-10
  flood_risk?: number; // 0-10
  road_access?: number; // 0-10

  landlord_on_site?: boolean;
  shared_household?: number;
  tenant_privacy_score?: number; // 0-10

  bedrooms?: number;
  ventilation_score?: number; // 0-10
  bathrooms?: number;
  kitchen_quality?: number; // 0-10
  parking_space?: boolean;
  parking_capacity?: number;
  building_age_years?: number;

  // utilities and infrastructure
  generator_present?: boolean;
  generator_kva?: number;
  solar_provision?: boolean;
  backup_hours?: number;
  nepa_hours_per_day?: number;
  water_storage?: boolean;
  borehole_present?: boolean;
  septic_tank?: boolean;
  internet_fibre?: boolean;
  estate_management?: boolean;
  service_charge_amount?: number;

  // optional remarks
  compound_remarks?: string;
  security_remarks?: string;
  location_remarks?: string;
  privacy_remarks?: string;
  architecture_remarks?: string;
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
  const update = (field: keyof ManualEntryData, value: any) =>
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
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Power reliability (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.power_reliability ?? "")}
            onChange={(e) => update("power_reliability", Number(e.target.value))} />
        </div>
        <div className="space-y-2 flex items-center">
          <div className="flex-1">
            <Label>Water available</Label>
            <div className="mt-1">
              <Switch checked={!!data.water_availability} onCheckedChange={(v) => update("water_availability", !!v)} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mt-2">
        <div className="space-y-2">
          <Label>Generator present</Label>
          <Switch checked={!!data.generator_present} onCheckedChange={(v) => update("generator_present", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>Generator KVA (if present)</Label>
          <Input type="number" min={0} value={String(data.generator_kva ?? "")}
            onChange={(e) => update("generator_kva", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>NEPA hours per day</Label>
          <Input type="number" min={0} max={24} value={String(data.nepa_hours_per_day ?? "")}
            onChange={(e) => update("nepa_hours_per_day", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Garbage collection</Label>
          <Switch checked={!!data.garbage_collection} onCheckedChange={(v) => update("garbage_collection", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>Drainage quality (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.drainage_quality ?? "")}
            onChange={(e) => update("drainage_quality", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Drainage altitude risk (0-1)</Label>
          <Input type="number" min={0} max={1} step={0.01} value={String(data.drainage_altitude_risk ?? "")}
            onChange={(e) => update("drainage_altitude_risk", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Fenced</Label>
          <Switch checked={!!data.fenced} onCheckedChange={(v) => update("fenced", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>In estate</Label>
          <Switch checked={!!data.in_estate} onCheckedChange={(v) => update("in_estate", !!v)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mt-2">
        <div className="space-y-2">
          <Label>CCTV present</Label>
          <Switch checked={!!data.cctv_present} onCheckedChange={(v) => update("cctv_present", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>Guards present</Label>
          <Switch checked={!!data.guards_present} onCheckedChange={(v) => update("guards_present", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>Flood risk (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.flood_risk ?? "")}
            onChange={(e) => update("flood_risk", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Road access (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.road_access ?? "")}
            onChange={(e) => update("road_access", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Gate quality (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.gate_quality ?? "")}
            onChange={(e) => update("gate_quality", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Guards present</Label>
          <Switch checked={!!data.guards_present} onCheckedChange={(v) => update("guards_present", !!v)} />
        </div>
        <div className="space-y-2">
          <Label>Proximity (km)</Label>
          <Input type="number" min={0} step={0.1} value={String(data.proximity_km ?? "")}
            onChange={(e) => update("proximity_km", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Neighborhood score (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.neighborhood_score ?? "")}
            onChange={(e) => update("neighborhood_score", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Landlord on site</Label>
          <Switch checked={!!data.landlord_on_site} onCheckedChange={(v) => update("landlord_on_site", !!v)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Shared household count</Label>
          <Input type="number" min={0} max={20} value={String(data.shared_household ?? "")}
            onChange={(e) => update("shared_household", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Tenant privacy score (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.tenant_privacy_score ?? "")}
            onChange={(e) => update("tenant_privacy_score", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Bedrooms</Label>
          <Input type="number" min={0} max={20} value={String(data.bedrooms ?? "")}
            onChange={(e) => update("bedrooms", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Ventilation score (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.ventilation_score ?? "")}
            onChange={(e) => update("ventilation_score", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Input type="number" min={0} max={10} value={String(data.bathrooms ?? "")}
            onChange={(e) => update("bathrooms", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Kitchen quality (0-10)</Label>
          <Input type="number" min={0} max={10} value={String(data.kitchen_quality ?? "")}
            onChange={(e) => update("kitchen_quality", Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Parking space</Label>
        <Switch checked={!!data.parking_space} onCheckedChange={(v) => update("parking_space", !!v)} />
      </div>

      <div className="space-y-2">
        <Label>Compound remarks</Label>
        <Textarea value={data.compound_remarks || ""} onChange={(e) => update("compound_remarks", e.target.value)} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Security remarks</Label>
        <Textarea value={data.security_remarks || ""} onChange={(e) => update("security_remarks", e.target.value)} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Architecture remarks</Label>
        <Textarea value={data.architecture_remarks || ""} onChange={(e) => update("architecture_remarks", e.target.value)} rows={2} />
      </div>
    </div>
  );
};

export default ManualEntryTab;
