import { Filter } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";

interface FilterBarProps {
  segments: string[];
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  activeFilters: any;
}

export function FilterBar({ segments, onFilterChange, onReset, activeFilters }: FilterBarProps) {
  const hasActiveFilters = Object.keys(activeFilters).length > 0 && 
    (activeFilters.segment !== 'all' || activeFilters.customerType !== 'all');

  const activeFiltersCount = [
    activeFilters.segment && activeFilters.segment !== 'all',
    activeFilters.customerType && activeFilters.customerType !== 'all'
  ].filter(Boolean).length;

  return (
    <Card className="p-3 sm:p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <Select 
          value={activeFilters.segment || 'all'} 
          onValueChange={(value) => onFilterChange({ segment: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Segments" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={activeFilters.customerType || 'all'} 
          onValueChange={(value) => onFilterChange({ customerType: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Customer Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="returning">Returning</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="w-full sm:w-auto sm:ml-auto"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </Card>
  );
}
