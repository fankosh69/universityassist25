// Native replacements for the legacy WordPress posts that still rank for
// uniassist.net on Google. Slugs MATCH the legacy URLs exactly so that
// existing backlinks and SERP positions transfer to the new app.
//
// Update copy here; routes are wired up in src/App.tsx.

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type RelatedLink = {
  label: string;
  href: string;
  description?: string;
};

export type LegacyBlogPost = {
  slug: string; // e.g. "karlsruhe-a-city-of-history" -> /karlsruhe-a-city-of-history
  title: string;
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  category: "Cities" | "Universities" | "Study tips" | "Company";
  readingMinutes: number;
  publishedDate: string; // ISO date
  updatedDate: string; // ISO date
  excerpt: string;
  intro: string;
  sections: ArticleSection[];
  related: RelatedLink[];
  primaryCta: { label: string; href: string };
};

const TODAY = "2026-05-16";

export const LEGACY_BLOG_POSTS: LegacyBlogPost[] = [
  {
    slug: "the-most-budget-friendly-cities-in-germany-for-international-students",
    title: "The Most Budget-Friendly Cities in Germany for International Students",
    metaTitle: "Cheapest Cities in Germany for International Students (2026)",
    metaDescription:
      "Compare the most affordable German student cities by rent, transport and living costs — Leipzig, Halle, Magdeburg, Dresden and more.",
    keyword: "cheapest cities in germany",
    category: "Cities",
    readingMinutes: 7,
    publishedDate: "2023-02-14",
    updatedDate: TODAY,
    excerpt:
      "Germany is one of the most affordable study destinations in Western Europe — if you pick the right city. Here are the cheapest places to study, with up-to-date monthly budgets.",
    intro:
      "Tuition at most public German universities is free, but rent and groceries vary widely by region. The cities below let international students live comfortably on €730–€1,100 per month — well below the German Embassy's blocked-account requirement of €992/month.",
    sections: [
      {
        heading: "How we ranked the cheapest student cities",
        paragraphs: [
          "We combined Studentenwerk dormitory averages, mid-2026 WG-Gesucht rental data and DAAD living-cost surveys. A city only made the list if it has at least one accredited public university and an active international student community.",
        ],
        bullets: [
          "Average shared-flat (WG) room rent under €400/month",
          "Monthly groceries below €220",
          "Semester ticket included for unlimited regional transport",
        ],
      },
      {
        heading: "1. Leipzig — Saxony's creative capital",
        paragraphs: [
          "Leipzig combines low rent (median WG room €330) with a thriving arts scene and Universität Leipzig, one of Germany's oldest research universities. The HMT Leipzig and HTWK round out a strong public ecosystem for music, engineering and computer science.",
          "Expected total budget: €780–€950/month including health insurance.",
        ],
      },
      {
        heading: "2. Halle (Saale) — small-city value",
        paragraphs: [
          "Halle sits 35 minutes from Leipzig by S-Bahn and offers some of the lowest rents in Germany (€280–€340 for a WG room). Martin-Luther-Universität Halle-Wittenberg has strong programs in pharmacy, natural sciences and medieval studies.",
        ],
      },
      {
        heading: "3. Magdeburg — engineering on a tight budget",
        paragraphs: [
          "Otto-von-Guericke-Universität is a magnet for English-taught engineering Master's. Magdeburg's WG rents average €310 and the Studentenwerk dorm network covers more than 3,000 beds, meaning international students rarely struggle to find housing.",
        ],
      },
      {
        heading: "4. Dresden — capital city quality without Berlin prices",
        paragraphs: [
          "Dresden hosts TU Dresden — a member of the German U15 research alliance — and HTW Dresden for applied sciences. Rents climbed in 2025 but remain 30% below Munich (median WG €420).",
        ],
      },
      {
        heading: "5. Bochum — the Ruhr's hidden value",
        paragraphs: [
          "Ruhr-Universität Bochum has more than 40,000 students and one of the most generous semester tickets in the country, covering trains across all of North Rhine-Westphalia. Expect WG rents around €360 and a vibrant Turkish, Arabic and Greek community.",
        ],
      },
      {
        heading: "Cities to consider next",
        paragraphs: [
          "Honourable mentions: Greifswald (coastal), Cottbus (lowest dorm rents in Germany), Chemnitz (TU Chemnitz, English-taught), and Kiel (sailing capital with excellent marine engineering).",
        ],
      },
    ],
    related: [
      { label: "Browse all German student cities", href: "/cities", description: "159 cities with rent, transport and university data" },
      { label: "Find affordable programs", href: "/search", description: "Filter by tuition and language of instruction" },
      { label: "Check your eligibility", href: "/eligibility-checker", description: "Free 3-minute eligibility check for German universities" },
    ],
    primaryCta: { label: "Explore all 159 German cities", href: "/cities" },
  },
  {
    slug: "karlsruhe-a-city-of-history",
    title: "Karlsruhe: A City of History, Science and Tech",
    metaTitle: "Karlsruhe Student Guide — KIT, History, Cost of Living (2026)",
    metaDescription:
      "Everything international students need to know about Karlsruhe: KIT, HKA, the fan-shaped old town, monthly budgets and where to live.",
    keyword: "karlsruhe city",
    category: "Cities",
    readingMinutes: 6,
    publishedDate: "2023-03-04",
    updatedDate: TODAY,
    excerpt:
      "Karlsruhe was planned in 1715 as a baroque fan radiating from the Margrave's palace. Three centuries later it's a top-five German tech hub and a calm, green place to study.",
    intro:
      "Karlsruhe is the southwestern gateway to the Black Forest and home to Karlsruher Institut für Technologie (KIT), one of the eleven German Universities of Excellence. With roughly 311,000 residents and 40,000 students, it strikes a rare balance between affordability and research firepower.",
    sections: [
      {
        heading: "A 300-year-old planned city",
        paragraphs: [
          "Margrave Karl Wilhelm dreamed of a perfectly symmetric capital and laid out 32 streets radiating from his palace tower — the Schloss. Today the same fan shape makes the city compact and walkable. Most of the centre is car-free, and the city's tram-train system reaches every university campus.",
        ],
      },
      {
        heading: "Where you'll study",
        paragraphs: [
          "KIT is the merger of TH Karlsruhe and Forschungszentrum Karlsruhe, and consistently sits in the world top 150 for engineering and computer science. Hochschule Karlsruhe (HKA) focuses on applied sciences and has strong English-taught Master's. The Hochschule für Musik and HfG (state design academy) attract creative students from across Europe.",
        ],
      },
      {
        heading: "Cost of living",
        paragraphs: [
          "Karlsruhe is noticeably cheaper than Stuttgart or Munich. Expect €1,000–€1,250/month including a WG room (€420–€520), health insurance, groceries and the semester ticket.",
        ],
      },
      {
        heading: "Neighbourhoods to consider",
        paragraphs: [
          "Oststadt is the classic student district — close to KIT and full of cafés. Südstadt has the cheapest rents and an international weekly market. Mühlburg and Weststadt offer larger flats for couples and families.",
        ],
      },
      {
        heading: "Things to do",
        paragraphs: [
          "The ZKM Centre for Art and Media is one of Europe's leading digital-art museums, the Botanical Garden is free for students, and the Schwarzwald is 30 minutes away by regional train — perfect for weekend hiking.",
        ],
      },
    ],
    related: [
      { label: "Karlsruhe city page", href: "/cities/karlsruhe", description: "Live data on universities, weather and amenities" },
      { label: "Programs in Karlsruhe", href: "/search?city=karlsruhe", description: "All English- and German-taught programs in the city" },
      { label: "Compare with other Baden-Württemberg cities", href: "/regions/baden-wurttemberg" },
    ],
    primaryCta: { label: "See universities in Karlsruhe", href: "/cities/karlsruhe" },
  },
  {
    slug: "ue-university-of-europe-for-applied-sciences",
    title: "UE — University of Europe for Applied Sciences: Programs & Admission",
    metaTitle: "UE Germany (University of Europe) — Programs, Fees, Admission",
    metaDescription:
      "Guide to UE Germany campuses in Berlin, Hamburg, Iserlohn and Potsdam — programs, tuition, English-taught Bachelor's and Master's, and how to apply.",
    keyword: "uni of europe",
    category: "Universities",
    readingMinutes: 6,
    publishedDate: "2023-04-21",
    updatedDate: TODAY,
    excerpt:
      "UE is a private state-accredited university with four German campuses, more than 4,000 international students and the largest English-taught design portfolio in Germany.",
    intro:
      "Founded in 2001 in Iserlohn, the University of Europe for Applied Sciences (UE) has grown into a four-campus institution (Berlin, Hamburg, Iserlohn, Potsdam) and is part of the Global University Systems network. It is state-recognised by the Ministries of Education in North Rhine-Westphalia and Berlin.",
    sections: [
      {
        heading: "Schools and program portfolio",
        paragraphs: [
          "UE organises its programs across three schools: Business, Sport & Communication; Tech; and Art & Design (including the renowned BTK division). All Bachelor's and most Master's are delivered in English.",
        ],
        bullets: [
          "Business Administration, Digital Marketing, Sport & Event Management",
          "Software Engineering, Data Science, Cybersecurity",
          "Graphic Design, Illustration, Game Design, UX Design",
          "Visual & Experience Design (M.A.), Smart Building Engineering",
        ],
      },
      {
        heading: "Tuition and scholarships",
        paragraphs: [
          "Bachelor's tuition starts at €865/month and Master's at €975/month depending on the program. UE offers a need-based ‘Future Leader' scholarship of up to 60% off tuition, plus regional discounts for MENA, African and Latin-American students.",
        ],
      },
      {
        heading: "Admission requirements",
        paragraphs: [
          "For Bachelor's: a recognised secondary-school leaving certificate equivalent to the German Abitur (we automatically map IB, A-Levels, IGCSE, GAC, Tawjihi and the American Diploma) plus English at IELTS 6.0 / TOEFL iBT 80. For Master's: a relevant Bachelor's with at least 180 ECTS and English at IELTS 6.5.",
          "UE does not require uni-assist; you apply directly through the university portal, which speeds the process to roughly 10 working days.",
        ],
      },
      {
        heading: "Campus life",
        paragraphs: [
          "Berlin is the largest campus (Potsdamer Platz area), focusing on business and tech. Iserlohn is the residential campus with dormitories on-site. Hamburg sits in the HafenCity creative quarter and Potsdam hosts the Film & Motion programs.",
        ],
      },
    ],
    related: [
      { label: "All German universities", href: "/universities", description: "Browse 293 public and private institutions" },
      { label: "English-taught Bachelor's", href: "/search?language=english&level=bachelor" },
      { label: "Check your eligibility for UE", href: "/eligibility-checker" },
    ],
    primaryCta: { label: "See all programs at UE", href: "/search?university=ue-germany" },
  },
  {
    slug: "why-to-study-entrepreneurship-in-germany",
    title: "Why Study Entrepreneurship in Germany",
    metaTitle: "Study Entrepreneurship in Germany — Top Programs & Visa Path",
    metaDescription:
      "Why Germany is a top destination for entrepreneurship Master's: startup ecosystem, post-study work visa, top business schools and how to apply.",
    keyword: "germany entrepreneurship",
    category: "Study tips",
    readingMinutes: 6,
    publishedDate: "2023-05-10",
    updatedDate: TODAY,
    excerpt:
      "Berlin alone closed €5.4B in startup funding in 2025. Combined with low tuition and an 18-month post-study work visa, Germany is one of the world's best places to study entrepreneurship.",
    intro:
      "If you want to build a company in Europe, Germany gives you three structural advantages: cheap or free tuition at public universities, a Section-16 student visa that converts to an 18-month job-seeker visa after graduation, and direct access to the Mittelstand — the engine of Europe's largest economy.",
    sections: [
      {
        heading: "1. A top-5 startup ecosystem",
        paragraphs: [
          "Berlin, Munich and Hamburg consistently rank in the global top 30 startup hubs (Startup Genome 2025). Berlin's accelerators (APX, Project A, Earlybird) and Munich's deep-tech VCs (UnternehmerTUM, HV Capital) actively recruit master's graduates.",
        ],
      },
      {
        heading: "2. Universities with real founder pipelines",
        paragraphs: [
          "Top picks: TU Munich (M.Sc. Management & Technology + UnternehmerTUM), WHU Otto Beisheim School (M.Sc. Entrepreneurship), ESCP Berlin (M.Sc. International Business), EBS Wiesbaden (M.Sc. Innovation & Entrepreneurship) and CODE Berlin (B.A. Product Management for creative founders).",
        ],
      },
      {
        heading: "3. The post-study visa advantage",
        paragraphs: [
          "Graduates receive an 18-month residence permit to find work or launch a business — one of the most generous routes in the EU. A founders' permit (§21 AufenthG) is available once you secure seed funding or a TÜV-validated business plan.",
        ],
      },
      {
        heading: "4. Affordable tuition",
        paragraphs: [
          "Public Master's are free across most federal states (Baden-Württemberg charges €1,500/semester for non-EU students). Private business schools cost €25,000–€48,000 total but often include mentor networks and capital introductions.",
        ],
      },
      {
        heading: "5. Direct access to the Mittelstand",
        paragraphs: [
          "Germany has 1,500+ ‘hidden champion' companies — global market leaders most students have never heard of. Many run open-innovation programs that take on entrepreneurial Master's interns to spin out new business lines.",
        ],
      },
    ],
    related: [
      { label: "Entrepreneurship & Business programs", href: "/search?field=business-management" },
      { label: "WHU, ESCP, EBS and other top business schools", href: "/universities" },
      { label: "Check your eligibility for a German Master's", href: "/eligibility-checker" },
    ],
    primaryCta: { label: "Find an entrepreneurship program", href: "/search?field=entrepreneurship" },
  },
  {
    slug: "ebs-germany-a-way-to-success",
    title: "EBS Universität: A Way to Success in German Business Education",
    metaTitle: "EBS Germany — Programs, Tuition, Admission & Career Outcomes",
    metaDescription:
      "EBS Universität für Wirtschaft und Recht in Wiesbaden: programs, tuition, English-taught Bachelor's & Master's, and the corporate network behind its 95% employment rate.",
    keyword: "ebs germany",
    category: "Universities",
    readingMinutes: 6,
    publishedDate: "2023-06-02",
    updatedDate: TODAY,
    excerpt:
      "EBS in Wiesbaden is one of only three German business schools triple-accredited (EQUIS, AACSB, AMBA-equivalent) and feeds directly into the Frankfurt finance hub.",
    intro:
      "EBS Universität für Wirtschaft und Recht is a private state-accredited university located in Oestrich-Winkel and Wiesbaden — a 30-minute train from Frankfurt's banking district. Founded in 1971, it pioneered Anglo-Saxon business education in Germany and is the alma mater of many DAX-listed executives.",
    sections: [
      {
        heading: "Programs",
        paragraphs: [
          "EBS offers a B.Sc. in Management with majors in Finance, Marketing, Strategy and Family Business; a 4-year integrated J.D./M.Sc. in Law and Business; and English-taught Master's in Management, Finance, Real Estate and Innovation & Entrepreneurship. The Executive MBA is delivered jointly with Durham University Business School.",
        ],
      },
      {
        heading: "Tuition and scholarships",
        paragraphs: [
          "Bachelor's tuition is €5,950/semester (€41,650 total over 7 semesters); Master's range €34,000–€39,500. EBS offers merit, women-in-leadership and DAAD-backed scholarships covering 10–80% of tuition.",
        ],
      },
      {
        heading: "Admission",
        paragraphs: [
          "Bachelor's applicants need a recognised secondary diploma, English (IELTS 6.5 / TOEFL iBT 90) and the EBS Aptitude Test plus interview. Master's applicants need 180 ECTS in a relevant field, GMAT 600+ (or equivalent), and an interview. No uni-assist required — applications go directly through the EBS portal.",
        ],
      },
      {
        heading: "Career outcomes",
        paragraphs: [
          "EBS reports 95% of graduates employed within three months of graduation, with median starting salaries of €58,000. Top recruiters include Deutsche Bank, EY, Roland Berger, McKinsey, Henkel and BMW.",
        ],
      },
    ],
    related: [
      { label: "EBS profile and live deadlines", href: "/universities/ebs-universitat-fur-wirtschaft-und-recht" },
      { label: "All Master's in Management", href: "/search?field=management&level=master" },
      { label: "Other top private business schools", href: "/universities?type=private" },
    ],
    primaryCta: { label: "Open EBS on University Assist", href: "/universities/ebs-universitat-fur-wirtschaft-und-recht" },
  },
  {
    slug: "best-5-universities-to-pursue-a-business-degree-in-germany",
    title: "The 5 Best Universities for a Business Degree in Germany",
    metaTitle: "Best Universities in Germany for Business Degrees (2026)",
    metaDescription:
      "Ranked list of the best German universities for business — Mannheim, WHU, TUM, LMU and Frankfurt School — with tuition, language and entry requirements.",
    keyword: "best german universities for business",
    category: "Universities",
    readingMinutes: 7,
    publishedDate: "2023-07-15",
    updatedDate: TODAY,
    excerpt:
      "Germany has both globally-ranked public business faculties and elite private schools. Here are five worth applying to — and how they differ.",
    intro:
      "We ranked these five on the 2025 Financial Times European Business School table, Handelsblatt research output, recruiter survey scores and English-language program depth. All five admit international students with curricula in English.",
    sections: [
      {
        heading: "1. Universität Mannheim",
        paragraphs: [
          "Mannheim Business School is the only German faculty consistently in the FT European Top 10. Public university, no tuition for the B.Sc. Business Administration, English-taught Mannheim Master in Management.",
        ],
      },
      {
        heading: "2. WHU – Otto Beisheim School of Management",
        paragraphs: [
          "Private, Vallendar campus near Koblenz. WHU's M.Sc. Management is ranked #4 in Europe by the FT. Famous founders include Zalando, HelloFresh and Flixbus.",
        ],
      },
      {
        heading: "3. TUM School of Management",
        paragraphs: [
          "Part of Technical University of Munich. Combines management with engineering and data — perfect for tech-leaning founders. M.Sc. Management & Technology is taught fully in English with €2,000–€4,000/semester tuition for non-EU students.",
        ],
      },
      {
        heading: "4. LMU Munich Faculty of Business Administration",
        paragraphs: [
          "Public university, no tuition. Strong in finance and economics research; English-taught Master in Management & Digital Technology.",
        ],
      },
      {
        heading: "5. Frankfurt School of Finance & Management",
        paragraphs: [
          "Private; triple-accredited (EQUIS, AACSB, AMBA). Specialises in finance, banking and quantitative methods. Direct pipeline to Frankfurt's banking sector and the ECB.",
        ],
      },
      {
        heading: "How to choose",
        paragraphs: [
          "Pick public (Mannheim, TUM, LMU) for low tuition and strong research; pick private (WHU, Frankfurt School) for tighter cohorts, faster networking and stronger career services. Use our search to compare deadlines and language requirements side-by-side.",
        ],
      },
    ],
    related: [
      { label: "All business & management programs", href: "/search?field=business-management" },
      { label: "Top private universities", href: "/universities?type=private" },
      { label: "Universities in Munich", href: "/cities/munich" },
    ],
    primaryCta: { label: "Compare business programs", href: "/search?field=business-management" },
  },
  {
    slug: "ects-and-its-benefits-for-international-students",
    title: "ECTS Explained: How Credit Points Work in Germany",
    metaTitle: "ECTS (Total Credit Points) Explained for International Students",
    metaDescription:
      "What ECTS — the European Credit Transfer System — means for international students applying to German universities, and how Total Credit Points are calculated.",
    keyword: "ects meaning",
    category: "Study tips",
    readingMinutes: 5,
    publishedDate: "2023-09-08",
    updatedDate: TODAY,
    excerpt:
      "ECTS — now usually called Total Credit Points — is the currency of European higher education. Here's what it means for transferring, applying and graduating in Germany.",
    intro:
      "ECTS stands for the European Credit Transfer and Accumulation System. It exists so that a semester studied in Berlin counts the same as a semester studied in Bologna or Barcelona. In Germany you will see it on every transcript, syllabus and program description — and it determines whether your Bachelor's qualifies you for a German Master's.",
    sections: [
      {
        heading: "How Total Credit Points are calculated",
        paragraphs: [
          "One credit point equals 25–30 hours of student workload — lectures, seminars, self-study and exam preparation combined. A standard semester is 30 credits and a full Bachelor's is 180 credits (sometimes 210 or 240).",
        ],
      },
      {
        heading: "Why it matters for international applicants",
        paragraphs: [
          "Most German Master's require a Bachelor's worth at least 180 ECTS. Indian 3-year Bachelor's, U.S. and Canadian degrees and several MENA curricula often come in below this threshold. In that case you may need to either: complete additional coursework, take a recognised pre-Master's, or apply only to programs that explicitly accept your degree.",
          "University Assist's eligibility checker maps your transcript to ECTS automatically using the Modified Bavarian Formula and flags any credit gap before you apply.",
        ],
      },
      {
        heading: "Grade conversion",
        paragraphs: [
          "A separate process — German GPA conversion via the Modified Bavarian Formula — translates your foreign GPA to the German 1.0–4.0 scale. Top universities (TU Munich, RWTH Aachen) typically require a converted GPA of 2.5 or better.",
        ],
      },
      {
        heading: "Quick reference",
        paragraphs: [
          "180 ECTS = 3-year Bachelor's. 240 ECTS = 4-year Bachelor's. 120 ECTS = 2-year Master's. 60 ECTS = 1-year Master's. 30 ECTS = one full-time semester.",
        ],
      },
    ],
    related: [
      { label: "Free eligibility checker", href: "/eligibility-checker", description: "Map your transcript to German credit points" },
      { label: "Find Master's programs", href: "/search?level=master" },
      { label: "Browse universities by entry difficulty", href: "/universities" },
    ],
    primaryCta: { label: "Check your credit points", href: "/eligibility-checker" },
  },
  {
    slug: "about-us",
    title: "About University Assist",
    metaTitle: "About University Assist — Free Help for International Students",
    metaDescription:
      "University Assist helps students from MENA find, qualify for and apply to German Bachelor's and Master's programs — independent, multilingual and free.",
    keyword: "uniassist about",
    category: "Company",
    readingMinutes: 3,
    publishedDate: "2022-11-01",
    updatedDate: TODAY,
    excerpt:
      "We're an independent platform that helps students from the Middle East and North Africa find and apply to the right German university — in English, Arabic and German.",
    intro:
      "University Assist is a free multilingual platform that matches international students — particularly from MENA — to German Bachelor's and Master's programs. We are not affiliated with uni-assist e.V., DAAD or any individual German university; we exist to make the path simpler, faster and more transparent.",
    sections: [
      {
        heading: "What we do",
        paragraphs: [
          "We maintain a live catalog of 293 German universities and thousands of programs with verified deadlines, language requirements and tuition. Our eligibility checker uses the Modified Bavarian Formula to convert your GPA, maps your curriculum to German credit points and flags any gaps before you spend money on applications.",
        ],
      },
      {
        heading: "Who we serve",
        paragraphs: [
          "Students from the MENA region applying to German higher education, parents who want a transparent view of the process, school counsellors guiding cohorts, and university partners who want qualified applicants — all in one place.",
        ],
      },
      {
        heading: "How we make money",
        paragraphs: [
          "Search, eligibility checks and program details are always free for students. We are paid by university and partner institutions for verified applicants who match their published criteria — never for steering students toward worse-fit programs.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Email info@uniassist.net or message us on the social channels linked in the footer. For legal information, see our Impressum.",
        ],
      },
    ],
    related: [
      { label: "Search programs", href: "/search" },
      { label: "Eligibility checker", href: "/eligibility-checker" },
      { label: "Browse cities", href: "/cities" },
      { label: "Legal / Impressum", href: "/impressum" },
    ],
    primaryCta: { label: "Start with a free eligibility check", href: "/eligibility-checker" },
  },
];

export function getLegacyBlogPostBySlug(slug: string): LegacyBlogPost | undefined {
  return LEGACY_BLOG_POSTS.find((p) => p.slug === slug);
}