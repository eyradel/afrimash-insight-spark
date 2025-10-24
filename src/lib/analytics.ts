import * as XLSX from 'xlsx';

export interface RFMData {
  customer_id: string;
  frequency: number;
  monetary: number;
  avg_order_value: number;
  customer_lifetime_days: number;
  purchase_rate: number;
  customer_type: string;
  attribution: string;
  total_items_sold: number;
  recency?: number;
  r_score?: number;
  f_score?: number;
  m_score?: number;
  rfm_sum?: number;
  segment?: string;
  propensity?: number;
}

export interface TransactionData {
  customer_id: string;
  order_number: string;
  date: Date;
  products: string;
  items_sold: number;
  revenue: number;
  net_sales: number;
  status: string;
}

export interface AnalyticsData {
  rfm: RFMData[];
  transactions: TransactionData[];
  segments: { [key: string]: number };
  topCustomers: RFMData[];
  cohortData: CohortData;
  timeSeriesData: TimeSeriesData[];
  recommendations: CustomerRecommendations;
}

export interface CohortData {
  cohorts: string[];
  retentionMatrix: number[][];
  averageRetention: number[];
}

export interface TimeSeriesData {
  date: string;
  sales: number;
  customers: number;
}

export interface CustomerRecommendations {
  [customerId: string]: string[];
}

// Standardize column names
function standardizeColumns(data: any[]): any[] {
  return data.map(row => {
    const standardized: any = {};
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
      standardized[lowerKey] = row[key];
    });
    return standardized;
  });
}

// Parse Excel files
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(standardizeColumns(jsonData));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Load data from public folder
export async function loadDataFromPublic(): Promise<{ rfm: any[]; transactions: any[] }> {
  const [rfmResponse, transactionsResponse] = await Promise.all([
    fetch('/data/RFM_Data.xlsx'),
    fetch('/data/Transaction_Data.xlsx')
  ]);

  const [rfmBuffer, transactionsBuffer] = await Promise.all([
    rfmResponse.arrayBuffer(),
    transactionsResponse.arrayBuffer()
  ]);

  const rfmWorkbook = XLSX.read(rfmBuffer, { type: 'array' });
  const transactionsWorkbook = XLSX.read(transactionsBuffer, { type: 'array' });

  const rfmData = XLSX.utils.sheet_to_json(rfmWorkbook.Sheets[rfmWorkbook.SheetNames[0]]);
  const transactionsData = XLSX.utils.sheet_to_json(transactionsWorkbook.Sheets[transactionsWorkbook.SheetNames[0]]);

  return {
    rfm: standardizeColumns(rfmData),
    transactions: standardizeColumns(transactionsData)
  };
}

// Calculate RFM scores
export function calculateRFMScores(rfm: RFMData[], transactions: TransactionData[]): RFMData[] {
  const today = new Date();
  const transactionMap = new Map<string, Date>();

  // Get most recent transaction date for each customer
  transactions.forEach(t => {
    const existing = transactionMap.get(t.customer_id);
    if (!existing || t.date > existing) {
      transactionMap.set(t.customer_id, t.date);
    }
  });

  // Calculate recency
  rfm.forEach(customer => {
    const lastDate = transactionMap.get(customer.customer_id);
    if (lastDate) {
      customer.recency = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      customer.recency = customer.customer_lifetime_days || 0;
    }
  });

  // Calculate quintiles for scoring
  const recencies = rfm.map(c => c.recency!).sort((a, b) => a - b);
  const frequencies = rfm.map(c => c.frequency).sort((a, b) => a - b);
  const monetaries = rfm.map(c => c.monetary).sort((a, b) => a - b);

  const getQuintile = (value: number, sorted: number[], reverse = false): number => {
    const len = sorted.length;
    const quintiles = [
      sorted[Math.floor(len * 0.2)],
      sorted[Math.floor(len * 0.4)],
      sorted[Math.floor(len * 0.6)],
      sorted[Math.floor(len * 0.8)]
    ];

    let score = 1;
    for (let i = 0; i < quintiles.length; i++) {
      if (value > quintiles[i]) score = i + 2;
    }

    return reverse ? 6 - score : score;
  };

  // Score and segment
  rfm.forEach(customer => {
    customer.r_score = getQuintile(customer.recency!, recencies, true);
    customer.f_score = getQuintile(customer.frequency, frequencies);
    customer.m_score = getQuintile(customer.monetary, monetaries);
    customer.rfm_sum = customer.r_score + customer.f_score + customer.m_score;

    // Segment assignment
    if (customer.r_score >= 4 && customer.f_score >= 4 && customer.m_score >= 4) {
      customer.segment = 'Champions';
    } else if (customer.r_score >= 3 && customer.f_score >= 3 && customer.m_score >= 3) {
      customer.segment = 'Loyal';
    } else if (customer.r_score <= 2 && customer.f_score >= 3) {
      customer.segment = 'At Risk';
    } else if (customer.r_score <= 2 && customer.f_score <= 2) {
      customer.segment = 'Hibernating';
    } else {
      customer.segment = 'Potential Loyalist';
    }

    // Propensity score (0-100)
    customer.propensity = Math.min(100, Math.round(
      (customer.r_score * 10) + 
      (customer.f_score * 8) + 
      (customer.m_score * 7) + 
      (100 / (customer.recency! + 1))
    ));
  });

  return rfm;
}

