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

interface EmailChangeEmailProps {
  userName: string;
  newEmail: string;
  confirmUrl: string;
  token: string;
  logoUrl: string;
}

export const EmailChangeEmail = ({
  userName,
  newEmail,
  confirmUrl,
  token,
  logoUrl,
}: EmailChangeEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your new email address for University Assist</Preview>
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
          <Heading style={h1}>Confirm Your New Email 📧</Heading>
          
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          
          <Text style={text}>
            You requested to change your email address to:
          </Text>

          <Section style={emailBox}>
            <Text style={emailText}>{newEmail}</Text>
          </Section>
          
          <Text style={text}>
            Please click the button below to confirm this change.
          </Text>

          <Section style={buttonContainer}>
            <Link href={confirmUrl} style={button}>
              Confirm Email Change →
            </Link>
          </Section>

          <Text style={orText}>Or use this verification code:</Text>
          
          <Section style={codeBox}>
            <Text style={codeText}>{token}</Text>
          </Section>

          {/* Security Warning */}
          <Section style={dangerBox}>
            <Text style={dangerText}>
              🚨 <strong>Didn't request this change?</strong> If you didn't request to 
              change your email address, please ignore this email and consider changing 
              your password immediately. Someone may have access to your account.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={helpText}>
            This link expires in 24 hours. After confirming, you'll use your new email 
            address to sign in.
          </Text>
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

export default EmailChangeEmail;

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

const emailBox = {
  backgroundColor: '#eef2ff',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #c7d2fe',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const emailText = {
  color: '#3730a3',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
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

const dangerBox = {
  backgroundColor: '#fef2f2',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  margin: '0 0 24px',
};

const dangerText = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const helpText = {
  color: '#a0aec0',
  fontSize: '14px',
  textAlign: 'center' as const,
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
