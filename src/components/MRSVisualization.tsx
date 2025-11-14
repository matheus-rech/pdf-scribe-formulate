import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface MRSData {
  id: string;
  timepoint: string;
  armData: Array<{
    armId: string;
    mRS0: string;
    mRS1: string;
    mRS2: string;
    mRS3: string;
    mRS4: string;
    mRS5: string;
    mRS6: string;
  }>;
}

interface StudyArm {
  id: string;
  name: string;
}

interface MRSVisualizationProps {
  mrsData: MRSData[];
  studyArms: StudyArm[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const MRSVisualization = ({ mrsData, studyArms }: MRSVisualizationProps) => {
  const { chartData, favorableOutcomes } = useMemo(() => {
    if (!mrsData.length || !studyArms.length) {
      return { chartData: [], favorableOutcomes: [] };
    }

    // Process data for the most recent timepoint
    const latestMRS = mrsData[mrsData.length - 1];
    
    // Transform data for recharts
    const data = [];
    for (let i = 0; i <= 6; i++) {
      const point: any = { name: `mRS ${i}` };
      
      latestMRS.armData.forEach((armData) => {
        const arm = studyArms.find(a => a.id === armData.armId);
        if (arm) {
          const key = `mRS${i}` as keyof typeof armData;
          point[arm.name || `Arm ${armData.armId}`] = parseFloat(armData[key] || "0");
        }
      });
      
      data.push(point);
    }

    // Calculate favorable outcomes (mRS 0-2)
    const favorable = latestMRS.armData.map((armData) => {
      const arm = studyArms.find(a => a.id === armData.armId);
      const mrs0 = parseFloat(armData.mRS0 || "0");
      const mrs1 = parseFloat(armData.mRS1 || "0");
      const mrs2 = parseFloat(armData.mRS2 || "0");
      const total = mrs0 + mrs1 + mrs2;
      
      return {
        armName: arm?.name || `Arm ${armData.armId}`,
        percentage: total,
        count: Math.round(total) // Assuming these are counts, adjust if percentages
      };
    });

    return { chartData: data, favorableOutcomes: favorable };
  }, [mrsData, studyArms]);

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>mRS Distribution</CardTitle>
          <CardDescription>Add mRS data to see visualization</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const armNames = studyArms.map(arm => arm.name || `Arm ${arm.id}`);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>mRS Distribution by Study Arm</CardTitle>
          <CardDescription>
            {mrsData[mrsData.length - 1]?.timepoint || "Latest timepoint"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={armNames.reduce((acc, name, idx) => ({
              ...acc,
              [name]: {
                label: name,
                color: CHART_COLORS[idx % CHART_COLORS.length],
              }
            }), {})}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs fill-muted-foreground"
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {armNames.map((name, idx) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorable Outcomes (mRS 0-2)</CardTitle>
          <CardDescription>Patients achieving functional independence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {favorableOutcomes.map((outcome, idx) => (
              <div key={outcome.armName} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="font-medium">{outcome.armName}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {outcome.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({outcome.count} patients)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
