import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

interface ContactSectionProps {
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export function ContactSection({
  contactEmail,
  contactPhone,
  website,
  socialMedia,
}: ContactSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">
        📧 Contact Information
      </h2>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Get in Touch
            </h3>
            
            {contactEmail && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <a 
                    href={`mailto:${contactEmail}`} 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
            )}

            {contactPhone && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Phone className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Phone</div>
                  <a 
                    href={`tel:${contactPhone}`} 
                    className="text-sm font-medium text-foreground hover:text-secondary transition-colors"
                  >
                    {contactPhone}
                  </a>
                </div>
              </div>
            )}

            {website && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Website</div>
                  <a 
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Media */}
          {socialMedia && Object.keys(socialMedia).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Follow Us
              </h3>
              <div className="space-y-3">
                {socialMedia.facebook && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-5 w-5 mr-3 text-[#1877F2]" />
                      Facebook
                    </a>
                  </Button>
                )}
                {socialMedia.instagram && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-5 w-5 mr-3 text-[#E4405F]" />
                      Instagram
                    </a>
                  </Button>
                )}
                {socialMedia.linkedin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-5 w-5 mr-3 text-[#0A66C2]" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {socialMedia.youtube && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                      <Youtube className="h-5 w-5 mr-3 text-[#FF0000]" />
                      YouTube
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Request Information Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Need More Information?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our admissions team is here to help you with your questions
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90">
            Request Information
          </Button>
        </div>
      </Card>
    </div>
  );
}
