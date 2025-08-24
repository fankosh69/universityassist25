import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { calculateMatch, type StudentProfile, type ProgramRequirements, type MatchResult } from '@/lib/matching';
import { useTranslation } from 'react-i18next';

interface EligibilityPanelProps {
  studentProfile?: StudentProfile;
  programRequirements: ProgramRequirements;
  className?: string;
}

export default function EligibilityPanel({ 
  studentProfile, 
  programRequirements, 
  className 
}: EligibilityPanelProps) {
  const { t } = useTranslation();
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    if (studentProfile) {
      const result = calculateMatch(studentProfile, programRequirements);
      setMatchResult(result);
    }
  }, [studentProfile, programRequirements]);

  if (!studentProfile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            {t('eligibility.complete_profile')}
          </CardTitle>
          <CardDescription>
            {t('eligibility.complete_profile_desc')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!matchResult) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'borderline':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'borderline':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-red-100 text-red-800 hover:bg-red-100';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon(matchResult.status)}
            {t('eligibility.title')}
          </span>
          <Badge className={getStatusColor(matchResult.status)}>
            {t(`eligibility.status.${matchResult.status}`)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t('eligibility.match_score')}: {Math.round(matchResult.score * 100)}%
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{t('eligibility.overall_match')}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(matchResult.score * 100)}%
            </span>
          </div>
          <Progress value={matchResult.score * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{t('eligibility.gpa')}</span>
              <span>{Math.round(matchResult.components.gpa * 100)}%</span>
            </div>
            <Progress value={matchResult.components.gpa * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{t('eligibility.language')}</span>
              <span>{Math.round(matchResult.components.language * 100)}%</span>
            </div>
            <Progress value={matchResult.components.language * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{t('eligibility.ects')}</span>
              <span>{Math.round(matchResult.components.ects * 100)}%</span>
            </div>
            <Progress value={matchResult.components.ects * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{t('eligibility.timing')}</span>
              <span>{Math.round(matchResult.components.intake * 100)}%</span>
            </div>
            <Progress value={matchResult.components.intake * 100} className="h-1" />
          </div>
        </div>

        {matchResult.gaps.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">{t('eligibility.requirements_needed')}</h4>
            <ul className="text-sm space-y-1">
              {matchResult.gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {t('eligibility.algorithm_note')}
        </div>
      </CardContent>
    </Card>
  );
}