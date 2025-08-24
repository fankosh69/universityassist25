// Analytics event tracking for University Assist

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  // Core events from PRD
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      },
      timestamp: new Date()
    };

    this.events.push(event);
    
    // Log to console for now (would integrate with PostHog/GA4 later)
    console.log('📊 Analytics Event:', event);
    
    // Store in localStorage for debugging
    this.persistEvent(event);
  }

  // PRD-specified events
  programViewed(programId: string, programName: string, universityName: string) {
    this.track('program_viewed', {
      program_id: programId,
      program_name: programName,
      university_name: universityName
    });
  }

  programSaved(programId: string, programName: string) {
    this.track('program_saved', {
      program_id: programId,
      program_name: programName
    });
  }

  gpaConverted(originalGPA: number, germanGPA: number, scale: string) {
    this.track('gpa_converted', {
      original_gpa: originalGPA,
      german_gpa: germanGPA,
      original_scale: scale
    });
  }

  matchViewed(programId: string, matchScore: number, status: string) {
    this.track('match_viewed', {
      program_id: programId,
      match_score: matchScore,
      match_status: status
    });
  }

  ocrUploaded(documentType: string, success: boolean, pagesCount?: number) {
    this.track('ocr_uploaded', {
      document_type: documentType,
      success,
      pages_count: pagesCount
    });
  }

  reminderOptIn(programId: string, reminderType: string) {
    this.track('reminder_opt_in', {
      program_id: programId,
      reminder_type: reminderType
    });
  }

  leadStageChanged(leadId: string, fromStage: string, toStage: string) {
    this.track('lead_stage_changed', {
      lead_id: leadId,
      from_stage: fromStage,
      to_stage: toStage
    });
  }

  ambassadorInviteSent(ambassadorEmail: string, method: string) {
    this.track('ambassador_invite_sent', {
      ambassador_email: ambassadorEmail,
      method
    });
  }

  // User journey events
  searchPerformed(query: string, filters: any, resultsCount: number) {
    this.track('search_performed', {
      query,
      filters,
      results_count: resultsCount
    });
  }

  profileCompleted(completionPercentage: number) {
    this.track('profile_completed', {
      completion_percentage: completionPercentage
    });
  }

  deadlineExported(programId: string, format: string) {
    this.track('deadline_exported', {
      program_id: programId,
      format
    });
  }

  ambassadorViewed(ambassadorId: string, ambassadorName: string) {
    this.track('ambassador_viewed', {
      ambassador_id: ambassadorId,
      ambassador_name: ambassadorName
    });
  }

  // Utility methods
  identify(userId: string, traits?: Record<string, any>) {
    this.track('user_identified', {
      user_id: userId,
      ...traits
    });
  }

  pageView(page: string, properties?: Record<string, any>) {
    this.track('page_viewed', {
      page,
      ...properties
    });
  }

  private persistEvent(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('ua_analytics') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('ua_analytics', JSON.stringify(events));
    } catch (error) {
      console.warn('Could not persist analytics event:', error);
    }
  }

  // Get stored events for debugging
  getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('ua_analytics') || '[]';
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // Clear stored events
  clearStoredEvents() {
    localStorage.removeItem('ua_analytics');
    this.events = [];
  }

  // Toggle analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Page view helper for router integration
export function trackPageView(path: string) {
  analytics.pageView(path, {
    path,
    timestamp: new Date()
  });
}
