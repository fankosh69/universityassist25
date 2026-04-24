import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";
import {
  getHrefLangTags,
  getProgramBreadcrumbs,
  createBreadcrumbSchema,
} from "@/lib/seo-helpers";
import {
  createProgramSchema,
  createFaqSchema,
  type FaqItem,
} from "@/lib/jsonld";

interface ProgramSEOInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  degree_type?: string | null;
  degree_level?: string | null;
  field_of_study?: string | null;
  duration_semesters?: number | null;
  semester_fees?: number | null;
  tuition_amount?: number | null;
  ects_credits?: number | null;
  language_of_instruction?: string[] | null;
  uni_assist_required?: boolean | null;
  application_method?: string | null;
  winter_intake?: boolean | null;
  summer_intake?: boolean | null;
  winter_deadline?: string | null;
  summer_deadline?: string | null;
  prerequisites?: string | null;
  language_requirements?: string | string[] | null;
}

interface UniversitySEOInput {
  name: string;
  slug: string;
  city?: string | null;
  city_slug?: string | null;
  website?: string | null;
  hero_image_url?: string | null;
  logo_url?: string | null;
}

interface SEOProgramPageProps {
  program: ProgramSEOInput;
  university: UniversitySEOInput;
  language?: "en" | "ar" | "de";
}

const BASE_URL = "https://uniassist.net";
const DEFAULT_OG_IMAGE = `${BASE_URL}/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png`;

function languageDisplay(codes?: string[] | null): string {
  if (!codes || codes.length === 0) return "German";
  const map: Record<string, string> = {
    en: "English",
    de: "German",
    fr: "French",
    es: "Spanish",
    it: "Italian",
  };
  return codes.map((c) => map[c.toLowerCase()] ?? c.toUpperCase()).join(", ");
}

function tuitionLabel(p: ProgramSEOInput): string {
  const amount = p.tuition_amount ?? p.semester_fees;
  if (amount === 0 || amount === null || amount === undefined) {
    return "tuition-free";
  }
  return `tuition €${amount.toLocaleString()} per semester`;
}

function nextDeadlineLabel(p: ProgramSEOInput): string | null {
  const w = p.winter_deadline ? new Date(p.winter_deadline) : null;
  const s = p.summer_deadline ? new Date(p.summer_deadline) : null;
  if (!w && !s) return null;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "long" });
  if (w && s) return `Winter ${fmt(w)} · Summer ${fmt(s)}`;
  if (w) return `Winter intake deadline ${fmt(w)}`;
  return `Summer intake deadline ${fmt(s!)}`;
}

function applicationMethodHuman(method?: string | null): string {
  switch (method) {
    case "uni_assist_direct":
      return "Apply via uni-assist (Direct)";
    case "uni_assist_vpd":
      return "Apply via uni-assist (VPD pre-evaluation required)";
    case "direct":
      return "Apply directly to the university";
    default:
      return "Application method varies — see program page";
  }
}

