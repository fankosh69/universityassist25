import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/slug";
import { 
  Upload, 
  Globe, 
  Check, 
  X, 
  AlertTriangle, 
  Building2, 
  Loader2,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface UniversityMatch {
  url: string;
  domain: string;
  university_id: string | null;
  university_name: string | null;
  university_slug: string | null;
  city_name: string | null;
  matched: boolean;
}

interface ScrapedProgram {
  name: string;
  degree_type?: string;
  degree_level?: 'bachelor' | 'master';
  description?: string;
  duration_semesters?: number;
  ects_credits?: number;
  language_of_instruction?: string[];
  tuition_amount?: number;
  tuition_fee_structure?: string;
  uni_assist_required?: boolean;
  application_method?: string;
  winter_intake?: boolean;
  summer_intake?: boolean;
  winter_deadline?: string;
  summer_deadline?: string;
  program_url?: string;
  field_of_study?: string;
  field_of_study_id?: string;
  field_of_study_name?: string;
  field_match_confidence?: 'high' | 'medium' | 'low' | 'none';
  minimum_gpa?: number;
  confidence?: number;
  // Added for bulk import
  university_id?: string;
  university_name?: string;
  selected?: boolean;
  auto_created_field?: boolean;
}

interface GroupedPrograms {
  university_id: string;
  university_name: string;
  city_name: string | null;
  programs: ScrapedProgram[];
}

type Step = 'input' | 'matching' | 'scraping' | 'preview' | 'importing';

interface BulkProgramImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgramsImported?: () => void;
}

