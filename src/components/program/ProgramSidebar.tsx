import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WatchlistButton from '@/components/WatchlistButton';
import EligibilityPanel from '@/components/EligibilityPanel';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { AskAIButton } from '@/components/program/AskAIButton';
import { ProgramCampusLocation } from '@/components/program/ProgramCampusLocation';
import { Share2, Printer, Calendar, ExternalLink, MapPin, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import type { StudentProfile, ProgramRequirements } from '@/lib/matching';

interface ProgramSidebarProps {
  programId: string;
  programName: string;
  studentProfile?: StudentProfile;
  programRequirements: ProgramRequirements;
  university: {
    id: string;
    name: string;
    slug: string;
    city: string;
    type: string;
    control_type: string;
    website?: string;
  };
  campuses?: any[];
  nextDeadline?: Date;
  onConsultationClick?: () => void;
  className?: string;
}

export function ProgramSidebar({
  programId,
  programName,
  studentProfile,
  programRequirements,
  university,
  campuses,
  nextDeadline,
  onConsultationClick,
  className,
}: ProgramSidebarProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isComplete, isLoggedIn } = useOnboardingStatus();
  const [isSharing, setIsSharing] = useState(false);

  const handleGatedConsultation = () => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }
    if (!isComplete) {
      navigate(`/onboarding?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    onConsultationClick?.();
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: programName,
          text: `Check out this program at ${university.name}`,
          url: window.location.href,
        });
        // No toast needed for native share - it has its own UI
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        
        toast({
          title: t('share.copied'),
          description: t('share.copied_desc'),
        });
      }
    } catch (err) {
      // Only show error if it's not just a user cancellation
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        toast({
          title: t('share.error'),
          description: t('share.error_desc'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AskAIButton 
            programId={programId}
            variant="default"
            size="default"
            className="w-full"
          />

          <Button variant="secondary" className="w-full" onClick={handleGatedConsultation}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Get Admission Support
          </Button>
          
          <div className="w-full">
            <WatchlistButton programId={programId} size="default" variant="outline" />
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleShare} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Sharing...' : t('share.title')}
          </Button>

          <Button variant="outline" className="w-full" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Details
          </Button>
        </CardContent>
      </Card>

      {/* Eligibility Checker */}
      <EligibilityPanel
        studentProfile={studentProfile}
        programRequirements={programRequirements}
      />

      {/* Campus Location */}
      {campuses && campuses.length > 0 && (
        <ProgramCampusLocation campuses={campuses} />
      )}

      {/* Important Dates */}
      {nextDeadline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Next Application Deadline</p>
              <p className="text-sm font-semibold">{format(nextDeadline, 'MMMM d, yyyy')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* University Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">University</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Link
              to={`/universities/${university.slug}`}
              className="text-sm font-semibold hover:underline hover:text-primary"
            >
              {university.name}
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <InstitutionTypeBadge type={university.type} />
              <ControlTypeBadge type={university.control_type} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{university.city}, Germany</span>
          </div>

          <Link to={`/universities/${university.slug}`}>
            <Button variant="secondary" size="sm" className="w-full">
              View University Profile
            </Button>
          </Link>

          {university.website && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={university.website} target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Helpful Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="link" size="sm" className="w-full justify-start px-0">
            <a href="https://www.make-it-in-germany.com" target="_blank" rel="noopener noreferrer">
              Student Visa Guide
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
          <Button asChild variant="link" size="sm" className="w-full justify-start px-0">
            <a href="https://www.uni-assist.de" target="_blank" rel="noopener noreferrer">
              Uni-Assist Portal
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
