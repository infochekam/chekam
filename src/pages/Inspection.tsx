import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import MediaUploader from "@/components/inspection/MediaUploader";
import MediaGallery from "@/components/inspection/MediaGallery";
import ScoreCard from "@/components/inspection/ScoreCard";
import logo from "@/assets/chekamlogo.png";

interface InspectionData {
  id: string;
  property_id: string;
  inspector_id: string | null;
  status: string;
  notes: string | null;
  overall_score: number | null;
  ai_summary: string | null;
  created_at: string;
  properties: {
    title: string;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface ScoreItem {
  category: string;
  score: number;
  remarks: string | null;
}

const statusColors: Record<string, string> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
  scored: "default",
};

const Inspection = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [mediaRefresh, setMediaRefresh] = useState(0);

  const canManage = hasRole("admin") || hasRole("inspector");

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: insp } = await supabase
      .from("inspections")
      .select("*, properties(title, address, city, state)")
      .eq("id", id)
      .single();

    setInspection(insp as unknown as InspectionData);

    const { data: scoreData } = await supabase
      .from("inspection_scores")
      .select("category, score, remarks")
      .eq("inspection_id", id)
      .order("created_at");

    setScores((scoreData as ScoreItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const runAIScoring = async () => {
    if (!id) return;
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-inspection", {
        body: { inspection_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("AI scoring complete!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Scoring failed");
    } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Inspection not found.</p>
            <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={logo} alt="Chekam" className="h-7" />
          <h1 className="text-lg font-display font-bold truncate">Virtual Inspection</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Inspection Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  {inspection.properties?.title || "Untitled Property"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {[inspection.properties?.address, inspection.properties?.city, inspection.properties?.state]
                    .filter(Boolean)
                    .join(", ") || "No address"}
                </p>
              </div>
              <Badge variant={statusColors[inspection.status] as any || "outline"} className="capitalize w-fit">
                {inspection.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Media Upload (admin/inspector only) */}
        {canManage && user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Inspection Media</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUploader
                inspectionId={inspection.id}
                userId={user.id}
                onUploadComplete={() => setMediaRefresh((r) => r + 1)}
              />
            </CardContent>
          </Card>
        )}

        {/* Media Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Inspection Media</CardTitle>
            {canManage && (
              <Button onClick={runAIScoring} disabled={scoring} size="sm" className="gap-2">
                {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {scoring ? "Analyzing…" : "Run AI Scoring"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <MediaGallery
              inspectionId={inspection.id}
              userId={user?.id || ""}
              canDelete={canManage}
              refreshKey={mediaRefresh}
            />
          </CardContent>
        </Card>

        {/* AI Scores */}
        <ScoreCard
          overallScore={inspection.overall_score}
          aiSummary={inspection.ai_summary}
          scores={scores}
        />
      </main>
    </div>
  );
};

export default Inspection;
