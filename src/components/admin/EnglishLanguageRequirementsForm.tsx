import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EnglishLanguageRequirements } from "@/types/language-requirements";

interface EnglishLanguageRequirementsFormProps {
  value: EnglishLanguageRequirements | null;
  onChange: (value: EnglishLanguageRequirements | null) => void;
  isEnglishTaught: boolean;
}

export function EnglishLanguageRequirementsForm({
  value,
  onChange,
  isEnglishTaught
}: EnglishLanguageRequirementsFormProps) {
  const [bandScoresExpanded, setBandScoresExpanded] = useState(false);

  if (!isEnglishTaught) {
    return null;
  }

  const requirements = value || {
    accepts_moi: false,
    ielts_academic: { required: false, overall_min: 6.5 },
    toefl_ibt: { required: false, overall_min: 80 },
    pte_academic: { required: false, overall_min: 58 }
  };

  const updateRequirements = (updates: Partial<EnglishLanguageRequirements>) => {
    onChange({ ...requirements, ...updates });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>English Language Proof Requirements</CardTitle>
        <CardDescription>
          Select which English language proofs your program accepts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MOI */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="accepts-moi"
            checked={requirements.accepts_moi}
            onCheckedChange={(checked) => 
              updateRequirements({ accepts_moi: checked as boolean })
            }
          />
          <div className="space-y-1 leading-none">
            <div className="flex items-center gap-2">
              <Label htmlFor="accepts-moi" className="font-medium">
                Accepts MOI (Medium of Instruction) Certificate
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      MOI is a certificate from the student's university confirming 
                      that their degree was taught entirely in English. No test scores required.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Certificate proving studies were conducted in English
            </p>
          </div>
        </div>

        {/* IELTS Academic */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="accepts-ielts"
              checked={requirements.ielts_academic?.required || false}
              onCheckedChange={(checked) => 
                updateRequirements({
                  ielts_academic: {
                    ...requirements.ielts_academic,
                    required: checked as boolean,
                    overall_min: requirements.ielts_academic?.overall_min || 6.5
                  }
                })
              }
            />
            <Label htmlFor="accepts-ielts" className="font-medium">
              Accepts IELTS Academic
            </Label>
          </div>

          {requirements.ielts_academic?.required && (
            <div className="ml-9 space-y-3">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="ielts-overall">Minimum Overall Score *</Label>
                <Input
                  id="ielts-overall"
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={requirements.ielts_academic.overall_min}
                  onChange={(e) => 
                    updateRequirements({
                      ielts_academic: {
                        ...requirements.ielts_academic!,
                        overall_min: parseFloat(e.target.value) || 6.5
                      }
                    })
                  }
                />
              </div>

              <Collapsible open={bandScoresExpanded} onOpenChange={setBandScoresExpanded}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                  <ChevronDown className={`h-4 w-4 transition-transform ${bandScoresExpanded ? 'rotate-180' : ''}`} />
                  Band Scores (Optional)
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ielts-reading">Reading</Label>
                      <Input
                        id="ielts-reading"
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        placeholder="Optional"
                        value={requirements.ielts_academic.reading_min || ''}
                        onChange={(e) => 
                          updateRequirements({
                            ielts_academic: {
                              ...requirements.ielts_academic!,
                              reading_min: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ielts-writing">Writing</Label>
                      <Input
                        id="ielts-writing"
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        placeholder="Optional"
                        value={requirements.ielts_academic.writing_min || ''}
                        onChange={(e) => 
                          updateRequirements({
                            ielts_academic: {
                              ...requirements.ielts_academic!,
                              writing_min: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ielts-listening">Listening</Label>
                      <Input
                        id="ielts-listening"
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        placeholder="Optional"
                        value={requirements.ielts_academic.listening_min || ''}
                        onChange={(e) => 
                          updateRequirements({
                            ielts_academic: {
                              ...requirements.ielts_academic!,
                              listening_min: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ielts-speaking">Speaking</Label>
                      <Input
                        id="ielts-speaking"
                        type="number"
                        min="0"
                        max="9"
                        step="0.5"
                        placeholder="Optional"
                        value={requirements.ielts_academic.speaking_min || ''}
                        onChange={(e) => 
                          updateRequirements({
                            ielts_academic: {
                              ...requirements.ielts_academic!,
                              speaking_min: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {/* TOEFL iBT */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="accepts-toefl"
              checked={requirements.toefl_ibt?.required || false}
              onCheckedChange={(checked) => 
                updateRequirements({
                  toefl_ibt: {
                    required: checked as boolean,
                    overall_min: requirements.toefl_ibt?.overall_min || 80
                  }
                })
              }
            />
            <Label htmlFor="accepts-toefl" className="font-medium">
              Accepts TOEFL iBT
            </Label>
          </div>

          {requirements.toefl_ibt?.required && (
            <div className="ml-9">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="toefl-overall">Minimum Overall Score *</Label>
                <Input
                  id="toefl-overall"
                  type="number"
                  min="0"
                  max="120"
                  value={requirements.toefl_ibt.overall_min}
                  onChange={(e) => 
                    updateRequirements({
                      toefl_ibt: {
                        ...requirements.toefl_ibt!,
                        overall_min: parseInt(e.target.value) || 80
                      }
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* PTE Academic */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="accepts-pte"
              checked={requirements.pte_academic?.required || false}
              onCheckedChange={(checked) => 
                updateRequirements({
                  pte_academic: {
                    required: checked as boolean,
                    overall_min: requirements.pte_academic?.overall_min || 58
                  }
                })
              }
            />
            <Label htmlFor="accepts-pte" className="font-medium">
              Accepts PTE Academic
            </Label>
          </div>

          {requirements.pte_academic?.required && (
            <div className="ml-9">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pte-overall">Minimum Overall Score *</Label>
                <Input
                  id="pte-overall"
                  type="number"
                  min="10"
                  max="90"
                  value={requirements.pte_academic.overall_min}
                  onChange={(e) => 
                    updateRequirements({
                      pte_academic: {
                        ...requirements.pte_academic!,
                        overall_min: parseInt(e.target.value) || 58
                      }
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
