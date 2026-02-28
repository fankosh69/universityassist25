import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Upload, Languages, BookOpen } from "lucide-react";

interface LanguageStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
  errors?: Record<string, string>;
}

// --- Score constants ---
const IELTS_SCORES = ["4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"];
const TOEFL_OLD_SCORES = ["60","65","70","72","75","79","80","85","86","90","95","100","105","107","110","114","120"];
const TOEFL_NEW_SCORES = ["1.0","1.5","2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0"];
const PTE_SCORES = ["30","36","42","50","58","65","73","79","83","90"];
const CAMBRIDGE_SCORES = ["140","150","160","165","170","175","180","185","190","195","200","210","220","230"];
const DUOLINGO_SCORES = ["85","90","95","100","105","110","115","120","125","130","135","140","145","150","155","160"];

const ENGLISH_TESTS = [
  { value: "ielts", label: "IELTS Academic" },
  { value: "toefl_old", label: "TOEFL iBT (0–120 scale)" },
  { value: "toefl_new", label: "TOEFL iBT (1–6 new scale)" },
  { value: "pte", label: "PTE Academic" },
  { value: "cambridge", label: "Cambridge (FCE/CAE/CPE)" },
  { value: "duolingo", label: "Duolingo English Test" },
];

const GERMAN_CERTS = [
  { value: "goethe", label: "Goethe-Zertifikat" },
  { value: "testdaf", label: "TestDaF" },
  { value: "dsh", label: "DSH" },
  { value: "telc", label: "telc Deutsch" },
  { value: "oesd", label: "ÖSD" },
];

const GERMAN_CERT_LEVELS: Record<string, { value: string; label: string }[]> = {
  goethe: [
    { value: "A1", label: "A1" },{ value: "A2", label: "A2" },{ value: "B1", label: "B1" },
    { value: "B2", label: "B2" },{ value: "C1", label: "C1" },{ value: "C2", label: "C2" },
  ],
  testdaf: [
    { value: "TDN3", label: "TDN 3" },{ value: "TDN4", label: "TDN 4" },{ value: "TDN5", label: "TDN 5" },
  ],
  dsh: [
    { value: "DSH-1", label: "DSH-1" },{ value: "DSH-2", label: "DSH-2" },{ value: "DSH-3", label: "DSH-3" },
  ],
  telc: [
    { value: "A1", label: "A1" },{ value: "A2", label: "A2" },{ value: "B1", label: "B1" },
    { value: "B2", label: "B2" },{ value: "C1", label: "C1" },{ value: "C2", label: "C2" },
  ],
  oesd: [
    { value: "A1", label: "A1" },{ value: "A2", label: "A2" },{ value: "B1", label: "B1" },
    { value: "B2", label: "B2" },{ value: "C1", label: "C1" },{ value: "C2", label: "C2" },
  ],
};

function getScoresForTest(testType: string): string[] {
  switch (testType) {
    case "ielts": return IELTS_SCORES;
    case "toefl_old": return TOEFL_OLD_SCORES;
    case "toefl_new": return TOEFL_NEW_SCORES;
    case "pte": return PTE_SCORES;
    case "cambridge": return CAMBRIDGE_SCORES;
    case "duolingo": return DUOLINGO_SCORES;
    default: return [];
  }
}

function getMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ value: val, label });
  }
  months.push({ value: `${now.getFullYear() + 1}`, label: `Next year (${now.getFullYear() + 1})` });
  return months;
}

function UploadPrompt({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
      <Upload className="w-5 h-5 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">You can upload this document after onboarding in the Documents section.</p>
      </div>
    </div>
  );
}

function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="border-destructive/30 bg-destructive/5">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-sm">
        {children}
      </AlertDescription>
    </Alert>
  );
}

