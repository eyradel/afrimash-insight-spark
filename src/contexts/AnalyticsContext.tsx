import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnalyticsData, processAnalytics } from '@/lib/analytics';
import { toast } from 'sonner';

interface AnalyticsContextType {
  data: AnalyticsData | null;
  rawData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  uploadData: (rfmFile: File, transactionsFile: File) => Promise<void>;
  filters: {
    segment?: string;
    customerType?: string;
  };
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [rawData, setRawData] = useState<AnalyticsData | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<any>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (rawData) {
      applyFilters(rawData, filters);
    }
  }, [filters, rawData]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const analyticsData = await processAnalytics();
      setRawData(analyticsData);
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(sourceData: AnalyticsData, activeFilters: any) {
    let filteredRfm = [...sourceData.rfm];

    // Apply segment filter
    if (activeFilters.segment && activeFilters.segment !== 'all') {
      filteredRfm = filteredRfm.filter(c => c.segment === activeFilters.segment);
    }

    // Apply customer type filter
    if (activeFilters.customerType && activeFilters.customerType !== 'all') {
      filteredRfm = filteredRfm.filter(c => c.customer_type === activeFilters.customerType);
    }

    // Recalculate segments
    const segments = filteredRfm.reduce((acc: any, curr) => {
      acc[curr.segment] = (acc[curr.segment] || 0) + 1;
      return acc;
    }, {});

    // Filter recommendations
    const filteredCustomerIds = new Set(filteredRfm.map(c => c.customer_id));
    const filteredRecommendations: any = {};
    Object.keys(sourceData.recommendations).forEach(customerId => {
      if (filteredCustomerIds.has(customerId)) {
        filteredRecommendations[customerId] = sourceData.recommendations[customerId];
      }
    });

    // Filter top customers
    const topCustomers = [...filteredRfm]
      .sort((a, b) => b.monetary - a.monetary)
      .slice(0, 100);

    setData({
      rfm: filteredRfm,
      transactions: sourceData.transactions,
      segments,
      topCustomers,
      timeSeriesData: sourceData.timeSeriesData,
      cohortData: sourceData.cohortData,
      recommendations: filteredRecommendations
    });
  }

  function setFilters(newFilters: any) {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }

  function resetFilters() {
    setFiltersState({});
    if (rawData) {
      setData(rawData);
    }
  }

  async function uploadData(rfmFile: File, transactionsFile: File) {
    try {
      setLoading(true);
      const analyticsData = await processAnalytics(rfmFile, transactionsFile);
      setRawData(analyticsData);
      setData(analyticsData);
      setError(null);
      toast.success('Data uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process data');
      toast.error('Failed to process uploaded data');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnalyticsContext.Provider value={{ data, rawData, loading, error, uploadData, filters, setFilters, resetFilters }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}
