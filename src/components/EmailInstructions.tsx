import { AlertTriangle, CheckCircle, Mail, Shield, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailInstructionsProps {
  domain: string;
  organizationType: 'school' | 'company';
}

export function EmailInstructions({ domain, organizationType }: EmailInstructionsProps) {
  const isSchool = organizationType === 'school';
  
  return (
    <Alert className="border-yellow-500 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium text-yellow-800">
            {isSchool ? 'University/School Email Detected' : 'Company Email Detected'}
          </p>
          
          <p className="text-sm text-yellow-700">
            {isSchool 
              ? 'Institutional emails often block external messages. Follow these steps to ensure you receive our communications:'
              : 'Corporate emails may filter external messages. Follow these steps to ensure delivery:'
            }
          </p>

          <Card className="bg-white border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Add to Safe Senders
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p>Add these addresses to your email whitelist:</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1 ml-2">
                <li><code className="bg-yellow-100 px-1 rounded">noreply@uniassist.net</code></li>
                <li><code className="bg-yellow-100 px-1 rounded">support@uniassist.net</code></li>
                <li><code className="bg-yellow-100 px-1 rounded">@uniassist.net</code> (entire domain)</li>
              </ul>
            </CardContent>
          </Card>

          {isSchool && (
            <Card className="bg-white border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {domain.includes('.edu') ? 'IT Department Help' : 'Email Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                {domain.includes('.edu') ? (
                  <div>
                    <p>If you still don't receive emails, contact your IT department and ask them to:</p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1 ml-2">
                      <li>Whitelist <code className="bg-yellow-100 px-1 rounded">uniassist.net</code> domain</li>
                      <li>Check institutional spam filters</li>
                      <li>Allow external educational services</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p>Check these locations for our emails:</p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1 ml-2">
                      <li>Spam/Junk folder</li>
                      <li>Quarantine folder</li>
                      <li>Blocked messages</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Alternative Options
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p className="text-yellow-700">Consider using a personal email for better delivery:</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1 ml-2">
                <li>Gmail, Yahoo, Outlook personal accounts</li>
                <li>Check that account regularly for updates</li>
                <li>Forward important messages to your institutional email</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </AlertDescription>
    </Alert>
  );
}