import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Filter, MapPin, Clock, Globe, GraduationCap, ExternalLink } from "lucide-react";

interface Program {
  id: string;
  name: string;
  field_of_study: string;
  degree_type: string;
  duration_semesters: number;
  language_requirements: string[];
  minimum_gpa: number;
  application_deadline: string;
  semester_start: string;
  tuition_fees: number;
  prerequisites: string[];
  university: {
    name: string;
    city: string;
    website: string;
    logo_url?: string;
  };
}

import Navigation from "@/components/Navigation";

const Search = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [maxTuition, setMaxTuition] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [searchQuery, selectedField, selectedDegree, selectedCity, maxTuition, programs]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          universities!inner(
            name,
            city,
            website,
            logo_url
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching programs:', error);
        // Load sample data if no database programs exist
        setPrograms(getSamplePrograms());
      } else {
        setPrograms(data as any || getSamplePrograms());
      }
    } catch (error) {
      console.error('Error:', error);
      setPrograms(getSamplePrograms());
    } finally {
      setLoading(false);
    }
  };

  const getSamplePrograms = (): Program[] => [
    {
      id: "1",
      name: "Computer Science",
      field_of_study: "Computer Science",
      degree_type: "Master's",
      duration_semesters: 4,
      language_requirements: ["English B2", "German C1"],
      minimum_gpa: 2.5,
      application_deadline: "2024-07-15",
      semester_start: "October 2024",
      tuition_fees: 0,
      prerequisites: ["Bachelor in Computer Science or related field"],
      university: {
        name: "Technical University of Munich",
        city: "Munich",
        website: "https://www.tum.de",
        logo_url: "/placeholder.svg"
      }
    },
    {
      id: "2",
      name: "Mechanical Engineering",
      field_of_study: "Engineering",
      degree_type: "Master's",
      duration_semesters: 4,
      language_requirements: ["English B2"],
      minimum_gpa: 2.3,
      application_deadline: "2024-07-31",
      semester_start: "October 2024",
      tuition_fees: 0,
      prerequisites: ["Bachelor in Mechanical Engineering"],
      university: {
        name: "RWTH Aachen University",
        city: "Aachen",
        website: "https://www.rwth-aachen.de",
        logo_url: "/placeholder.svg"
      }
    },
    {
      id: "3",
      name: "International Business Management",
      field_of_study: "Business",
      degree_type: "Master's",
      duration_semesters: 4,
      language_requirements: ["English C1"],
      minimum_gpa: 2.0,
      application_deadline: "2024-06-30",
      semester_start: "September 2024",
      tuition_fees: 20000,
      prerequisites: ["Bachelor in Business or Economics"],
      university: {
        name: "Frankfurt School of Finance",
        city: "Frankfurt",
        website: "https://www.frankfurt-school.de",
        logo_url: "/placeholder.svg"
      }
    },
    {
      id: "4",
      name: "Medicine",
      field_of_study: "Medicine",
      degree_type: "Bachelor's",
      duration_semesters: 12,
      language_requirements: ["German C2"],
      minimum_gpa: 1.2,
      application_deadline: "2024-05-31",
      semester_start: "October 2024",
      tuition_fees: 0,
      prerequisites: ["Abitur or equivalent", "Medical aptitude test"],
      university: {
        name: "Heidelberg University",
        city: "Heidelberg",
        website: "https://www.uni-heidelberg.de",
        logo_url: "/placeholder.svg"
      }
    },
    {
      id: "5",
      name: "Data Science",
      field_of_study: "Computer Science",
      degree_type: "Master's",
      duration_semesters: 4,
      language_requirements: ["English B2"],
      minimum_gpa: 2.5,
      application_deadline: "2024-08-15",
      semester_start: "October 2024",
      tuition_fees: 0,
      prerequisites: ["Bachelor in Computer Science, Mathematics, or Statistics"],
      university: {
        name: "University of Berlin",
        city: "Berlin",
        website: "https://www.hu-berlin.de",
        logo_url: "/placeholder.svg"
      }
    }
  ];

  const filterPrograms = () => {
    let filtered = programs;

    // Search by program name or university
    if (searchQuery) {
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.field_of_study.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by field of study
    if (selectedField) {
      filtered = filtered.filter(program => program.field_of_study === selectedField);
    }

    // Filter by degree type
    if (selectedDegree) {
      filtered = filtered.filter(program => program.degree_type === selectedDegree);
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(program => program.university.city === selectedCity);
    }

    // Filter by tuition fees
    if (maxTuition) {
      filtered = filtered.filter(program => program.tuition_fees <= parseInt(maxTuition));
    }

    setFilteredPrograms(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedField("");
    setSelectedDegree("");
    setSelectedCity("");
    setMaxTuition("");
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDeadlineUpcoming = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          German University Programs
        </h1>
        <p className="text-muted-foreground">
          Discover and explore programs from leading German universities
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs, universities, or fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Field of Study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Medicine">Medicine</SelectItem>
                  <SelectItem value="Law">Law</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDegree} onValueChange={setSelectedDegree}>
                <SelectTrigger>
                  <SelectValue placeholder="Degree Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                  <SelectItem value="Master's">Master's</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Munich">Munich</SelectItem>
                  <SelectItem value="Berlin">Berlin</SelectItem>
                  <SelectItem value="Aachen">Aachen</SelectItem>
                  <SelectItem value="Frankfurt">Frankfurt</SelectItem>
                  <SelectItem value="Heidelberg">Heidelberg</SelectItem>
                </SelectContent>
              </Select>

              <Select value={maxTuition} onValueChange={setMaxTuition}>
                <SelectTrigger>
                  <SelectValue placeholder="Max Tuition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Free</SelectItem>
                  <SelectItem value="5000">Up to €5,000</SelectItem>
                  <SelectItem value="10000">Up to €10,000</SelectItem>
                  <SelectItem value="20000">Up to €20,000</SelectItem>
                  <SelectItem value="50000">Up to €50,000</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          Found {filteredPrograms.length} programs matching your criteria
        </p>
      </div>

      {/* Programs Grid */}
      <div className="grid gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="shadow-soft hover:shadow-medium transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Program Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {program.name}
                      </h3>
                      <p className="text-lg text-muted-foreground font-medium">
                        {program.university.name}
                      </p>
                      <div className="flex items-center text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {program.university.city}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {program.degree_type}
                      </Badge>
                      {isDeadlineUpcoming(program.application_deadline) && (
                        <Badge variant="destructive" className="text-xs">
                          Deadline Soon!
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{program.field_of_study}</Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {program.duration_semesters} semesters
                    </Badge>
                    <Badge variant="outline" className={program.tuition_fees === 0 ? "text-success border-success" : ""}>
                      {program.tuition_fees === 0 ? "Free" : `€${program.tuition_fees.toLocaleString()}/year`}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Key Details</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Minimum GPA: {program.minimum_gpa}</li>
                        <li>• Application Deadline: {formatDeadline(program.application_deadline)}</li>
                        <li>• Semester Start: {program.semester_start}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Language Requirements</h4>
                      <div className="flex flex-wrap gap-1">
                        {program.language_requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {program.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Prerequisites</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {program.prerequisites.map((prereq, index) => (
                          <li key={index}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="lg:w-48 flex flex-col gap-3">
                  <Button variant="hero" className="w-full">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(program.university.website, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit University
                  </Button>
                  <Button variant="ghost" className="w-full">
                    Save Program
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No programs found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or clear the filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
        )}
      </div>
    </div>
  );
};

export default Search;