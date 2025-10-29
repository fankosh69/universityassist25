import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProgramContactProps {
  programId: string;
  programName: string;
  universityName: string;
  universitySlug: string;
  universityWebsite?: string;
  programUrl?: string;
  applicationMethod: string;
  uniAssistRequired: boolean;
  onConsultationClick: () => void;
}

export function ProgramContact({
  programId,
  programName,
  universityName,
  universitySlug,
  universityWebsite,
  onConsultationClick,
}: ProgramContactProps) {
  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Ready to Apply?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get expert guidance for your application to {universityName}. Our advisors are here to help you every step of the way.
          </p>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button size="lg" className="w-full" onClick={onConsultationClick}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Your Journey
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to={`/universities/${universitySlug}`}>
                <Building2 className="h-4 w-4 mr-2" />
                View {universityName}
              </Link>
            </Button>
          </div>

          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={onConsultationClick}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Application Support
          </Button>
        </div>

        {/* Guidance Section */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold">Need Guidance?</h4>
          
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3"
              onClick={onConsultationClick}
            >
              <MessageSquare className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Speak with Our Advisors</p>
                <p className="text-xs text-muted-foreground">Get personalized admission support</p>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link to={`/ai-assistant?program_id=${programId}`}>
                <Sparkles className="h-4 w-4 mr-3 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-sm">Check Your Eligibility</p>
                  <p className="text-xs text-muted-foreground">Use our AI tool for instant assessment</p>
                </div>
              </Link>
            </Button>
          </div>
        </div>

        {/* CTA Info Box */}
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">Have questions about this program?</p>
          <p className="text-xs text-muted-foreground">
            Use our AI Assistant to get instant, personalized guidance based on this program's specific requirements and your profile.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            asChild
          >
            <Link to={`/ai-assistant?program_id=${programId}`}>
              <Sparkles className="h-3 w-3 mr-2" />
              Ask AI About This Program
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
