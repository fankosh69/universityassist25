import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface FilterGroupProps {
  value: string;
  title: string;
  icon?: React.ReactNode;
  activeCount?: number;
  children: React.ReactNode;
}

export function FilterGroup({ value, title, icon, activeCount, children }: FilterGroupProps) {
  return (
    <AccordionItem value={value} className="border-b border-border">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {activeCount}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
