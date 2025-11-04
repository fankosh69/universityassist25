import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Award, CheckCircle2, Info } from "lucide-react";
import { EnglishLanguageRequirements } from "@/types/language-requirements";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnglishLanguageRequirementsCardProps {
  requirements: EnglishLanguageRequirements;
}

export function EnglishLanguageRequirementsCard({ requirements }: EnglishLanguageRequirementsCardProps) {
  const hasAnyRequirement = requirements.accepts_moi || 
    requirements.ielts_academic?.required || 
    requirements.toefl_ibt?.required || 
    requirements.pte_academic?.required;

  if (!hasAnyRequirement) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          English Language Proof Options
        </CardTitle>
        <CardDescription>
          This program accepts the following English proficiency proofs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MOI */}
        {requirements.accepts_moi && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Medium of Instruction (MOI) Certificate</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        An official certificate from your university confirming that your 
                        degree was taught entirely in English. No test scores required.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                If your degree was taught entirely in English
              </p>
            </div>
          </div>
        )}

        {/* IELTS Academic */}
        {requirements.ielts_academic?.required && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
            <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Award className="h-4 w-4" />
                <span className="font-medium">IELTS Academic</span>
                <Badge variant="secondary">
                  Overall: {requirements.ielts_academic.overall_min}+
                </Badge>
              </div>
              {(requirements.ielts_academic.reading_min || 
                requirements.ielts_academic.writing_min || 
                requirements.ielts_academic.listening_min || 
                requirements.ielts_academic.speaking_min) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">Individual bands:</span>
                  {requirements.ielts_academic.reading_min && (
                    <Badge variant="outline">R: {requirements.ielts_academic.reading_min}+</Badge>
                  )}
                  {requirements.ielts_academic.writing_min && (
                    <Badge variant="outline">W: {requirements.ielts_academic.writing_min}+</Badge>
                  )}
                  {requirements.ielts_academic.listening_min && (
                    <Badge variant="outline">L: {requirements.ielts_academic.listening_min}+</Badge>
                  )}
                  {requirements.ielts_academic.speaking_min && (
                    <Badge variant="outline">S: {requirements.ielts_academic.speaking_min}+</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOEFL iBT */}
        {requirements.toefl_ibt?.required && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="font-medium">TOEFL iBT</span>
                <Badge variant="secondary">
                  Score: {requirements.toefl_ibt.overall_min}+
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* PTE Academic */}
        {requirements.pte_academic?.required && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="font-medium">PTE Academic</span>
                <Badge variant="secondary">
                  Score: {requirements.pte_academic.overall_min}+
                </Badge>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground pt-2 border-t">
          You need to provide at least one of the above proofs to be eligible for this program.
        </p>
      </CardContent>
    </Card>
  );
}