// Calculate cohort retention
export function calculateCohortRetention(transactions: TransactionData[]): CohortData {
  const customerCohorts = new Map<string, string>();
  const cohortActivity = new Map<string, Set<string>[]>();

  // Determine first purchase month for each customer
  transactions.forEach(t => {
    if (!customerCohorts.has(t.customer_id)) {
      const cohortMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      customerCohorts.set(t.customer_id, cohortMonth);
    }
  });

  // Track activity by cohort and month
  const allCohorts = Array.from(new Set(customerCohorts.values())).sort();
  allCohorts.forEach(cohort => {
    cohortActivity.set(cohort, Array.from({ length: 12 }, () => new Set<string>()));
  });

  transactions.forEach(t => {
    const cohort = customerCohorts.get(t.customer_id);
    if (!cohort) return;

    const cohortDate = new Date(cohort + '-01');
    const monthOffset = Math.floor(
      (t.date.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthOffset >= 0 && monthOffset < 12) {
      cohortActivity.get(cohort)![monthOffset].add(t.customer_id);
    }
  });

  // Build retention matrix
  const retentionMatrix: number[][] = [];
  allCohorts.forEach(cohort => {
    const activity = cohortActivity.get(cohort)!;
    const cohortSize = activity[0].size;
    const retention = activity.map(monthSet => 
      cohortSize > 0 ? (monthSet.size / cohortSize) * 100 : 0
    );
    retentionMatrix.push(retention);
  });

  // Calculate average retention
  const averageRetention = Array.from({ length: 12 }, (_, i) => {
    const validValues = retentionMatrix
      .filter(row => row[i] !== undefined)
      .map(row => row[i]);
    return validValues.length > 0
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length
      : 0;
  });

  return {
    cohorts: allCohorts,
    retentionMatrix,
    averageRetention
  };
}

// Calculate time series data
export function calculateTimeSeries(transactions: TransactionData[]): TimeSeriesData[] {
  const dailyData = new Map<string, { sales: number; customers: Set<string> }>();

  transactions.forEach(t => {
    const dateKey = t.date.toISOString().split('T')[0];
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { sales: 0, customers: new Set() });
    }
    const data = dailyData.get(dateKey)!;
    data.sales += t.net_sales;
    data.customers.add(t.customer_id);
  });

  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      customers: data.customers.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Generate product recommendations
