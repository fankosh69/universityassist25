import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen,
  Globe,
  RotateCcw,
  TrendingUp,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FieldOption {
  id: string;
  name: string;
  slug?: string | null;
}

const PRESETS = [
  { label: "Computer Science", icon: "💻", level: "master", field: "computer-science", lang: "en" },
  { label: "Mechanical Eng.", icon: "⚙️", level: "master", field: "mechanical-engineering", lang: "en" },
  { label: "Business Admin", icon: "💼", level: "master", field: "business-administration", lang: "en" },
  { label: "Medicine", icon: "🩺", level: "master", field: "medicine", lang: "en" },
  { label: "Electrical Eng.", icon: "⚡", level: "master", field: "electrical-engineering", lang: "en" },
];

const TIPS: Record<string, Record<string, string>> = {
  master: {
    en: "English-taught Master's are competitive — apply 12 months early.",
    de: "German-taught Master's offer the widest program variety.",
    any: "Filter by language to narrow your results.",
  },
  bachelor: {
    en: "Only ~5% of Bachelor's are fully English-taught.",
    de: "Bachelor's in German are tuition-free at public unis.",
    any: "Bachelor's require a recognized secondary certificate.",
  },
  phd: {
    en: "PhD positions are often funded — check our scholarship guide.",
    de: "German-taught PhDs integrate easily into research institutes.",
    any: "PhD applicants need a Master's or exceptional Bachelor's.",
  },
  any: {
    en: "Use the filters to find programs matching your goals.",
    de: "German language skills unlock 10× more options.",
    any: "Start with a degree level, then refine by field.",
  },
};

