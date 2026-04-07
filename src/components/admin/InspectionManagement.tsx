import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Inspection {
  id: string;
  property_id: string;
  status: string;
  inspector_id?: string;
  overall_score?: number;
  created_at: string;
  properties: {
    id: string;
    title: string;
    address?: string;
    city?: string;
  } | null;
  inspector?: {
    first_name?: string;
    last_name?: string;
  } | null;
}

interface Inspector {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

const InspectionManagement = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch inspections with property details
      const { data: insps, error: inspErr } = await (supabase as any)
        .from("inspections")
        .select(
          `
          id,
          property_id,
          status,
          inspector_id,
          overall_score,
          created_at,
          properties(id, title, address, city)
          `
        )
        .order("created_at", { ascending: false });

      if (inspErr) throw inspErr;
      
      // Fetch inspector profiles separately
      const inspectorIds = (insps || [])
      .filter((i: any) => i.inspector_id)
      .map((i: any) => i.inspector_id) || [];
      
      let inspectorProfiles: Record<string, any> = {};
      if (inspectorIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", inspectorIds);
        
        if (profiles) {
          inspectorProfiles = profiles.reduce(
            (acc: any, p: any) => {
              acc[p.user_id] = { first_name: p.first_name || undefined, last_name: p.last_name || undefined };
              return acc;
            },
            {}
          );
        }
      }
      
      // Merge inspector profiles into inspections
      const inspectionsWithProfiles = (insps || []).map((i: any) => ({
        ...i,
        inspector: i.inspector_id ? inspectorProfiles[i.inspector_id] : null,
      }));
      
      setInspections((inspectionsWithProfiles || []) as unknown as Inspection[]);

      // Fetch all inspectors
      const { data: roles } = await (supabase as any)
        .from("user_roles")
        .select("user_id")
        .eq("role", "inspector");

      if (roles && roles.length > 0) {
        const inspectorIds = roles.map((r) => r.user_id);
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", inspectorIds);

        setInspectors(
          (profiles || []).map((p) => ({
            id: p.user_id,
            first_name: p.first_name || undefined,
            last_name: p.last_name || undefined,
          }))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const assignInspector = async (inspectionId: string) => {
    const inspectorId = selectedInspectorId[inspectionId];
    if (!inspectorId) {
      toast.error("Select an inspector first");
      return;
    }

    setAssigning(inspectionId);
    try {
      const { error } = await supabase
        .from("inspections")
        .update({ inspector_id: inspectorId, status: "in_progress" })
        .eq("id", inspectionId);

      if (error) throw error;

      toast.success("Inspector assigned successfully");
      setSelectedInspectorId((prev) => ({ ...prev, [inspectionId]: "" }));
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign inspector");
    } finally {
      setAssigning(null);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "outline",
    in_progress: "secondary",
    completed: "default",
    scored: "default",
  };

  const getInspectorName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "Unknown";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inspection Assignment</CardTitle>
          <p className="text-sm text-muted-foreground">Assign inspectors to pending and in-progress inspections</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>No inspections to assign</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Inspector</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Assign To</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ins.properties?.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">
                            {ins.properties?.address && `${ins.properties.address}, `}
                            {ins.properties?.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor[ins.status] as any} className="capitalize">
                          {ins.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ins.inspector_id ? (
                          <span className="text-sm">
                            {ins.inspector ? getInspectorName(ins.inspector.first_name, ins.inspector.last_name) : "Unknown"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ins.overall_score !== null && ins.overall_score !== undefined ? (
                          <span className="font-bold">{ins.overall_score.toFixed(1)}/10</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!ins.inspector_id || ins.status === "pending" ? (
                          <Select
                            value={selectedInspectorId[ins.id] || ""}
                            onValueChange={(value) =>
                              setSelectedInspectorId((prev) => ({ ...prev, [ins.id]: value }))
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select inspector" />
                            </SelectTrigger>
                            <SelectContent>
                              {inspectors.map((inspector) => (
                                <SelectItem key={inspector.id} value={inspector.id}>
                                  {getInspectorName(inspector.first_name, inspector.last_name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!ins.inspector_id || ins.status === "pending" ? (
                          <Button
                            size="sm"
                            disabled={assigning === ins.id || !selectedInspectorId[ins.id]}
                            onClick={() => assignInspector(ins.id)}
                          >
                            {assigning === ins.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Assign"
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Assigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionManagement;
