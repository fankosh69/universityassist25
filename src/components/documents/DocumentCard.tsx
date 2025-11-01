import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, FileText } from "lucide-react";
import { ReactNode } from "react";

interface DocumentCardProps {
  document: any;
  statusBadge: ReactNode;
  onView: () => void;
  onDelete: () => void;
}

export default function DocumentCard({
  document,
  statusBadge,
  onView,
  onDelete,
}: DocumentCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      transcript: 'Transcript',
      language_certificate: 'Language Certificate',
      diploma: 'Diploma',
      passport: 'Passport/ID',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        <FileText className="w-16 h-16 text-muted-foreground" />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2">{document.file_name}</h3>
            {statusBadge}
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{getDocumentTypeLabel(document.document_type)}</p>
            <p>{formatFileSize(document.file_size)}</p>
            <p>Uploaded {formatDate(document.uploaded_at)}</p>
            {document.document_extractions?.[0]?.ocr_confidence_score && (
              <p>
                Confidence: {Math.round(document.document_extractions[0].ocr_confidence_score)}%
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
