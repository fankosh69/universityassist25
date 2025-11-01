import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface DocumentViewerProps {
  document: any;
  onClose: () => void;
  onApprove: () => void;
}

export default function DocumentViewer({
  document,
  onClose,
  onApprove,
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);

  const extraction = document.document_extractions?.[0];
  const canApprove = document.status === 'completed' && extraction;

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('historical-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document.file_name}</span>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="extraction" disabled={!extraction}>
              Extracted Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[500px] border rounded-lg">
              <div className="p-4 bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  Document preview will be available soon
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  For now, please download the document to view it
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="extraction" className="mt-4">
            {extraction ? (
              <ScrollArea className="h-[500px] border rounded-lg p-4">
                <div className="space-y-4">
                  {/* Confidence Score */}
                  {extraction.ocr_confidence_score && (
                    <div>
                      <h3 className="font-semibold mb-2">Confidence Score</h3>
                      <Badge variant={extraction.ocr_confidence_score >= 80 ? 'default' : 'secondary'}>
                        {Math.round(extraction.ocr_confidence_score)}%
                      </Badge>
                    </div>
                  )}

                  {/* Raw Text */}
                  {extraction.raw_text && (
                    <div>
                      <h3 className="font-semibold mb-2">Extracted Text</h3>
                      <div className="bg-muted/50 rounded p-3 text-sm whitespace-pre-wrap">
                        {extraction.raw_text}
                      </div>
                    </div>
                  )}

                  {/* Structured Data */}
                  {extraction.structured_data && Object.keys(extraction.structured_data).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Structured Data</h3>
                      <div className="bg-muted/50 rounded p-3">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(extraction.structured_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Extracted GPA */}
                  {extraction.extracted_gpa && (
                    <div>
                      <h3 className="font-semibold mb-2">GPA Information</h3>
                      <p className="text-sm">Extracted GPA: {extraction.extracted_gpa}</p>
                    </div>
                  )}

                  {/* Extracted Courses */}
                  {extraction.extracted_courses && Array.isArray(extraction.extracted_courses) && extraction.extracted_courses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Courses</h3>
                      <div className="space-y-2">
                        {extraction.extracted_courses.map((course: any, index: number) => (
                          <div key={index} className="text-sm bg-muted/50 rounded p-2">
                            {typeof course === 'string' ? course : JSON.stringify(course)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Language Scores */}
                  {extraction.extracted_language_scores && Array.isArray(extraction.extracted_language_scores) && extraction.extracted_language_scores.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Language Scores</h3>
                      <div className="space-y-2">
                        {extraction.extracted_language_scores.map((score: any, index: number) => (
                          <div key={index} className="text-sm bg-muted/50 rounded p-2">
                            {typeof score === 'string' ? score : JSON.stringify(score)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                No extraction data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-4">
          {canApprove && (
            <Button onClick={onApprove} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve Extraction
            </Button>
          )}
          {document.status === 'failed' && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="w-3 h-3" />
              Processing Failed
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
