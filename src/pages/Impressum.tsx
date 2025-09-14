import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Impressum - University Assist"
        description="Legal information and company details for University Assist"
      />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Impressum
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">
                  Company Information
                </h2>
                <div className="space-y-2">
                  <p><strong>Name and Legal Form:</strong> Universal Global for Study Abroad L.L.C.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">
                  Contact Information
                </h2>
                <div className="space-y-2">
                  <p><strong>Physical Address:</strong><br />
                  322G, Khalid Ibn Elwaleed St<br />
                  North 90th Street New Cairo<br />
                  Cairo Governorate, Egypt</p>
                  
                  <p><strong>Email:</strong> info@uniassist</p>
                  <p><strong>Telephone:</strong> +20106734761</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">
                  Registration Information
                </h2>
                <div className="space-y-2">
                  <p><strong>Commercial Registration Number:</strong> 235795</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">
                  Responsible Person
                </h2>
                <div className="space-y-2">
                  <p><strong>Legally Responsible for Content:</strong> Hazem Khaled Ibrahim</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">
                  Legal Disclaimer
                </h2>
                <div className="space-y-2">
                  <p>
                    Universal Global for Study Abroad L.L.C. "University Assist" is a private company in Egypt, 
                    and it's not affiliated with uni-assist e.V., DAAD, or German universities. All trademarks 
                    belong to their respective owners.
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;