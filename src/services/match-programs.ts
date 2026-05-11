/**
 * Matchability flow — single source of truth for program ranking.
 *
 * Pulls the student's academics + language certs, scores them against every
 * published program using the PRD formula in `src/lib/matching.ts`
 * (0.35*GPA + 0.25*Lang + 0.30*ECTS + 0.10*Intake), persists the top results
 * to `program_matches_v2`, and returns a hydrated shortlist with reasons.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  calculateMatch,
  type StudentProfile,
  type ProgramRequirements,
  type MatchResult,
} from "@/lib/matching";

export interface RankedMatch extends MatchResult {
  programId: string;
  reasons: string[];
  program: {
    id: string;
    name: string;
    slug: string | null;
    degree_type: string | null;
    field_of_study: string | null;
    universityId: string | null;
    universityName?: string | null;
    universityCity?: string | null;
    universitySlug?: string | null;
  };
}

const TOP_N = 25;

function buildReasons(
  profile: StudentProfile,
  reqs: ProgramRequirements,
  result: MatchResult,
): string[] {
  const reasons: string[] = [];
  const { components, status } = result;

  if (components.gpa >= 0.95 && reqs.minimum_gpa) {
    reasons.push(`GPA ${profile.gpa_de?.toFixed(2)} comfortably clears ${reqs.minimum_gpa.toFixed(2)} required`);
  } else if (components.gpa >= 0.7) {
    reasons.push("GPA meets the program's minimum");
  }

  if (components.language >= 0.95) {
    reasons.push("Language certification fully covers requirements");
  } else if (components.language >= 0.7) {
    reasons.push("Language level close to requirement (one CEFR step)");
  }

  if (components.ects >= 1) {
    reasons.push(`Credit points satisfied (${reqs.ects_credits ?? "n/a"} required)`);
  } else if (components.ects >= 0.8) {
    reasons.push("Credit points nearly complete");
  }

  if (components.intake === 1) {
    reasons.push(`Matches your preferred intake (${profile.target_intake})`);
  }

  if (reasons.length === 0) {
    reasons.push(
      status === "missing"
        ? "Several requirements still need work — see gap analysis"
        : "Partial match — strengthen weakest area to qualify",
    );
  }
  return reasons;
}

function semesterToIntake(semesterStart?: string | null): string | undefined {
  if (!semesterStart) return undefined;
  const s = semesterStart.toLowerCase();
  if (s.includes("winter") || s.includes("oct") || s.includes("nov") || s.includes("sep")) return "winter";
  if (s.includes("summer") || s.includes("apr") || s.includes("mar")) return "summer";
  return undefined;
}

function programIntake(p: any): string | undefined {
  if (p.winter_intake && !p.summer_intake) return "winter";
  if (p.summer_intake && !p.winter_intake) return "summer";
  return semesterToIntake(p.semester_start);
}

async function loadStudentProfile(profileId: string): Promise<StudentProfile> {
  const [{ data: academics }, { data: langs }] = await Promise.all([
    supabase.from("student_academics").select("*").eq("profile_id", profileId).maybeSingle(),
    supabase.from("language_proficiency").select("language, cefr_level, test_type").eq("profile_id", profileId),
  ]);

  return {
    gpa_de: academics?.gpa_de ?? undefined,
    ects_total: academics?.ects_total ?? undefined,
    target_intake: academics?.target_intake ?? undefined,
    target_level: academics?.target_level ?? undefined,
    language_certificates:
      langs?.map((l: any) => ({
        language: (l.language || "").toLowerCase().slice(0, 2) === "de" ? "de" : (l.language || "").toLowerCase().slice(0, 2) === "en" ? "en" : (l.language || "").toLowerCase(),
        level: l.cefr_level || "",
        certificate_type: l.test_type || "",
      })) || [],
  };
}

function programToRequirements(p: any): ProgramRequirements {
  // language_requirements may be array of strings like "de:B2" or human strings.
  // Normalise: pluck "<lang>:<level>" tokens, default to all string entries.
  const reqs: string[] = Array.isArray(p.language_requirements) ? p.language_requirements : [];
  return {
    minimum_gpa: p.minimum_gpa ?? p.gpa_minimum ?? undefined,
    language_requirements: reqs,
    ects_credits: p.ects_credits ?? undefined,
    degree_level: p.degree_type || p.degree_level || "",
    semester_start: programIntake(p),
  };
}

export async function computeMatchesForProfile(profileId: string): Promise<RankedMatch[]> {
  const profile = await loadStudentProfile(profileId);

  // Pull all published programs with university info.
  const { data: programs, error } = await supabase
    .from("programs")
    .select(
      "id, name, slug, degree_type, field_of_study, university_id, minimum_gpa, gpa_minimum, ects_credits, language_requirements, winter_intake, summer_intake, semester_start, universities:universities(id, name, city, slug)",
    )
    .eq("published", true);

  if (error) throw error;
  if (!programs?.length) return [];

  const ranked: RankedMatch[] = programs
    .map((p: any) => {
      const reqs = programToRequirements(p);
      const result = calculateMatch(profile, reqs);
      return {
        ...result,
        programId: p.id,
        reasons: buildReasons(profile, reqs, result),
        program: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          degree_type: p.degree_type,
          field_of_study: p.field_of_study,
          universityId: p.university_id,
          universityName: p.universities?.name,
          universityCity: p.universities?.city,
          universitySlug: p.universities?.slug,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  await persistMatches(profileId, ranked);
  return ranked;
}

async function persistMatches(profileId: string, matches: RankedMatch[]) {
  // Replace previous shortlist for a clean snapshot.
  await supabase.from("program_matches_v2").delete().eq("profile_id", profileId);
  if (!matches.length) return;
  const rows = matches.map((m) => ({
    profile_id: profileId,
    program_id: m.programId,
    match_score: Math.round(m.score * 100),
    eligibility_status: m.status,
    gpa_score: Math.round(m.components.gpa * 100),
    language_score: Math.round(m.components.language * 100),
    ects_score: Math.round(m.components.ects * 100),
    intake_score: Math.round(m.components.intake * 100),
    gap_analysis: { gaps: m.gaps, reasons: m.reasons },
  }));
  await supabase.from("program_matches_v2").insert(rows);
}

export async function fetchPersistedMatches(profileId: string, limit = 5) {
  const { data, error } = await supabase
    .from("program_matches_v2")
    .select(
      "id, program_id, match_score, eligibility_status, gpa_score, language_score, ects_score, intake_score, gap_analysis, calculated_at, program:programs(id, name, slug, degree_type, field_of_study, university_id, universities:universities(name, city, slug))",
    )
    .eq("profile_id", profileId)
    .order("match_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
