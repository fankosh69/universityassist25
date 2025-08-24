/**
 * Sample data for University Assist (Free Plan Compatible)
 * Limited dataset for development and testing
 */

export const SAMPLE_CITIES = [
  {
    id: '1',
    name: 'Berlin',
    country_code: 'DE',
    state: 'Berlin',
    slug: 'berlin',
    lat: 52.5200,
    lng: 13.4050,
    metadata: { population: 3669491, description: 'Capital and largest city of Germany' },
    search_doc: { keywords: ['capital', 'technology', 'startup hub', 'universities'] }
  },
  {
    id: '2',
    name: 'Munich',
    country_code: 'DE',
    state: 'Bavaria',
    slug: 'munich',
    lat: 48.1351,
    lng: 11.5820,
    metadata: { population: 1488202, description: 'Capital of Bavaria, major economic center' },
    search_doc: { keywords: ['bavaria', 'oktoberfest', 'technology', 'automotive'] }
  },
  {
    id: '3',
    name: 'Hamburg',
    country_code: 'DE',
    state: 'Hamburg',
    slug: 'hamburg',
    lat: 53.5511,
    lng: 9.9937,
    metadata: { population: 1899160, description: 'Major port city and media hub' },
    search_doc: { keywords: ['port', 'media', 'maritime', 'logistics'] }
  }
];

export const SAMPLE_UNIVERSITIES = [
  {
    id: '1',
    name: 'Technical University of Berlin',
    city: 'Berlin',
    city_id: '1',
    country_code: 'DE',
    slug: 'tu-berlin',
    lat: 52.5125,
    lng: 13.3269,
    type: 'Public',
    ranking: 150,
    website: 'https://www.tu-berlin.de',
    external_refs: { daad_id: 'tu_berlin_001' }
  },
  {
    id: '2',
    name: 'Ludwig Maximilian University of Munich',
    city: 'Munich',
    city_id: '2',
    country_code: 'DE',
    slug: 'lmu-munich',
    lat: 48.1500,
    lng: 11.5800,
    type: 'Public',
    ranking: 60,
    website: 'https://www.lmu.de',
    external_refs: { daad_id: 'lmu_munich_001' }
  },
  {
    id: '3',
    name: 'University of Hamburg',
    city: 'Hamburg',
    city_id: '3',
    country_code: 'DE',
    slug: 'uni-hamburg',
    lat: 53.5676,
    lng: 9.9856,
    type: 'Public',
    ranking: 200,
    website: 'https://www.uni-hamburg.de',
    external_refs: { daad_id: 'uni_hamburg_001' }
  }
];

export const SAMPLE_PROGRAMS = [
  {
    id: '1',
    university_id: '1',
    name: 'Computer Science',
    field_of_study: 'Computer Science',
    degree_type: 'Bachelor',
    degree_level: 'bachelor' as const,
    duration_semesters: 6,
    language_requirements: ['German B2', 'English B2'],
    language_of_instruction: ['de', 'en'],
    minimum_gpa: 2.5,
    tuition_fees: 0,
    ects_credits: 180,
    uni_assist_required: true,
    delivery_mode: 'on_campus',
    published: true,
    slug: 'computer-science-bachelor-tu-berlin',
    country_code: 'DE',
    description: 'Comprehensive computer science program covering algorithms, software engineering, and system design.',
    prerequisites: ['Mathematics', 'Physics'],
    metadata: { popularity_rank: 1, application_difficulty: 'high' }
  },
  {
    id: '2',
    university_id: '2',
    name: 'Business Administration',
    field_of_study: 'Business',
    degree_type: 'Master',
    degree_level: 'master' as const,
    duration_semesters: 4,
    language_requirements: ['German C1', 'English C1'],
    language_of_instruction: ['de', 'en'],
    minimum_gpa: 2.0,
    tuition_fees: 0,
    ects_credits: 120,
    uni_assist_required: false,
    delivery_mode: 'on_campus',
    published: true,
    slug: 'business-administration-master-lmu-munich',
    country_code: 'DE',
    description: 'Advanced business program focusing on international management and strategy.',
    prerequisites: ['Bachelor in Business or related field', 'Work experience preferred'],
    metadata: { popularity_rank: 2, application_difficulty: 'medium' }
  },
  {
    id: '3',
    university_id: '1',
    name: 'Mechanical Engineering',
    field_of_study: 'Engineering',
    degree_type: 'Bachelor',
    degree_level: 'bachelor' as const,
    duration_semesters: 7,
    language_requirements: ['German C1'],
    language_of_instruction: ['de'],
    minimum_gpa: 2.8,
    tuition_fees: 350,
    ects_credits: 210,
    uni_assist_required: true,
    delivery_mode: 'on_campus',
    published: true,
    slug: 'mechanical-engineering-bachelor-tu-berlin',
    country_code: 'DE',
    description: 'Traditional engineering program with focus on automotive and manufacturing.',
    prerequisites: ['Mathematics', 'Physics', 'Chemistry'],
    metadata: { popularity_rank: 3, application_difficulty: 'high' }
  },
  {
    id: '4',
    university_id: '3',
    name: 'International Relations',
    field_of_study: 'Political Science',
    degree_type: 'Master',
    degree_level: 'master' as const,
    duration_semesters: 4,
    language_requirements: ['German B2', 'English C1'],
    language_of_instruction: ['de', 'en'],
    minimum_gpa: 2.3,
    tuition_fees: 0,
    ects_credits: 120,
    uni_assist_required: false,
    delivery_mode: 'on_campus',
    published: true,
    slug: 'international-relations-master-uni-hamburg',
    country_code: 'DE',
    description: 'Interdisciplinary program combining politics, economics, and cultural studies.',
    prerequisites: ['Bachelor in Social Sciences or related field'],
    metadata: { popularity_rank: 4, application_difficulty: 'medium' }
  }
];

