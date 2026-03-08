import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Shield, Home, FileCheck, Clock } from "lucide-react";

interface AdminStatsProps {
  totalUsers: number;
  inspectors: number;
  admins: number;
  totalProperties: number;
  pendingReviews: number;
  completedInspections: number;
}

const AdminStats = ({ totalUsers, inspectors, admins, totalProperties, pendingReviews, completedInspections }: AdminStatsProps) => {
  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary" },
    { label: "Inspectors", value: inspectors, icon: UserCheck, color: "text-secondary" },
    { label: "Admins", value: admins, icon: Shield, color: "text-primary" },
    { label: "Properties", value: totalProperties, icon: Home, color: "text-accent-foreground" },
    { label: "Pending Review", value: pendingReviews, icon: Clock, color: "text-destructive" },
    { label: "Inspections Done", value: completedInspections, icon: FileCheck, color: "text-secondary" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <CardTitle className="text-base">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
