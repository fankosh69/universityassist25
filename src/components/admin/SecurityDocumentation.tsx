import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Eye, Lock, Users, FileText, Clock } from 'lucide-react';

export const SecurityDocumentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Profile Data Security</h1>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Enhanced Security Implementation</AlertTitle>
        <AlertDescription>
          Multiple layers of security have been implemented to protect sensitive student personal information,
          including emails, phone numbers, full names, dates of birth, and academic records.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Control Layers
            </CardTitle>
            <CardDescription>
              Multi-tiered security approach to data protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">Row-Level Security (RLS)</Badge>
              <p className="text-sm text-muted-foreground">
                Database-level access control ensuring users can only access their own data
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Secure Functions</Badge>
              <p className="text-sm text-muted-foreground">
                All data access goes through security-hardened database functions
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Application-Level Validation</Badge>
              <p className="text-sm text-muted-foreground">
                Additional validation and sanitization in the application layer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Masking & Privacy
            </CardTitle>
            <CardDescription>
              Automatic data protection based on access level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">Owner Access</Badge>
              <p className="text-sm text-muted-foreground">
                Full access to their own profile data
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Admin Access</Badge>
              <p className="text-sm text-muted-foreground">
                Controlled access with partial data masking
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Public Access</Badge>
              <p className="text-sm text-muted-foreground">
                Minimal anonymized data only (display names)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
            <CardDescription>
              Prevents abuse and brute force attacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Profile Access</span>
              <Badge variant="destructive">10 per minute</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Data Export</span>
              <Badge variant="destructive">1 per hour</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Profile Updates</span>
              <Badge variant="destructive">3 per minute</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit & Compliance
            </CardTitle>
            <CardDescription>
              Comprehensive logging and GDPR compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">Audit Logging</Badge>
              <p className="text-sm text-muted-foreground">
                All profile access attempts are logged with timestamps and user details
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">GDPR Compliance</Badge>
              <p className="text-sm text-muted-foreground">
                Users can export their own data with rate-limited secure function
              </p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Data Validation</Badge>
              <p className="text-sm text-muted-foreground">
                Input sanitization prevents XSS and data corruption
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Security Functions Available
          </CardTitle>
          <CardDescription>
            Secure API functions for profile data access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Data Access Functions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>get_safe_profile_data()</code> - Full secure access</li>
                <li>• <code>get_profile_summary()</code> - Masked summary data</li>
                <li>• <code>get_masked_profile_data()</code> - Public display data</li>
                <li>• <code>check_profile_access_rights()</code> - Access validation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Security Functions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>ultra_secure_profile_update()</code> - Secure updates</li>
                <li>• <code>export_my_profile_data()</code> - GDPR export</li>
                <li>• <code>check_profile_access_rate_limit()</code> - Rate limiting</li>
                <li>• <code>enhanced_validate_profile_access()</code> - Enhanced validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Recommendations</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>1. Never access the profiles table directly - always use the secure API functions</p>
          <p>2. Monitor audit logs regularly for suspicious activity</p>
          <p>3. Use masked data functions for public displays</p>
          <p>4. Implement additional client-side validation where appropriate</p>
          <p>5. Regular security audits and penetration testing recommended</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};