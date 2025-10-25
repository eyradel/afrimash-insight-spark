import { useState, useEffect } from "react";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

interface Prediction {
  Customer_ID: number;
  Pred_Next_Purchase_Days: number;
  Churn_Probability: number;
}

interface CustomerData {
  Customer_ID: number;
  Recency_Days: number;
  Frequency: number;
  Monetary: number;
  Avg_Order_Value: number;
  Total_Items_Sold: number;
  Attribution: string;
  Customer_Type: string;
}

const API_URL = "https://agrinova-635062712814.europe-west1.run.app";

export default function Predictions() {
  const { data, rawData, loading: dataLoading } = useAnalytics();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"churn" | "next_purchase">("churn");

  const getChurnColor = (probability: number) => {
    if (probability >= 70) return "hsl(var(--destructive))";
    if (probability >= 40) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  };

  const getChurnBadge = (probability: number) => {
    if (probability >= 70) return { label: "High Risk", variant: "destructive" as const };
    if (probability >= 40) return { label: "Medium Risk", variant: "default" as const };
    return { label: "Low Risk", variant: "secondary" as const };
  };

  const fetchPredictions = async () => {
    if (!rawData) return;

    setLoading(true);
    try {
      // Prepare customer data for batch prediction
      const customersData: CustomerData[] = rawData.rfm.map((customer: any) => ({
        Customer_ID: customer.customer_id,
        Recency_Days: customer.recency || 0,
        Frequency: customer.frequency || 1,
        Monetary: customer.monetary || 0,
        Avg_Order_Value: customer.monetary && customer.frequency 
          ? customer.monetary / customer.frequency 
          : 0,
        Total_Items_Sold: customer.frequency * 2, // Approximation
        Attribution: "Organic: Google", // Default value
        Customer_Type: customer.frequency > 1 ? "returning" : "new",
      }));

      const response = await fetch(`${API_URL}/predict/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customers: customersData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPredictions(result.predictions);
      toast.success(`Predictions generated for ${result.predictions.length} customers`);
    } catch (error) {
      console.error("Prediction failed:", error);
      toast.error("Failed to generate predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rawData && predictions.length === 0) {
      fetchPredictions();
    }
  }, [rawData]);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const highChurnCount = predictions.filter(p => p.Churn_Probability >= 70).length;
  const mediumChurnCount = predictions.filter(p => p.Churn_Probability >= 40 && p.Churn_Probability < 70).length;
  const lowChurnCount = predictions.filter(p => p.Churn_Probability < 40).length;
  const avgChurnProbability = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.Churn_Probability, 0) / predictions.length
    : 0;
  const avgNextPurchase = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.Pred_Next_Purchase_Days, 0) / predictions.length
    : 0;

  // Prepare chart data
  const churnDistribution = [
    { name: "Low Risk", count: lowChurnCount, fill: "hsl(var(--success))" },
    { name: "Medium Risk", count: mediumChurnCount, fill: "hsl(var(--warning))" },
    { name: "High Risk", count: highChurnCount, fill: "hsl(var(--destructive))" },
  ];

  // Sort predictions
  const sortedPredictions = [...predictions].sort((a, b) => {
    if (sortBy === "churn") {
      return b.Churn_Probability - a.Churn_Probability;
    }
    return a.Pred_Next_Purchase_Days - b.Pred_Next_Purchase_Days;
  });

  // Scatter plot data
  const scatterData = predictions.map(p => ({
    nextPurchase: p.Pred_Next_Purchase_Days,
    churn: p.Churn_Probability,
    customerId: p.Customer_ID,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
            AI Predictions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Customer churn probability and next purchase predictions
          </p>
        </div>
        <Button onClick={fetchPredictions} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Generating..." : "Refresh Predictions"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Customers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highChurnCount}</div>
            <p className="text-xs text-muted-foreground">
              ≥70% churn probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediumChurnCount}</div>
            <p className="text-xs text-muted-foreground">
              40-70% churn probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Churn Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgChurnProbability.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              across all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Next Purchase</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgNextPurchase)}</div>
            <p className="text-xs text-muted-foreground">
              days on average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Distribution</CardTitle>
            <CardDescription>Customer distribution by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {churnDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn vs Next Purchase</CardTitle>
            <CardDescription>Correlation between churn risk and purchase timing</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  dataKey="nextPurchase"
                  name="Next Purchase (Days)"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  type="number"
                  dataKey="churn"
                  name="Churn %"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "churn") return [`${value.toFixed(1)}%`, "Churn Risk"];
                    return [`${Math.round(value)} days`, "Next Purchase"];
                  }}
                />
                <Scatter data={scatterData} fill="hsl(var(--primary))">
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getChurnColor(entry.churn)}
                      opacity={0.6}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Customer Predictions</CardTitle>
              <CardDescription>Detailed predictions for all customers</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "churn" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("churn")}
              >
                Sort by Churn
              </Button>
              <Button
                variant={sortBy === "next_purchase" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("next_purchase")}
              >
                Sort by Next Purchase
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Churn Risk</TableHead>
                  <TableHead>Churn Probability</TableHead>
                  <TableHead>Next Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPredictions.slice(0, 50).map((prediction) => {
                  const badge = getChurnBadge(prediction.Churn_Probability);
                  return (
                    <TableRow key={prediction.Customer_ID}>
                      <TableCell className="font-medium">
                        {prediction.Customer_ID}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[100px] bg-secondary rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${prediction.Churn_Probability}%`,
                                backgroundColor: getChurnColor(prediction.Churn_Probability),
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {prediction.Churn_Probability.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Math.round(prediction.Pred_Next_Purchase_Days)} days
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {sortedPredictions.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing top 50 of {sortedPredictions.length} predictions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
