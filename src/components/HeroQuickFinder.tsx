import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FieldOption {
  id: string;
  name: string;
  slug?: string | null;
}

/**
 * Above-the-fold "find your program" mini-form. Sends users straight into
 * /search with prefilled URL params so they see relevant results in one click.
 */
export default function HeroQuickFinder() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const [level, setLevel] = useState<string>("master");
  const [language, setLanguage] = useState<string>("en");
  const [field, setField] = useState<string>("any");
  const [fields, setFields] = useState<FieldOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load Level-2 fields of study so the dropdown stays compact (not 200+ items).
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (level && level !== "any") params.set("level", level);
    if (language && language !== "any") params.set("lang", language);
    if (field && field !== "any") params.set("field", field);
    navigate(`/search?${params.toString()}`);
  };

  const labelLevel = t("hero.quickFinder.level", { defaultValue: "I want to study" });
  const labelField = t("hero.quickFinder.field", { defaultValue: "Field of study" });
  const labelLanguage = t("hero.quickFinder.language", { defaultValue: "Taught in" });
  const labelCta = t("hero.quickFinder.cta", { defaultValue: "Find my programs" });

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t("hero.quickFinder.aria", { defaultValue: "Quick program finder" })}
      className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-[var(--shadow-strong)] text-foreground"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="qf-level" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labelLevel}
          </Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="qf-level" className="h-11">
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

        <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
          <Label htmlFor="qf-field" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labelField}
          </Label>
          <Select value={field} onValueChange={setField}>
            <SelectTrigger id="qf-field" className="h-11">
              <SelectValue placeholder="Any field" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="any">Any field</SelectItem>
              {fieldsSorted.map((f) => (
                <SelectItem key={f.id} value={f.slug || f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qf-lang" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labelLanguage}
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="qf-lang" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="any">Any language</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full bg-[image:var(--gradient-hero)] hover:opacity-95 text-primary-foreground border-0 group"
        >
          {labelCta}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
          Free, no signup needed to browse.
        </p>
        <button
          type="button"
          onClick={() => navigate("/eligibility-checker")}
          className="font-medium text-primary hover:underline"
        >
          Not sure? Check your eligibility →
        </button>
      </div>
    </form>
  );
}