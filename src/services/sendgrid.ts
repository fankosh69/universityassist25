// SendGrid email service wrapper

interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class SendGridService {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.defaultFrom = 'noreply@universityassist.com';
    
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured');
    }
  }

  async sendTransactional(emailData: EmailData): Promise<boolean> {
    if (!this.apiKey) {
      console.log('SendGrid email (stubbed):', emailData);
      return true;
    }

    try {
      // This would be the actual SendGrid API call
      console.log('Sending email via SendGrid:', emailData);
      
      // Example implementation:
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: Array.isArray(emailData.to) 
              ? emailData.to.map(email => ({ email }))
              : [{ email: emailData.to }],
            subject: emailData.subject
          }],
          from: { email: emailData.from || this.defaultFrom },
          content: [
            { type: 'text/html', value: emailData.html },
            ...(emailData.text ? [{ type: 'text/plain', value: emailData.text }] : [])
          ]
        })
      });

      return response.ok;
      */
      
      return true;
    } catch (error) {
      console.error('SendGrid email failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendTransactional({
      to: userEmail,
      from: this.defaultFrom,
      subject: 'Welcome to University Assist!',
      html: `
        <h1>Welcome to University Assist, ${userName}!</h1>
        <p>We're excited to help you on your journey to study in Germany.</p>
        <p>Get started by completing your academic profile to receive personalized program recommendations.</p>
        <a href="https://universityassist.com/profile">Complete Your Profile</a>
      `,
      text: `Welcome to University Assist, ${userName}! Complete your profile at https://universityassist.com/profile`
    });
  }

  async sendAmbassadorInvite(
    email: string, 
    name: string, 
    consentToken: string,
    reviewUrls: { facebook?: string; google?: string }
  ): Promise<boolean> {
    const consentUrl = `https://universityassist.com/ambassadors/consent/${consentToken}`;
    
    return this.sendTransactional({
      to: email,
      from: this.defaultFrom,
      subject: 'Become a University Assist Ambassador',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Hello ${name}!</h1>
          
          <p>We noticed you've successfully made it to Germany for your studies - congratulations! 🎉</p>
          
          <p>Would you like to help future students by sharing your experience as a University Assist Ambassador?</p>
          
          <p><strong>As an ambassador, you can:</strong></p>
          <ul>
            <li>Share your story and inspire others</li>
            <li>Connect with prospective students</li>
            <li>Help build our community</li>
          </ul>
          
          <p>If you're interested, please review and provide your consent:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${consentUrl}" 
               style="background: #2E57F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Give Consent & Become Ambassador
            </a>
          </div>
          
          <p><strong>Help us grow by leaving a review:</strong></p>
          <div style="margin: 20px 0;">
            ${reviewUrls.google ? `<a href="${reviewUrls.google}" style="margin-right: 15px;">Review on Google</a>` : ''}
            ${reviewUrls.facebook ? `<a href="${reviewUrls.facebook}">Review on Facebook</a>` : ''}
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            University Assist is not affiliated with uni-assist e.V., DAAD, or German universities. 
            All trademarks belong to their respective owners.
          </p>
        </div>
      `
    });
  }
}