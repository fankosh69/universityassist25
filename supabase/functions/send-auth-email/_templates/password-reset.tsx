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

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  token: string;
  logoUrl: string;
}

export const PasswordResetEmail = ({
  userName,
  resetUrl,
  token,
  logoUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your University Assist password</Preview>
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

        {/* Content */}
        <Section style={content}>
          <Heading style={h1}>Reset Your Password 🔐</Heading>
          
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          
          <Text style={text}>
            We received a request to reset the password for your University Assist account. 
            Click the button below to create a new password.
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Reset Password →
            </Link>
          </Section>

          <Text style={orText}>Or use this verification code:</Text>
          
          <Section style={codeBox}>
            <Text style={codeText}>{token}</Text>
          </Section>

          {/* Warning Box */}
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ <strong>This link expires in 1 hour.</strong> After that, you'll need to 
              request a new password reset.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Security Notice */}
          <Section style={securitySection}>
            <Text style={securityTitle}>Didn't request this?</Text>
            <Text style={securityText}>
              If you didn't request a password reset, you can safely ignore this email. 
              Your password will remain unchanged. If you're concerned about your account 
              security, please contact our support team.
            </Text>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={disclaimer}>
            University Assist is not affiliated with uni-assist e.V., DAAD, or
            German universities. All trademarks belong to their respective owners.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

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
  padding: '24px 20px',
  borderRadius: '8px 8px 0 0',
};

const logoImage = {
  margin: '0 auto',
  display: 'block',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px 24px',
  borderRadius: '0 0 8px 8px',
  border: '1px solid #e2e8f0',
  borderTop: 'none',
};

const h1 = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2E57F6',
  color: '#ffffff',
  padding: '14px 32px',
  textDecoration: 'none',
  borderRadius: '8px',
  display: 'inline-block',
  fontWeight: '600',
  fontSize: '16px',
};

const orText = {
  color: '#718096',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 12px',
};

const codeBox = {
  backgroundColor: '#f7fafc',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const codeText = {
  fontFamily: 'monospace',
  fontSize: '24px',
  fontWeight: '700',
  color: '#2E57F6',
  letterSpacing: '4px',
  margin: '0',
};

const warningBox = {
  backgroundColor: '#fffbeb',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
  margin: '0 0 24px',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const securitySection = {
  textAlign: 'center' as const,
};

const securityTitle = {
  color: '#4a5568',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const securityText = {
  color: '#a0aec0',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
};

const disclaimer = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  fontStyle: 'italic' as const,
};
