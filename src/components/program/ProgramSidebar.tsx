import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WatchlistButton from '@/components/WatchlistButton';
import EligibilityPanel from '@/components/EligibilityPanel';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { Share2, Printer, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
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
  nextDeadline?: Date;
  className?: string;
}

export function ProgramSidebar({
  programId,
  programName,
  studentProfile,
  programRequirements,
  university,
  nextDeadline,
  className,
}: ProgramSidebarProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: programName,
          text: `Check out this program at ${university.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast here
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
          <div className="w-full">
            <WatchlistButton programId={programId} size="default" variant="outline" />
          </div>
          
          <Button variant="outline" className="w-full" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Program
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

          {university.website && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={university.website} target="_blank" rel="noopener noreferrer">
                Visit University
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          )}

          <Link to={`/universities/${university.slug}`}>
            <Button variant="ghost" size="sm" className="w-full">
              View All Programs
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Helpful Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="link" size="sm" className="w-full justify-start px-0">
            <a href="https://www.daad.de" target="_blank" rel="noopener noreferrer">
              DAAD Scholarships
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
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
