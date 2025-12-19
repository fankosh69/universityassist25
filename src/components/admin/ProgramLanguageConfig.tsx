import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnglishLanguageRequirementsForm } from './EnglishLanguageRequirementsForm';
import { GermanLanguageRequirementsForm } from './GermanLanguageRequirementsForm';
import { 
  InstructionLanguageMode, 
  INSTRUCTION_MODE_LABELS,
  EnglishLanguageRequirements,
  GermanLanguageRequirements
} from '@/types/language-requirements';

interface ProgramLanguageConfigProps {
  instructionMode: InstructionLanguageMode;
  englishRequirements: EnglishLanguageRequirements | null;
  germanRequirements: GermanLanguageRequirements | null;
  onInstructionModeChange: (mode: InstructionLanguageMode) => void;
  onEnglishRequirementsChange: (value: EnglishLanguageRequirements | null) => void;
  onGermanRequirementsChange: (value: GermanLanguageRequirements | null) => void;
}

export function ProgramLanguageConfig({
  instructionMode,
  englishRequirements,
  germanRequirements,
  onInstructionModeChange,
  onEnglishRequirementsChange,
  onGermanRequirementsChange
}: ProgramLanguageConfigProps) {
  // Determine which requirement forms to show based on mode
  const showEnglishForm = ['fully_english', 'mostly_english', 'hybrid', 'either_or'].includes(instructionMode);
  const showGermanForm = ['fully_german', 'mostly_english', 'hybrid', 'either_or'].includes(instructionMode);
  const showBasicGermanOnly = instructionMode === 'mostly_english';
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Language of Instruction</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={instructionMode} 
            onValueChange={(value) => onInstructionModeChange(value as InstructionLanguageMode)}
            className="space-y-3"
          >
            {(Object.keys(INSTRUCTION_MODE_LABELS) as InstructionLanguageMode[]).map((mode) => (
              <div key={mode} className="flex items-start space-x-3">
                <RadioGroupItem value={mode} id={`mode-${mode}`} className="mt-0.5" />
                <div className="grid gap-0.5 leading-none">
                  <Label 
                    htmlFor={`mode-${mode}`}
                    className="font-medium cursor-pointer"
                  >
                    {INSTRUCTION_MODE_LABELS[mode].en}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {INSTRUCTION_MODE_LABELS[mode].description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Conditional Language Requirement Forms */}
      <div className="space-y-4">
        {showEnglishForm && (
          <div>
            <EnglishLanguageRequirementsForm
              value={englishRequirements}
              onChange={onEnglishRequirementsChange}
              isEnglishTaught={true}
            />
          </div>
        )}
        
        {showGermanForm && (
          <div>
            <GermanLanguageRequirementsForm
              value={germanRequirements}
              onChange={onGermanRequirementsChange}
              showBasicLevelsOnly={showBasicGermanOnly}
            />
          </div>
        )}
      </div>
      
      {/* Mode-specific guidance */}
      {instructionMode === 'either_or' && (
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm">
          <p className="font-medium text-blue-900">English or German Track</p>
          <p className="text-blue-700 mt-1">
            Students can choose to study entirely in English OR entirely in German. 
            Both language requirements should be configured as independent tracks.
          </p>
        </div>
      )}
      
      {instructionMode === 'hybrid' && (
        <div className="p-3 rounded-md bg-purple-50 border border-purple-200 text-sm">
          <p className="font-medium text-purple-900">Hybrid Program</p>
          <p className="text-purple-700 mt-1">
            Students need proficiency in BOTH English and German as courses are 
            taught in both languages throughout the program.
          </p>
        </div>
      )}
    </div>
  );
}
