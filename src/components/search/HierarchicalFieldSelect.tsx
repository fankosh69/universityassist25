import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface FieldNode {
  id: string;
  name: string;
  name_de?: string;
  name_ar?: string;
  slug: string;
  level: number;
  programCount: number;
  children: FieldNode[];
}

interface HierarchicalFieldSelectProps {
  selectedFieldIds: string[];
  onSelectionChange: (fieldIds: string[]) => void;
  className?: string;
}

export function HierarchicalFieldSelect({
  selectedFieldIds,
  onSelectionChange,
  className,
}: HierarchicalFieldSelectProps) {
  const [fields, setFields] = useState<FieldNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    loadFieldsHierarchy();
  }, []);

  const loadFieldsHierarchy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-fields-hierarchy');

      if (error) {
        console.error('Error loading fields hierarchy:', error);
        return;
      }

      if (data?.success && data?.fields) {
        setFields(data.fields);
      }
    } catch (error) {
      console.error('Error loading fields hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllDescendantIds = (field: FieldNode): string[] => {
    const ids = [field.id];
    field.children.forEach(child => {
      ids.push(...getAllDescendantIds(child));
    });
    return ids;
  };

  const handleFieldToggle = (field: FieldNode) => {
    const fieldId = field.id;
    const isCurrentlySelected = selectedFieldIds.includes(fieldId);

    // Get all descendant IDs
    const descendantIds = getAllDescendantIds(field);

    let newSelection: string[];
    if (isCurrentlySelected) {
      // Remove this field and all descendants
      newSelection = selectedFieldIds.filter(id => !descendantIds.includes(id));
    } else {
      // Add this field and all descendants
      newSelection = [...new Set([...selectedFieldIds, ...descendantIds])];
    }

    onSelectionChange(newSelection);
  };

  const isFieldSelected = (fieldId: string): boolean => {
    return selectedFieldIds.includes(fieldId);
  };

  const isFieldIndeterminate = (field: FieldNode): boolean => {
    if (field.children.length === 0) return false;

    const descendantIds = getAllDescendantIds(field).filter(id => id !== field.id);
    const selectedDescendants = descendantIds.filter(id => selectedFieldIds.includes(id));

    return selectedDescendants.length > 0 && selectedDescendants.length < descendantIds.length;
  };

  const renderField = (field: FieldNode, level: number = 1) => {
    const hasChildren = field.children.length > 0;
    const isSelected = isFieldSelected(field.id);
    const isIndeterminate = isFieldIndeterminate(field);
    const isExpanded = expandedItems.includes(field.id);

    // Calculate indentation based on level
    const indentClass = level === 1 ? "" : level === 2 ? "ml-6" : "ml-12";
    
    if (!hasChildren) {
      // Leaf node - simple checkbox with name and count
      return (
        <div
          key={field.id}
          className={cn(
            "flex items-center gap-3 py-2 px-3 rounded-md transition-colors hover:bg-accent/50",
            indentClass,
            level === 2 && "border-l-2 border-border/40",
            level === 3 && "border-l-2 border-border/60 bg-muted/30"
          )}
        >
          <Checkbox
            id={`field-${field.id}`}
            checked={isSelected}
            onCheckedChange={() => handleFieldToggle(field)}
          />
          <label
            htmlFor={`field-${field.id}`}
            className="flex items-center justify-between flex-1 cursor-pointer text-sm"
          >
            <span className={cn("text-foreground", level === 3 && "text-sm text-muted-foreground")}>
              {field.name}
            </span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {field.programCount}
            </Badge>
          </label>
        </div>
      );
    }

    // Parent node - accordion with checkbox
    return (
      <AccordionItem key={field.id} value={field.id} className="border-none">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md transition-colors",
            level === 1 && "bg-accent/10 font-semibold border border-border/50 mb-1",
            level === 2 && "border-l-2 border-primary/30 bg-accent/5",
            level === 3 && "border-l-2 border-primary/20 bg-muted/20",
            isExpanded && level === 1 && "bg-primary/5 border-primary/30",
            isExpanded && level === 2 && "bg-accent/20",
            indentClass
          )}
        >
          <Checkbox
            id={`field-${field.id}`}
            checked={isSelected && !isIndeterminate}
            onCheckedChange={() => handleFieldToggle(field)}
            className={cn("ml-3", isIndeterminate && "data-[state=checked]:bg-primary/50")}
          />
          <AccordionTrigger
            className={cn(
              "flex-1 py-2.5 pr-3 hover:no-underline",
              level === 1 && "font-semibold text-base",
              level === 2 && "font-medium",
              level === 3 && "text-sm",
              isExpanded && "text-primary"
            )}
            onClick={() => {
              setExpandedItems(prev =>
                prev.includes(field.id)
                  ? prev.filter(id => id !== field.id)
                  : [...prev, field.id]
              );
            }}
          >
            <div className="flex items-center justify-between w-full">
              <label
                htmlFor={`field-${field.id}`}
                className={cn(
                  "cursor-pointer",
                  level === 1 && "font-semibold text-base",
                  level === 2 && "font-medium text-sm",
                  level === 3 && "text-sm"
                )}
                onClick={(e) => e.preventDefault()}
              >
                {field.name}
              </label>
              <Badge
                variant="secondary"
                className={cn(
                  "ml-2 text-xs",
                  level === 1 && "bg-primary/20 text-primary font-semibold",
                  level === 2 && "bg-accent/50",
                  isExpanded && "bg-primary/30 text-primary"
                )}
              >
                {field.programCount}
              </Badge>
            </div>
          </AccordionTrigger>
        </div>
        <AccordionContent className={cn(
          "pb-1 pt-1",
          level === 1 && "border-l-2 border-primary/10 ml-3",
          level === 2 && "pl-2"
        )}>
          {field.children.map(child => renderField(child, level + 1))}
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground p-4", className)}>
        No fields of study available
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Accordion type="multiple" value={expandedItems} className="space-y-1">
        {fields.map(field => renderField(field, 1))}
      </Accordion>
    </div>
  );
}
