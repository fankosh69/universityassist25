import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, ExternalLink, BookOpen, Languages, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type MatchResult } from '@/lib/matching';

interface GapAnalysisProps {
  matchResult: MatchResult;
  className?: string;
}

interface GapItem {
  category: 'gpa' | 'language' | 'ects' | 'intake';
  severity: 'critical' | 'important' | 'minor';
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  progress: number;
}

export default function GapAnalysis({ matchResult, className }: GapAnalysisProps) {
  const { t } = useTranslation();

  const generateGapItems = (): GapItem[] => {
    const items: GapItem[] = [];
    const { components } = matchResult;

    // GPA Analysis
    if (components.gpa < 0.8) {
      items.push({
        category: 'gpa',
        severity: components.gpa < 0.5 ? 'critical' : 'important',
        title: t('gaps.gpa.title'),
        description: components.gpa < 0.5 
          ? t('gaps.gpa.critical_desc')
          : t('gaps.gpa.improve_desc'),
        action: t('gaps.gpa.action'),
        actionUrl: '/profile#gpa',
        progress: components.gpa * 100
      });
    }

    // Language Analysis
    if (components.language < 0.8) {
      items.push({
        category: 'language',
        severity: components.language < 0.5 ? 'critical' : 'important',
        title: t('gaps.language.title'),
        description: components.language < 0.5
          ? t('gaps.language.critical_desc')
          : t('gaps.language.improve_desc'),
        action: t('gaps.language.action'),
        actionUrl: 'https://www.goethe.de/en/spr/kup.html',
        progress: components.language * 100
      });
    }

    // ECTS Analysis
    if (components.ects < 0.8) {
      items.push({
        category: 'ects',
        severity: components.ects < 0.6 ? 'critical' : 'important',
        title: t('gaps.ects.title'),
        description: components.ects < 0.6
          ? t('gaps.ects.critical_desc')
          : t('gaps.ects.improve_desc'),
        action: t('gaps.ects.action'),
        actionUrl: '/profile#academics',
        progress: components.ects * 100
      });
    }

    // Intake timing
    if (components.intake < 0.8) {
      items.push({
        category: 'intake',
        severity: 'minor',
        title: t('gaps.intake.title'),
        description: t('gaps.intake.desc'),
        action: t('gaps.intake.action'),
        progress: components.intake * 100
      });
    }

    return items.sort((a, b) => {
      const severityOrder = { critical: 0, important: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  const gapItems = generateGapItems();

  if (gapItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            {t('gaps.all_requirements_met')}
          </CardTitle>
          <CardDescription>
            {t('gaps.all_requirements_met_desc')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gpa': return <GraduationCap className="h-4 w-4" />;
      case 'language': return <Languages className="h-4 w-4" />;
      case 'ects': return <BookOpen className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'important': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {t('gaps.title')}
        </CardTitle>
        <CardDescription>
          {t('gaps.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {gapItems.map((item, index) => (
          <div 
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(item.category)}
                <h4 className="font-medium">{item.title}</h4>
                <Badge variant={getSeverityColor(item.severity)}>
                  {t(`gaps.severity.${item.severity}`)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(item.progress)}%
              </div>
            </div>

            <Progress value={item.progress} className="h-2" />
            
            <p className="text-sm text-muted-foreground">
              {item.description}
            </p>

            {item.action && (
              <Button 
                size="sm" 
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (item.actionUrl?.startsWith('http')) {
                    window.open(item.actionUrl, '_blank');
                  } else if (item.actionUrl) {
                    window.location.href = item.actionUrl;
                  }
                }}
              >
                {item.action}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            {t('gaps.improvement_tips')}
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('gaps.tip_1')}</li>
            <li>• {t('gaps.tip_2')}</li>
            <li>• {t('gaps.tip_3')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}