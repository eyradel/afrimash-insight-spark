import { Calendar, Filter } from "lucide-react";
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
}

export function FilterBar({ segments, onFilterChange }: FilterBarProps) {
  return (
    <Card className="p-3 sm:p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select onValueChange={(value) => onFilterChange({ segment: value })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => onFilterChange({ customerType: value })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Customer Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="returning">Returning</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Calendar className="h-4 w-4 mr-2" />
          Date Range
        </Button>

        <Button variant="ghost" size="sm" className="w-full sm:w-auto sm:ml-auto">
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}
