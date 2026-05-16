// High-intent SEO landing pages. Each page targets one search query and
// funnels traffic into /search (or /eligibility-checker / /cities etc.)
// with the right filters preset. Slugs match the URL exactly.

import type { ComponentType } from "react";
import { Globe2, GraduationCap, BookOpenCheck, Euro, Search as SearchIcon } from "lucide-react";

export type LandingFAQ = { question: string; answer: string };

export type LandingPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  /** Live count to display in the hero, computed via supabase query. */
  counter:
    | { kind: "programs"; filter: Record<string, string | number | boolean> }
    | { kind: "universities"; filter?: Record<string, string | number | boolean> }
    | { kind: "cities" }
    | null;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  icon: ComponentType<{ className?: string }>;
  benefits: { title: string; description: string }[];
  faqs: LandingFAQ[];
  /** Internal links shown in the footer block. */
  related: { label: string; href: string }[];
};

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "english-taught-programs-in-germany",
    title: "English-Taught Programs in Germany",
    metaTitle: "English-Taught Programs in Germany | University Assist",
    metaDescription:
      "Search every English-taught Bachelor's and Master's at German universities. Live deadlines, language requirements and tuition — filter in one click.",
    keyword: "english taught programs germany",
    counter: { kind: "programs", filter: { language: "english" } },
    heroEyebrow: "Study in English",
    heroTitle: "English-taught programs at German universities",
    heroSubtitle:
      "More than 1,800 Bachelor's and Master's are taught fully in English. Filter by field, city and entry difficulty in seconds.",
    primaryCta: { label: "Search English programs", href: "/search?lang=english" },
    secondaryCta: { label: "Check your eligibility", href: "/eligibility-checker" },
    icon: Globe2,
    benefits: [
      {
        title: "No German required",
        description:
          "These programs accept IELTS 6.0–6.5 / TOEFL iBT 80–90. German is optional and many universities offer free courses on the side.",
      },
      {
        title: "Free or low tuition",
        description:
          "Public universities charge €0–€1,500 per semester for non-EU students. Private universities are typically €5,000–€12,000 per semester.",
      },
      {
        title: "18-month post-study visa",
        description:
          "Graduates of a recognised German degree receive an 18-month residence permit to find work — one of the most generous routes in the EU.",
      },
    ],
    faqs: [
      {
        question: "Can I study in Germany without German?",
        answer:
          "Yes. Hundreds of Bachelor's and Master's are taught fully in English. You only need to prove English proficiency (IELTS / TOEFL / Duolingo) at the level the university asks for.",
      },
      {
        question: "Are English programs free at public German universities?",
        answer:
          "Most public universities charge no tuition regardless of language of instruction. The exception is Baden-Württemberg, which charges €1,500/semester to non-EU students.",
      },
      {
        question: "Do I need to apply via uni-assist?",
        answer:
          "Most public universities use uni-assist for international applicants. Private universities (e.g. EBS, UE, IU, Frankfurt School) accept direct applications. Each program on University Assist shows which route applies.",
      },
    ],
    related: [
      { label: "Master's programs in Germany", href: "/masters-in-germany" },
      { label: "Bachelor's programs in Germany", href: "/bachelors-in-germany" },
      { label: "Free public universities", href: "/free-universities-in-germany" },
      { label: "Browse all German cities", href: "/cities" },
    ],
  },
  {
    slug: "masters-in-germany",
    title: "Master's Programs in Germany",
    metaTitle: "Master's Programs in Germany — Search & Compare | University Assist",
    metaDescription:
      "Find your Master's at a German university. Compare deadlines, tuition, English-taught options, GPA and credit-point requirements in one place.",
    keyword: "masters in germany",
    counter: { kind: "programs", filter: { level: "master" } },
    heroEyebrow: "Postgraduate",
    heroTitle: "Master's programs in Germany",
    heroSubtitle:
      "Germany hosts more Master's programs taught in English than the UK, with most public universities charging no tuition. Filter by field, language and deadline.",
    primaryCta: { label: "Search Master's programs", href: "/search?level=master" },
    secondaryCta: { label: "Check your eligibility", href: "/eligibility-checker" },
    icon: GraduationCap,
    benefits: [
      {
        title: "180 ECTS minimum",
        description:
          "Most German Master's require a Bachelor's worth 180 credit points. Our eligibility checker maps your transcript automatically.",
      },
      {
        title: "Modified Bavarian GPA conversion",
        description:
          "We convert your foreign GPA to the German 1.0–4.0 scale using the official Modified Bavarian Formula so you know which universities are realistic.",
      },
      {
        title: "Winter & summer intakes",
        description:
          "Winter intake (Oct) is the main one with deadlines in Jan–July. Summer intake (Apr) is available for ~30% of programs with deadlines in Sep–Jan.",
      },
    ],
    faqs: [
      {
        question: "What GPA do I need for a German Master's?",
        answer:
          "Top programs (TU Munich, RWTH Aachen, Mannheim) typically expect a converted German GPA of 2.5 or better. Mid-tier programs accept 3.0–3.5. Use our eligibility checker for a personalised estimate.",
      },
      {
        question: "Can I apply with a 3-year Bachelor's?",
        answer:
          "Many German universities only count 3-year Bachelor's if they are recognised as equivalent to 180 ECTS in your country. Indian 3-year B.Sc., for example, is often accepted but may require additional coursework.",
      },
      {
        question: "Are German Master's free?",
        answer:
          "At public universities in 15 of 16 federal states, yes. Baden-Württemberg charges €1,500/semester for non-EU students. Private universities range €25,000–€48,000 total.",
      },
    ],
    related: [
      { label: "English-taught programs", href: "/english-taught-programs-in-germany" },
      { label: "Free public universities", href: "/free-universities-in-germany" },
      { label: "Bachelor's programs", href: "/bachelors-in-germany" },
      { label: "Best universities for business", href: "/best-5-universities-to-pursue-a-business-degree-in-germany" },
    ],
  },
  {
    slug: "bachelors-in-germany",
    title: "Bachelor's Programs in Germany",
    metaTitle: "Bachelor's Programs in Germany — English & German | University Assist",
    metaDescription:
      "Search Bachelor's degrees at German universities. Tuition-free public options and English-taught private programs with rolling admissions.",
    keyword: "bachelors in germany",
    counter: { kind: "programs", filter: { level: "bachelor" } },
    heroEyebrow: "Undergraduate",
    heroTitle: "Bachelor's programs in Germany",
    heroSubtitle:
      "We map IB, A-Levels, IGCSE, Tawjihi, GAC, the American Diploma and the German Abitur to the right entry route — no guessing whether your secondary diploma qualifies.",
    primaryCta: { label: "Search Bachelor's programs", href: "/search?level=bachelor" },
    secondaryCta: { label: "Check your eligibility", href: "/eligibility-checker" },
    icon: BookOpenCheck,
    benefits: [
      {
        title: "Direct or Studienkolleg entry",
        description:
          "Some curricula qualify directly for German Bachelor's; others need a one-year Studienkolleg foundation. Our eligibility checker tells you which applies.",
      },
      {
        title: "Mostly tuition-free",
        description:
          "Public universities charge €150–€350 per semester (administrative + transport ticket), with no tuition in 15 of 16 federal states.",
      },
      {
        title: "Bilingual options",
        description:
          "Public universities mostly teach Bachelor's in German; private universities (UE, IU, BSBI) offer English-taught Bachelor's in business, design and tech.",
      },
    ],
    faqs: [
      {
        question: "Is my secondary diploma accepted in Germany?",
        answer:
          "It depends on curriculum and grades. IB, A-Levels (3+ A-Level subjects) and the German Abitur usually qualify directly. IGCSE, Tawjihi, GAC and the American Diploma often require a Studienkolleg foundation year. Use our eligibility checker for a personalised answer.",
      },
      {
        question: "Can I do a Bachelor's in Germany in English?",
        answer:
          "Yes — primarily at private universities (UE Germany, IU International, BSBI, Code Berlin) and a handful of public programs in international business and engineering.",
      },
      {
        question: "What is Studienkolleg?",
        answer:
          "Studienkolleg is a one-year preparatory program that closes the gap between your secondary diploma and the German Abitur. It is taught in German and ends with the Feststellungsprüfung exam.",
      },
    ],
    related: [
      { label: "English-taught programs", href: "/english-taught-programs-in-germany" },
      { label: "Master's programs in Germany", href: "/masters-in-germany" },
      { label: "Free public universities", href: "/free-universities-in-germany" },
      { label: "Cheapest student cities", href: "/the-most-budget-friendly-cities-in-germany-for-international-students" },
    ],
  },
  {
    slug: "free-universities-in-germany",
    title: "Free Universities in Germany",
    metaTitle: "Tuition-Free Universities in Germany for International Students",
    metaDescription:
      "Browse Germany's tuition-free public universities. Compare programs, entry requirements and city living costs — no tuition for international students.",
    keyword: "free universities in germany",
    counter: { kind: "universities", filter: { type: "public" } },
    heroEyebrow: "No tuition",
    heroTitle: "Free public universities in Germany",
    heroSubtitle:
      "Public universities in 15 of 16 federal states charge no tuition for international students. You pay only a semester contribution of €150–€350 that usually includes a transport ticket.",
    primaryCta: { label: "Browse free universities", href: "/universities?type=public" },
    secondaryCta: { label: "Search free programs", href: "/search?type=public" },
    icon: Euro,
    benefits: [
      {
        title: "World-class research",
        description:
          "11 German universities of excellence (TU Munich, RWTH Aachen, LMU, Heidelberg, KIT, etc.) all charge zero tuition for non-EU students.",
      },
      {
        title: "Semester fee €150–€350",
        description:
          "Covers student services and an unlimited transport ticket valid across the federal state — sometimes the whole country.",
      },
      {
        title: "One exception",
        description:
          "Baden-Württemberg charges €1,500/semester for non-EU students at universities like Heidelberg, Stuttgart and Karlsruhe (KIT).",
      },
    ],
    faqs: [
      {
        question: "Are there really free universities in Germany for international students?",
        answer:
          "Yes. Public universities in 15 of 16 federal states charge no tuition regardless of nationality. You only pay a semester contribution of €150–€350.",
      },
      {
        question: "What is the catch?",
        answer:
          "Living costs, not tuition. International students need to show €11,904/year in a blocked account before getting a student visa. Plan a realistic monthly budget of €930–€1,250 in most cities.",
      },
      {
        question: "Do free universities have lower quality?",
        answer:
          "No. Free public universities include world-leading research institutions like TU Munich (top 30 globally) and Heidelberg (founded 1386). German higher education is funded by federal and state taxes.",
      },
    ],
    related: [
      { label: "Master's programs in Germany", href: "/masters-in-germany" },
      { label: "English-taught programs", href: "/english-taught-programs-in-germany" },
      { label: "Cheapest student cities", href: "/the-most-budget-friendly-cities-in-germany-for-international-students" },
      { label: "All German universities", href: "/universities" },
    ],
  },
  {
    slug: "study-in-germany",
    title: "Study in Germany — Complete Guide",
    metaTitle: "Study in Germany 2026 — Programs, Universities, Eligibility",
    metaDescription:
      "Everything international students need to study in Germany: programs, universities, English-taught options, free tuition, ECTS, deadlines and a free eligibility check.",
    keyword: "study in germany",
    counter: null,
    heroEyebrow: "Your way to Germany",
    heroTitle: "Study in Germany — your complete starting point",
    heroSubtitle:
      "Search 1,800+ programs at 293 universities, check your eligibility in 3 minutes, and apply with confidence. Free for students, in English, Arabic and German.",
    primaryCta: { label: "Find your program", href: "/search" },
    secondaryCta: { label: "Check your eligibility", href: "/eligibility-checker" },
    icon: SearchIcon,
    benefits: [
      {
        title: "1,800+ programs",
        description: "Bachelor's, Master's, public, private — search by field, language, deadline and city.",
      },
      {
        title: "Free eligibility check",
        description: "We convert your GPA via the Modified Bavarian Formula and map your transcript to ECTS in minutes.",
      },
      {
        title: "Live deadlines",
        description: "Every program shows the current intake and remaining days. No more outdated PDFs.",
      },
    ],
    faqs: [
      {
        question: "How do I start applying to study in Germany?",
        answer:
          "Three steps: (1) Run a free eligibility check so you know which programs are realistic. (2) Shortlist programs by deadline and language. (3) Apply via uni-assist (for most public universities) or directly via the university portal (for private universities). University Assist guides you through each step.",
      },
      {
        question: "Is studying in Germany really free?",
        answer:
          "Public universities charge no tuition in 15 of 16 federal states, only a €150–€350/semester contribution. Baden-Württemberg charges €1,500/semester for non-EU students. Private universities cost €5,000–€12,000/semester.",
      },
      {
        question: "How long does the application take?",
        answer:
          "Uni-assist processes applications in 4–8 weeks. Direct applications to private universities usually decide within 10 working days. Plan to start 6 months before your target intake.",
      },
    ],
    related: [
      { label: "English-taught programs", href: "/english-taught-programs-in-germany" },
      { label: "Master's in Germany", href: "/masters-in-germany" },
      { label: "Bachelor's in Germany", href: "/bachelors-in-germany" },
      { label: "Free public universities", href: "/free-universities-in-germany" },
      { label: "Cheapest student cities", href: "/the-most-budget-friendly-cities-in-germany-for-international-students" },
      { label: "ECTS / Credit points explained", href: "/ects-and-its-benefits-for-international-students" },
    ],
  },
];

export function getLandingPageBySlug(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}