import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Target, 
  ChevronRight, 
  Users, 
  Award,
  MapPin,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image-optimized.jpg";
import heroImageWebP from "@/assets/hero-image-optimized.webp";
import SEOHead from "@/components/SEOHead";
import JsonLd, { organizationSchema, websiteSchema, homepageFaqSchema } from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import HeroQuickFinder from "@/components/HeroQuickFinder";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/Reveal";
import { motion, useReducedMotion } from "framer-motion";

interface FeaturedProgram {
  id: string;
  name: string;
  slug: string;
  degree_type: string | null;
  duration_semesters: number | null;
  tuition_amount: number | null;
  language_of_instruction: string[] | null;
  university: { name: string; slug: string } | null;
  city: { name: string; state: string | null } | null;
}

interface FeaturedCity {
  slug: string;
  name: string;
  program_count: number;
}

interface HomeStats {
  programs: number;
  universities: number;
  cities: number;
}

const Index = () => {
  const { t } = useTranslation('common');
  const reduce = useReducedMotion();
  const [programs, setPrograms] = useState<FeaturedProgram[]>([]);
  const [cities, setCities] = useState<FeaturedCity[]>([]);
  const [stats, setStats] = useState<HomeStats>({ programs: 0, universities: 0, cities: 0 });
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [programsRes, statsProgramsRes, statsUnisRes, statsCitiesRes, cityRowsRes] = await Promise.all([
          supabase
            .from('programs')
            .select(`
              id, name, slug, degree_type, duration_semesters, tuition_amount, language_of_instruction,
              universities:university_id ( name, slug, cities:city_id ( name, state ) )
            `)
            .eq('published', true)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(6),
          supabase.from('programs').select('id', { count: 'exact', head: true }).eq('published', true).eq('status', 'published'),
          supabase.from('universities').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('cities').select('id', { count: 'exact', head: true }),
          supabase
            .from('cities')
            .select('slug, name, universities:universities!city_id(id, programs:programs!university_id(id, published, status))')
            .limit(120),
        ]);

        if (cancelled) return;

        // Programs
        const list: FeaturedProgram[] = (programsRes.data ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          degree_type: p.degree_type,
          duration_semesters: p.duration_semesters,
          tuition_amount: p.tuition_amount,
          language_of_instruction: p.language_of_instruction,
          university: p.universities ? { name: p.universities.name, slug: p.universities.slug } : null,
          city: p.universities?.cities ? { name: p.universities.cities.name, state: p.universities.cities.state } : null,
        }));
        setPrograms(list);

        // Stats
        setStats({
          programs: statsProgramsRes.count ?? 0,
          universities: statsUnisRes.count ?? 0,
          cities: statsCitiesRes.count ?? 0,
        });

        // Featured cities — aggregate published-program counts client-side
        const aggregated: FeaturedCity[] = ((cityRowsRes.data ?? []) as any[])
          .map((c: any) => {
            const count = (c.universities ?? []).reduce((sum: number, u: any) => {
              return sum + ((u.programs ?? []).filter((p: any) => p.published && p.status === 'published').length);
            }, 0);
            return { slug: c.slug, name: c.name, program_count: count };
          })
          .filter(c => c.program_count > 0)
          .sort((a, b) => b.program_count - a.program_count)
          .slice(0, 6);
        if (!cancelled) setCities(aggregated);
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);
  
  // Debug fallback - if translations fail
  if (!t) {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center">
        <div className="text-white text-2xl">Translation Loading Issue</div>
      </div>
    );
  }
  
  const features = [
    {
      icon: Users,
      title: t('features.profileBuilding'),
      description: t('features.profileBuildingDesc')
    },
    {
      icon: Search,
      title: t('features.smartSearch'),
      description: t('features.smartSearchDesc')
    },
    {
      icon: Target,
      title: t('features.intelligentMatching'),
      description: t('features.intelligentMatchingDesc')
    }
  ];

  const formatCount = (n: number) => (n >= 50 ? `${Math.floor(n / 10) * 10}+` : `${n}`);
  const statsList = [
    { number: formatCount(stats.programs), label: t('stats.programs') },
    { number: formatCount(stats.universities), label: t('stats.universities') },
    { number: formatCount(stats.cities), label: t('cities.title', { defaultValue: 'German Cities' }) },
    { number: "24/7", label: t('stats.support') },
  ];

  const formatTuition = (amount: number | null) => {
    if (amount === null || amount === undefined) return null;
    if (amount === 0) return t('popularPrograms.free');
    return `€${amount.toLocaleString()} / sem`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="University Assist - Your Way to Germany | Find German University Programs"
        description="Your way to Germany - Discover 400+ German university programs with intelligent matching. Find bachelor's, master's, and PhD programs that match your academic profile and career goals."
        keywords="German universities, study in Germany, university programs, bachelor, master, PhD, Germany education, university admission, University Assist"
        ogTitle="University Assist - Your Way to Germany | Find German University Programs"
        ogDescription="Your way to Germany - Join thousands of students who found their ideal German university program with our intelligent matching system."
        ogImage={heroImage}
      />
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={homepageFaqSchema} />
      
      <Navigation />

      <a href="#main-content" className="skip-link">Skip to main content</a>

      <main id="main-content" role="main">
      {/* Hero Section */}
      <header className="relative bg-gradient-hero overflow-hidden" aria-label="University Assist hero">
        <div className="absolute inset-0">
          <picture>
            <source srcSet={heroImageWebP} type="image/webp" />
            <img 
              src={heroImage}
              alt="Students walking on a German university campus with historic architecture in the background"
              className="w-full h-full object-cover opacity-20"
              width="1335"
              height="751"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            {t('hero.title')}
            <br />
            <span className="text-accent">{t('hero.titleHighlight')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroQuickFinder />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Link to="/auth?tab=signup">
              <Button variant="hero" size="xl" className="min-w-48">
                {t('hero.startJourney')}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/search">
              <Button 
                variant="outline" 
                size="xl" 
                className="min-w-48 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {t('hero.browsePrograms')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <aside className="py-16 bg-white" aria-label="Platform statistics">
        <div className="container mx-auto px-4">
          <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" stagger={0.1}>
            {statsList.map((stat, index) => (
              <StaggerItem key={index} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </aside>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              {t('features.howItWorks')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.howItWorksSubtitle')}
            </p>
          </Reveal>

          <StaggerGroup className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="h-full shadow-medium hover:shadow-strong hover:-translate-y-1 transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-gradient-primary rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Popular Programs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              {t('popularPrograms.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('popularPrograms.subtitle')}
            </p>
          </Reveal>

          {loadingPrograms ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="shadow-soft animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                    <div className="h-8 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : programs.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('popularPrograms.noPrograms')}</p>
          ) : (
            <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.06}>
              {programs.map((program) => {
                const tuitionLabel = formatTuition(program.tuition_amount);
                const href = program.university
                  ? `/universities/${program.university.slug}/programs/${program.slug}`
                  : '/search';
                return (
                  <StaggerItem key={program.id}>
                  <Link to={href} className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl block h-full">
                    <Card className="h-full shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {program.name}
                        </CardTitle>
                        {program.university && (
                          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {program.university.name}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {program.city && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              {program.city.name}{program.city.state ? `, ${program.city.state}` : ''}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {program.degree_type && <Badge variant="secondary">{program.degree_type}</Badge>}
                            {program.duration_semesters && (
                              <Badge variant="outline">
                                {program.duration_semesters} {t('popularPrograms.semesters')}
                              </Badge>
                            )}
                            {tuitionLabel && (
                              <Badge variant="outline" className={program.tuition_amount === 0 ? 'text-success border-success' : ''}>
                                {tuitionLabel}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium text-primary pt-1">
                            <span>{t('popularPrograms.learnMore')}</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}

          <div className="text-center mt-10">
            <Link to="/search">
              <Button variant="outline" size="lg">
                {t('popularPrograms.viewAll')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Cities Section */}
      {cities.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <Reveal className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                {t('popularPrograms.exploreCitiesTitle')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('popularPrograms.exploreCitiesSubtitle')}
              </p>
            </Reveal>
            <StaggerGroup className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" stagger={0.05}>
              {cities.map((city) => (
                <StaggerItem key={city.slug}>
                <Link
                  to={`/cities/${city.slug}`}
                  className="group block h-full"
                >
                  <Card className="h-full shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-5 text-center space-y-2">
                      <div className="mx-auto bg-gradient-primary rounded-full p-2.5 w-12 h-12 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {city.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {city.program_count} {city.program_count === 1 ? 'program' : 'programs'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
            <div className="text-center mt-10">
              <Link to="/cities">
                <Button variant="outline" size="lg">
                  {t('popularPrograms.viewAllCities')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-academic text-white">
        <Reveal className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t('hero.readyToMatch')}
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            {t('hero.joinThousands')}
          </p>
          <Link to="/auth?tab=signup">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              {t('hero.startMatching')}
              <Award className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </Reveal>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/">
                <img 
                  src="/lovable-uploads/logo-white.png" 
                  alt="University Assist" 
                  className="h-12 w-auto object-contain"
                  width="200"
                  height="48"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              <p className="text-white/70">
                {t('footer.tagline')}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">{t('footer.platform')}</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/search" className="hover:text-white transition-colors">{t('footer.searchPrograms')}</Link></li>
                <li><Link to="/universities" className="hover:text-white transition-colors">Universities</Link></li>
                <li><Link to="/cities" className="hover:text-white transition-colors">Cities</Link></li>
                <li><Link to="/regions" className="hover:text-white transition-colors">Regions</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">{t('footer.resources')}</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/ambassadors" className="hover:text-white transition-colors">Student Ambassadors</Link></li>
                <li><Link to="/eligibility-checker" className="hover:text-white transition-colors">Eligibility Checker</Link></li>
                <li><Link to="/auth?tab=signup" className="hover:text-white transition-colors">{t('footer.profileBuilder')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">{t('footer.support')}</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="mailto:info@uniassist.net" className="hover:text-white transition-colors">{t('footer.contactUs')}</a></li>
                <li><a href="https://wa.me/" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>{t('footer.copyright')}</p>
            <p className="mt-2 text-sm">{t('footer.disclaimer')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
