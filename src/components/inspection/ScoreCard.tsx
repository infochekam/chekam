import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";

interface ScoreItem {
  category: string;
  score: number;
  remarks: string | null;
}

interface ScoreCardProps {
  overallScore: number | null;
  aiSummary: string | null;
  scores: ScoreItem[];
}

const getScoreColor = (score: number) => {
  if (score >= 7) return "text-green-600 dark:text-green-400";
  if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
};

const getProgressColor = (score: number) => {
  if (score >= 7) return "[&>div]:bg-green-500";
  if (score >= 4) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-destructive";
};

const ScoreCard = ({ overallScore, aiSummary, scores }: ScoreCardProps) => {
  if (overallScore === null && scores.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No AI scores yet. Upload media and run AI analysis to generate scores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Overall Score</p>
              <p className={`text-4xl font-display font-bold ${getScoreColor(overallScore || 0)}`}>
                {overallScore?.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span>
              </p>
            </div>
          </div>
          {aiSummary && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          )}
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scores.map((s) => (
            <div key={s.category} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.category}</span>
                <Badge variant="outline" className={getScoreColor(s.score)}>
                  {s.score.toFixed(1)}
                </Badge>
              </div>
              <Progress value={s.score * 10} className={`h-2 ${getProgressColor(s.score)}`} />
              {s.remarks && <p className="text-xs text-muted-foreground">{s.remarks}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreCard;