export function generateRecommendations(transactions: TransactionData[]): CustomerRecommendations {
  const customerProducts = new Map<string, Set<string>>();
  const productCoOccurrence = new Map<string, Map<string, number>>();

  // Build customer-product map
  transactions.forEach(t => {
    if (!customerProducts.has(t.customer_id)) {
      customerProducts.set(t.customer_id, new Set());
    }
    const products = t.products.split(/[×,|]/).map(p => p.trim()).filter(p => p && p !== '');
    products.forEach(product => {
      if (product.match(/\d+/)) return; // Skip quantity indicators
      customerProducts.get(t.customer_id)!.add(product);
    });
  });

  // Build co-occurrence matrix
  customerProducts.forEach(products => {
    const productArray = Array.from(products);
    for (let i = 0; i < productArray.length; i++) {
      if (!productCoOccurrence.has(productArray[i])) {
        productCoOccurrence.set(productArray[i], new Map());
      }
      for (let j = 0; j < productArray.length; j++) {
        if (i !== j) {
          const coOccur = productCoOccurrence.get(productArray[i])!;
          coOccur.set(productArray[j], (coOccur.get(productArray[j]) || 0) + 1);
        }
      }
    }
  });

  // Generate recommendations
  const recommendations: CustomerRecommendations = {};
  customerProducts.forEach((products, customerId) => {
    const scores = new Map<string, number>();
    
    products.forEach(product => {
      const coOccur = productCoOccurrence.get(product);
      if (coOccur) {
        coOccur.forEach((score, relatedProduct) => {
          if (!products.has(relatedProduct)) {
            scores.set(relatedProduct, (scores.get(relatedProduct) || 0) + score);
          }
        });
      }
    });

    recommendations[customerId] = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product]) => product);
  });

  return recommendations;
}

// Process all analytics
export async function processAnalytics(
  rfmFile?: File,
  transactionsFile?: File
): Promise<AnalyticsData> {
  let rfmRaw: any[];
  let transactionsRaw: any[];

  if (rfmFile && transactionsFile) {
    [rfmRaw, transactionsRaw] = await Promise.all([
      parseExcelFile(rfmFile),
      parseExcelFile(transactionsFile)
    ]);
  } else {
    const data = await loadDataFromPublic();
    rfmRaw = data.rfm;
    transactionsRaw = data.transactions;
  }

  // Parse RFM data
  const rfm: RFMData[] = rfmRaw.map(row => ({
    customer_id: row.customer_id || row.customerid || row.cust_id || row.id,
    frequency: Number(row.frequency) || 0,
    monetary: Number(row.monetary) || 0,
    avg_order_value: Number(row.avg_order_value) || 0,
    customer_lifetime_days: Number(row.customer_lifetime_days) || 0,
    purchase_rate: Number(row.purchase_rate) || 0,
    customer_type: row.customer_type || 'unknown',
    attribution: row.attribution || 'Unknown',
    total_items_sold: Number(row.total_items_sold) || 0
  }));

  // Parse transaction data
  const transactions: TransactionData[] = transactionsRaw
    .map(row => {
      let date: Date;
      if (row.date) {
        date = new Date(row.date);
        if (isNaN(date.getTime())) {
          // Try Excel date number format
          const excelDate = Number(row.date);
          if (!isNaN(excelDate)) {
            date = new Date((excelDate - 25569) * 86400 * 1000);
          } else {
            date = new Date();
          }
        }
      } else {
        date = new Date();
      }

      return {
        customer_id: row.customer_id || row.customerid || row.cust_id,
        order_number: row.order || row.order_number || '',
        date,
        products: row.products || row.product || '',
        items_sold: Number(row.items_sold) || 1,
        revenue: Number(row.revenue) || 0,
        net_sales: Number(row.net_sales) || Number(row.revenue) || 0,
        status: row.status || 'completed'
      };
    })
    .filter(t => t.status === 'completed');

  // Calculate RFM scores
  const scoredRFM = calculateRFMScores(rfm, transactions);

  // Calculate segments
  const segments: { [key: string]: number } = {};
  scoredRFM.forEach(customer => {
    const segment = customer.segment || 'Unknown';
    segments[segment] = (segments[segment] || 0) + 1;
  });

  // Get top customers
  const topCustomers = [...scoredRFM]
    .sort((a, b) => b.monetary - a.monetary)
    .slice(0, 50);

  // Calculate cohorts
  const cohortData = calculateCohortRetention(transactions);

  // Calculate time series
  const timeSeriesData = calculateTimeSeries(transactions);

  // Generate recommendations
  const recommendations = generateRecommendations(transactions);

  return {
    rfm: scoredRFM,
    transactions,
    segments,
    topCustomers,
    cohortData,
    timeSeriesData,
    recommendations
  };
}
