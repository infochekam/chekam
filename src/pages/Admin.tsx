import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Users, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

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

const ROLES: AppRole[] = ["admin", "inspector", "user"];

const Admin = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: allRoles } = await supabase.from("user_roles").select("*");

    if (profiles && allRoles) {
      const mapped: UserWithRoles[] = profiles.map((p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        roles: allRoles.filter((r) => r.user_id === p.user_id).map((r) => r.role),
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Role "${role}" added`);
      fetchUsers();
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Role "${role}" removed`);
      fetchUsers();
    }
  };

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

  const totalUsers = users.length;
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
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Total Users</CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{totalUsers}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <UserCheck className="h-5 w-5 text-secondary" />
              <CardTitle className="text-base">Inspectors</CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{inspectors}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Admins</CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{admins}</p></CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading users…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Add Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.first_name || u.last_name
                            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                            : <span className="text-muted-foreground italic">No name</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === "admin" ? "default" : role === "inspector" ? "secondary" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  if (u.roles.length <= 1) {
                                    toast.error("User must have at least one role");
                                    return;
                                  }
                                  removeRole(u.user_id, role);
                                }}
                                title="Click to remove"
                              >
                                {role} ✕
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(val) => addRole(u.user_id, val as AppRole)}>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Add role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

export default Admin;
