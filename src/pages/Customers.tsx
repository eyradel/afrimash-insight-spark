import { useState } from "react";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Customers() {
  const { data, loading } = useAnalytics();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const topByRevenue = [...data.rfm]
    .sort((a, b) => b.monetary - a.monetary)
    .slice(0, 20);

  const topByPropensity = [...data.rfm]
    .sort((a, b) => (b.propensity || 0) - (a.propensity || 0))
    .slice(0, 20);

  const customer = selectedCustomer 
    ? data.rfm.find(c => c.customer_id === selectedCustomer)
    : null;

  const recommendations = selectedCustomer 
    ? data.recommendations[selectedCustomer] || []
    : [];

  const getSegmentColor = (segment?: string) => {
    switch (segment) {
      case 'Champions': return 'bg-success text-success-foreground';
      case 'Loyal': return 'bg-info text-info-foreground';
      case 'At Risk': return 'bg-warning text-warning-foreground';
      case 'Hibernating': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Insights</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Top customers and personalized recommendations
          </p>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(data.rfm, 'customers.csv')} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
            <CardDescription>Highest spending customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topByRevenue.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">{customer.customer_id}</TableCell>
                      <TableCell>GH₵{(customer.monetary / 1000).toFixed(0)}K</TableCell>
                      <TableCell>
                        <Badge className={getSegmentColor(customer.segment)}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer.customer_id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Propensity to Buy</CardTitle>
            <CardDescription>Customers most likely to purchase soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Propensity</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topByPropensity.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell className="font-medium">{customer.customer_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${customer.propensity}%` }}
                            />
                          </div>
                          <span className="text-xs">{customer.propensity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.recency} days ago</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer.customer_id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Profile</SheetTitle>
            <SheetDescription>{selectedCustomer}</SheetDescription>
          </SheetHeader>
          
          {customer && (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="font-semibold mb-2">RFM Scores</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{customer.r_score}</div>
                    <div className="text-xs text-muted-foreground">Recency</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{customer.f_score}</div>
                    <div className="text-xs text-muted-foreground">Frequency</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold">{customer.m_score}</div>
                    <div className="text-xs text-muted-foreground">Monetary</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segment:</span>
                    <Badge className={getSegmentColor(customer.segment)}>
                      {customer.segment}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{customer.customer_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-medium">GH₵{customer.monetary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span>{customer.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Order Value:</span>
                    <span>GH₵{customer.avg_order_value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Purchase:</span>
                    <span>{customer.recency} days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Propensity Score:</span>
                    <span className="font-medium">{customer.propensity}%</span>
                  </div>
                </div>
              </div>

              {recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommended Products</h3>
                  <div className="space-y-2">
                    {recommendations.map((product, i) => (
                      <div 
                        key={i}
                        className="p-3 bg-secondary rounded-lg text-sm"
                      >
                        {product}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
