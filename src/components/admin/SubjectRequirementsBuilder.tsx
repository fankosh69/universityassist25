import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface SubRequirement {
  topics: string[];
  min_ects: number;
  logic: 'AND' | 'OR';
}

export interface SubjectArea {
  area: string;
  min_ects: number;
  sub_requirements: SubRequirement[];
}

export interface SubjectRequirements {
  total_ects: number;
  subject_areas: SubjectArea[];
}

interface SubjectRequirementsBuilderProps {
  value: SubjectRequirements;
  onChange: (value: SubjectRequirements) => void;
}

const COMMON_SUBJECT_AREAS = [
  'Mathematics',
  'Computer Science',
  'Physics',
  'Statistics',
  'Economics',
  'Business Administration',
  'Engineering',
  'Natural Sciences',
  'Social Sciences',
];

const COMMON_TOPICS: Record<string, string[]> = {
  Mathematics: ['Linear Algebra', 'Calculus', 'Analysis', 'Probability Theory', 'Statistics', 'Discrete Mathematics', 'Numerical Methods'],
  'Computer Science': ['Algorithms', 'Data Structures', 'Programming (C/C++)', 'Programming (Java)', 'Programming (Python)', 'Databases', 'Software Engineering', 'Operating Systems', 'Computer Networks'],
  Physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics', 'Optics'],
  Statistics: ['Probability Theory', 'Statistical Inference', 'Regression Analysis', 'Time Series'],
  Economics: ['Microeconomics', 'Macroeconomics', 'Econometrics', 'International Economics'],
  'Business Administration': ['Accounting', 'Finance', 'Marketing', 'Operations Management', 'Strategic Management'],
  Engineering: ['Mechanics', 'Thermodynamics', 'Control Systems', 'Materials Science', 'CAD'],
  'Natural Sciences': ['Biology', 'Chemistry', 'Biochemistry', 'Environmental Science'],
  'Social Sciences': ['Psychology', 'Sociology', 'Political Science', 'Research Methods'],
};

// Special value for "add custom" option
const ADD_CUSTOM_VALUE = '__add_custom__';

