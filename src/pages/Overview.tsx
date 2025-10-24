import { useAnalytics } from "@/contexts/AnalyticsContext";
import { KPICard } from "@/components/KPICard";
import { FilterBar } from "@/components/FilterBar";
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Overview() {
  const { data, loading, filters, setFilters } = useAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Failed to load data</p>
      </div>
    );
  }

  const totalRevenue = data.rfm.reduce((sum, c) => sum + c.monetary, 0);
  const avgRecency = data.rfm.reduce((sum, c) => sum + (c.recency || 0), 0) / data.rfm.length;
  const avgFrequency = data.rfm.reduce((sum, c) => sum + c.frequency, 0) / data.rfm.length;
  const avgMonetary = totalRevenue / data.rfm.length;

  const segmentData = Object.entries(data.segments).map(([name, value]) => ({
    name,
    value,
  }));

  const monthlyData = data.timeSeriesData
    .reduce((acc: any[], curr) => {
      const month = curr.date.substring(0, 7);
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.sales += curr.sales;
      } else {
        acc.push({ month, sales: curr.sales });
      }
      return acc;
    }, [])
    .slice(-12);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Comprehensive view of your customer analytics
        </p>
      </div>

      <FilterBar 
        segments={Object.keys(data.segments)} 
        onFilterChange={setFilters}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Customers"
          value={data.rfm.length.toLocaleString()}
          icon={Users}
          subtitle={`${Object.keys(data.segments).length} segments`}
        />
        <KPICard
          title="Total Revenue"
          value={`GH₵${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          subtitle={`Avg: GH₵${(avgMonetary / 1000).toFixed(0)}K`}
        />
        <KPICard
          title="Avg Frequency"
          value={avgFrequency.toFixed(1)}
          icon={ShoppingCart}
          subtitle="orders per customer"
        />
        <KPICard
          title="Avg Recency"
          value={`${Math.round(avgRecency)} days`}
          icon={TrendingUp}
          subtitle="since last purchase"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>Distribution by RFM segments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
            <CardDescription>Revenue over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `GH₵${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => [`GH₵${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
