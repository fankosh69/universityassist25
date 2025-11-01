import { supabase } from "@/integrations/supabase/client";

export interface DocumentUpload {
  file: File;
  documentType: string;
  profileId: string;
}

export interface OCRResult {
  documentId: string;
  extractedText?: any;
  tableData?: any;
  ectsMapping?: any;
  qualityScore?: number;
  needsReview: boolean;
}

export class OCRService {
  /**
   * Upload a document for OCR processing
   */
  static async uploadDocument(upload: DocumentUpload): Promise<{ documentId?: string; error?: string }> {
    try {
      const { file, documentType, profileId } = upload;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}/${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          profile_id: profileId,
          document_type: documentType,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;

      // Trigger OCR processing (edge function)
      const { error: ocrError } = await supabase.functions.invoke('process-document-ocr', {
        body: { documentId: document.id }
      });

      if (ocrError) {
        console.error('OCR processing error:', ocrError);
      }

      return { documentId: document.id };
    } catch (error: any) {
      console.error('Document upload error:', error);
      return { error: error.message };
    }
  }

  /**
   * Get OCR result for a document
   */
  static async getOCRResult(documentId: string): Promise<OCRResult | null> {
    try {
      const { data, error } = await supabase
        .from('ocr_extractions')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !data) return null;

      return {
        documentId,
        extractedText: data.extracted_text,
        tableData: data.table_data,
        ectsMapping: data.ects_mapping,
        qualityScore: data.quality_score,
        needsReview: data.needs_review
      };
    } catch (error) {
      console.error('Error getting OCR result:', error);
      return null;
    }
  }

  /**
   * Confirm OCR extraction
   */
  static async confirmExtraction(documentId: string, confirmedData: any): Promise<boolean> {
    try {
      // Update extraction with confirmed data
      const { error } = await supabase
        .from('ocr_extractions')
        .update({
          ects_mapping: confirmedData,
          needs_review: false,
          reviewed_at: new Date().toISOString()
        })
        .eq('document_id', documentId);

      if (error) throw error;

      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

      return true;
    } catch (error) {
      console.error('Error confirming extraction:', error);
      return false;
    }
  }

  /**
   * Request human review for OCR
   */
  static async requestReview(documentId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ocr_extractions')
        .update({
          needs_review: true,
          extracted_text: {
            ...((await this.getOCRResult(documentId))?.extractedText || {}),
            review_reason: reason
          }
        })
        .eq('document_id', documentId);

      if (error) throw error;

      await supabase
        .from('documents')
        .update({ status: 'reviewing' })
        .eq('id', documentId);

      return true;
    } catch (error) {
      console.error('Error requesting review:', error);
      return false;
    }
  }

  /**
   * Get user's documents
   */
  static async getUserDocuments(profileId: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          ocr_extractions(*)
        `)
        .eq('profile_id', profileId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      return [];
    }
  }
}
