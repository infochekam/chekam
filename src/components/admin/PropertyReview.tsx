import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PropertyStatus = Database["public"]["Enums"]["property_status"];

interface PropertyRow {
  id: string;
  title: string;
  status: PropertyStatus;
  property_type: string | null;
  city: string | null;
  state: string | null;
  submission_method: string;
  created_at: string;
}

const STATUS_COLORS: Record<PropertyStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "default",
  verified: "secondary",
  rejected: "destructive",
};

const PropertyReview = () => {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("id, title, status, property_type, city, state, submission_method, created_at")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter as PropertyStatus);
    }

    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [filter]);

  const statusNotificationMap: Partial<Record<PropertyStatus, { title: string; message: (title: string) => string; type: string }>> = {
    under_review: {
      title: "Property Under Review",
      message: (t) => `Your property "${t}" is now being reviewed by our team.`,
      type: "status_under_review",
    },
    verified: {
      title: "Property Verified",
      message: (t) => `Great news! Your property "${t}" has been verified successfully.`,
      type: "status_verified",
    },
    rejected: {
      title: "Property Rejected",
      message: (t) => `Your property "${t}" has been rejected. Please review and resubmit.`,
      type: "status_rejected",
    },
  };

  const updateStatus = async (id: string, status: PropertyStatus) => {
    // First get the property to know owner and title
    const { data: prop } = await supabase
      .from("properties")
      .select("user_id, title")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    // Send in-app notification to property owner (if preference enabled)
    const notif = statusNotificationMap[status];
    if (notif && prop) {
      const prefKey = notif.type; // e.g. "status_under_review"
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select(prefKey)
        .eq("user_id", prop.user_id)
        .single();

      // Send if no prefs row exists (default) or if preference is enabled
      if (!prefs || (prefs as Record<string, boolean>)[prefKey] !== false) {
        await supabase.from("notifications").insert({
          user_id: prop.user_id,
          title: notif.title,
          message: notif.message(prop.title),
          type: notif.type,
          property_id: id,
        });
      }
    }

    toast.success(`Property marked as "${status.replace("_", " ")}"`);
    fetchProperties();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle>Property Review</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:max-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No properties found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{p.property_type || "—"}</TableCell>
                    <TableCell className="text-sm">{p.submission_method.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[p.status]} className="capitalize">
                        {p.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {p.status !== "verified" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-secondary border-secondary/40 hover:bg-secondary/10"
                            onClick={() => updateStatus(p.id, "verified")}
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        {p.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() => updateStatus(p.id, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        )}
                        {p.status !== "under_review" && p.status === "submitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(p.id, "under_review")}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyReview;