export function BulkProgramImporter({ open, onOpenChange, onProgramsImported }: BulkProgramImporterProps) {
  const [step, setStep] = useState<Step>('input');
  const [urlInput, setUrlInput] = useState('');
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [unmatchedDomains, setUnmatchedDomains] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [scrapedPrograms, setScrapedPrograms] = useState<ScrapedProgram[]>([]);
  const [groupedPrograms, setGroupedPrograms] = useState<GroupedPrograms[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoCreateFields, setAutoCreateFields] = useState(true);
  const { toast } = useToast();

  // Parse URLs from input
  const parseUrls = useCallback((input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
  }, []);

  // Step 1: Match URLs to universities
  const handleMatchUrls = async () => {
    const urls = parseUrls(urlInput);
    
    if (urls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    setError(null);
    setStep('matching');
    setProgress(0);
    setCurrentAction('Matching URLs to universities...');

    try {
      const { data, error: matchError } = await supabase.functions.invoke('match-university-by-domain', {
        body: { urls }
      });

      if (matchError) throw matchError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to match URLs');
      }

      setMatches(data.matches);
      setUnmatchedDomains(data.unmatched_domains);
      
      // Auto-select matched URLs
      const matchedUrls = new Set<string>(
        data.matches.filter((m: UniversityMatch) => m.matched).map((m: UniversityMatch) => m.url)
      );
      setSelectedUrls(matchedUrls);

      setStep('preview');
      setProgress(100);
      
      toast({
        title: "URLs Analyzed",
        description: `Matched ${data.stats.matched}/${data.stats.total} URLs to universities`
      });

    } catch (err: any) {
      console.error('Error matching URLs:', err);
      setError(err.message || 'Failed to match URLs');
      setStep('input');
    }
  };

  // Step 2: Scrape selected programs
  const handleScrapePrograms = async () => {
    const urlsToScrape = Array.from(selectedUrls);
    
    if (urlsToScrape.length === 0) {
      setError('Please select at least one URL to scrape');
      return;
    }

    setError(null);
    setStep('scraping');
    setProgress(0);
    setScrapedPrograms([]);

    const programs: ScrapedProgram[] = [];
    const batchSize = 5;
    const totalBatches = Math.ceil(urlsToScrape.length / batchSize);

    try {
      for (let i = 0; i < urlsToScrape.length; i += batchSize) {
        const batch = urlsToScrape.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        setCurrentAction(`Scraping batch ${batchNumber}/${totalBatches} (${batch.length} URLs)...`);
        setProgress((i / urlsToScrape.length) * 80);

        const { data, error: scrapeError } = await supabase.functions.invoke('scrape-programs-firecrawl', {
          body: { 
            mode: 'scrape',
            programUrls: batch
          }
        });

        if (scrapeError) {
          console.error('Scrape error:', scrapeError);
          continue;
        }

        if (data?.data?.programs) {
          // Add university info to each program
          for (const program of data.data.programs) {
            const matchInfo = matches.find(m => m.url === program.program_url);
            if (matchInfo?.matched) {
              program.university_id = matchInfo.university_id;
              program.university_name = matchInfo.university_name;
              program.selected = true;
            }
            programs.push(program);
          }
        }
      }

      // Auto-create fields if enabled
      if (autoCreateFields) {
        setCurrentAction('Auto-creating missing fields of study...');
        setProgress(85);

        for (const program of programs) {
          if (program.field_of_study && 
              (!program.field_of_study_id || program.field_match_confidence === 'none' || program.field_match_confidence === 'low')) {
            try {
              const { data: createResult } = await supabase.functions.invoke('auto-create-field-of-study', {
                body: { 
                  field_name: program.field_of_study,
                  program_name: program.name,
                  degree_level: program.degree_level
                }
              });

              if (createResult?.success && createResult?.field_of_study_id) {
                program.field_of_study_id = createResult.field_of_study_id;
                program.field_of_study_name = createResult.field_of_study_name;
                program.auto_created_field = createResult.created;
                program.field_match_confidence = 'high';
              }
            } catch (err) {
              console.error('Error auto-creating field:', err);
            }
          }
        }
      }

      setScrapedPrograms(programs);
      
      // Group by university
      const grouped = groupProgramsByUniversity(programs, matches);
      setGroupedPrograms(grouped);

      setStep('preview');
      setProgress(100);
      setCurrentAction('');

      toast({
        title: "Scraping Complete",
        description: `Extracted ${programs.length} programs from ${urlsToScrape.length} URLs`
      });

    } catch (err: any) {
      console.error('Error scraping programs:', err);
      setError(err.message || 'Failed to scrape programs');
      setStep('preview');
    }
  };

  // Group programs by university
  const groupProgramsByUniversity = (programs: ScrapedProgram[], matchData: UniversityMatch[]): GroupedPrograms[] => {
    const groups = new Map<string, GroupedPrograms>();

    for (const program of programs) {
      if (!program.university_id) continue;

      if (!groups.has(program.university_id)) {
        const matchInfo = matchData.find(m => m.university_id === program.university_id);
        groups.set(program.university_id, {
          university_id: program.university_id,
          university_name: program.university_name || matchInfo?.university_name || 'Unknown',
          city_name: matchInfo?.city_name || null,
          programs: []
        });
      }

      groups.get(program.university_id)!.programs.push(program);
    }

    return Array.from(groups.values());
  };

  // Step 3: Import selected programs
  const handleImportPrograms = async () => {
    const programsToImport = scrapedPrograms.filter(p => p.selected && p.university_id);

    if (programsToImport.length === 0) {
      setError('Please select at least one program to import');
      return;
    }

    setError(null);
    setStep('importing');
    setProgress(0);
    setCurrentAction('Importing programs...');

    let imported = 0;
    let failed = 0;

    try {
      for (let i = 0; i < programsToImport.length; i++) {
        const program = programsToImport[i];
        setProgress((i / programsToImport.length) * 100);
        setCurrentAction(`Importing ${program.name}...`);

        try {
          // Generate slug
          let slug = slugify(program.name);
          
          // Check for slug conflicts
          let counter = 1;
          let finalSlug = slug;
          while (true) {
            const { data: existing } = await supabase
              .from('programs')
              .select('id')
              .eq('slug', finalSlug)
              .maybeSingle();
            
            if (!existing) break;
            finalSlug = `${slug}-${counter}`;
            counter++;
          }

          // Insert program
          const { data: newProgram, error: insertError } = await supabase
            .from('programs')
            .insert({
              name: program.name,
              slug: finalSlug,
              description: program.description || null,
              degree_type: program.degree_type || 'B.Sc.',
              degree_level: program.degree_level || 'bachelor',
              duration_semesters: program.duration_semesters || 6,
              ects_credits: program.ects_credits || 180,
              tuition_amount: program.tuition_amount || 0,
              tuition_fee_structure: program.tuition_fee_structure || 'semester',
              semester_fees: program.tuition_amount || 0,
              language_of_instruction: program.language_of_instruction || ['de'],
              uni_assist_required: program.uni_assist_required || false,
              application_method: program.application_method || 'direct',
              winter_intake: program.winter_intake ?? true,
              summer_intake: program.summer_intake ?? false,
              program_url: program.program_url || null,
              university_id: program.university_id!,
              published: false, // Start as draft
              status: 'draft',
              field_of_study: program.field_of_study || '',
              field_of_study_id: program.field_of_study_id || null,
              gpa_minimum: program.minimum_gpa || null
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Add field of study association if we have an ID
          if (program.field_of_study_id && newProgram) {
            await supabase
              .from('program_fields_of_study')
              .insert({
                program_id: newProgram.id,
                field_of_study_id: program.field_of_study_id,
                is_primary: true
              });
          }

          imported++;
        } catch (err) {
          console.error(`Failed to import ${program.name}:`, err);
          failed++;
        }
      }

      setProgress(100);
      setCurrentAction('');

      toast({
        title: "Import Complete",
        description: `Successfully imported ${imported} programs. ${failed > 0 ? `${failed} failed.` : ''}`,
        variant: failed > 0 ? 'default' : 'default'
      });

      onProgramsImported?.();
      handleClose();

    } catch (err: any) {
      console.error('Error importing programs:', err);
      setError(err.message || 'Failed to import programs');
      setStep('preview');
    }
  };

  // Toggle program selection
  const toggleProgramSelection = (programUrl: string) => {
    setScrapedPrograms(prev => 
      prev.map(p => 
        p.program_url === programUrl ? { ...p, selected: !p.selected } : p
      )
    );
  };

  // Toggle all programs in a university
  const toggleUniversitySelection = (universityId: string, selected: boolean) => {
    setScrapedPrograms(prev =>
      prev.map(p =>
        p.university_id === universityId ? { ...p, selected } : p
      )
    );
  };

  // Close and reset
  const handleClose = () => {
    setStep('input');
    setUrlInput('');
    setMatches([]);
    setUnmatchedDomains([]);
    setSelectedUrls(new Set());
    setScrapedPrograms([]);
    setGroupedPrograms([]);
    setProgress(0);
    setCurrentAction('');
    setError(null);
    onOpenChange(false);
  };

  // Get confidence badge
  const getConfidenceBadge = (confidence: string | undefined) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Low</Badge>;
      default:
        return <Badge variant="destructive">None</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Program Import
            {step !== 'input' && (
              <Badge variant="outline" className="ml-2">
                Step {['input', 'matching', 'scraping', 'preview', 'importing'].indexOf(step) + 1}/5
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        {(step === 'matching' || step === 'scraping' || step === 'importing') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentAction}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Input URLs */}
          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Program URLs (one per line)</Label>
                <Textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={`https://www.tu-dortmund.de/studium/informatik-bachelor
https://www.rwth-aachen.de/maschinenbau-master
https://www.kit.edu/studium/physik-bachelor`}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste program page URLs from any German universities. The system will automatically detect the university.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoCreate"
                  checked={autoCreateFields}
                  onCheckedChange={(checked) => setAutoCreateFields(!!checked)}
                />
                <Label htmlFor="autoCreate" className="flex items-center gap-1 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Auto-create missing fields of study
                </Label>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>{parseUrls(urlInput).length}</strong> valid URLs detected
              </div>
            </div>
          )}

          {/* Step 2: URL Matching Results & Program Selection */}
          {step === 'preview' && scrapedPrograms.length === 0 && (
            <div className="space-y-4">
              {unmatchedDomains.length > 0 && (
                <Alert variant="default" className="border-yellow-500">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <strong>{unmatchedDomains.length} domains</strong> could not be matched to universities: {unmatchedDomains.join(', ')}
                    <br />
                    <span className="text-xs">Add these universities first, or skip these URLs.</span>
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="matched" className="w-full">
                <TabsList>
                  <TabsTrigger value="matched">
                    Matched ({matches.filter(m => m.matched).length})
                  </TabsTrigger>
                  <TabsTrigger value="unmatched">
                    Unmatched ({matches.filter(m => !m.matched).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matched" className="mt-4">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2 pr-4">
                      {matches.filter(m => m.matched).map((match) => (
                        <div
                          key={match.url}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedUrls.has(match.url)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedUrls);
                              if (checked) {
                                newSet.add(match.url);
                              } else {
                                newSet.delete(match.url);
                              }
                              setSelectedUrls(newSet);
                            }}
                          />
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{match.university_name}</span>
                              {match.city_name && (
                                <span className="text-sm text-muted-foreground">({match.city_name})</span>
                              )}
                            </div>
                            <a 
                              href={match.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary truncate block"
                            >
                              {match.url}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="unmatched" className="mt-4">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2 pr-4">
                      {matches.filter(m => !m.matched).map((match) => (
                        <div
                          key={match.url}
                          className="flex items-center gap-3 p-3 border rounded-lg opacity-60"
                        >
                          <X className="h-4 w-4 text-destructive flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{match.domain}</span>
                              <Badge variant="outline" className="text-destructive">Not in database</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground truncate block">
                              {match.url}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 3: Scraped Programs Preview */}
          {step === 'preview' && scrapedPrograms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <strong>{scrapedPrograms.filter(p => p.selected).length}</strong> of{' '}
                  <strong>{scrapedPrograms.length}</strong> programs selected for import
                </div>
              </div>

              {groupedPrograms.map((group) => (
                <Card key={group.university_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {group.university_name}
                        {group.city_name && (
                          <span className="text-sm font-normal text-muted-foreground">
                            ({group.city_name})
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{group.programs.length} programs</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUniversitySelection(group.university_id, true)}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUniversitySelection(group.university_id, false)}
                        >
                          Deselect
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.programs.map((program) => (
                      <div
                        key={program.program_url}
                        className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                          program.selected ? 'bg-primary/5 border-primary/30' : 'opacity-60'
                        }`}
                      >
                        <Checkbox
                          checked={program.selected}
                          onCheckedChange={() => toggleProgramSelection(program.program_url!)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{program.name}</span>
                            <Badge variant="outline">{program.degree_type || 'Unknown'}</Badge>
                            <Badge variant={program.degree_level === 'master' ? 'default' : 'secondary'}>
                              {program.degree_level || 'Unknown'}
                            </Badge>
                            {program.confidence && (
                              <Badge 
                                variant={program.confidence >= 70 ? 'default' : 'outline'}
                                className={program.confidence >= 70 ? 'bg-green-500' : 'text-yellow-600'}
                              >
                                {program.confidence}% confidence
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {program.duration_semesters && (
                              <span>{program.duration_semesters} semesters</span>
                            )}
                            {program.ects_credits && <span>{program.ects_credits} ECTS</span>}
                            {program.language_of_instruction && (
                              <span>Lang: {program.language_of_instruction.join(', ')}</span>
                            )}
                            {program.tuition_amount !== undefined && (
                              <span>
                                {program.tuition_amount === 0 ? 'Free' : `€${program.tuition_amount}`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Field:</span>
                            <span className="text-xs">
                              {program.field_of_study_name || program.field_of_study || 'Unknown'}
                            </span>
                            {getConfidenceBadge(program.field_match_confidence)}
                            {program.auto_created_field && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Auto-created
                              </Badge>
                            )}
                          </div>

                          {program.program_url && (
                            <a
                              href={program.program_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleMatchUrls} disabled={parseUrls(urlInput).length === 0}>
                <ChevronRight className="h-4 w-4 mr-1" />
                Analyze URLs
              </Button>
            </>
          )}

          {step === 'preview' && scrapedPrograms.length === 0 && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleScrapePrograms} disabled={selectedUrls.size === 0}>
                <ChevronRight className="h-4 w-4 mr-1" />
                Scrape {selectedUrls.size} URLs
              </Button>
            </>
          )}

          {step === 'preview' && scrapedPrograms.length > 0 && (
            <>
              <Button variant="outline" onClick={() => {
                setScrapedPrograms([]);
                setGroupedPrograms([]);
              }}>
                Back to URL Selection
              </Button>
              <Button 
                onClick={handleImportPrograms} 
                disabled={scrapedPrograms.filter(p => p.selected).length === 0}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import {scrapedPrograms.filter(p => p.selected).length} Programs
              </Button>
            </>
          )}

          {(step === 'matching' || step === 'scraping' || step === 'importing') && (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Processing...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
