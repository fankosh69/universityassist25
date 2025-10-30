import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ShortlistEmailProps {
  studentName: string;
  staffName: string;
  title: string;
  message?: string;
  appUrl: string;
  logoUrl: string;
  isExternalRecipient?: boolean;
  programs: Array<{
    id: string;
    name: string;
    slug: string;
    degree_type: string;
    duration_semesters: number;
    semester_fees: number;
    winter_deadline?: string;
    summer_deadline?: string;
    university: {
      name: string;
      slug: string;
      city_name: string;
      logo_url?: string;
    };
    staff_notes?: string;
  }>;
}

export const ShortlistEmail = ({
  studentName,
  staffName,
  title,
  message,
  programs,
  appUrl,
  logoUrl,
  isExternalRecipient = false,
}: ShortlistEmailProps) => (
  <Html>
    <Head />
    <Preview>{title} - Programs recommended by {staffName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Img
            src={logoUrl}
            alt="University Assist"
            width="180"
            height="auto"
            style={logoImage}
          />
        </Section>

        {/* Greeting */}
        <Heading style={h1}>Hi {studentName}! 👋</Heading>
        
        <Text style={text}>
          <strong>{staffName}</strong> has carefully curated these programs for you:
        </Text>

        {message && (
          <Section style={messageBox}>
            <Text style={messageText}>{message}</Text>
          </Section>
        )}

        {isExternalRecipient && (
          <Section style={ctaBox}>
            <Heading style={ctaHeading}>
              🎓 Ready to Start Your Journey to Germany?
            </Heading>
            <Text style={ctaText}>
              Create a free account to save these programs, track deadlines, 
              and get personalized guidance throughout your application process.
            </Text>
            <Link
              href={`${appUrl}/auth?mode=signup`}
              style={ctaButton}
            >
              Create Free Account →
            </Link>
            <Text style={ctaSubtext}>
              Already have an account?{' '}
              <Link href={`${appUrl}/auth?mode=login`} style={inlineLink}>
                Sign in here
              </Link>
            </Text>
          </Section>
        )}

        <Hr style={hr} />

        {/* Programs */}
        {programs.map((program, index) => (
          <Section key={program.id} style={programCard}>
            {program.university.logo_url && (
              <Link href={`${appUrl}/universities/${program.university.slug}`}>
                <Img
                  src={program.university.logo_url}
                  alt={program.university.name}
                  width="120"
                  height="auto"
                  style={universityLogo}
                />
              </Link>
            )}
            
            <Heading style={programTitle}>{program.name}</Heading>
            
            <Text style={universityText}>
              📍{' '}
              <Link href={`${appUrl}/universities/${program.university.slug}`} style={inlineLink}>
                {program.university.name}
              </Link>
              ,{' '}
              <Link href={`${appUrl}/cities/${program.university.city_name.toLowerCase().replace(/\s+/g, '-')}`} style={inlineLink}>
                {program.university.city_name}
              </Link>
            </Text>

            <Section style={detailsGrid}>
              <Text style={detailItem}>
                🎓 <strong>{program.degree_type}</strong>
              </Text>
              <Text style={detailItem}>
                ⏱️ <strong>{program.duration_semesters} semesters</strong>
              </Text>
              <Text style={detailItem}>
                💶 <strong>€{program.semester_fees}/semester</strong>
              </Text>
            </Section>

            {(program.winter_deadline || program.summer_deadline) && (
              <Text style={deadlineText}>
                📅 Application Deadline:{' '}
                {program.winter_deadline || program.summer_deadline}
              </Text>
            )}

            {program.staff_notes && (
              <Section style={notesBox}>
                <Text style={notesLabel}>💡 Why this program?</Text>
                <Text style={notesText}>{program.staff_notes}</Text>
              </Section>
            )}

            <Link
              href={`${appUrl}/universities/${program.university.slug}/programs/${program.slug}`}
              style={button}
            >
              View Program Details →
            </Link>

            {index < programs.length - 1 && <Hr style={programDivider} />}
          </Section>
        ))}

        <Hr style={hr} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            {isExternalRecipient 
              ? 'Have questions? Create an account or visit our website for more information.'
              : 'Have questions? Reply to this email or contact your advisor.'
            }
          </Text>

          <Text style={disclaimer}>
            University Assist is not affiliated with uni-assist e.V., DAAD, or
            German universities. All trademarks belong to their respective owners.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ShortlistEmail;

// Styles
const main = {
  backgroundColor: '#f5f7fa',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#2E57F6',
  padding: '20px',
  borderRadius: '8px 8px 0 0',
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: '600',
  margin: '30px 0 16px',
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const messageBox = {
  backgroundColor: '#e6f2ff',
  borderLeft: '4px solid #2E57F6',
  padding: '16px',
  margin: '20px 0',
  borderRadius: '4px',
};

const messageText = {
  color: '#2d3748',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '30px 0',
};

const programCard = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #e2e8f0',
};

const programTitle = {
  color: '#1a202c',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const universityText = {
  color: '#2d3748',
  fontSize: '15px',
  margin: '8px 0',
};

const detailsGrid = {
  margin: '16px 0',
};

const detailItem = {
  color: '#4a5568',
  fontSize: '14px',
  margin: '8px 0',
};

const deadlineText = {
  color: '#e53e3e',
  fontSize: '14px',
  fontWeight: '600',
  margin: '12px 0',
};

const notesBox = {
  backgroundColor: '#f7fafc',
  padding: '12px',
  borderRadius: '6px',
  margin: '16px 0',
};

const notesLabel = {
  color: '#2d3748',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const notesText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const button = {
  backgroundColor: '#2E57F6',
  color: '#ffffff',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
  fontWeight: '600',
  marginTop: '16px',
};

const programDivider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const footer = {
  marginTop: '40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const link = {
  color: '#2E57F6',
  textDecoration: 'underline',
};

const disclaimer = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '20px 0 0',
  fontStyle: 'italic' as const,
};

const logoImage = {
  margin: '0 auto',
  display: 'block',
};

const universityLogo = {
  marginBottom: '16px',
  maxHeight: '60px',
  objectFit: 'contain' as const,
};

const inlineLink = {
  color: '#2E57F6',
  textDecoration: 'none',
  fontWeight: '500',
};

const ctaBox = {
  backgroundColor: '#f0f7ff',
  border: '2px solid #2E57F6',
  padding: '24px',
  margin: '30px 0',
  borderRadius: '12px',
  textAlign: 'center' as const,
};

const ctaHeading = {
  color: '#1a202c',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 12px',
};

const ctaText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 20px',
};

const ctaButton = {
  backgroundColor: '#2E57F6',
  color: '#ffffff',
  padding: '16px 32px',
  textDecoration: 'none',
  borderRadius: '8px',
  display: 'inline-block',
  fontWeight: '700',
  fontSize: '16px',
  margin: '0 0 16px',
};

const ctaSubtext = {
  color: '#718096',
  fontSize: '14px',
  margin: '0',
};