export function SubjectRequirementsBuilder({ value, onChange }: SubjectRequirementsBuilderProps) {
  const [newTopicInput, setNewTopicInput] = useState<Record<string, string>>({});
  const [showAddSubjectArea, setShowAddSubjectArea] = useState<number | null>(null);
  const [newSubjectAreaName, setNewSubjectAreaName] = useState('');
  const [showAddTopic, setShowAddTopic] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  // Ensure value has the required structure with safe defaults
  const safeValue: SubjectRequirements = {
    total_ects: value?.total_ects ?? 180,
    subject_areas: Array.isArray(value?.subject_areas) ? value.subject_areas : []
  };

  // Initialize custom subject areas from saved data - extract areas not in COMMON_SUBJECT_AREAS
  const [customSubjectAreas, setCustomSubjectAreas] = useState<string[]>(() => {
    const savedAreas = safeValue.subject_areas
      .map(sa => sa.area)
      .filter(area => area && !COMMON_SUBJECT_AREAS.includes(area));
    return [...new Set(savedAreas)];
  });

  // Initialize custom topics from saved data - extract topics not in COMMON_TOPICS
  const [customTopics, setCustomTopics] = useState<Record<string, string[]>>(() => {
    const saved: Record<string, string[]> = {};
    safeValue.subject_areas.forEach(sa => {
      if (!sa.area) return;
      const commonForArea = COMMON_TOPICS[sa.area] || [];
      sa.sub_requirements.forEach(subReq => {
        subReq.topics.forEach(topic => {
          if (!commonForArea.includes(topic)) {
            if (!saved[sa.area]) saved[sa.area] = [];
            if (!saved[sa.area].includes(topic)) {
              saved[sa.area].push(topic);
            }
          }
        });
      });
    });
    return saved;
  });

  // Combined subject areas (common + custom)
  const allSubjectAreas = [...COMMON_SUBJECT_AREAS, ...customSubjectAreas];

  // Get topics for an area (common + custom)
  const getTopicsForArea = (area: string): string[] => {
    const commonTopics = COMMON_TOPICS[area] || [];
    const custom = customTopics[area] || [];
    return [...commonTopics, ...custom];
  };

  const handleAddCustomSubjectArea = (areaIndex: number) => {
    if (!newSubjectAreaName.trim()) return;
    const name = newSubjectAreaName.trim();
    if (!customSubjectAreas.includes(name) && !COMMON_SUBJECT_AREAS.includes(name)) {
      setCustomSubjectAreas(prev => [...prev, name]);
    }
    updateSubjectArea(areaIndex, 'area', name);
    setNewSubjectAreaName('');
    setShowAddSubjectArea(null);
  };

  const handleAddCustomTopic = (areaIndex: number, subIndex: number, area: string) => {
    if (!newTopicName.trim()) return;
    const topic = newTopicName.trim();
    
    // Add to custom topics for this area
    if (!getTopicsForArea(area).includes(topic)) {
      setCustomTopics(prev => ({
        ...prev,
        [area]: [...(prev[area] || []), topic]
      }));
    }
    
    // Add to sub-requirement
    addTopicToSubRequirement(areaIndex, subIndex, topic);
    setNewTopicName('');
    setShowAddTopic(null);
  };

  const addSubjectArea = () => {
    onChange({
      ...safeValue,
      subject_areas: [
        ...safeValue.subject_areas,
        { area: '', min_ects: 10, sub_requirements: [] },
      ],
    });
  };

  const removeSubjectArea = (index: number) => {
    const updated = [...safeValue.subject_areas];
    updated.splice(index, 1);
    onChange({ ...safeValue, subject_areas: updated });
  };

  const updateSubjectArea = (index: number, field: keyof SubjectArea, newValue: any) => {
    const updated = [...safeValue.subject_areas];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange({ ...safeValue, subject_areas: updated });
  };

  const addSubRequirement = (areaIndex: number) => {
    const updated = [...safeValue.subject_areas];
    updated[areaIndex].sub_requirements.push({
      topics: [],
      min_ects: 5,
      logic: 'OR',
    });
    onChange({ ...safeValue, subject_areas: updated });
  };

  const removeSubRequirement = (areaIndex: number, subIndex: number) => {
    const updated = [...safeValue.subject_areas];
    updated[areaIndex].sub_requirements.splice(subIndex, 1);
    onChange({ ...safeValue, subject_areas: updated });
  };

  const updateSubRequirement = (
    areaIndex: number,
    subIndex: number,
    field: keyof SubRequirement,
    newValue: any
  ) => {
    const updated = [...safeValue.subject_areas];
    updated[areaIndex].sub_requirements[subIndex] = {
      ...updated[areaIndex].sub_requirements[subIndex],
      [field]: newValue,
    };
    onChange({ ...safeValue, subject_areas: updated });
  };

  const addTopicToSubRequirement = (areaIndex: number, subIndex: number, topic: string) => {
    if (!topic.trim()) return;
    const updated = [...safeValue.subject_areas];
    const currentTopics = updated[areaIndex].sub_requirements[subIndex].topics;
    if (!currentTopics.includes(topic)) {
      updated[areaIndex].sub_requirements[subIndex].topics = [...currentTopics, topic];
      onChange({ ...safeValue, subject_areas: updated });
    }
    setNewTopicInput({ ...newTopicInput, [`${areaIndex}-${subIndex}`]: '' });
  };

  const removeTopicFromSubRequirement = (areaIndex: number, subIndex: number, topic: string) => {
    const updated = [...safeValue.subject_areas];
    updated[areaIndex].sub_requirements[subIndex].topics = 
      updated[areaIndex].sub_requirements[subIndex].topics.filter(t => t !== topic);
    onChange({ ...safeValue, subject_areas: updated });
  };

  return (
    <div className="space-y-4">
      {/* Total ECTS */}
      <div className="flex items-center gap-4">
        <Label className="w-32">Total ECTS Required</Label>
        <Input
          type="number"
          value={safeValue.total_ects || 180}
          onChange={(e) => onChange({ ...safeValue, total_ects: parseInt(e.target.value) || 0 })}
          className="w-24"
        />
      </div>

      {/* Subject Areas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Subject-Specific Requirements</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSubjectArea}>
            <Plus className="h-4 w-4 mr-1" /> Add Subject Area
          </Button>
        </div>

        {safeValue.subject_areas.map((area, areaIndex) => (
          <Card key={areaIndex} className="border-2">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {showAddSubjectArea === areaIndex ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      placeholder="Enter custom subject area..."
                      value={newSubjectAreaName}
                      onChange={(e) => setNewSubjectAreaName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubjectArea(areaIndex)}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddCustomSubjectArea(areaIndex)}
                      disabled={!newSubjectAreaName.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowAddSubjectArea(null); setNewSubjectAreaName(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={area.area}
                    onValueChange={(v) => {
                      if (v === ADD_CUSTOM_VALUE) {
                        setShowAddSubjectArea(areaIndex);
                      } else {
                        updateSubjectArea(areaIndex, 'area', v);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select subject area" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSubjectAreas.map((subj) => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                      <SelectItem value={ADD_CUSTOM_VALUE} className="text-primary font-medium">
                        <span className="flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Add custom...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={area.min_ects}
                    onChange={(e) => updateSubjectArea(areaIndex, 'min_ects', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">ECTS</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSubjectArea(areaIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-3 px-4 space-y-3">
              {/* Sub-requirements */}
              {area.sub_requirements.map((subReq, subIndex) => (
                <div key={subIndex} className="pl-4 border-l-2 border-muted space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Requires</span>
                    <Input
                      type="number"
                      value={subReq.min_ects}
                      onChange={(e) =>
                        updateSubRequirement(areaIndex, subIndex, 'min_ects', parseInt(e.target.value) || 0)
                      }
                      className="w-16"
                    />
                    <span className="text-sm text-muted-foreground">ECTS in</span>
                    <Select
                      value={subReq.logic}
                      onValueChange={(v) => updateSubRequirement(areaIndex, subIndex, 'logic', v)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OR">any of</SelectItem>
                        <SelectItem value="AND">all of</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubRequirement(areaIndex, subIndex)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Topics */}
                  <div className="flex flex-wrap gap-1 items-center">
                    {subReq.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopicFromSubRequirement(areaIndex, subIndex, topic)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    
                    {/* Add topic dropdown or input */}
                    {showAddTopic === `${areaIndex}-${subIndex}` ? (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Enter topic..."
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTopic(areaIndex, subIndex, area.area)}
                          autoFocus
                          className="w-40 h-7 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => handleAddCustomTopic(areaIndex, subIndex, area.area)}
                          disabled={!newTopicName.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => { setShowAddTopic(null); setNewTopicName(''); }}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(v) => {
                          if (v === ADD_CUSTOM_VALUE) {
                            setShowAddTopic(`${areaIndex}-${subIndex}`);
                          } else {
                            addTopicToSubRequirement(areaIndex, subIndex, v);
                          }
                        }}
                      >
                        <SelectTrigger className="w-40 h-7 text-xs">
                          <SelectValue placeholder="+ Add topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTopicsForArea(area.area).map((topic) => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                          ))}
                          <SelectItem value={ADD_CUSTOM_VALUE} className="text-primary font-medium">
                            <span className="flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Add custom...
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addSubRequirement(areaIndex)}
                className="text-primary"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Sub-requirement
              </Button>
            </CardContent>
          </Card>
        ))}

        {safeValue.subject_areas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No subject requirements defined. Click "Add Subject Area" to specify ECTS requirements for specific subjects.
          </div>
        )}
      </div>
    </div>
  );
}
