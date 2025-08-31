import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  FileText,
  Users,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QAPacketData {
  success: boolean;
  packet: string;
  summary: {
    apiKey: string;
    studentAccount: string;
    counselorAccount: string;
    adminAccount: string;
    qaMode: string;
    emailSandbox: string;
    dataCounts: {
      cities: number;
      universities: number;
      programs: number;
    };
  };
}

const QAPacket = () => {
  const [packetData, setPacketData] = useState<QAPacketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQAPacket();
  }, []);

  const loadQAPacket = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-test-packet');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setPacketData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QA packet');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "QA packet copied to clipboard",
    });
  };

  const downloadPacket = () => {
    if (!packetData?.packet) return;
    
    const blob = new Blob([packetData.packet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'testsprite-qa-packet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Fetch the runbook and config files
      const [runbookRes, configRes] = await Promise.all([
        fetch('/testsprite/runbook.md'),
        fetch('/testsprite/config.json')
      ]);
      
      // Add files to ZIP
      if (runbookRes.ok) {
        const runbookContent = await runbookRes.text();
        zip.file('runbook.md', runbookContent);
      }
      
      if (configRes.ok) {
        const configContent = await configRes.text();
        zip.file('config.json', configContent);
      }
      
      // Add README with current packet info
      const readmeContent = `# TestSprite QA Packet - University Assist

## Environment Details
- **Base URL**: ${stagingUrl}
- **Mode**: QA Testing (${summary?.qaMode || 'Unknown'})
- **Email Sandbox**: ${summary?.emailSandbox || 'Unknown'} (No real emails sent)

## Test Accounts
All passwords are provided separately for security.

### Student Account
- Email: student+qa@universityassist.net
- Role: student
- Use Case: Basic user journey, eligibility checking, watchlist

### School Counselor Account  
- Email: counselor+qa@universityassist.net
- Role: school_counselor
- Use Case: Student management, cohort tracking, reporting

### Admin Account
- Email: admin+qa@universityassist.net
- Role: admin
- Use Case: Full system access, data management, configuration

## API Configuration
- TestSprite API Key: ${summary?.apiKey === 'Present' ? 'ts_1234567890…' : 'Missing'} (masked)
- Full credentials stored separately in TestSprite

## Data Counts
- Cities: ${summary?.dataCounts?.cities || 0}
- Universities: ${summary?.dataCounts?.universities || 0}
- Programs: ${summary?.dataCounts?.programs || 0}

## Documentation
- runbook.md: Complete testing procedures and validation points
- config.json: TestSprite configuration and test scenarios

## Security Notes
- No real passwords or full API keys included in this package
- All email communications are sandboxed during testing
- QA mode banner visible on all pages
- Audit logging captures all test activities

## Support
For technical issues or questions about the QA environment, 
check the runbook.md or contact the development team.

Generated: ${new Date().toISOString()}
`;

      zip.file('README.txt', readmeContent);
      
      // Generate and download the ZIP
      const content = await zip.generateAsync({type: "blob"});
      
      // Create download link
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qa-packet.zip';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "ZIP Downloaded!",
        description: "QA packet ZIP file has been generated and downloaded",
      });
      
    } catch (error) {
      console.error('Failed to generate ZIP:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate ZIP file. Please try copying the text instead.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load QA packet: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stagingUrl = "https://universityassist25.lovable.app";
  const summary = packetData?.summary;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">TestSprite QA Packet</h1>
        <p className="text-xl text-muted-foreground">
          University Assist - Staging Environment
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">Public Access</Badge>
          <Badge variant="outline">No Login Required</Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staging URL</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              <a href={stagingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {stagingUrl}
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Mode</CardTitle>
            {summary?.qaMode === 'Active' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.qaMode || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              QA banner visible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Sandbox</CardTitle>
            {summary?.emailSandbox === 'Active' ? (
              <Shield className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.emailSandbox || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              No real emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Student, Counselor, Admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            TestSprite API credentials and configuration (passwords provided separately)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">API Access</h4>
              <p className="text-sm text-muted-foreground mb-1">TestSprite API Key:</p>
              <code className="bg-muted p-2 rounded text-sm block">
                {summary?.apiKey === 'Present' ? 'ts_1234567890…' : 'Missing - Check Secrets'}
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Counts</h4>
              <div className="space-y-1 text-sm">
                <p>Cities: <span className="font-mono">{summary?.dataCounts?.cities || 0}</span></p>
                <p>Universities: <span className="font-mono">{summary?.dataCounts?.universities || 0}</span></p>
                <p>Programs: <span className="font-mono">{summary?.dataCounts?.programs || 0}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Test User Accounts
          </CardTitle>
          <CardDescription>
            Pre-configured test accounts for different user roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <h4 className="font-semibold">Student Account</h4>
                <p className="text-sm text-muted-foreground">
                  Email: student+qa@universityassist.net
                </p>
                <p className="text-sm text-muted-foreground">
                  Password: <em>Provided separately</em>
                </p>
              </div>
              <Badge variant={summary?.studentAccount === 'Configured' ? 'default' : 'destructive'}>
                {summary?.studentAccount || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <h4 className="font-semibold">School Counselor Account</h4>
                <p className="text-sm text-muted-foreground">
                  Email: counselor+qa@universityassist.net
                </p>
                <p className="text-sm text-muted-foreground">
                  Password: <em>Provided separately</em>
                </p>
              </div>
              <Badge variant={summary?.counselorAccount === 'Configured' ? 'default' : 'destructive'}>
                {summary?.counselorAccount || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <h4 className="font-semibold">Admin Account</h4>
                <p className="text-sm text-muted-foreground">
                  Email: admin+qa@universityassist.net
                </p>
                <p className="text-sm text-muted-foreground">
                  Password: <em>Provided separately</em>
                </p>
              </div>
              <Badge variant={summary?.adminAccount === 'Configured' ? 'default' : 'destructive'}>
                {summary?.adminAccount || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Documentation
          </CardTitle>
          <CardDescription>
            Detailed testing runbook and configuration files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/testsprite/runbook.md" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Testing Runbook
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/testsprite/config.json" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Test Configuration
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Options
          </CardTitle>
          <CardDescription>
            Get the complete QA packet in different formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => copyToClipboard(packetData?.packet || '')} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Text Packet
            </Button>
            <Button onClick={downloadPacket} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Text File
            </Button>
            <Button onClick={downloadZip}>
              <Download className="h-4 w-4 mr-2" />
              Download ZIP Package
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raw Packet Display */}
      {packetData?.packet && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Test Packet</CardTitle>
            <CardDescription>
              Complete TestSprite QA packet for copy/paste
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96 border">
              {packetData.packet}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAPacket;