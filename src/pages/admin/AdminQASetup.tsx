import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  FileText,
  Play
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

const AdminQASetup = () => {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'create-users',
      title: 'Create QA Users',
      description: 'Create test users in Supabase Auth and assign roles',
      status: 'pending'
    },
    {
      id: 'ingest-data',
      title: 'Ingest Universities Data',
      description: 'Load cities and universities from CSV',
      status: 'pending'
    },
    {
      id: 'verify-setup',
      title: 'Verify QA Setup',
      description: 'Check that all components are properly configured',
      status: 'pending'
    },
    {
      id: 'generate-packet',
      title: 'Generate Test Packet',
      description: 'Create TestSprite test packet with credentials',
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [testPacket, setTestPacket] = useState<string>('');

  const updateStep = (stepId: string, updates: Partial<SetupStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const runSetup = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Create QA Users
      updateStep('create-users', { status: 'running' });
      console.log('🔄 Creating QA users...');
      
      const { data: usersResult, error: usersError } = await supabase.functions.invoke('setup-qa-users');
      
      if (usersError) {
        console.error('❌ Error creating QA users:', usersError);
        updateStep('create-users', { 
          status: 'error', 
          error: usersError.message 
        });
        return;
      }
      
      console.log('✅ QA users created:', usersResult);
      updateStep('create-users', { 
        status: 'completed', 
        result: usersResult 
      });

      // Step 2: Ingest Universities Data
      updateStep('ingest-data', { status: 'running' });
      console.log('🔄 Ingesting universities data...');
      
      const { data: ingestResult, error: ingestError } = await supabase.functions.invoke('ingest-universities');
      
      if (ingestError) {
        console.error('❌ Error ingesting data:', ingestError);
        updateStep('ingest-data', { 
          status: 'error', 
          error: ingestError.message 
        });
        return;
      }
      
      console.log('✅ Data ingested:', ingestResult);
      updateStep('ingest-data', { 
        status: 'completed', 
        result: ingestResult 
      });

      // Step 3: Verify Setup
      updateStep('verify-setup', { status: 'running' });
      console.log('🔄 Verifying QA setup...');
      
      const { data: verifyResult, error: verifyError } = await supabase.rpc('check_qa_users_setup');
      
      if (verifyError) {
        console.error('❌ Error verifying setup:', verifyError);
        updateStep('verify-setup', { 
          status: 'error', 
          error: verifyError.message 
        });
        return;
      }
      
      console.log('✅ Setup verified:', verifyResult);
      updateStep('verify-setup', { 
        status: 'completed', 
        result: verifyResult 
      });

      // Step 4: Generate Test Packet
      updateStep('generate-packet', { status: 'running' });
      console.log('🔄 Generating test packet...');
      
      const { data: packetResult, error: packetError } = await supabase.functions.invoke('generate-test-packet');
      
      if (packetError) {
        console.error('❌ Error generating packet:', packetError);
        updateStep('generate-packet', { 
          status: 'error', 
          error: packetError.message 
        });
        return;
      }
      
      console.log('✅ Test packet generated:', packetResult);
      updateStep('generate-packet', { 
        status: 'completed', 
        result: packetResult 
      });
      
      if (packetResult?.packet) {
        setTestPacket(packetResult.packet);
      }

      console.log('🎉 QA setup completed successfully!');
      
    } catch (error) {
      console.error('💥 Setup failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepBadge = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
        return <Badge variant="secondary">Running...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QA Environment Setup</h1>
          <p className="text-muted-foreground">
            Set up TestSprite QA environment with test users and data
          </p>
        </div>
        <Button 
          onClick={runSetup} 
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run QA Setup
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This will create test users, ingest sample data, and configure the QA environment. 
          Make sure you have the required secrets configured in Supabase Edge Functions.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {index + 1}
                  </div>
                  {getStepIcon(step.status)}
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                {getStepBadge(step.status)}
              </div>
            </CardHeader>
            
            {(step.result || step.error) && (
              <CardContent>
                {step.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{step.error}</AlertDescription>
                  </Alert>
                )}
                
                {step.result && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Result:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(step.result, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {testPacket && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>TestSprite Test Packet</CardTitle>
            </div>
            <CardDescription>
              Forward this packet to TestSprite for QA testing setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
                {testPacket}
              </pre>
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(testPacket)}
              >
                Copy to Clipboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const blob = new Blob([testPacket], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'testsprite-qa-packet.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download as File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Student, Counselor, Admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Environment</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Staging</div>
            <p className="text-xs text-muted-foreground">
              QA Mode Active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">
              Cities & Universities
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminQASetup;