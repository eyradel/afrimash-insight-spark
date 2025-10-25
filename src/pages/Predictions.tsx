import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CustomerInput {
  Customer_ID: string;
  Recency_Days: string;
  Frequency: string;
  Monetary: string;
  Avg_Order_Value: string;
  Total_Items_Sold: string;
  Attribution: string;
  Customer_Type: string;
}

interface PredictionResult {
  Customer_ID: number;
  Pred_Next_Purchase_Days: number;
  Churn_Probability: number;
}

const API_URL = "https://agrinova-635062712814.europe-west1.run.app";

const ATTRIBUTION_OPTIONS = [
  "Direct",
  "Unknown",
  "Organic: Google",
  "Source: Google",
  "Web admin",
  "Source: Category",
  "Source: Metorik",
  "Referral: Dashboard.tawk.to",
  "Referral: Dash.callbell.eu",
  "Source: Chatgpt.com",
  "Source: Home",
  "Referral: Diyagric.com",
  "Source: CategoryPage",
  "Referral: Yandex.com",
  "Referral: Com.slack",
  "Referral: Duckduckgo.com",
  "Referral: Com.google.android.googlequicksearchbox",
  "Referral: Com.google.android.gm",
  "Referral: Bing.com",
  "Referral: L.instagram.com",
  "Referral: L.wl.co",
  "Source: Equipment+Category",
];

export default function Predictions() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [formData, setFormData] = useState<CustomerInput>({
    Customer_ID: "",
    Recency_Days: "",
    Frequency: "",
    Monetary: "",
    Avg_Order_Value: "",
    Total_Items_Sold: "",
    Attribution: "Organic: Google",
    Customer_Type: "new",
  });

  const handleInputChange = (field: keyof CustomerInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.Customer_ID || isNaN(Number(formData.Customer_ID)) || Number(formData.Customer_ID) <= 0) {
      toast.error("Customer ID must be a positive number");
      return false;
    }
    if (!formData.Recency_Days || isNaN(Number(formData.Recency_Days)) || Number(formData.Recency_Days) < 0) {
      toast.error("Recency Days must be 0 or greater");
      return false;
    }
    if (!formData.Frequency || isNaN(Number(formData.Frequency)) || Number(formData.Frequency) < 1) {
      toast.error("Frequency must be 1 or greater");
      return false;
    }
    if (!formData.Monetary || isNaN(Number(formData.Monetary)) || Number(formData.Monetary) < 0) {
      toast.error("Monetary must be 0 or greater");
      return false;
    }
    if (!formData.Avg_Order_Value || isNaN(Number(formData.Avg_Order_Value)) || Number(formData.Avg_Order_Value) < 0) {
      toast.error("Average Order Value must be 0 or greater");
      return false;
    }
    if (!formData.Total_Items_Sold || isNaN(Number(formData.Total_Items_Sold)) || Number(formData.Total_Items_Sold) < 0) {
      toast.error("Total Items Sold must be 0 or greater");
      return false;
    }
    return true;
  };

  const handlePredict = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setPrediction(null);

    try {
      const customerData = {
        Customer_ID: Number(formData.Customer_ID),
        Recency_Days: Number(formData.Recency_Days),
        Frequency: Number(formData.Frequency),
        Monetary: Number(formData.Monetary),
        Avg_Order_Value: Number(formData.Avg_Order_Value),
        Total_Items_Sold: Number(formData.Total_Items_Sold),
        Attribution: formData.Attribution,
        Customer_Type: formData.Customer_Type,
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result);
      toast.success("Prediction generated successfully!");
    } catch (error) {
      console.error("Prediction failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getChurnColor = (probability: number) => {
    if (probability >= 70) return "hsl(var(--destructive))";
    if (probability >= 40) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  };

  const getChurnBadge = (probability: number) => {
    if (probability >= 70) return { label: "High Risk", variant: "destructive" as const, icon: AlertTriangle };
    if (probability >= 40) return { label: "Medium Risk", variant: "default" as const, icon: TrendingUp };
    return { label: "Low Risk", variant: "secondary" as const, icon: TrendingUp };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
          AI Predictions
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Enter customer data to predict churn probability and next purchase timing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Fill in the customer details to generate a prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer ID *</Label>
              <Input
                id="customer_id"
                type="number"
                placeholder="e.g., 101"
                value={formData.Customer_ID}
                onChange={(e) => handleInputChange("Customer_ID", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Unique customer identifier (positive integer)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recency">Recency Days *</Label>
                <Input
                  id="recency"
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.Recency_Days}
                  onChange={(e) => handleInputChange("Recency_Days", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Days since last purchase (≥0)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Input
                  id="frequency"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.Frequency}
                  onChange={(e) => handleInputChange("Frequency", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Number of purchases (≥1)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monetary">Monetary Value *</Label>
                <Input
                  id="monetary"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500.00"
                  value={formData.Monetary}
                  onChange={(e) => handleInputChange("Monetary", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Total monetary value (₦)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg_order">Avg Order Value *</Label>
                <Input
                  id="avg_order"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 100.00"
                  value={formData.Avg_Order_Value}
                  onChange={(e) => handleInputChange("Avg_Order_Value", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Average order value (₦)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="items_sold">Total Items Sold *</Label>
              <Input
                id="items_sold"
                type="number"
                placeholder="e.g., 20"
                value={formData.Total_Items_Sold}
                onChange={(e) => handleInputChange("Total_Items_Sold", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Total items sold to this customer</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attribution">Attribution Channel *</Label>
              <Select value={formData.Attribution} onValueChange={(value) => handleInputChange("Attribution", value)}>
                <SelectTrigger id="attribution">
                  <SelectValue placeholder="Select attribution channel" />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Customer acquisition source</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_type">Customer Type *</Label>
              <Select value={formData.Customer_Type} onValueChange={(value) => handleInputChange("Customer_Type", value)}>
                <SelectTrigger id="customer_type">
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Customer</SelectItem>
                  <SelectItem value="returning">Returning Customer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Is this a new or returning customer?</p>
            </div>

            <Button onClick={handlePredict} disabled={loading} className="w-full">
              <Sparkles className={`mr-2 h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Generating Prediction..." : "Generate Prediction"}
            </Button>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <div className="space-y-4">
          {prediction ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Prediction Results</CardTitle>
                  <CardDescription>AI-powered customer behavior prediction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer ID</p>
                      <p className="text-2xl font-bold">{prediction.Customer_ID}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Churn Probability</CardTitle>
                  {(() => {
                    const badge = getChurnBadge(prediction.Churn_Probability);
                    const Icon = badge.icon;
                    return <Icon className="h-5 w-5" style={{ color: getChurnColor(prediction.Churn_Probability) }} />;
                  })()}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold" style={{ color: getChurnColor(prediction.Churn_Probability) }}>
                      {prediction.Churn_Probability.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Likelihood of customer churn</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${prediction.Churn_Probability}%`,
                          backgroundColor: getChurnColor(prediction.Churn_Probability),
                        }}
                      />
                    </div>
                    <Badge variant={getChurnBadge(prediction.Churn_Probability).variant} className="mt-2">
                      {getChurnBadge(prediction.Churn_Probability).label}
                    </Badge>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Risk Assessment</p>
                    <p className="text-xs text-muted-foreground">
                      {prediction.Churn_Probability >= 70 && "⚠️ High risk: Immediate retention action recommended"}
                      {prediction.Churn_Probability >= 40 && prediction.Churn_Probability < 70 && "⚡ Medium risk: Monitor closely and engage proactively"}
                      {prediction.Churn_Probability < 40 && "✅ Low risk: Customer is likely to continue purchasing"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Next Purchase Prediction</CardTitle>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold text-primary">
                      {Math.round(prediction.Pred_Next_Purchase_Days)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">days until next purchase</p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Engagement Strategy</p>
                    <p className="text-xs text-muted-foreground">
                      {prediction.Pred_Next_Purchase_Days <= 30 && "📅 Customer expected to purchase soon. Perfect timing for a reminder!"}
                      {prediction.Pred_Next_Purchase_Days > 30 && prediction.Pred_Next_Purchase_Days <= 90 && "📆 Customer will purchase in 1-3 months. Plan mid-term engagement."}
                      {prediction.Pred_Next_Purchase_Days > 90 && "📋 Long purchase cycle. Consider nurture campaigns."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Enter customer information and click "Generate Prediction" to see AI-powered insights</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
