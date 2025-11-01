import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import SEOUniversityPage from '@/components/SEOUniversityPage';
import { UniversityHero } from '@/components/university/UniversityHero';
import { UniversityTabs } from '@/components/university/UniversityTabs';
import { StatisticsCard } from '@/components/university/StatisticsCard';
import { UniversityAbout } from '@/components/university/UniversityAbout';
import { RankingsDisplay } from '@/components/university/RankingsDisplay';
import { FacilitiesGrid } from '@/components/university/FacilitiesGrid';
import { CampusCard } from '@/components/university/CampusCard';
import { PhotoGallery } from '@/components/university/PhotoGallery';
import { TestimonialsCarousel } from '@/components/university/TestimonialsCarousel';
import { StudentLifeSection } from '@/components/university/StudentLifeSection';
import { AdmissionsSection } from '@/components/university/AdmissionsSection';
import { ResearchSection } from '@/components/university/ResearchSection';
import { ContactSection } from '@/components/university/ContactSection';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';

export default function UniversityPage() {
  const { uni } = useParams();
  const [university, setUniversity] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!uni) return;
      setLoading(true);

      try {
        // Check if parameter looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uni);
        
        // Query by slug or ID depending on the parameter format
        const query = supabase
          .from('universities')
          .select('*');

        const { data: uniData, error: uniError } = isUUID 
          ? await query.eq('id', uni).maybeSingle()
          : await query.eq('slug', uni).maybeSingle();
        
        if (uniError) {
          console.error('Error fetching university:', uniError);
        }
        
        setUniversity(uniData);

        if (uniData?.id) {
          // Fetch programs
          const { data: programsData } = await supabase
            .from('programs')
            .select('*')
            .eq('university_id', uniData.id)
            .eq('published', true);
          
          setPrograms(programsData || []);

          // Fetch ambassadors
          const { data: ambassadorsData } = await supabase
            .from('ambassadors')
            .select('*')
            .eq('university_id', uniData.id)
            .eq('is_published', true);
          
          setAmbassadors(ambassadorsData || []);

          // Fetch campuses (if table exists) - wrapped in try/catch for future compatibility
          try {
            const { data: campusesData } = await supabase
              .from('university_campuses' as any)
              .select('*')
              .eq('university_id', uniData.id)
              .order('is_main_campus', { ascending: false });
            
            if (campusesData) setCampuses(campusesData);
          } catch (error) {
            // Table doesn't exist yet
            console.log('Campuses table not available yet');
          }

          // Fetch testimonials (if table exists) - wrapped in try/catch for future compatibility
          try {
            const { data: testimonialsData } = await supabase
              .from('university_testimonials' as any)
              .select('*')
              .eq('university_id', uniData.id)
              .eq('is_approved', true)
              .order('created_at', { ascending: false });
            
            if (testimonialsData) setTestimonials(testimonialsData);
          } catch (error) {
            // Table doesn't exist yet
            console.log('Testimonials table not available yet');
          }
        }
      } catch (error) {
        console.error('Error fetching university data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [uni]);

  if (loading) return <LoadingScreen />;
  if (!university) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">University not found</div></div>;

  // Parse JSONB data - handle missing fields gracefully
  const rankingsData = university?.rankings_data ? 
    (typeof university.rankings_data === 'string' ? JSON.parse(university.rankings_data) : university.rankings_data) 
    : {};
  
  const facilitiesData = university?.facilities ? 
    (typeof university.facilities === 'string' ? JSON.parse(university.facilities) : university.facilities) 
    : {};

  const socialMedia = university?.social_media ? 
    (typeof university.social_media === 'string' ? JSON.parse(university.social_media) : university.social_media) 
    : {};

  const photos = university?.photos ? 
    (typeof university.photos === 'string' ? JSON.parse(university.photos) : university.photos) 
    : [];

  // Prepare rankings array
  const rankings = [];
  if (rankingsData.qs?.rank) {
    rankings.push({
      name: 'QS World University Rankings',
      rank: rankingsData.qs.rank,
      totalRanked: 1500,
      score: rankingsData.qs.score,
      year: rankingsData.qs.year,
    });
  }
  if (rankingsData.the?.rank) {
    rankings.push({
      name: 'THE World University Rankings',
      rank: rankingsData.the.rank,
      totalRanked: 1904,
      score: rankingsData.the.score,
      year: rankingsData.the.year,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOUniversityPage 
        university={university}
      />
      <Navigation />
      
      {/* Hero Section */}
      <UniversityHero
        name={university.name}
        city={university.city}
        region={university.region}
        website={university.website}
        logoUrl={university.logo_url}
        heroImageUrl={university.hero_image_url}
        virtualTourUrl={university.virtual_tour_url}
        quickFacts={{
          founded: university.founded_year || null,
          students: university.student_count || null,
          internationalPercentage: university.international_student_percentage || null,
          qsRank: rankingsData.qs?.rank || null,
          programsCount: programs.length,
          campusesCount: campuses.length || 1,
        }}
      />

      <div className="container mx-auto px-4 md:px-6 py-12">
        <UniversityTabs
          programsCount={programs.length}
          children={{
            overview: (
              <div className="space-y-12">
                {/* Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {university.student_count && (
                    <StatisticsCard
                      icon={Users}
                      value={university.student_count}
                      label="Total Students"
                      color="primary"
                    />
                  )}
                  {university.international_student_percentage && (
                    <StatisticsCard
                      icon={GraduationCap}
                      value={`${university.international_student_percentage}%`}
                      label="International Students"
                      color="secondary"
                    />
                  )}
                  {programs.length > 0 && (
                    <StatisticsCard
                      icon={BookOpen}
                      value={programs.length}
                      label="Programs Offered"
                      color="accent"
                    />
                  )}
                  {university.student_staff_ratio && (
                    <StatisticsCard
                      icon={TrendingUp}
                      value={`1:${university.student_staff_ratio}`}
                      label="Student-Staff Ratio"
                      color="primary"
                    />
                  )}
                </div>

                {/* About Section - only show if we have data */}
                {(university.description || university.mission_statement || university.research_areas || university.accreditations || university.notable_alumni) && (
                  <UniversityAbout
                    description={university.description}
                    missionStatement={university.mission_statement}
                    researchAreas={university.research_areas}
                    accreditations={university.accreditations}
                    notableAlumni={university.notable_alumni}
                  />
                )}

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <PhotoGallery photos={photos} title="Campus Gallery" />
                )}

                {/* Facilities - only show if we have data */}
                {(Object.keys(facilitiesData).length > 0 || university.student_organizations_count) && (
                  <FacilitiesGrid
                    facilities={facilitiesData}
                    studentOrganizations={university.student_organizations_count}
                  />
                )}

                {/* Student Ambassadors */}
                {ambassadors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      👥 Student Ambassadors
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Connect with current students at {university.name} and hear their experiences
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ambassadors.slice(0, 6).map(ambassador => (
                        <Card key={ambassador.id} className="p-6 text-center hover:shadow-lg transition-shadow">
                          {ambassador.photo_url && (
                            <img 
                              src={ambassador.photo_url}
                              alt={ambassador.full_name}
                              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-lg mb-2">{ambassador.full_name}</h4>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {ambassador.testimonial}
                          </p>
                          <Link 
                            to={`/ambassadors/${ambassador.slug}`}
                            className="text-primary hover:underline text-sm"
                          >
                            Read Story →
                          </Link>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Testimonials */}
                {testimonials.length > 0 && (
                  <TestimonialsCarousel testimonials={testimonials.map(t => ({
                    id: t.id,
                    studentName: t.student_name,
                    studentPhoto: t.student_photo_url,
                    nationality: t.nationality,
                    programName: t.program_name,
                    testimonial: t.testimonial,
                    rating: t.rating,
                  }))} />
                )}
              </div>
            ),
            programs: (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map(program => (
                  <Card key={program.id} className="p-6 hover:shadow-lg transition-shadow">
                    <h3 className="font-bold text-lg mb-3">{program.name}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p>🎓 {program.degree_type}</p>
                      <p>⏱️ {program.duration_semesters} semesters</p>
                      <p>🌐 {program.language_requirements?.join(', ') || 'German'}</p>
                      {program.semester_fees > 0 && (
                        <p>💶 €{program.semester_fees}/semester</p>
                      )}
                    </div>
                    <a 
                      href={`/universities/${uni}/programs/${program.slug || program.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View Details →
                    </a>
                  </Card>
                ))}
              </div>
            ),
            admissions: (
              <AdmissionsSection
                applicationFee={university.application_fee_eur}
                contactEmail={university.contact_email}
              />
            ),
            studentLife: (
              <div className="space-y-12">
                <StudentLifeSection
                  accommodationOptions={
                    university.accommodation_info?.dorms?.available ? [
                      {
                        type: 'Student Dormitories',
                        priceRange: university.accommodation_info?.dorms?.price_range || 'Contact for pricing',
                        description: 'On-campus accommodation with easy access to facilities',
                      }
                    ] : undefined
                  }
                  clubs={university.clubs_and_societies}
                />

                {/* Ambassadors */}
                {ambassadors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      👥 Student Ambassadors
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ambassadors.map(ambassador => (
                        <Card key={ambassador.id} className="p-6 text-center hover:shadow-lg transition-shadow">
                          {ambassador.photo_url && (
                            <img 
                              src={ambassador.photo_url}
                              alt={ambassador.full_name}
                              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-lg mb-2">{ambassador.full_name}</h4>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {ambassador.testimonial}
                          </p>
                          <a 
                            href={`/ambassadors/${ambassador.slug}`}
                            className="text-primary hover:underline text-sm"
                          >
                            Read Story →
                          </a>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
            research: (
              <ResearchSection
                researchAreas={university.research_areas}
                partnerships={university.partnerships}
                researchOutput={university.research_output}
              />
            ),
            rankings: (
              <RankingsDisplay
                rankings={rankings}
                accreditations={university.accreditations}
                awards={university.awards_recognition}
              />
            ),
            campuses: (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  🗺️ Campus Locations
                </h2>
                {campuses.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {campuses.map((campus) => (
                      <CampusCard
                        key={campus.id}
                        name={campus.name}
                        address={campus.address}
                        city={campus.city}
                        isMainCampus={campus.is_main_campus}
                        description={campus.description}
                        studentCount={campus.student_count}
                        buildingCount={campus.building_count}
                        faculties={campus.faculties}
                        photoUrl={campus.photo_urls?.[0]}
                        transport={campus.public_transport}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <p>📍 {university.city}, {university.state || 'Germany'}</p>
                      <p className="text-sm mt-2">Campus information will be added soon</p>
                    </div>
                  </Card>
                )}
              </div>
            ),
            contact: (
              <ContactSection
                contactEmail={university.contact_email}
                contactPhone={university.contact_phone}
                website={university.website}
                socialMedia={socialMedia}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}