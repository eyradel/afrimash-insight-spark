import { useAnalytics } from "@/contexts/AnalyticsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function Behavior() {
  const { data, loading } = useAnalytics();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scatterData = data.rfm.slice(0, 500).map(c => ({
    frequency: c.frequency,
    monetary: c.monetary / 1000,
    segment: c.segment
  }));

  const retentionData = data.cohortData.averageRetention.map((value, index) => ({
    month: `Month ${index}`,
    retention: value
  }));

  // Cohort heatmap data
  const heatmapData = data.cohortData.cohorts.slice(0, 10).map((cohort, i) => {
    const row: any = { cohort };
    data.cohortData.retentionMatrix[i].slice(0, 12).forEach((value, j) => {
      row[`m${j}`] = value.toFixed(1);
    });
    return row;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Behavior & Retention</h1>
        <p className="text-muted-foreground">
          Customer engagement patterns and cohort analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Average Retention Curve</CardTitle>
          <CardDescription>Customer retention rate over 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="retention" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Retention %"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequency vs Monetary Value</CardTitle>
          <CardDescription>Customer purchase behavior scatter plot (sample of 500 customers)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                dataKey="frequency" 
                name="Frequency"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Frequency (orders)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="monetary" 
                name="Monetary"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Monetary (₦ thousands)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string) => {
                  if (name === 'Monetary') return [`₦${value}K`, name];
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Scatter 
                name="Customers" 
                data={scatterData} 
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Matrix</CardTitle>
          <CardDescription>First 10 cohorts retention rates by month (%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Cohort</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="text-center p-2 font-medium">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-2 font-medium text-xs">{row.cohort}</td>
                    {Array.from({ length: 12 }, (_, j) => {
                      const value = parseFloat(row[`m${j}`] || '0');
                      const opacity = value / 100;
                      return (
                        <td 
                          key={j} 
                          className="text-center p-2"
                          style={{
                            backgroundColor: `hsl(var(--primary) / ${opacity * 0.5})`,
                            color: opacity > 0.5 ? 'hsl(var(--primary-foreground))' : 'inherit'
                          }}
                        >
                          {value > 0 ? value : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
