import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Loader2, Send, Database } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function AdminHistoricalData() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Admin AI Assistant. I can help you upload and manage historical student application data. Upload student documents (transcripts, certificates) and I\'ll extract the data using OCR and help you build a knowledge base for better program matching.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newFiles.push(files[i].name);
    }
    setUploadingFiles(newFiles);

    const uploadedDocs: Array<{ id: string; name: string }> = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('historical-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { data: docData, error: dbError } = await supabase
          .from('student_documents')
          .insert({
            file_name: file.name,
            file_path: filePath,
            file_type: fileExt || 'unknown',
            mime_type: file.type,
            file_size_kb: Math.round(file.size / 1024),
            uploaded_by: user.id,
            ocr_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;

        uploadedDocs.push({ id: docData.id, name: file.name });

        // Automatically trigger OCR processing
        try {
          await supabase.functions.invoke('process-document-ocr', {
            body: { document_id: docData.id }
          });
        } catch (ocrError) {
          console.error('OCR trigger failed:', ocrError);
        }
      }

      toast({
        title: 'Files uploaded',
        description: `${files.length} document(s) uploaded - OCR processing started`,
      });

      // Add system message with document IDs for AI to process
      const uploadMessage: Message = {
        role: 'system',
        content: `DOCUMENTS_UPLOADED: ${JSON.stringify(uploadedDocs)}. Automatically trigger OCR and analyze these documents.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, uploadMessage]);

      // Automatically send message to AI to analyze documents
      setTimeout(() => {
        const docList = uploadedDocs.map(d => d.name).join(', ');
        handleSendMessage(`I uploaded ${uploadedDocs.length} document(s): ${docList}. Please analyze them.`);
      }, 1000);

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || input.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call admin-ai-assistant edge function
      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: { 
          message: message,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historical Application Data</h1>
            <p className="text-muted-foreground mt-2">
              Upload past student documents to teach the AI about program acceptance patterns
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents Processed</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Upload className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patterns Identified</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col h-[600px]">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Admin AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents and chat with the AI to build your historical database
            </p>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              {uploadingFiles.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm">Uploading {uploadingFiles.length} file(s)...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploadingFiles.length > 0}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Ask me to help you add historical data, or describe the uploaded documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG • Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
