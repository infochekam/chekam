import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [selectedInspector, setSelectedInspector] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, status, property_type, city, state, submission_method, created_at, user_id")
        .order("created_at", { ascending: false });

      setProperties(props || []);

      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "inspector");
      const inspectorIds = (roles || []).map((r: any) => r.user_id);
      if (inspectorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", inspectorIds);
        setInspectors((profiles || []).map((p: any) => ({ id: p.user_id, name: [p.first_name, p.last_name].filter(Boolean).join(" ") })));
      } else {
        setInspectors([]);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (propertyId: string) => {
    try {
      const { data: existing } = await supabase.from("inspections").select("id").eq("property_id", propertyId).limit(1);
      if (existing && existing.length > 0) {
        toast("Inspection already exists");
        return;
      }
      const { error } = await supabase.from("inspections").insert({ property_id: propertyId, status: "pending" });
      if (error) throw error;
      toast.success("Inspection created");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to create inspection");
    }
  };

  const assignInspector = async (propertyId: string) => {
    const inspectorId = selectedInspector[propertyId];
    if (!inspectorId) { toast.error("Select an inspector"); return; }
    setAssigning(propertyId);
    try {
      // create or update inspection linked to property
      const { data: existing } = await supabase.from("inspections").select("id").eq("property_id", propertyId).limit(1);
      if (existing && existing.length > 0) {
        const inspId = existing[0].id;
        const { error } = await supabase.from("inspections").update({ inspector_id: inspectorId, status: "in_progress" }).eq("id", inspId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inspections").insert({ property_id: propertyId, inspector_id: inspectorId, status: "in_progress" });
        if (error) throw error;
      }
      toast.success("Inspector assigned");
      setSelectedInspector((s) => ({ ...s, [propertyId]: "" }));
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to assign inspector");
    } finally { setAssigning(null); }
  };

  const downloadReport = async (propertyId: string) => {
    try {
      const resp = await fetch(`/api/properties/${propertyId}/report`, { method: "GET", credentials: "include" });
      if (!resp.ok) throw new Error(`Report failed (${resp.status})`);
      const json = await resp.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `property-${propertyId}-report.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Failed to download report");
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ")}</TableCell>
                  <TableCell className="text-sm">{p.property_type || "—"}</TableCell>
                  <TableCell className="text-sm">{p.status}</TableCell>
                  <TableCell className="flex gap-2 items-center">
                    <Link to={`/property/${p.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                    <Link to={`/property/${p.id}/report`}><Button size="sm" variant="outline">Report</Button></Link>
                    <Select value={selectedInspector[p.id] || ""} onValueChange={(v) => setSelectedInspector((s) => ({ ...s, [p.id]: v }))}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Assign inspector" /></SelectTrigger>
                      <SelectContent>
                        {inspectors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!selectedInspector[p.id] || assigning === p.id} onClick={() => assignInspector(p.id)}>Assign</Button>
                    <Button size="sm" variant="secondary" onClick={() => createInspection(p.id)}>Create Inspection</Button>
                    <Button size="sm" onClick={() => downloadReport(p.id)}>Download Report</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminProperties;
