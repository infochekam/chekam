import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, User, Eye, Plus, Video, FileSearch, Loader2, MessageSquare, FileBarChart, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/chekamlogo.png";
import NotificationBell from "@/components/NotificationBell";

interface Property {
  id: string;
  title: string;
  status: string;
  submission_method: string;
  created_at: string;
  inspection?: {
    id: string;
    status: "pending" | "in_progress" | "completed" | "scored";
    inspector_id?: string;
    overall_score?: number;
    updated_at: string;
  };
}

const Dashboard = () => {
  const { user, roles, signOut, hasRole } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("properties")
        .select("id, title, status, submission_method, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (!data) {
        setProperties([]);
        setLoadingProps(false);
        return;
      }

      // Fetch inspection data for each property
      const propsWithInspections = await Promise.all(
        data.map(async (prop) => {
          const { data: inspection } = await supabase
            .from("inspections")
            .select("id, status, inspector_id, overall_score, updated_at")
            .eq("property_id", prop.id)
            .single();
          return { ...prop, inspection: inspection || undefined };
        })
      );

      setProperties(propsWithInspections);
      setLoadingProps(false);
    };
    fetchProperties();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Chekam" className="h-8" />
          </a>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile">Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-6">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Your Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span key={role} className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground capitalize">
                    {role}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {hasRole("admin") && (
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Manage users, inspections, and property reviews.</p>
                <Button size="sm" asChild><Link to="/admin">Open Admin Panel</Link></Button>
              </CardContent>
            </Card>
          )}

          {hasRole("inspector") && (
            <Card className="border-secondary/40">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Eye className="h-5 w-5 text-secondary" />
                <CardTitle className="text-base">Inspector Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Conduct virtual inspections and upload media (assigned inspections).</p>
                <Button size="sm" variant="secondary" asChild><Link to="/inspections?view=assigned">Assigned Inspections</Link></Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Video className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Virtual Inspections</CardTitle>
            </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">View property inspections with AI-powered facility scoring.</p>
                <Button size="sm" variant="outline" asChild><Link to="/inspections">Browse Inspections</Link></Button>
              </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Ask questions about your verification results and documents.</p>
              <Button size="sm" variant="outline" asChild><Link to="/assistant">Chat with AI</Link></Button>
            </CardContent>
          </Card>
        </div>

        {/* My Properties */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold mb-4">My Properties</h2>
          {loadingProps ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : properties.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No properties submitted yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {properties.map((p) => (
                <Card key={p.id}>
                  <CardContent className="py-4 space-y-3">
                    {/* Property Title and Info */}
                    <div>
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.submission_method.replace(/_/g, " ")} · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Inspection Status Timeline */}
                    {p.inspection && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Inspection Progress</p>
                        <div className="flex items-center gap-1">
                          {["pending", "in_progress", "completed", "scored"].map((status, idx) => (
                            <div key={status} className="flex items-center flex-1">
                              <div
                                className={`h-2 flex-1 rounded-full transition-colors ${
                                  ["pending", "in_progress", "completed", "scored"].indexOf(p.inspection!.status) >= idx
                                    ? "bg-primary"
                                    : "bg-muted"
                                }`}
                              />
                              {idx < 3 && <div className="w-1 h-1" />}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{p.inspection.status.replace(/_/g, " ")}</span>
                          {p.inspection.overall_score !== null && p.inspection.overall_score !== undefined && (
                            <span className="font-medium text-primary">Score: {p.inspection.overall_score}/10</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                      <Badge variant="outline" className="capitalize">{p.status.replace(/_/g, " ")}</Badge>
                      <Button size="sm" className="gap-1" asChild>
                        <Link to={`/property/${p.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Link>
                      </Button>
                      {p.status === "draft" && (
                        <Button size="sm" className="gap-1" asChild>
                          <Link to={`/payment?propertyId=${p.id}`}>
                            <BadgeCheck className="h-3.5 w-3.5" /> Verify Property
                          </Link>
                        </Button>
                      )}
                      {p.submission_method === "document_upload" && (
                        <Button size="sm" variant="outline" className="gap-1" asChild>
                          <Link to={`/property/${p.id}/documents`}>
                            <FileSearch className="h-3.5 w-3.5" /> Verify Docs
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="gap-1" asChild>
                        <Link to={`/property/${p.id}/report`}>
                          <FileBarChart className="h-3.5 w-3.5" /> Report
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="pt-6 text-center space-y-4">
            <Plus className="h-10 w-10 mx-auto text-primary/60" />
            <p className="text-muted-foreground">Submit a property for AI-powered verification.</p>
            <Button asChild size="lg">
              <Link to="/submit-property">Submit a Property</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
