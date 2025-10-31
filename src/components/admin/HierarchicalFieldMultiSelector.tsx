import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ChevronRight, X, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FieldNode {
  id: string;
  name: string;
  name_de?: string;
  name_ar?: string;
  slug: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  programCount: number;
  children: FieldNode[];
}

interface HierarchicalFieldMultiSelectorProps {
  selectedFieldIds: string[];
  primaryFieldId: string | null;
  onChange: (fieldIds: string[], primaryId: string | null) => void;
  required?: boolean;
  className?: string;
}

export const HierarchicalFieldMultiSelector = ({
  selectedFieldIds,
  primaryFieldId,
  onChange,
  required = false,
  className
}: HierarchicalFieldMultiSelectorProps) => {
  const [fields, setFields] = useState<FieldNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFieldsHierarchy();
  }, []);

  const loadFieldsHierarchy = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-fields-hierarchy');
      
      if (error) throw error;
      
      if (data?.fields) {
        setFields(data.fields);
      }
    } catch (error) {
      console.error('Error loading fields hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const findFieldById = (nodes: FieldNode[], id: string): FieldNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = findFieldById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (fieldId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedItems(newExpanded);
  };

  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      newSelectedIds = [...selectedFieldIds, fieldId];
    } else {
      newSelectedIds = selectedFieldIds.filter(id => id !== fieldId);
      // If unchecking the primary field, clear primary
      if (fieldId === primaryFieldId) {
        onChange(newSelectedIds, newSelectedIds.length > 0 ? newSelectedIds[0] : null);
        return;
      }
    }
    
    onChange(newSelectedIds, primaryFieldId);
  };

  const handleSetPrimary = (fieldId: string) => {
    // Make sure the field is selected
    if (!selectedFieldIds.includes(fieldId)) {
      onChange([...selectedFieldIds, fieldId], fieldId);
    } else {
      onChange(selectedFieldIds, fieldId);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    const newSelectedIds = selectedFieldIds.filter(id => id !== fieldId);
    const newPrimaryId = fieldId === primaryFieldId 
      ? (newSelectedIds.length > 0 ? newSelectedIds[0] : null)
      : primaryFieldId;
    
    onChange(newSelectedIds, newPrimaryId);
  };

  const filterFields = (nodes: FieldNode[], term: string): FieldNode[] => {
    if (!term) return nodes;
    
    const lowerTerm = term.toLowerCase();
    const filtered: FieldNode[] = [];

    for (const node of nodes) {
      const matches = node.name.toLowerCase().includes(lowerTerm);
      const filteredChildren = filterFields(node.children, term);
      
      if (matches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
        
        // Auto-expand nodes that match or have matching children
        if (matches || filteredChildren.length > 0) {
          setExpandedItems(prev => new Set([...prev, node.id]));
        }
      }
    }

    return filtered;
  };

  const renderField = (field: FieldNode, level: number = 1): JSX.Element => {
    const hasChildren = field.children.length > 0;
    const isExpanded = expandedItems.has(field.id);
    const isSelected = selectedFieldIds.includes(field.id);
    const isPrimary = field.id === primaryFieldId;

    return (
      <div key={field.id} className={cn("w-full", level > 1 && "ml-6")}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md transition-colors group",
            isSelected && "bg-primary/10 border-l-4 border-primary",
            !isSelected && "hover:bg-accent/50",
            level === 1 && "font-semibold",
            level === 2 && "font-medium",
            level === 3 && "text-sm"
          )}
        >
          {hasChildren && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(field.id);
              }}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </Button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          <Checkbox
            id={`field-${field.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => handleCheckboxChange(field.id, checked as boolean)}
          />
          
          <Label
            htmlFor={`field-${field.id}`}
            className="flex items-center justify-between flex-1 gap-2 cursor-pointer"
          >
            <span className="flex-1">{field.name}</span>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs shrink-0",
                  level === 1 && "bg-primary/20 text-primary font-semibold",
                  level === 2 && "bg-accent/50",
                  isSelected && "bg-primary/30 text-primary"
                )}
              >
                {field.programCount}
              </Badge>
              {isSelected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0",
                    isPrimary && "text-yellow-500"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetPrimary(field.id);
                  }}
                  title={isPrimary ? "Primary field" : "Set as primary"}
                >
                  <Star className={cn("h-4 w-4", isPrimary && "fill-current")} />
                </Button>
              )}
            </div>
          </Label>
        </div>

        {hasChildren && isExpanded && (
          <div className={cn("mt-1", level === 1 && "border-l-2 border-accent/30 ml-3")}>
            {field.children.map(child => renderField(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const displayedFields = filterFields(fields, searchTerm);
  const selectedFields = selectedFieldIds
    .map(id => findFieldById(fields, id))
    .filter(Boolean) as FieldNode[];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {selectedFields.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Fields ({selectedFields.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedFields.map(field => (
              <Badge
                key={field.id}
                variant={field.id === primaryFieldId ? "default" : "secondary"}
                className="flex items-center gap-1 px-3 py-1"
              >
                {field.id === primaryFieldId && (
                  <Star className="h-3 w-3 fill-current" />
                )}
                <span>{field.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleRemoveField(field.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fields of study..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-md p-2 max-h-[400px] overflow-y-auto">
        {displayedFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No fields found matching your search' : 'No fields of study available'}
          </div>
        ) : (
          <div className="space-y-1">
            {displayedFields.map(field => renderField(field))}
          </div>
        )}
      </div>

      {required && selectedFieldIds.length === 0 && (
        <p className="text-sm text-destructive">Please select at least one field of study</p>
      )}
      {selectedFieldIds.length > 0 && !primaryFieldId && (
        <p className="text-sm text-yellow-600">Please select a primary field (click the star icon)</p>
      )}
    </div>
  );
};
