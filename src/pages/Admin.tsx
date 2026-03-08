import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import AdminStats from "@/components/admin/AdminStats";
import UserManagement from "@/components/admin/UserManagement";
import PropertyReview from "@/components/admin/PropertyReview";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
}

const Admin = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyStats, setPropertyStats] = useState({ total: 0, pending: 0, inspectionsDone: 0 });

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: allRoles } = await supabase.from("user_roles").select("*");

    if (profiles && allRoles) {
      setUsers(profiles.map((p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        roles: allRoles.filter((r) => r.user_id === p.user_id).map((r) => r.role),
      })));
    }
    setLoading(false);
  };

  const fetchPropertyStats = async () => {
    const [{ count: total }, { count: pending }, { count: inspectionsDone }] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase.from("properties").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      supabase.from("inspections").select("*", { count: "exact", head: true }).eq("status", "completed"),
    ]);
    setPropertyStats({ total: total ?? 0, pending: pending ?? 0, inspectionsDone: inspectionsDone ?? 0 });
  };

  useEffect(() => {
    if (hasRole("admin")) {
      fetchUsers();
      fetchPropertyStats();
    }
  }, [hasRole]);

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
            <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspectors = users.filter((u) => u.roles.includes("inspector")).length;
  const admins = users.filter((u) => u.roles.includes("admin")).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-lg font-display font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <AdminStats
          totalUsers={users.length}
          inspectors={inspectors}
          admins={admins}
          totalProperties={propertyStats.total}
          pendingReviews={propertyStats.pending}
          completedInspections={propertyStats.inspectionsDone}
        />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="properties">Property Review</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement users={users} loading={loading} onRefresh={fetchUsers} />
          </TabsContent>
          <TabsContent value="properties">
            <PropertyReview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
