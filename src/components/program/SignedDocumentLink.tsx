import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSignedDocumentUrl } from '@/lib/storage-urls';

interface SignedDocumentLinkProps {
  url: string;
  label: string;
  icon?: 'download' | 'external';
}

/**
 * Button that opens a private Supabase Storage document via a fresh signed URL.
 * Falls back to opening the original URL for external (non-Supabase) links.
 */
export function SignedDocumentLink({ url, label, icon = 'download' }: SignedDocumentLinkProps) {
  const [loading, setLoading] = useState(false);
  const Icon = icon === 'download' ? Download : ExternalLink;

  const handleClick = async () => {
    setLoading(true);
    try {
      const signed = await getSignedDocumentUrl(url);
      if (!signed) {
        toast.error('Could not open document. Please try again later.');
        return;
      }
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to open signed document:', err);
      toast.error('Could not open document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Icon className="h-3 w-3 mr-1" />
      )}
      {label}
    </Button>
  );
}
