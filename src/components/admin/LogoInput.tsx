import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Link as LinkIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LogoInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucketName?: string;
  folderPath?: string;
}

export function LogoInput({ 
  value, 
  onChange, 
  label = "Logo",
  bucketName = "logos",
  folderPath = "universities"
}: LogoInputProps) {
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>(value ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      onChange(publicUrl);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <RadioGroup value={inputMethod} onValueChange={(v) => setInputMethod(v as 'url' | 'upload')}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="url-method" />
          <Label htmlFor="url-method" className="font-normal cursor-pointer flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Enter URL
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" id="upload-method" />
          <Label htmlFor="upload-method" className="font-normal cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </Label>
        </div>
      </RadioGroup>

      {inputMethod === 'url' ? (
        <div className="flex gap-2">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="flex-1"
          />
          {value && (
            <Button type="button" variant="ghost" size="icon" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
        </div>
      )}

      {value && (
        <div className="border rounded p-2 bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <img 
            src={value} 
            alt="Logo preview" 
            className="w-24 h-24 object-contain rounded border bg-background"
          />
        </div>
      )}
    </div>
  );
}
