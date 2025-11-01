import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, ExternalLink, GraduationCap, MapPin } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";
import { motion } from "framer-motion";

interface ProgramRecommendation {
  program_id: string;
  university_name: string;
  university_slug: string;
  program_name: string;
  program_slug: string;
  city: string;
  match_score: number;
  eligibility: 'eligible' | 'borderline' | 'missing';
  why_it_fits: string;
  requirements_met: string[];
  requirements_missing: string[];
}

interface ProgramRecommendationCardProps {
  program: ProgramRecommendation;
  onAskAI?: (programName: string) => void;
}

export default function ProgramRecommendationCard({ program, onAskAI }: ProgramRecommendationCardProps) {
  const getEligibilityColor = () => {
    switch (program.eligibility) {
      case 'eligible': return 'text-green-600 bg-green-50 border-green-200';
      case 'borderline': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'missing': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getMatchScoreColor = () => {
    if (program.match_score >= 80) return 'text-green-600';
    if (program.match_score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Header with Match Score */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg leading-tight">{program.program_name}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{program.university_name}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{program.city}</span>
                </div>
              </div>
            </div>
            
            {/* Match Score Ring */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - program.match_score / 100)}`}
                    className={`${getMatchScoreColor()} transition-all duration-500`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${getMatchScoreColor()}`}>
                    {program.match_score}%
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Match</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Eligibility Badge */}
          <Badge className={`${getEligibilityColor()} border`}>
            {program.eligibility === 'eligible' && '✓ Eligible'}
            {program.eligibility === 'borderline' && '⚠ Borderline'}
            {program.eligibility === 'missing' && '✗ Missing Requirements'}
          </Badge>

          {/* Why It Fits */}
          <div>
            <p className="text-sm font-medium mb-2">Why this program fits you:</p>
            <p className="text-sm text-muted-foreground">{program.why_it_fits}</p>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            {program.requirements_met.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Requirements Met:</p>
                <div className="space-y-1">
                  {program.requirements_met.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {program.requirements_missing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Action Items:</p>
                <div className="space-y-1">
                  {program.requirements_missing.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="default" size="sm" className="flex-1">
              <Link to={`/universities/${program.university_slug}/programs/${program.program_slug}`}>
                View Details
                <ExternalLink className="h-3 w-3 ml-2" />
              </Link>
            </Button>
            <WatchlistButton 
              programId={program.program_id}
              size="sm"
              variant="outline"
            />
            {onAskAI && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onAskAI(program.program_name)}
                className="text-primary"
              >
                Ask AI
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