export const SAMPLE_PROGRAM_REQUIREMENTS = [
  // Computer Science Bachelor requirements
  {
    id: '1',
    program_id: '1',
    requirement_type: 'gpa',
    details: { min_gpa_de: 2.5, description: 'Minimum German GPA of 2.5' }
  },
  {
    id: '2',
    program_id: '1',
    requirement_type: 'language',
    details: { 
      language: 'german',
      min_level: 'B2',
      accepted_tests: ['TestDaF', 'DSH', 'Goethe-Zertifikat'],
      description: 'German proficiency at B2 level'
    }
  },
  {
    id: '3',
    program_id: '1',
    requirement_type: 'ects',
    details: { min_ects: 180, description: 'Minimum 180 ECTS from previous studies' }
  },
  
  // Business Administration Master requirements
  {
    id: '4',
    program_id: '2',
    requirement_type: 'gpa',
    details: { min_gpa_de: 2.0, description: 'Minimum German GPA of 2.0' }
  },
  {
    id: '5',
    program_id: '2',
    requirement_type: 'language',
    details: { 
      language: 'german',
      min_level: 'C1',
      accepted_tests: ['TestDaF', 'DSH', 'Goethe-Zertifikat'],
      description: 'German proficiency at C1 level'
    }
  }
];

export const SAMPLE_PROGRAM_DEADLINES = [
  // Winter intake deadlines
  {
    id: '1',
    program_id: '1',
    intake: 'winter' as const,
    application_deadline: '2024-07-15',
    notes: 'Early application recommended for international students'
  },
  {
    id: '2',
    program_id: '2',
    intake: 'winter' as const,
    application_deadline: '2024-06-30',
    notes: 'Portfolio submission required'
  },
  {
    id: '3',
    program_id: '3',
    intake: 'winter' as const,
    application_deadline: '2024-07-31',
    notes: 'Uni-assist application required'
  },
  {
    id: '4',
    program_id: '4',
    intake: 'winter' as const,
    application_deadline: '2024-08-15',
    notes: 'Statement of purpose required'
  },
  
  // Summer intake deadlines (some programs)
  {
    id: '5',
    program_id: '2',
    intake: 'summer' as const,
    application_deadline: '2024-01-15',
    notes: 'Limited places available'
  },
  {
    id: '6',
    program_id: '4',
    intake: 'summer' as const,
    application_deadline: '2024-02-28',
    notes: 'Rolling admissions'
  }
];

/**
 * Create SQL statements to populate sample data (for use in migrations)
 */
export function generateSampleDataSQL(): string {
  const cityInserts = SAMPLE_CITIES.map(city => 
    `INSERT INTO public.cities (id, name, country_code, state, slug, lat, lng, metadata, search_doc) VALUES ('${city.id}', '${city.name}', '${city.country_code}', '${city.state}', '${city.slug}', ${city.lat}, ${city.lng}, '${JSON.stringify(city.metadata)}', '${JSON.stringify(city.search_doc)}') ON CONFLICT (id) DO NOTHING;`
  ).join('\n');

  const universityInserts = SAMPLE_UNIVERSITIES.map(uni => 
    `INSERT INTO public.universities (id, name, city, city_id, country_code, slug, lat, lng, type, ranking, website, external_refs) VALUES ('${uni.id}', '${uni.name}', '${uni.city}', '${uni.city_id}', '${uni.country_code}', '${uni.slug}', ${uni.lat}, ${uni.lng}, '${uni.type}', ${uni.ranking}, '${uni.website}', '${JSON.stringify(uni.external_refs)}') ON CONFLICT (id) DO NOTHING;`
  ).join('\n');

  const programInserts = SAMPLE_PROGRAMS.map(prog => 
    `INSERT INTO public.programs (id, university_id, name, field_of_study, degree_type, degree_level, duration_semesters, language_requirements, language_of_instruction, minimum_gpa, tuition_fees, ects_credits, uni_assist_required, delivery_mode, published, slug, country_code, description, prerequisites, metadata) VALUES ('${prog.id}', '${prog.university_id}', '${prog.name}', '${prog.field_of_study}', '${prog.degree_type}', '${prog.degree_level}', ${prog.duration_semesters}, '${JSON.stringify(prog.language_requirements)}', '${JSON.stringify(prog.language_of_instruction)}', ${prog.minimum_gpa}, ${prog.tuition_fees}, ${prog.ects_credits}, ${prog.uni_assist_required}, '${prog.delivery_mode}', ${prog.published}, '${prog.slug}', '${prog.country_code}', '${prog.description}', '${JSON.stringify(prog.prerequisites)}', '${JSON.stringify(prog.metadata)}') ON CONFLICT (id) DO NOTHING;`
  ).join('\n');

  const requirementInserts = SAMPLE_PROGRAM_REQUIREMENTS.map(req => 
    `INSERT INTO public.program_requirements (id, program_id, requirement_type, details) VALUES ('${req.id}', '${req.program_id}', '${req.requirement_type}', '${JSON.stringify(req.details)}') ON CONFLICT (id) DO NOTHING;`
  ).join('\n');

  const deadlineInserts = SAMPLE_PROGRAM_DEADLINES.map(deadline => 
    `INSERT INTO public.program_deadlines (id, program_id, intake, application_deadline, notes) VALUES ('${deadline.id}', '${deadline.program_id}', '${deadline.intake}', '${deadline.application_deadline}', '${deadline.notes}') ON CONFLICT (id) DO NOTHING;`
  ).join('\n');

  return `-- Sample data for University Assist (Free Plan)
${cityInserts}

${universityInserts}

${programInserts}

${requirementInserts}

${deadlineInserts}
`;
}