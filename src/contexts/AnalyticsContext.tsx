import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnalyticsData, processAnalytics } from '@/lib/analytics';
import { toast } from 'sonner';

interface AnalyticsContextType {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  uploadData: (rfmFile: File, transactionsFile: File) => Promise<void>;
  filters: {
    segment?: string;
    customerType?: string;
    dateRange?: { start: Date; end: Date };
  };
  setFilters: (filters: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const analyticsData = await processAnalytics();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  async function uploadData(rfmFile: File, transactionsFile: File) {
    try {
      setLoading(true);
      const analyticsData = await processAnalytics(rfmFile, transactionsFile);
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
    <AnalyticsContext.Provider value={{ data, loading, error, uploadData, filters, setFilters }}>
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
