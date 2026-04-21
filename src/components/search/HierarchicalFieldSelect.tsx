import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, X } from "lucide-react";
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
  const [search, setSearch] = useState("");

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

  // Recursive search filter — keeps a node if it matches OR any descendant matches
  const matchesQuery = (field: FieldNode, q: string): boolean => {
    const ql = q.trim().toLowerCase();
    if (!ql) return true;
    const selfMatch =
      field.name.toLowerCase().includes(ql) ||
      (field.name_de?.toLowerCase().includes(ql) ?? false) ||
      (field.name_ar?.toLowerCase().includes(ql) ?? false);
    if (selfMatch) return true;
    return field.children.some((c) => matchesQuery(c, ql));
  };

  const filterTree = (nodes: FieldNode[], q: string): FieldNode[] => {
    if (!q.trim()) return nodes;
    return nodes
      .filter((n) => matchesQuery(n, q))
      .map((n) => ({ ...n, children: filterTree(n.children, q) }));
  };

  const filteredFields = useMemo(() => filterTree(fields, search), [fields, search]);

  // Auto-expand parents that have descendants matching the current search
  const autoExpandedIds = useMemo(() => {
    if (!search.trim()) return [] as string[];
    const ids: string[] = [];
    const walk = (node: FieldNode) => {
      if (node.children.length > 0) {
        ids.push(node.id);
        node.children.forEach(walk);
      }
    };
    filteredFields.forEach(walk);
    return ids;
  }, [filteredFields, search]);

  const effectiveExpanded = search.trim()
    ? Array.from(new Set([...expandedItems, ...autoExpandedIds]))
    : expandedItems;

  // Highlight matched text inside a label
  const highlight = (text: string) => {
    const q = search.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/15 text-foreground rounded-sm px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const renderField = (field: FieldNode, level: number = 1) => {
    const hasChildren = field.children.length > 0;
    const isSelected = isFieldSelected(field.id);
    const isIndeterminate = isFieldIndeterminate(field);

    // Indentation by level — visual hierarchy via spacing + left border only
    const indentClass =
      level === 1 ? "" : level === 2 ? "ml-4" : "ml-8";
    const borderClass =
      level === 1
        ? ""
        : level === 2
        ? "border-l border-border/60"
        : "border-l border-border/40";

    if (!hasChildren) {
      return (
        <div
          key={field.id}
          className={cn(
            "flex items-center gap-2.5 py-1.5 pr-2 pl-3 rounded-md transition-colors hover:bg-accent/40",
            isSelected && "bg-accent/60",
            indentClass,
            borderClass
          )}
        >
          <Checkbox
            id={`field-${field.id}`}
            checked={isSelected}
            onCheckedChange={() => handleFieldToggle(field)}
          />
          <label
            htmlFor={`field-${field.id}`}
            className="flex items-center justify-between flex-1 cursor-pointer text-sm font-normal text-foreground"
          >
            <span className="truncate">{highlight(field.name)}</span>
            <Badge variant="secondary" className="ml-2 text-xs font-normal shrink-0">
              {field.programCount}
            </Badge>
          </label>
        </div>
      );
    }

    return (
      <AccordionItem key={field.id} value={field.id} className="border-none">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md transition-colors hover:bg-accent/30",
            isSelected && !isIndeterminate && "bg-accent/60",
            indentClass,
            borderClass
          )}
        >
          <Checkbox
            id={`field-${field.id}`}
            checked={isSelected && !isIndeterminate}
            onCheckedChange={() => handleFieldToggle(field)}
            className={cn(
              "ml-3",
              isIndeterminate && "data-[state=checked]:bg-primary/50"
            )}
          />
          <AccordionTrigger
            className="flex-1 py-1.5 pr-3 hover:no-underline [&>svg]:ml-auto text-sm font-normal text-foreground"
            onClick={() => {
              setExpandedItems((prev) =>
                prev.includes(field.id)
                  ? prev.filter((id) => id !== field.id)
                  : [...prev, field.id]
              );
            }}
          >
            <div className="flex items-center justify-between w-full pr-2">
              <label
                htmlFor={`field-${field.id}`}
                className="cursor-pointer text-sm font-normal text-foreground truncate"
                onClick={(e) => e.preventDefault()}
              >
                {highlight(field.name)}
              </label>
              <Badge variant="secondary" className="ml-2 text-xs font-normal shrink-0">
                {field.programCount}
              </Badge>
            </div>
          </AccordionTrigger>
        </div>
        <AccordionContent className="pb-1 pt-1">
          {field.children.map((child) => renderField(child, level + 1))}
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
    <div className={cn("space-y-2", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fields..."
          className="pl-8 pr-8 h-8 text-sm"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selection summary + clear */}
      {selectedFieldIds.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedFieldIds.length} selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {filteredFields.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No fields match "{search}"
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={effectiveExpanded}
          onValueChange={setExpandedItems}
          className="space-y-0.5"
        >
          {filteredFields.map((field) => renderField(field, 1))}
        </Accordion>
      )}
    </div>
  );
}
