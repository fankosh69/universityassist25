import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Trash2, Plus, ExternalLink, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import { useTestSprite } from "@/hooks/useTestSprite";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreateTestRequest } from "@/lib/testsprite";
import { formatDistanceToNow } from "date-fns";

export default function AdminTestSprite() {
  const { loading, tests, fetchTests, createTest, runTest, deleteTest } = useTestSprite();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState<CreateTestRequest>({
    name: "",
    description: "",
    url: "",
  });

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.url) {
      return;
    }

    try {
      await createTest(newTest);
      setNewTest({ name: "", description: "", url: "" });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  const handleRunTest = async (testId: string) => {
    try {
      await runTest(testId);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId);
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading && tests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">TestSprite Integration</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI-powered end-to-end tests for your application
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>
                Create a new AI-powered test for your application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  placeholder="e.g., Login Flow Test"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="test-url">URL to Test</Label>
                <Input
                  id="test-url"
                  placeholder="https://your-app.com"
                  value={newTest.url}
                  onChange={(e) => setNewTest({ ...newTest, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="test-description">Description (optional)</Label>
                <Textarea
                  id="test-description"
                  placeholder="Describe what this test should do..."
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTest} disabled={!newTest.name || !newTest.url}>
                  Create Test
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <Card key={test.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {test.description && (
                    <CardDescription>{test.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(test.status)}
                  <Badge variant={getStatusVariant(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="truncate">{test.url}</span>
                </div>
                
                {test.lastRun && (
                  <div className="text-sm text-muted-foreground">
                    <div>Last run: {formatDistanceToNow(new Date(test.lastRun))} ago</div>
                    {test.duration && (
                      <div>Duration: {test.duration}ms</div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunTest(test.id)}
                    disabled={loading || test.status === 'running'}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Test
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Test</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{test.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTest(test.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tests.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            No tests created yet. Create your first AI-powered test to get started.
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Test
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
    </div>
  );
}