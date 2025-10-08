import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id } = await req.json();

    if (!document_id) {
      throw new Error('document_id is required');
    }

    // Get document details
    const { data: document, error: docError } = await supabaseAdmin
      .from('student_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabaseAdmin
      .from('student_documents')
      .update({ ocr_status: 'processing' })
      .eq('id', document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('historical-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document');
    }

    // For now, we'll use a placeholder OCR response
    // In production, integrate with Tesseract.js or AWS Textract
    const ocrText = `[OCR PLACEHOLDER - In production, this would contain extracted text from ${document.file_name}]
    
    This is a placeholder for OCR extracted text. 
    Real implementation would use Tesseract.js or AWS Textract to extract text from documents.
    
    Example extracted fields:
    - Student Name: [Extracted]
    - GPA: [Extracted]
    - Courses: [Extracted]
    - Graduation Date: [Extracted]
    `;

    // Save extraction results
    const { error: extractionError } = await supabaseAdmin
      .from('document_extractions')
      .insert({
        document_id,
        raw_text: ocrText,
        extraction_method: 'tesseract_placeholder',
        ocr_confidence_score: 0.85,
        extracted_at: new Date().toISOString()
      });

    if (extractionError) {
      throw extractionError;
    }

    // Update document status
    await supabaseAdmin
      .from('student_documents')
      .update({ 
        ocr_status: 'completed',
        ocr_completed_at: new Date().toISOString()
      })
      .eq('id', document_id);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        ocr_text: ocrText,
        message: 'OCR processing completed (placeholder mode)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-document-ocr:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
