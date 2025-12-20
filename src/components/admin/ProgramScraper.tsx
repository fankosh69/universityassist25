import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Search, Download, Loader2, CheckCircle2, AlertCircle, Lightbulb, Link2, Sparkles } from 'lucide-react';
import { slugify } from '@/lib/slug';

interface FieldOfStudy {
  id: string;
  name: string;
  slug: string;
  level: number;
  parent_id: string | null;
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
  field_match_score?: number;
  minimum_gpa?: number;
  confidence?: number;
  selected?: boolean;
}

interface ProgramScraperProps {
  universityId: string;
  universityName: string;
  onProgramsImported?: () => void;
}

export function ProgramScraper({ universityId, universityName, onProgramsImported }: ProgramScraperProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'discover' | 'manual'>('discover');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [manualUrls, setManualUrls] = useState('');
  const [deepDiscovery, setDeepDiscovery] = useState(true);
  const [step, setStep] = useState<'input' | 'discover' | 'select' | 'scrape' | 'preview' | 'importing'>('input');
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [allFoundUrls, setAllFoundUrls] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [scrapedPrograms, setScrapedPrograms] = useState<ScrapedProgram[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<FieldOfStudy[]>([]);

  // Fetch fields of study when dialog opens
  useEffect(() => {
    if (open && fieldsOfStudy.length === 0) {
      fetchFieldsOfStudy();
    }
  }, [open]);

  const fetchFieldsOfStudy = async () => {
    const { data, error } = await supabase
      .from('fields_of_study')
      .select('id, name, slug, level, parent_id')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('name', { ascending: true });
    
    if (data && !error) {
      setFieldsOfStudy(data);
    }
  };

  const handleDiscover = async () => {
    if (!websiteUrl) {
      toast({ title: 'Error', description: 'Please enter a website URL', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('discover');
    setSuggestions([]);
    setAllFoundUrls([]);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-programs-firecrawl', {
        body: { url: websiteUrl, mode: 'discover', deepDiscovery }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        const programUrls = data.data.programUrls || [];
        setDiscoveredUrls(programUrls);
        setAllFoundUrls(data.data.allUrls || []);
        setSuggestions(data.data.suggestions || []);
        setSelectedUrls(programUrls.slice(0, 10));
        setStep('select');
        
        if (programUrls.length === 0) {
          toast({ 
            title: 'No Programs Found', 
            description: `Found ${data.data.totalUrls} total URLs but none matched program patterns. Try suggestions below or enter URLs manually.`,
            variant: 'destructive'
          });
        } else {
          toast({ 
            title: 'URLs Discovered', 
            description: `Found ${programUrls.length} potential program pages out of ${data.data.totalUrls} URLs` 
          });
          if (data.data.suggestedUrl) {
            toast({ title: 'Info', description: `Used discovered listing page: ${data.data.suggestedUrl}` });
          }
        }
      } else {
        throw new Error(data?.error || 'Failed to discover URLs');
      }
    } catch (err) {
      console.error('Discovery error:', err);
      setError(err instanceof Error ? err.message : 'Failed to discover URLs');
      setStep('input');
      toast({ title: 'Error', description: 'Failed to discover program URLs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUrls = () => {
    const urls = manualUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));
    
    if (urls.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one valid URL (starting with http:// or https://)', variant: 'destructive' });
      return;
    }

    setDiscoveredUrls(urls);
    setSelectedUrls(urls);
    setStep('select');
    toast({ title: 'URLs Added', description: `Added ${urls.length} URLs for scraping` });
  };

  const handleScrape = async () => {
    if (selectedUrls.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one URL to scrape', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('scrape');
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-programs-firecrawl', {
        body: { url: websiteUrl, mode: 'scrape', programUrls: selectedUrls }
      });

      if (error) throw error;

      if (data?.success && data.data?.programs) {
        const programs = data.data.programs.map((p: ScrapedProgram) => ({ ...p, selected: true }));
        setScrapedPrograms(programs);
        setStep('preview');
        setProgress(100);
        
        // Count auto-matched fields
        const matchedCount = programs.filter((p: ScrapedProgram) => p.field_of_study_id).length;
        toast({ 
          title: 'Scraping Complete', 
          description: `Extracted ${programs.length} programs (${matchedCount} with auto-matched fields)` 
        });
      } else {
        throw new Error(data?.error || 'No programs extracted');
      }
    } catch (err) {
      console.error('Scraping error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scrape programs');
      setStep('select');
      toast({ title: 'Error', description: 'Failed to scrape program data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const programsToImport = scrapedPrograms.filter(p => p.selected);
    
    if (programsToImport.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one program to import', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setStep('importing');
    setProgress(0);

    let imported = 0;
    let errors = 0;

    for (const program of programsToImport) {
      try {
        const baseSlug = slugify(program.name);
        let slug = baseSlug;
        let counter = 1;

        // Check for slug conflicts
        while (true) {
          const { data: existing } = await supabase
            .from('programs')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
          
          if (!existing) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        const { error } = await supabase.from('programs').insert({
          name: program.name,
          description: program.description || null,
          degree_type: program.degree_type || 'B.Sc.',
          degree_level: program.degree_level || 'bachelor',
          duration_semesters: program.duration_semesters || 6,
          ects_credits: program.ects_credits || 180,
          language_of_instruction: program.language_of_instruction || ['de'],
          tuition_amount: program.tuition_amount || 0,
          tuition_fee_structure: program.tuition_fee_structure || 'semester',
          uni_assist_required: program.uni_assist_required || false,
          application_method: program.application_method || 'direct',
          winter_intake: program.winter_intake ?? true,
          summer_intake: program.summer_intake ?? false,
          winter_deadline: program.winter_deadline || null,
          summer_deadline: program.summer_deadline || null,
          program_url: program.program_url || null,
          field_of_study: program.field_of_study || 'General',
          field_of_study_id: program.field_of_study_id || null,
          minimum_gpa: program.minimum_gpa || null,
          university_id: universityId,
          slug,
          published: false,
        });

        if (error) throw error;
        imported++;
      } catch (err) {
        console.error('Import error:', err);
        errors++;
      }

      setProgress(Math.round(((imported + errors) / programsToImport.length) * 100));
    }

    setIsLoading(false);
    
    if (imported > 0) {
      toast({ 
        title: 'Import Complete', 
        description: `Imported ${imported} programs${errors > 0 ? `, ${errors} failed` : ''}` 
      });
      onProgramsImported?.();
      setOpen(false);
      resetState();
    } else {
      toast({ title: 'Import Failed', description: 'No programs were imported', variant: 'destructive' });
    }
  };

  const resetState = () => {
    setStep('input');
    setInputMode('discover');
    setWebsiteUrl('');
    setManualUrls('');
    setDiscoveredUrls([]);
    setAllFoundUrls([]);
    setSuggestions([]);
    setSelectedUrls([]);
    setScrapedPrograms([]);
    setProgress(0);
    setError(null);
  };

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url) 
        : [...prev, url]
    );
  };

  const toggleProgram = (index: number) => {
    setScrapedPrograms(prev => 
      prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p)
    );
  };

  const updateProgramField = (index: number, fieldId: string) => {
    const field = fieldsOfStudy.find(f => f.id === fieldId);
    setScrapedPrograms(prev => 
      prev.map((p, i) => i === index ? { 
        ...p, 
        field_of_study_id: fieldId,
        field_of_study_name: field?.name || p.field_of_study_name,
        field_match_confidence: 'high' // Manual selection = high confidence
      } : p)
    );
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return <Badge variant="outline">Unknown</Badge>;
    if (confidence >= 80) return <Badge className="bg-green-500">High ({confidence}%)</Badge>;
    if (confidence >= 50) return <Badge className="bg-yellow-500">Medium ({confidence}%)</Badge>;
    return <Badge variant="destructive">Low ({confidence}%)</Badge>;
  };

  const getFieldMatchBadge = (program: ScrapedProgram) => {
    if (!program.field_match_confidence || program.field_match_confidence === 'none') {
      return <Badge variant="outline" className="text-xs">No match</Badge>;
    }
    
    const colors = {
      high: 'bg-green-500 hover:bg-green-600',
      medium: 'bg-yellow-500 hover:bg-yellow-600',
      low: 'bg-orange-500 hover:bg-orange-600',
    };
    
    return (
      <Badge className={`text-xs ${colors[program.field_match_confidence]}`}>
        <Sparkles className="h-3 w-3 mr-1" />
        {program.field_match_confidence}
      </Badge>
    );
  };

  // Group fields by level for better display
  const getFieldOptions = () => {
    const level1 = fieldsOfStudy.filter(f => f.level === 1);
    const level2 = fieldsOfStudy.filter(f => f.level === 2);
    const level3 = fieldsOfStudy.filter(f => f.level === 3);
    
    return { level1, level2, level3 };
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="mr-2 h-4 w-4" />
          Scrape from Web
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Programs from Website</DialogTitle>
          <DialogDescription>
            Scrape program data from {universityName}'s website using AI-powered extraction with automatic field matching
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input URL */}
          {step === 'input' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enter University Website</CardTitle>
                <CardDescription>
                  Enter the main URL of the university or their programs page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'discover' | 'manual')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="discover">
                      <Search className="h-4 w-4 mr-2" />
                      Auto-Discover
                    </TabsTrigger>
                    <TabsTrigger value="manual">
                      <Link2 className="h-4 w-4 mr-2" />
                      Manual URLs
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="discover" className="space-y-4 mt-4">
                    <Input
                      placeholder="https://www.uni-example.de/studium"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="deep-discovery" 
                        checked={deepDiscovery}
                        onCheckedChange={(checked) => setDeepDiscovery(checked as boolean)}
                      />
                      <label htmlFor="deep-discovery" className="text-sm text-muted-foreground cursor-pointer">
                        Deep discovery (try to find program listing page automatically)
                      </label>
                    </div>
                    <Button onClick={handleDiscover} disabled={isLoading || !websiteUrl}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Discover Program Pages
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Enter the university's homepage or program listing page. The scraper will discover program pages and auto-match fields of study.
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <Textarea
                      placeholder={`Paste program URLs (one per line):\nhttps://www.university.edu/program/computer-science\nhttps://www.university.edu/program/business-admin`}
                      value={manualUrls}
                      onChange={(e) => setManualUrls(e.target.value)}
                      rows={6}
                    />
                    <Button onClick={handleManualUrls} disabled={!manualUrls.trim()}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Use These URLs
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Paste direct links to program pages, one URL per line. Use this if auto-discovery doesn't find the right pages.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {(step === 'discover' || step === 'scrape' || step === 'importing') && isLoading && (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  {step === 'discover' && 'Discovering program pages...'}
                  {step === 'scrape' && 'Scraping and matching fields of study...'}
                  {step === 'importing' && 'Importing programs to database...'}
                </p>
                {(step === 'scrape' || step === 'importing') && (
                  <Progress value={progress} className="w-full max-w-md mx-auto" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select URLs */}
          {step === 'select' && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Select Program Pages ({selectedUrls.length}/{discoveredUrls.length})</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUrls(discoveredUrls)}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUrls([])}>
                      Clear
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show suggestions if no programs found */}
                {discoveredUrls.length === 0 && suggestions.length > 0 && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>No program pages found. Try one of these URLs instead:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {suggestions.map((suggestion, i) => (
                          <Button 
                            key={i} 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setWebsiteUrl(suggestion);
                              setStep('input');
                            }}
                          >
                            {new URL(suggestion).pathname || suggestion}
                          </Button>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show all found URLs for debugging */}
                {discoveredUrls.length === 0 && allFoundUrls.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View {allFoundUrls.length} URLs found (not matching program patterns)
                    </summary>
                    <ScrollArea className="h-40 mt-2 rounded border p-2">
                      {allFoundUrls.map((url, i) => (
                        <div key={i} className="text-xs text-muted-foreground truncate py-0.5">
                          {url}
                        </div>
                      ))}
                    </ScrollArea>
                  </details>
                )}

                {discoveredUrls.length > 0 && (
                  <ScrollArea className="h-64 rounded border p-2">
                    {discoveredUrls.map((url, i) => (
                      <div key={i} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          checked={selectedUrls.includes(url)}
                          onCheckedChange={() => toggleUrl(url)}
                        />
                        <span className="text-sm truncate flex-1">{url}</span>
                      </div>
                    ))}
                  </ScrollArea>
                )}

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
                  <Button onClick={handleScrape} disabled={selectedUrls.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Scrape Selected ({selectedUrls.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Preview & Import */}
          {step === 'preview' && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Review Extracted Programs ({scrapedPrograms.filter(p => p.selected).length}/{scrapedPrograms.length})</span>
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {scrapedPrograms.filter(p => p.field_of_study_id).length} auto-matched
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-[200px]">Program Name</TableHead>
                        <TableHead className="w-24">Degree</TableHead>
                        <TableHead className="min-w-[250px]">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Field of Study
                          </div>
                        </TableHead>
                        <TableHead className="w-20">Match</TableHead>
                        <TableHead className="w-24">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scrapedPrograms.map((program, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Checkbox 
                              checked={program.selected}
                              onCheckedChange={() => toggleProgram(i)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div className="truncate max-w-[200px]">{program.name}</div>
                              {program.field_of_study && program.field_of_study !== program.field_of_study_name && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  Extracted: {program.field_of_study}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {program.degree_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={program.field_of_study_id || ''} 
                              onValueChange={(value) => updateProgramField(i, value)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Select field...">
                                  {program.field_of_study_name || 'Select field...'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <ScrollArea className="h-60">
                                  {fieldsOfStudy.map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                      <span className={field.level === 1 ? 'font-semibold' : field.level === 2 ? 'ml-2' : 'ml-4 text-muted-foreground'}>
                                        {field.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {getFieldMatchBadge(program)}
                          </TableCell>
                          <TableCell>{getConfidenceBadge(program.confidence)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
                  <Button onClick={handleImport} disabled={scrapedPrograms.filter(p => p.selected).length === 0}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Import Selected ({scrapedPrograms.filter(p => p.selected).length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
