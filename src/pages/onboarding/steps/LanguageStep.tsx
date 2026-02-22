import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Languages } from "lucide-react";

interface LanguageStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
  errors?: Record<string, string>;
}

interface Language {
  language: string;
  cefrLevel: string;
  testType?: string;
  testScore?: string;
}

export function LanguageStep({ data, onUpdate }: LanguageStepProps) {
  const [languages, setLanguages] = useState<Language[]>(data.languages || []);

  const addLanguage = () => {
    const newLanguages = [...languages, { language: 'en', cefrLevel: 'B1' }];
    setLanguages(newLanguages);
    onUpdate({ languages: newLanguages });
  };

  const removeLanguage = (index: number) => {
    const newLanguages = languages.filter((_, i) => i !== index);
    setLanguages(newLanguages);
    onUpdate({ languages: newLanguages });
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const newLanguages = [...languages];
    newLanguages[index] = { ...newLanguages[index], [field]: value };
    setLanguages(newLanguages);
    onUpdate({ languages: newLanguages });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Language Proficiency</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
          <Plus className="w-4 h-4 mr-2" />
          Add Language
        </Button>
      </div>

      {languages.map((lang, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Language</Label>
                <Select
                  value={lang.language}
                  onValueChange={(value) => updateLanguage(index, 'language', value)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CEFR Level</Label>
                <Select
                  value={lang.cefrLevel}
                  onValueChange={(value) => updateLanguage(index, 'cefrLevel', value)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Type (Optional)</Label>
                <Input
                  value={lang.testType || ''}
                  onChange={(e) => updateLanguage(index, 'testType', e.target.value)}
                  placeholder="e.g., IELTS, TestDaF"
                />
              </div>
              <div>
                <Label>Test Score (Optional)</Label>
                <Input
                  value={lang.testScore || ''}
                  onChange={(e) => updateLanguage(index, 'testScore', e.target.value)}
                  placeholder="e.g., 7.5, C1"
                />
              </div>
            </div>

            <Button type="button" variant="destructive" size="sm" onClick={() => removeLanguage(index)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </Card>
      ))}

      {languages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
          <Languages className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No languages added yet</p>
          <p className="text-sm mt-1">Click "Add Language" above to add your certificates.</p>
        </div>
      )}
    </div>
  );
}
