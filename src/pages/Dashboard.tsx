import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Shield, User, Eye } from "lucide-react";
import logo from "@/assets/chekamlogo.png";

const Dashboard = () => {
  const { user, roles, signOut, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Chekam" className="h-8" />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
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
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage users, inspections, and property reviews.</p>
              </CardContent>
            </Card>
          )}

          {hasRole("inspector") && (
            <Card className="border-secondary/40">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Eye className="h-5 w-5 text-secondary" />
                <CardTitle className="text-base">Inspector Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Conduct virtual inspections and upload media.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Your property verification dashboard is ready. Submit a property to get started!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