export function LanguageStep({ data, onUpdate }: LanguageStepProps) {
  const update = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const studyLang = data.intendedStudyLanguage || "";
  const eduLevel = data.desiredEducationLevel || "";
  const curriculum = data.curriculum || "";

  // Determine context labels
  const studyContext = (eduLevel === "masters") ? "university" : "high school";
  const needsStudienkolleg = eduLevel === "foundation_year";

  // --- ENGLISH PATH ---
  const renderEnglishSection = () => (
    <div className="space-y-4">
      {/* Q2: Current level */}
      <div>
        <Label>What is your current English level?</Label>
        <Select value={data.englishLevel || ""} onValueChange={(v) => update("englishLevel", v)}>
          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="fluent">Fluent / Native</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Q3: Have test? */}
      {data.englishLevel && (
        <div>
          <Label>Have you taken a valid English test?</Label>
          <Select value={data.hasEnglishTest || ""} onValueChange={(v) => {
            update("hasEnglishTest", v);
            // Reset downstream
            if (v !== "yes") onUpdate({ englishTestType: "", englishTestScore: "" });
            if (v !== "no") onUpdate({ studiedFullyInEnglish: "", intendToTakeEnglishTest: "", plannedEnglishTestType: "", plannedEnglishTestMonth: "" });
          }}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="planning">I'm planning to take a valid test</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* YES: test details */}
      {data.hasEnglishTest === "yes" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div>
            <Label>Which English test did you take?</Label>
            <Select value={data.englishTestType || ""} onValueChange={(v) => { update("englishTestType", v); update("englishTestScore", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
              <SelectContent>
                {ENGLISH_TESTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {data.englishTestType && (
            <div>
              <Label>What was your score?</Label>
              <Select value={data.englishTestScore || ""} onValueChange={(v) => update("englishTestScore", v)}>
                <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
                <SelectContent>
                  {getScoresForTest(data.englishTestType).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {data.englishTestScore && (
            <UploadPrompt label="Upload your English test certificate" />
          )}
        </Card>
      )}

      {/* NO: MOI path */}
      {data.hasEnglishTest === "no" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div>
            <Label>Did you study fully in English during your {studyContext}?</Label>
            <Select value={data.studiedFullyInEnglish || ""} onValueChange={(v) => update("studiedFullyInEnglish", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.studiedFullyInEnglish === "yes" && (
            <div className="space-y-4">
              <Disclaimer>
                Applying only with proof of studies in English (MOI) may significantly decrease your chances, as many German programs do not accept this unless you studied in a native English-speaking country. We recommend taking an official English test to maximize your options.
              </Disclaimer>
              <UploadPrompt label="Upload your Medium of Instruction (MOI) letter" />
              <div>
                <Label>Do you intend to take an English test to increase your chances?</Label>
                <Select value={data.intendToTakeEnglishTest || ""} onValueChange={(v) => update("intendToTakeEnglishTest", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No, I'll proceed with MOI only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.intendToTakeEnglishTest === "yes" && renderPlannedEnglishTest()}
            </div>
          )}

          {data.studiedFullyInEnglish === "no" && (
            <div className="space-y-4">
              <Disclaimer>
                To apply for English-taught programs in Germany, you need either proof of full English-medium education or a valid English test score (IELTS, TOEFL, PTE, Cambridge, Duolingo).
              </Disclaimer>
              <div>
                <Label>Do you intend to take an English test?</Label>
                <Select value={data.intendToTakeEnglishTest || ""} onValueChange={(v) => update("intendToTakeEnglishTest", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">Not at this time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.intendToTakeEnglishTest === "yes" && renderPlannedEnglishTest()}
            </div>
          )}
        </Card>
      )}

      {/* PLANNING */}
      {data.hasEnglishTest === "planning" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          {renderPlannedEnglishTest()}
        </Card>
      )}

      {/* German knowledge sub-section for English-track */}
      {data.englishLevel && renderGermanKnowledgeSubSection()}
    </div>
  );

  const renderPlannedEnglishTest = () => (
    <div className="space-y-4">
      <div>
        <Label>Which English test do you plan to take?</Label>
        <Select value={data.plannedEnglishTestType || ""} onValueChange={(v) => update("plannedEnglishTestType", v)}>
          <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
          <SelectContent>
            {ENGLISH_TESTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>When do you intend to take it?</Label>
        <Select value={data.plannedEnglishTestMonth || ""} onValueChange={(v) => update("plannedEnglishTestMonth", v)}>
          <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
          <SelectContent>
            {getMonthOptions().map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // --- German knowledge for English-track students ---
  const renderGermanKnowledgeSubSection = () => (
    <Card className="p-4 space-y-4 border-secondary/30">
      <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
        <BookOpen className="w-4 h-4" />
        <span>German Language Knowledge</span>
      </div>
      <p className="text-xs text-muted-foreground">Some English-taught programs in Germany require basic German knowledge (A1/A2). Let us know your level.</p>
      <div>
        <Label>Do you have any knowledge of German?</Label>
        <Select value={data.germanKnowledge || ""} onValueChange={(v) => {
          update("germanKnowledge", v);
          if (v === "none") onUpdate({ hasGermanCert: "", germanCertType: "", germanCertLevel: "", intendToTakeGermanTest: "", plannedGermanTestType: "", plannedGermanTestMonth: "" });
        }}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="beginner">Beginner (A1–A2)</SelectItem>
            <SelectItem value="intermediate">Intermediate (B1–B2)</SelectItem>
            <SelectItem value="advanced">Advanced (C1–C2)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.germanKnowledge && data.germanKnowledge !== "none" && renderGermanCertQuestion()}
    </Card>
  );

  // --- GERMAN PATH ---
  const renderGermanSection = () => (
    <div className="space-y-4">
      {/* Context-aware disclaimers */}
      {needsStudienkolleg && (
        <Disclaimer>
          Public Studienkolleg programs typically require a minimum German level of B1 or B2. Make sure you have or plan to obtain this level before applying.
        </Disclaimer>
      )}
      {!needsStudienkolleg && (
        <Disclaimer>
          Most German-taught degree programs require C1 or C2 German. A B2 certificate is the minimum that some programs accept for conditional admission.
        </Disclaimer>
      )}
      <Disclaimer>
        German universities do not accept proof of studies conducted in German (MOI) as a substitute for a language certificate, unless you hold a German Abitur, a bilingual IB diploma, or completed German as a Higher Level (HL) subject in IB.
      </Disclaimer>

      {/* Q2g: Current German level */}
      <div>
        <Label>What is your current German level?</Label>
        <Select value={data.germanLevel || ""} onValueChange={(v) => update("germanLevel", v)}>
          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None / Just started</SelectItem>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
            <SelectItem value="C1">C1</SelectItem>
            <SelectItem value="C2">C2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Q3g: Have cert? */}
      {data.germanLevel && data.germanLevel !== "none" && (
        <div>
          <Label>Do you have a valid German language certificate?</Label>
          <Select value={data.hasGermanCert || ""} onValueChange={(v) => {
            update("hasGermanCert", v);
            if (v !== "yes") onUpdate({ germanCertType: "", germanCertLevel: "" });
            if (v !== "planning") onUpdate({ plannedGermanTestMonth: "" });
          }}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="planning">I'm planning to take one</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* YES: cert details */}
      {data.hasGermanCert === "yes" && renderGermanCertDetails()}

      {/* NO: intend to take */}
      {data.hasGermanCert === "no" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div>
            <Label>Do you intend to take an official German test?</Label>
            <Select value={data.intendToTakeGermanTest || ""} onValueChange={(v) => update("intendToTakeGermanTest", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">Not at this time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.intendToTakeGermanTest === "yes" && renderPlannedGermanTest()}
        </Card>
      )}

      {/* PLANNING */}
      {data.hasGermanCert === "planning" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          {renderPlannedGermanTest()}
        </Card>
      )}

      {/* If level is "none", show planning */}
      {data.germanLevel === "none" && (
        <Card className="p-4 space-y-4 bg-muted/30">
          <div>
            <Label>Do you intend to start learning German and take an official test?</Label>
            <Select value={data.intendToTakeGermanTest || ""} onValueChange={(v) => update("intendToTakeGermanTest", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">Not yet decided</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.intendToTakeGermanTest === "yes" && renderPlannedGermanTest()}
        </Card>
      )}
    </div>
  );

  const renderGermanCertQuestion = () => (
    <div className="space-y-4">
      <div>
        <Label>Do you have a valid German language certificate?</Label>
        <Select value={data.hasGermanCert || ""} onValueChange={(v) => {
          update("hasGermanCert", v);
          if (v !== "yes") onUpdate({ germanCertType: "", germanCertLevel: "" });
        }}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.hasGermanCert === "yes" && renderGermanCertDetails()}
      {data.hasGermanCert === "no" && (
        <div className="space-y-4">
          <div>
            <Label>Do you intend to take an official German test?</Label>
            <Select value={data.intendToTakeGermanTest || ""} onValueChange={(v) => update("intendToTakeGermanTest", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">Not at this time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.intendToTakeGermanTest === "yes" && renderPlannedGermanTest()}
        </div>
      )}
    </div>
  );

  const renderGermanCertDetails = () => (
    <Card className="p-4 space-y-4 bg-muted/30">
      <div>
        <Label>Which German certificate do you have?</Label>
        <Select value={data.germanCertType || ""} onValueChange={(v) => { update("germanCertType", v); update("germanCertLevel", ""); }}>
          <SelectTrigger><SelectValue placeholder="Select certificate" /></SelectTrigger>
          <SelectContent>
            {GERMAN_CERTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {data.germanCertType && GERMAN_CERT_LEVELS[data.germanCertType] && (
        <div>
          <Label>What level/score?</Label>
          <Select value={data.germanCertLevel || ""} onValueChange={(v) => update("germanCertLevel", v)}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              {GERMAN_CERT_LEVELS[data.germanCertType].map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {data.germanCertLevel && (
        <UploadPrompt label="Upload your German language certificate" />
      )}
    </Card>
  );

  const renderPlannedGermanTest = () => (
    <div className="space-y-4">
      <div>
        <Label>Which German test do you plan to take?</Label>
        <Select value={data.plannedGermanTestType || ""} onValueChange={(v) => update("plannedGermanTestType", v)}>
          <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
          <SelectContent>
            {GERMAN_CERTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>When do you intend to take it?</Label>
        <Select value={data.plannedGermanTestMonth || ""} onValueChange={(v) => update("plannedGermanTestMonth", v)}>
          <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
          <SelectContent>
            {getMonthOptions().map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Q1: Intended language of study */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Languages className="w-5 h-5" />
          What is the intended language of your studies in Germany?
        </Label>
        <Select value={studyLang} onValueChange={(v) => {
          update("intendedStudyLanguage", v);
          // Reset all downstream when switching
          onUpdate({
            englishLevel: "", hasEnglishTest: "", englishTestType: "", englishTestScore: "",
            studiedFullyInEnglish: "", intendToTakeEnglishTest: "", plannedEnglishTestType: "", plannedEnglishTestMonth: "",
            germanKnowledge: "", germanLevel: "", hasGermanCert: "", germanCertType: "", germanCertLevel: "",
            intendToTakeGermanTest: "", plannedGermanTestType: "", plannedGermanTestMonth: "",
          });
        }}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Select language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="german">German</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {studyLang === "english" && renderEnglishSection()}
      {studyLang === "german" && renderGermanSection()}
    </div>
  );
}
