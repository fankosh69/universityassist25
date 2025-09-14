import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Target, 
  ChevronRight, 
  Users, 
  BookOpen,
  Award,
  MapPin 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-image.jpg";
import SEOHead from "@/components/SEOHead";
import JsonLd, { organizationSchema, websiteSchema } from "@/components/JsonLd";
import Navigation from "@/components/Navigation";

const Index = () => {
  const { t } = useTranslation('common');
  
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

  const stats = [
    { number: "400+", label: t('stats.programs') },
    { number: "50+", label: t('stats.universities') },
    { number: "95%", label: t('stats.accuracy') },
    { number: "24/7", label: t('stats.support') }
  ];

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
      
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="German University Campus"
            className="w-full h-full object-cover opacity-20"
            width="1920"
            height="749"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}
            <br />
            <span className="text-accent">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              {t('features.howItWorks')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.howItWorksSubtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-medium hover:shadow-strong transition-shadow duration-300">
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
            ))}
          </div>
        </div>
      </section>

      {/* Popular Programs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              {t('popularPrograms.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('popularPrograms.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: t('popularPrograms.computerScience'),
                university: "Technical University of Munich",
                location: "Munich, Bavaria",
                degree: t('popularPrograms.masters'),
                duration: `4 ${t('popularPrograms.semesters')}`,
                tuition: t('popularPrograms.free')
              },
              {
                title: t('popularPrograms.mechanicalEngineering'),
                university: "RWTH Aachen University",
                location: "Aachen, NRW",
                degree: t('popularPrograms.masters'),
                duration: `4 ${t('popularPrograms.semesters')}`,
                tuition: t('popularPrograms.free')
              },
              {
                title: t('popularPrograms.medicine'),
                university: "Heidelberg University",
                location: "Heidelberg, BW",
                degree: t('popularPrograms.bachelors'),
                duration: `12 ${t('popularPrograms.semesters')}`,
                tuition: t('popularPrograms.free')
              }
            ].map((program, index) => (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                  <p className="text-muted-foreground">{program.university}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {program.location}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{program.degree}</Badge>
                      <Badge variant="outline">{program.duration}</Badge>
                      <Badge variant="outline" className="text-success border-success">
                        {program.tuition}
                      </Badge>
                    </div>
                    <Button variant="ghost" className="w-full justify-between">
                      {t('popularPrograms.learnMore')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-academic text-white">
        <div className="container mx-auto px-4 text-center">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/">
                <img 
                  src="/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png" 
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
                <li><Link to="/profile" className="hover:text-white transition-colors">{t('footer.profileBuilder')}</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">{t('footer.matchAlgorithm')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">{t('footer.resources')}</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/guides" className="hover:text-white transition-colors">{t('footer.studyGuide')}</Link></li>
                <li><Link to="/tips" className="hover:text-white transition-colors">{t('footer.applicationTips')}</Link></li>
                <li><Link to="/visa" className="hover:text-white transition-colors">{t('footer.visaInformation')}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">{t('footer.support')}</h3>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/help" className="hover:text-white transition-colors">{t('footer.helpCenter')}</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">{t('footer.contactUs')}</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">{t('footer.faq')}</Link></li>
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
