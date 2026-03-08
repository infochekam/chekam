import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Camera, Loader2, Save, User, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/chekamlogo.png";
import NotificationBell from "@/components/NotificationBell";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = urlData.publicUrl + `?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url }).eq("user_id", user.id);
    setProfile((prev) => ({ ...prev, avatar_url }));
    setUploading(false);
    toast({ title: "Avatar updated" });
  };

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
        </div>

        {/* Avatar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
            <CardDescription>Upload a photo to personalize your account.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-lg bg-accent text-accent-foreground">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="h-5 w-5 text-primary-foreground" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <p className="font-medium">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Update your name and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Your account details and actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Member since</p>
                <p className="text-sm text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </p>
              </div>
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-destructive">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={signOut}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
