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
import heroImage from "@/assets/hero-image.jpg";
import SEOHead from "@/components/SEOHead";
import JsonLd, { organizationSchema, websiteSchema } from "@/components/JsonLd";
import Logo from "@/components/Logo";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Profile Building",
      description: "Create your comprehensive academic profile with GPA, experience, and goals"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Explore 400+ German university programs with detailed requirements and deadlines"
    },
    {
      icon: Target,
      title: "Intelligent Matching",
      description: "Get personalized program recommendations based on your profile and preferences"
    }
  ];

  const stats = [
    { number: "400+", label: "University Programs" },
    { number: "50+", label: "German Universities" },
    { number: "95%", label: "Match Accuracy" },
    { number: "24/7", label: "Support Available" }
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
      
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="German University Campus"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Way to
            <br />
            <span className="text-accent">German Universities</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            University Assist helps you find the perfect German university program that matches your academic background, 
            goals, and preferences. Start your journey to world-class education today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="min-w-48">
                Start Your Journey
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/search">
              <Button 
                variant="outline" 
                size="xl" 
                className="min-w-48 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Browse Programs
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
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our intelligent platform simplifies your German university application process
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
              Popular Programs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore some of the most sought-after programs in German universities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Computer Science",
                university: "Technical University of Munich",
                location: "Munich, Bavaria",
                degree: "Master's",
                duration: "4 Semesters",
                tuition: "Free"
              },
              {
                title: "Mechanical Engineering",
                university: "RWTH Aachen University",
                location: "Aachen, NRW",
                degree: "Master's",
                duration: "4 Semesters",
                tuition: "Free"
              },
              {
                title: "Medicine",
                university: "Heidelberg University",
                location: "Heidelberg, BW",
                degree: "Bachelor's",
                duration: "12 Semesters",
                tuition: "Free"
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
                      Learn More
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
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of students who have successfully found their ideal German university program
          </p>
          <Link to="/auth">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              Start Matching Now
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
              <Logo variant="white" />
              <p className="text-white/70">
                Your way to Germany - Your trusted partner for German university admissions
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Platform</h3>
              <ul className="space-y-2 text-white/70">
                <li>Search Programs</li>
                <li>Profile Builder</li>
                <li>Match Algorithm</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Resources</h3>
              <ul className="space-y-2 text-white/70">
                <li>Study Guide</li>
                <li>Application Tips</li>
                <li>Visa Information</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <ul className="space-y-2 text-white/70">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 University Assist. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