export default function HeroQuickFinder() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const [level, setLevel] = useState<string>("master");
  const [language, setLanguage] = useState<string>("en");
  const [field, setField] = useState<string>("any");
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("fields_of_study")
        .select("id, name, slug, level")
        .eq("level", 2)
        .order("name");
      if (!cancelled && data) {
        setFields(data.map((f: any) => ({ id: f.id, name: f.name, slug: f.slug })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fieldsSorted = useMemo(
    () => [...fields].sort((a, b) => a.name.localeCompare(b.name)),
    [fields],
  );

  const selectedFieldName = useMemo(() => {
    if (field === "any") return "Any field";
    const found = fieldsSorted.find((f) => (f.slug || f.id) === field);
    return found?.name || "Select field";
  }, [field, fieldsSorted]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (level && level !== "any") params.set("level", level);
    if (language && language !== "any") params.set("lang", language);
    if (field && field !== "any") params.set("field", field);
    navigate(`/search?${params.toString()}`);
  };

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    setLevel(preset.level);
    setLanguage(preset.lang);
    setField(preset.field);
    setHasInteracted(true);
    setTimeout(() => {
      const params = new URLSearchParams();
      if (preset.level !== "any") params.set("level", preset.level);
      if (preset.lang !== "any") params.set("lang", preset.lang);
      if (preset.field !== "any") params.set("field", preset.field);
      navigate(`/search?${params.toString()}`);
    }, 250);
  };

  const handleReset = () => {
    setLevel("master");
    setLanguage("en");
    setField("any");
    setHasInteracted(false);
  };

  const allFieldsSet = level !== "any" && language !== "any" && field !== "any";
  const isDirty = hasInteracted || level !== "master" || language !== "en" || field !== "any";
  const currentTip = TIPS[level]?.[language] || "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !target?.isContentEditable) {
        e.preventDefault();
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstTrigger = formRef.current?.querySelector(
          'button[role="combobox"]',
        ) as HTMLElement | null;
        firstTrigger?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const labelLevel = t("hero.quickFinder.level", { defaultValue: "I want to study" });
  const labelField = t("hero.quickFinder.field", { defaultValue: "Field of study" });
  const labelLanguage = t("hero.quickFinder.language", { defaultValue: "Taught in" });
  const labelCta = t("hero.quickFinder.cta", { defaultValue: "Find my programs" });

  const triggerCls =
    "h-11 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_0_3px_hsl(var(--secondary)/0.2)] transition-all duration-200";

  return (
    <div className="mx-auto mt-8 max-w-4xl">
      <motion.form
        ref={formRef as any}
        onSubmit={handleSubmit}
        aria-label={t("hero.quickFinder.aria", { defaultValue: "Quick program finder" })}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 backdrop-blur-2xl p-4 sm:p-5 text-white shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]"
      >
        {/* Animated top gradient line */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-px w-1/3 bg-gradient-to-r from-transparent via-secondary to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "400%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        {/* Radial depth overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.22),transparent_60%)]"
        />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* LEVEL */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qf-level"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80"
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              {labelLevel}
            </Label>
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v);
                setHasInteracted(true);
              }}
            >
              <SelectTrigger id="qf-level" className={triggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelor">Bachelor's</SelectItem>
                <SelectItem value="master">Master's</SelectItem>
                <SelectItem value="phd">PhD / Doctorate</SelectItem>
                <SelectItem value="any">Any degree</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FIELD COMBOBOX */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qf-field"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {labelField}
            </Label>
            <Popover open={fieldOpen} onOpenChange={setFieldOpen}>
              <PopoverTrigger asChild>
                <button
                  id="qf-field"
                  type="button"
                  role="combobox"
                  aria-expanded={fieldOpen}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 text-sm",
                    triggerCls,
                  )}
                >
                  <span className="truncate text-left">{selectedFieldName}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search fields…" />
                  <CommandList>
                    <CommandEmpty>No field found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="any"
                        onSelect={() => {
                          setField("any");
                          setHasInteracted(true);
                          setFieldOpen(false);
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", field === "any" ? "opacity-100" : "opacity-0")}
                        />
                        Any field
                      </CommandItem>
                      {fieldsSorted.map((f) => {
                        const val = f.slug || f.id;
                        return (
                          <CommandItem
                            key={f.id}
                            value={f.name}
                            onSelect={() => {
                              setField(val);
                              setHasInteracted(true);
                              setFieldOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field === val ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {f.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* LANGUAGE */}
          <div className="space-y-1.5">
            <Label
              htmlFor="qf-lang"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {labelLanguage}
            </Label>
            <Select
              value={language}
              onValueChange={(v) => {
                setLanguage(v);
                setHasInteracted(true);
              }}
            >
              <SelectTrigger id="qf-lang" className={triggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="de">🇩🇪 German</SelectItem>
                <SelectItem value="any">🌐 Any language</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SUBMIT */}
          <Button
            type="submit"
            size="lg"
            className={cn(
              "relative h-11 w-full overflow-hidden border-0 group active:scale-95 transition-all duration-300 text-primary-foreground",
              allFieldsSet
                ? "bg-[image:var(--gradient-hero)] shadow-[0_0_24px_-4px_hsl(var(--secondary)/0.6)]"
                : "bg-[image:var(--gradient-hero)] hover:opacity-95",
            )}
          >
            {(allFieldsSet || true) && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: "-150%" }}
                animate={{ x: "350%" }}
                transition={{
                  duration: allFieldsSet ? 1.8 : 2.5,
                  repeat: Infinity,
                  repeatDelay: allFieldsSet ? 0.8 : 2,
                  ease: "easeInOut",
                }}
              />
            )}
            <span className="relative inline-flex items-center">
              {labelCta}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Button>
        </div>

        {/* Contextual tip */}
        <div className="relative mt-3 min-h-[1.25rem]">
          <AnimatePresence mode="wait">
            {currentTip && (
              <motion.p
                key={`${level}-${language}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="inline-flex items-center gap-1.5 text-xs text-white/80"
              >
                <Sparkles className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                {currentTip}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
          <p className="inline-flex items-center gap-1.5">
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
            </motion.span>
            Free, no signup needed.
          </p>
          <div className="inline-flex items-center gap-3">
            <AnimatePresence>
              {isDirty && (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </motion.button>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => navigate("/eligibility-checker")}
              className="font-medium text-secondary hover:text-white hover:underline transition-colors"
            >
              Check your eligibility →
            </button>
          </div>
        </div>
      </motion.form>

      {/* Trending presets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="inline-flex items-center gap-1 text-xs font-medium text-white/80">
          <TrendingUp className="h-3.5 w-3.5" />
          Trending:
        </span>
        {PRESETS.map((preset) => {
          const isActive =
            field === preset.field && level === preset.level && language === preset.lang;
          return (
            <motion.button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                  : "bg-white/80 backdrop-blur border-white/40 text-foreground hover:border-primary/50 hover:bg-white",
              )}
            >
              <span aria-hidden="true">{preset.icon}</span>
              {preset.label}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="inline-flex"
                  >
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Keyboard hint */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/60">
        <span>Press</span>
        <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded border border-white/20 bg-white/10 text-white/80 font-mono text-[10px]">
          /
        </kbd>
        <span>to jump to finder</span>
      </div>
    </div>
  );
}
