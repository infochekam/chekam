import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/chekamlogo.png";

interface InspectionRow {
  id: string;
  property_id: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  properties: { title: string } | null;
}

interface PropertyOption {
  id: string;
  title: string;
}

const Inspections = () => {
  const { user, hasRole } = useAuth();
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");

  const isAdmin = hasRole("admin");

  const fetchData = async () => {
    setLoading(true);
    const { data: insps } = await supabase
      .from("inspections")
      .select("id, property_id, status, overall_score, created_at, properties(title)")
      .order("created_at", { ascending: false });

    setInspections((insps as unknown as InspectionRow[]) || []);

    // Fetch properties for creating new inspections
    if (isAdmin) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, title")
        .eq("status", "submitted")
        .order("created_at", { ascending: false });
      setProperties((props as PropertyOption[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createInspection = async () => {
    if (!selectedProperty) {
      toast.error("Select a property first");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("inspections")
      .insert({ property_id: selectedProperty, inspector_id: user?.id })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Inspection created");
      setSelectedProperty("");
      fetchData();
    }
    setCreating(false);
  };

  const statusColor: Record<string, string> = {
    pending: "outline",
    in_progress: "secondary",
    completed: "default",
    scored: "default",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={logo} alt="Chekam" className="h-7" />
          <h1 className="text-lg font-display font-bold">Virtual Inspections</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Create Inspection (Admin) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create New Inspection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a submitted property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={createInspection} disabled={creating || !selectedProperty} className="gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  Create Inspection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspections List */}
        <Card>
          <CardHeader>
            <CardTitle>All Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : inspections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No inspections yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((ins) => (
                      <TableRow key={ins.id}>
                        <TableCell className="font-medium">
                          {ins.properties?.title || "Untitled"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor[ins.status] as any || "outline"} className="capitalize">
                            {ins.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ins.overall_score !== null ? (
                            <span className="font-bold">{Number(ins.overall_score).toFixed(1)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ins.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/inspection/${ins.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Inspections;
