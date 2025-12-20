import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgramDocumentUploadProps {
  label: string;
  description: string;
  value: string | null;
  onChange: (url: string | null) => void;
  programId?: string;
  documentType: 'admission_regulations' | 'program_flyer' | 'module_description';
  required?: boolean;
}

export function ProgramDocumentUpload({
  label,
  description,
  value,
  onChange,
  programId,
  documentType,
  required = false,
}: ProgramDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${programId || 'new'}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${documentType}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('program-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('program-documents')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);

      toast({
        title: 'Document uploaded',
        description: `${label} has been uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage.from('program-documents').remove([filePath]);
      
      onChange(null);
      
      toast({
        title: 'Document removed',
        description: `${label} has been removed.`,
      });
    } catch (error) {
      console.error('Remove error:', error);
      // Still clear the value even if storage delete fails
      onChange(null);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            
            {value ? (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={value} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Document
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`file-${documentType}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload PDF
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
