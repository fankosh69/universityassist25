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
  const isActive = (activeCount ?? 0) > 0;
  return (
    <AccordionItem value={value} className="border-0">
      <AccordionTrigger
        className="group px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors data-[state=open]:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`${title}${isActive ? `, ${activeCount} active filter${activeCount === 1 ? '' : 's'}` : ''}`}
      >
        <div className="flex items-center justify-between w-full pr-2 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span
                aria-hidden="true"
                className={[
                  'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary',
                ].join(' ')}
              >
                {icon}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          </div>
          {isActive && (
            <span
              className="shrink-0 text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center"
              aria-hidden="true"
            >
              {activeCount}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5 pt-1">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
