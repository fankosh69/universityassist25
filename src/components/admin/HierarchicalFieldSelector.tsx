import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

interface HierarchicalFieldSelectorProps {
  value: string | null;
  onChange: (fieldId: string | null, fieldName: string, fullPath: string) => void;
  required?: boolean;
  className?: string;
}

export const HierarchicalFieldSelector = ({
  value,
  onChange,
  required = false,
  className
}: HierarchicalFieldSelectorProps) => {
  const [fields, setFields] = useState<FieldNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<FieldNode | null>(null);

  useEffect(() => {
    loadFieldsHierarchy();
  }, []);

  useEffect(() => {
    if (value && fields.length > 0) {
      const field = findFieldById(fields, value);
      setSelectedField(field);
      if (field) {
        // Auto-expand parent path
        expandParentPath(field);
      }
    } else {
      setSelectedField(null);
    }
  }, [value, fields]);

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

  const getFieldPath = (field: FieldNode): string => {
    const path: string[] = [];
    const buildPath = (nodes: FieldNode[], targetId: string, currentPath: string[] = []): boolean => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.name];
        if (node.id === targetId) {
          path.push(...newPath);
          return true;
        }
        if (node.children.length > 0 && buildPath(node.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    buildPath(fields, field.id);
    return path.join(' → ');
  };

  const expandParentPath = (field: FieldNode) => {
    const expanded = new Set(expandedItems);
    const addParents = (nodes: FieldNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) return true;
        if (node.children.length > 0 && addParents(node.children, targetId)) {
          expanded.add(node.id);
          return true;
        }
      }
      return false;
    };
    addParents(fields, field.id);
    setExpandedItems(expanded);
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

  const handleSelect = (field: FieldNode, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const fullPath = getFieldPath(field);
    onChange(field.id, field.name, fullPath);
  };

  const handleClear = () => {
    onChange(null, '', '');
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
    const isSelected = value === field.id;

    return (
      <div key={field.id} className={cn("w-full", level > 1 && "ml-6")}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md transition-colors cursor-pointer group",
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
                e.preventDefault();
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
          
          <div
            className="flex items-center justify-between flex-1 gap-2"
            onClick={(e) => handleSelect(field, e)}
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
                <Badge variant="default" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
          </div>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {selectedField && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex-1">
            <div className="text-sm font-medium">{selectedField.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {getFieldPath(selectedField)}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleClear();
            }}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
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

      {required && !value && (
        <p className="text-sm text-destructive">Please select a field of study</p>
      )}
    </div>
  );
};
