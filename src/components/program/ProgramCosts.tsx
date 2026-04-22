import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Euro, Info, Home, ShoppingBag, Heart, Briefcase, Receipt } from 'lucide-react';
import { calculateTuitionFees, formatTuitionDisplay, type TuitionStructure } from '@/lib/tuition-calculator';

interface ProgramCostsProps {
  tuitionAmount: number | null;
  tuitionStructure: TuitionStructure;
  durationSemesters: number | null;
  applicationMethod?: string;
  hasApplicationFee?: boolean | null;
  applicationFeeAmount?: number | null;
}

export function ProgramCosts({ tuitionAmount, tuitionStructure, durationSemesters, applicationMethod, hasApplicationFee, applicationFeeAmount }: ProgramCostsProps) {
  const tuitionCalc = tuitionAmount 
    ? calculateTuitionFees(tuitionAmount, tuitionStructure)
    : null;
  
  const isTuitionFree = !tuitionAmount || tuitionAmount === 0;
  const totalProgramCost = tuitionCalc && durationSemesters 
    ? tuitionCalc.semester * durationSemesters 
    : null;

  // Typical semester contribution breakdown
  const semesterContribution = {
    admin: 50,
    studentUnion: 20,
    semesterTicket: 180,
    total: 250,
  };

  // Living costs estimates for Germany
  const livingCosts = {
    accommodation: { min: 300, max: 700 },
    food: { min: 200, max: 350 },
    insurance: { min: 130, max: 170 },
    transport: { min: 0, max: 50 },
    other: { min: 100, max: 200 },
  };

  const totalMonthlyMin = 
    livingCosts.accommodation.min +
    livingCosts.food.min +
    livingCosts.insurance.min +
    livingCosts.transport.min +
    livingCosts.other.min;

  const totalMonthlyMax = 
    livingCosts.accommodation.max +
    livingCosts.food.max +
    livingCosts.insurance.max +
    livingCosts.transport.max +
    livingCosts.other.max;

  // Application fee logic
  const isUniAssist = applicationMethod === 'uni_assist_direct' || applicationMethod === 'uni_assist_vpd';
  const getApplicationFeeInfo = () => {
    if (isUniAssist) {
      return { hasFee: true, amount: '€75 (first) + €30 (additional)', isStandard: true };
    }
    if (hasApplicationFee === true && applicationFeeAmount) {
      return { hasFee: true, amount: `€${applicationFeeAmount.toLocaleString()}`, isStandard: false };
    }
    if (hasApplicationFee === false) {
      return { hasFee: false, amount: 'Free', isStandard: false };
    }
    return null;
  };

  const appFeeInfo = getApplicationFeeInfo();

  // Summary text for collapsed state
  const getSummary = () => {
    const parts: string[] = [];
    if (isTuitionFree) {
      parts.push('Tuition-free');
    } else if (tuitionCalc) {
      parts.push(`€${tuitionCalc.semester.toLocaleString()}/semester`);
    }
    parts.push(`~€${totalMonthlyMin}-${totalMonthlyMax}/month living`);
    return parts;
  };

  const summaryParts = getSummary();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="costs" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              <span className="font-semibold">Costs & Financing</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {summaryParts[0]}
              </span>
              <Badge variant={isTuitionFree ? 'default' : 'secondary'} className={isTuitionFree ? 'bg-green-600' : ''}>
                {isTuitionFree ? '✓ Tuition-free' : 'View costs'}
              </Badge>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Estimated costs for studying this program in Germany
            </p>

            {/* Tuition Fees Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Tuition Fees</h3>
              {isTuitionFree ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This program is <strong className="text-green-600">tuition-free</strong>. Most public universities in Germany do not charge tuition fees for undergraduate and many graduate programs.
                  </AlertDescription>
                </Alert>
              ) : tuitionCalc && (
                <div className="space-y-2">
                  {/* Primary Fee (as entered by admin) */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 font-semibold">
                    <span>
                      {tuitionStructure === 'monthly' && 'Monthly Fee'}
                      {tuitionStructure === 'semester' && 'Per Semester'}
                      {tuitionStructure === 'yearly' && 'Annual Fee'}
                    </span>
                    <span className="text-lg">{formatTuitionDisplay(tuitionAmount!, tuitionStructure)}</span>
                  </div>
                  
                  {/* Calculated Alternatives */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Equivalent amounts:</p>
                    
                    {tuitionStructure !== 'monthly' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Per Month</span>
                        <span>€{tuitionCalc.monthly.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {tuitionStructure !== 'semester' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Per Semester (6 months)</span>
                        <span>€{tuitionCalc.semester.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {tuitionStructure !== 'yearly' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Per Year</span>
                        <span>€{tuitionCalc.yearly.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Program Cost */}
                  {totalProgramCost && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted mt-3">
                      <span className="text-sm">Total Program Cost ({durationSemesters} semesters)</span>
                      <span className="font-semibold text-lg">€{totalProgramCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Application Fee Section */}
            {appFeeInfo && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Application Fee
                </h3>
                {appFeeInfo.hasFee ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-sm text-amber-800">Application Fee</span>
                      <span className="font-medium text-amber-900">{appFeeInfo.amount}</span>
                    </div>
                    {appFeeInfo.isStandard && (
                      <p className="text-xs text-muted-foreground">
                        Uni-Assist processes applications for many German universities. The fee is €75 for your first application and €30 for each additional application submitted in the same semester.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-sm text-green-800">Application Fee</span>
                    <Badge variant="default" className="bg-green-600">No Fee</Badge>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Semester Contribution (All Students)</h3>
              <p className="text-xs text-muted-foreground">
                Even at tuition-free universities, students pay a semester contribution
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Administrative Fee</span>
                  <span>€{semesterContribution.admin}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Student Union Fee</span>
                  <span>€{semesterContribution.studentUnion}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Semester Ticket (Public Transport)</span>
                  <span>€{semesterContribution.semesterTicket}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 font-medium">
                  <span>Typical Total per Semester</span>
                  <span>~€{semesterContribution.total}</span>
                </div>
              </div>
            </div>

            {/* Living Costs */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Monthly Living Costs Estimate</h3>
              <p className="text-xs text-muted-foreground">
                Average monthly expenses for students in Germany
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    Accommodation (rent)
                  </span>
                  <span>€{livingCosts.accommodation.min}-{livingCosts.accommodation.max}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    Food & Groceries
                  </span>
                  <span>€{livingCosts.food.min}-{livingCosts.food.max}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    Health Insurance
                  </span>
                  <span>€{livingCosts.insurance.min}-{livingCosts.insurance.max}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Other (books, leisure, etc.)
                  </span>
                  <span>€{livingCosts.other.min}-{livingCosts.other.max}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary font-medium mt-3">
                  <span>Total Monthly Budget</span>
                  <span>€{totalMonthlyMin}-{totalMonthlyMax}</span>
                </div>
              </div>
            </div>

            {/* Financing Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Financing Options</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium">Student Jobs</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    International students can work up to 120 full days or 240 half days per year
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium">Blocked Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required proof of €11,904/year (€992/month) for student visa application
                  </p>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Costs vary by city and lifestyle. Major cities like Munich and Frankfurt tend to be more expensive. Always check the university's official website for current fees.
              </AlertDescription>
            </Alert>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