function buildFaqs(p: ProgramSEOInput, u: UniversitySEOInput): FaqItem[] {
  const items: FaqItem[] = [];
  const programLabel = `${p.degree_type || p.degree_level || "this program"} in ${p.field_of_study || p.name}`;

  items.push({
    q: `What are the admission requirements for ${p.name} at ${u.name}?`,
    a: [
      p.prerequisites ? `Prerequisites: ${p.prerequisites}.` : null,
      Array.isArray(p.language_requirements) && p.language_requirements.length > 0
        ? `Language requirements: ${p.language_requirements.join(", ")}.`
        : typeof p.language_requirements === "string" && p.language_requirements
        ? `Language requirements: ${p.language_requirements}.`
        : null,
      `Detailed admission rules are listed on the program page on University Assist.`,
    ]
      .filter(Boolean)
      .join(" "),
  });

  const dl = nextDeadlineLabel(p);
  if (dl) {
    items.push({
      q: `When is the application deadline for ${p.name}?`,
      a: `${dl}. Deadlines for international applicants can be earlier than for domestic students — confirm the latest dates on the program detail page.`,
    });
  }

  if (p.uni_assist_required !== null && p.uni_assist_required !== undefined) {
    items.push({
      q: `Do I need to apply through uni-assist for ${p.name}?`,
      a: p.uni_assist_required
        ? `Yes. ${u.name} requires international applicants to submit ${p.name} through uni-assist e.V. ${applicationMethodHuman(p.application_method)}.`
        : `No. ${u.name} accepts direct applications for ${p.name} from international students. ${applicationMethodHuman(p.application_method)}.`,
    });
  }

  items.push({
    q: `How much does ${p.name} cost?`,
    a: `${p.name} is ${tuitionLabel(p)} at ${u.name}. International students should also budget around €730–€1,470 per month for living costs in Germany, including health insurance.`,
  });

  if (p.language_of_instruction && p.language_of_instruction.length > 0) {
    items.push({
      q: `Which language is ${p.name} taught in?`,
      a: `${p.name} is taught in ${languageDisplay(p.language_of_instruction)}. ${
        p.language_of_instruction.includes("en")
          ? "English-taught programs typically accept IELTS, TOEFL, PTE or recognised Medium of Instruction (MOI) certificates."
          : "German-taught programs typically require TestDaF, DSH, telc or Goethe certificates at the level required by the university."
      }`,
    });
  }

  if (p.duration_semesters) {
    items.push({
      q: `How long is ${p.name}?`,
      a: `${p.name} has a standard duration of ${p.duration_semesters} semesters (${p.duration_semesters * 6} months) and awards ${
        p.ects_credits ? `${p.ects_credits} ECTS / Credit Points` : "the standard credit load"
      }.`,
    });
  }

  return items;
}

export default function SEOProgramPage({
  program,
  university,
  language = "en",
}: SEOProgramPageProps) {
  const path = `/universities/${university.slug}/programs/${program.slug}`;
  const canonical = `${BASE_URL}${path}`;

  const degreeLabel = program.degree_type || program.degree_level || "Program";
  const title = `${degreeLabel} ${program.name} at ${university.name} | University Assist`;

  const cleanDescription = (program.description || "").replace(/\s+/g, " ").trim();
  const seedDescription =
    cleanDescription.length > 0
      ? cleanDescription.slice(0, 155)
      : `Study ${program.name} (${degreeLabel}) at ${university.name} in ${
          university.city || "Germany"
        }. Taught in ${languageDisplay(program.language_of_instruction)}, ${tuitionLabel(
          program,
        )}.`;
  const description = seedDescription.length >= 155 ? `${seedDescription.slice(0, 152)}…` : seedDescription;

  const keywords = [
    program.name,
    `${degreeLabel} ${program.field_of_study || ""}`.trim(),
    program.field_of_study,
    university.name,
    university.city,
    "Study in Germany",
    "German university programs",
    "international students Germany",
  ]
    .filter(Boolean)
    .join(", ");

  const ogImage =
    university.hero_image_url || university.logo_url || DEFAULT_OG_IMAGE;

  const hrefLangTags = getHrefLangTags(path, language);

  // Schemas
  const programSchema = createProgramSchema(
    {
      id: program.id,
      title: program.name,
      major: program.field_of_study || program.name,
      degree_level: program.degree_level || degreeLabel,
      university: {
        id: university.slug,
        name: university.name,
        city: university.city || "Germany",
        website: university.website || undefined,
      },
      tuition_eur: program.tuition_amount ?? program.semester_fees ?? undefined,
      duration_semesters: program.duration_semesters ?? undefined,
    },
    [],
  );

  const breadcrumbs = getProgramBreadcrumbs(
    program.name,
    program.slug,
    university.name,
    university.slug,
    university.city || undefined,
    university.city_slug || undefined,
  );
  const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs);

  const faqs = buildFaqs(program, university);
  const faqSchema = faqs.length > 0 ? createFaqSchema(faqs) : null;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="University Assist" />
        <meta property="og:locale" content={language === "de" ? "de_DE" : language === "ar" ? "ar_AR" : "en_US"} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Canonical & hreflang */}
        <link rel="canonical" href={canonical} />
        {hrefLangTags.map((tag) => (
          <link
            key={tag.hreflang}
            rel="alternate"
            hrefLang={tag.hreflang}
            href={tag.href}
          />
        ))}
      </Helmet>

      <JsonLd data={programSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
    </>
  );
}