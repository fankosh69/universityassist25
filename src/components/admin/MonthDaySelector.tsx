import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONTHS, getDaysInMonth, formatMonthDay, getComputedDeadlineInfo } from '@/lib/academic-calendar';
import { CalendarIcon, Clock } from 'lucide-react';

interface MonthDaySelectorProps {
  label: string;
  month: number | null;
  day: number | null;
  onMonthChange: (month: number | null) => void;
  onDayChange: (day: number | null) => void;
  intake?: 'winter' | 'summer';
  showPreview?: boolean;
}

export function MonthDaySelector({
  label,
  month,
  day,
  onMonthChange,
  onDayChange,
  intake,
  showPreview = true
}: MonthDaySelectorProps) {
  const daysInMonth = month ? getDaysInMonth(month) : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Get computed deadline info for preview
  const deadlineInfo = intake && month && day 
    ? getComputedDeadlineInfo(month, day, intake) 
    : null;
  
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        {label}
      </Label>
      
      <div className="flex gap-2">
        <Select 
          value={month?.toString() || undefined} 
          onValueChange={(v) => onMonthChange(v === '__clear__' ? null : parseInt(v))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Month..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">-- Clear --</SelectItem>
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={day?.toString() || undefined} 
          onValueChange={(v) => onDayChange(v === '__clear__' ? null : parseInt(v))}
          disabled={!month}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Day..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">--</SelectItem>
            {days.map(d => (
              <SelectItem key={d} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Preview of formatted date and next deadline */}
      {showPreview && month && day && (
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">
            📅 Every year on <span className="font-medium">{formatMonthDay(month, day)}</span>
          </p>
          
          {deadlineInfo && deadlineInfo.status !== 'unknown' && (
            <p className={`flex items-center gap-1 ${
              deadlineInfo.status === 'urgent' ? 'text-destructive' :
              deadlineInfo.status === 'soon' ? 'text-orange-600' :
              deadlineInfo.status === 'passed' ? 'text-muted-foreground' :
              'text-green-600'
            }`}>
              <Clock className="h-3 w-3" />
              Next deadline: {deadlineInfo.displayText}
              {deadlineInfo.status !== 'passed' && deadlineInfo.daysRemaining > 0 && (
                <span className="ml-1">({deadlineInfo.daysRemaining} days)</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
