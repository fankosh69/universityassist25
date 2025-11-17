import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GamificationService } from "@/services/gamification";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import DocumentUploadModal from "@/components/documents/DocumentUploadModal";
import DocumentCard from "@/components/documents/DocumentCard";
import DocumentViewer from "@/components/documents/DocumentViewer";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { PageHeader } from "@/components/PageHeader";
import { BackToTop } from "@/components/BackToTop";

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*, document_extractions(*)')
        .eq('profile_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExtraction = async (documentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update document status
      const { error } = await supabase
        .from('documents')
        .update({ status: 'approved' })
        .eq('id', documentId);

      if (error) throw error;

      // Award XP for document approval
      const result = await GamificationService.awardXP(user.id, {
        eventType: 'OCR_APPROVED',
        description: 'Document approved'
      });

      // Check if this is the first document and award badge
      const approvedDocs = documents.filter(d => d.status === 'approved');
      if (approvedDocs.length === 0) {
        await GamificationService.awardBadge(user.id, 'document_dynamo');
      }

      if (result.newLevel) {
        toast.success(`🎉 Level Up! You're now level ${result.newLevel}`, {
          duration: 5000,
        });
      } else {
        toast.success('✨ +100 XP earned for document approval!');
      }

      loadDocuments();
      setSelectedDoc(null);
    } catch (error: any) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('historical-documents')
        .remove([doc.file_path]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const },
      processing: { label: 'Processing', icon: Clock, variant: 'default' as const },
      completed: { label: 'Completed', icon: CheckCircle, variant: 'default' as const },
      approved: { label: 'Approved', icon: CheckCircle, variant: 'default' as const },
      failed: { label: 'Failed', icon: XCircle, variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <SEOHead 
        title="My Documents | University Assist"
        description="Upload and manage your academic documents"
      />
      <Navigation />
      
      <div className="container max-w-6xl">
        <PageHeader
          title="My Documents"
          description="Upload and manage your academic documents"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Documents' }
          ]}
          backButtonLabel="Back to Dashboard"
          backButtonTo="/dashboard"
          actions={
            <Button onClick={() => setUploadModalOpen(true)} size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          }
        />

        <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {filteredDocuments.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your academic documents to get started
                </p>
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    statusBadge={getStatusBadge(doc.status)}
                    onView={() => setSelectedDoc(doc)}
                    onDelete={() => handleDelete(doc.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={loadDocuments}
        />

        {selectedDoc && (
          <DocumentViewer
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onApprove={() => handleApproveExtraction(selectedDoc.id)}
          />
        )}
      </div>
      
      <BackToTop />
    </div>
  );
}
