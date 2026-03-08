import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Preferences {
  payment_success: boolean;
  status_under_review: boolean;
  status_verified: boolean;
  status_rejected: boolean;
  document_verified: boolean;
  inspection_scored: boolean;
}

const PREF_LABELS: { key: keyof Preferences; label: string; description: string; icon: string }[] = [
  { key: "payment_success", label: "Payment Confirmations", description: "When a payment is completed successfully", icon: "💳" },
  { key: "status_under_review", label: "Property Under Review", description: "When your property is being reviewed", icon: "🔍" },
  { key: "status_verified", label: "Property Verified", description: "When your property is verified", icon: "✅" },
  { key: "status_rejected", label: "Property Rejected", description: "When your property is rejected", icon: "❌" },
  { key: "document_verified", label: "Document Verified", description: "When a document verification completes", icon: "📄" },
  { key: "inspection_scored", label: "Inspection Scored", description: "When an inspection is scored", icon: "🏠" },
];

const DEFAULT_PREFS: Preferences = {
  payment_success: true,
  status_under_review: true,
  status_verified: true,
  status_rejected: true,
  document_verified: true,
  inspection_scored: true,
};

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          payment_success: data.payment_success,
          status_under_review: data.status_under_review,
          status_verified: data.status_verified,
          status_rejected: data.status_rejected,
          document_verified: data.document_verified,
          inspection_scored: data.inspection_scored,
        });
      } else {
        // Create default preferences for existing users
        await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const togglePref = async (key: keyof Preferences) => {
    if (!user) return;
    const newVal = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newVal }));

    const { error } = await supabase
      .from("notification_preferences")
      .update({ [key]: newVal, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      setPrefs((p) => ({ ...p, [key]: !newVal }));
      toast.error("Failed to update preference");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you'd like to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {PREF_LABELS.map(({ key, label, description, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Switch
              id={key}
              checked={prefs[key]}
              onCheckedChange={() => togglePref(key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
