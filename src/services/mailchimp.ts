// Mailchimp marketing automation service wrapper

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  interests?: string[];
  language?: string;
}

export class MailchimpService {
  private apiKey: string;
  private serverPrefix: string;
  private audienceId: string;

  constructor() {
    this.apiKey = process.env.MAILCHIMP_API_KEY || '';
    this.serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || '';
    this.audienceId = process.env.MAILCHIMP_AUDIENCE_ID || '';
    
    if (!this.apiKey || !this.serverPrefix || !this.audienceId) {
      console.warn('Mailchimp configuration incomplete');
    }
  }

  async addToAudience(contactData: ContactData): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Mailchimp audience addition (stubbed):', contactData);
      return true;
    }

    try {
      // This would be the actual Mailchimp API call
      console.log('Adding to Mailchimp audience:', contactData);
      
      // Example implementation:
      /*
      const url = `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.audienceId}/members`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: contactData.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: contactData.firstName || '',
            LNAME: contactData.lastName || '',
            LANGUAGE: contactData.language || 'en'
          },
          tags: contactData.tags || [],
          interests: this.formatInterests(contactData.interests || [])
        })
      });

      return response.ok;
      */
      
      return true;
    } catch (error) {
      console.error('Mailchimp subscription failed:', error);
      return false;
    }
  }

  async updateContact(email: string, updates: Partial<ContactData>): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Mailchimp contact update (stubbed):', { email, updates });
      return true;
    }

    // Implementation would use Mailchimp's member update API
    console.log('Updating Mailchimp contact:', { email, updates });
    return true;
  }

  async addTags(email: string, tags: string[]): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Mailchimp tag addition (stubbed):', { email, tags });
      return true;
    }

    // Implementation would use Mailchimp's tag API
    console.log('Adding Mailchimp tags:', { email, tags });
    return true;
  }

  async triggerJourney(email: string, journeyName: string, data?: any): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Mailchimp journey trigger (stubbed):', { email, journeyName, data });
      return true;
    }

    // Implementation would trigger a Mailchimp automation
    console.log('Triggering Mailchimp journey:', { email, journeyName, data });
    return true;
  }

  // Helper method to format interests for Mailchimp
  private formatInterests(interests: string[]): Record<string, boolean> {
    const interestMap: Record<string, boolean> = {};
    
    // Map interest strings to Mailchimp interest IDs
    const interestIds = {
      'bachelor_programs': 'interest_id_bachelor',
      'master_programs': 'interest_id_master',
      'computer_science': 'interest_id_cs',
      'engineering': 'interest_id_eng',
      'business': 'interest_id_business',
      'medicine': 'interest_id_med'
    };

    interests.forEach(interest => {
      const id = interestIds[interest as keyof typeof interestIds];
      if (id) {
        interestMap[id] = true;
      }
    });

    return interestMap;
  }

  // Predefined journey triggers
  async triggerWelcomeJourney(email: string, userData: ContactData): Promise<boolean> {
    await this.addToAudience(userData);
    return this.triggerJourney(email, 'welcome_series', userData);
  }

  async triggerApplicationDeadlineReminders(email: string, programs: any[]): Promise<boolean> {
    return this.triggerJourney(email, 'deadline_reminders', { programs });
  }

  async triggerAmbassadorInvite(email: string, ambassadorData: any): Promise<boolean> {
    return this.triggerJourney(email, 'ambassador_invite', ambassadorData);
  }
}