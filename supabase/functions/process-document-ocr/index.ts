import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPDF(fileData: Blob): Promise<{ text: string; confidence: number }> {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDocument.numPages;
    
    console.log(`[OCR] Processing ${numPages} pages`);
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      console.log(`[OCR] Page ${pageNum} has ${textContent.items.length} text items`);
      
      // Extract text with better formatting
      const pageTexts: string[] = [];
      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          pageTexts.push(item.str.trim());
        }
      });
      
      const pageText = pageTexts.join(' ');
      console.log(`[OCR] Page ${pageNum} extracted text length: ${pageText.length}`);
      
      if (pageText.trim()) {
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      } else {
        fullText += `\n--- Page ${pageNum} ---\n[No text extracted from this page]\n`;
      }
    }
    
    const actualTextLength = fullText.replace(/--- Page \d+ ---/g, '').replace(/\[No text extracted from this page\]/g, '').trim().length;
    console.log(`[OCR] Total extracted text length: ${actualTextLength} characters`);
    
    // Calculate confidence based on actual text density
    const confidence = actualTextLength > 100 ? 0.95 : actualTextLength > 50 ? 0.7 : actualTextLength > 0 ? 0.4 : 0.0;
    
    return { text: fullText.trim(), confidence };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return { 
      text: `[PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`, 
      confidence: 0.0 
    };
  }
}

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

    console.log(`[OCR] Starting processing for document: ${document_id}`);

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

    console.log(`[OCR] Downloading file: ${document.file_path}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('historical-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`);
    }

    console.log(`[OCR] File downloaded, size: ${fileData.size} bytes, type: ${document.mime_type}`);

    // Extract text based on file type
    let extractedText = '';
    let confidence = 0.0;
    let extractionMethod = 'unknown';

    if (document.mime_type === 'application/pdf') {
      const result = await extractTextFromPDF(fileData);
      extractedText = result.text;
      confidence = result.confidence;
      extractionMethod = 'pdfjs';
      console.log(`[OCR] PDF extraction completed, text length: ${extractedText.length}, confidence: ${confidence}`);
    } else if (document.mime_type?.startsWith('image/')) {
      // For images, we'd use Tesseract.js or similar
      extractedText = '[Image OCR not yet implemented - requires Tesseract.js]';
      confidence = 0.0;
      extractionMethod = 'pending';
      console.log(`[OCR] Image file detected, OCR not yet implemented`);
    } else {
      extractedText = '[Unsupported file type for OCR]';
      confidence = 0.0;
      extractionMethod = 'unsupported';
      console.log(`[OCR] Unsupported file type: ${document.mime_type}`);
    }

    // Save extraction results
    const { error: extractionError } = await supabaseAdmin
      .from('document_extractions')
      .insert({
        document_id,
        raw_text: extractedText,
        extraction_method: extractionMethod,
        ocr_confidence_score: confidence,
        extracted_at: new Date().toISOString()
      });

    if (extractionError) {
      console.error('[OCR] Failed to save extraction:', extractionError);
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

    console.log(`[OCR] Processing completed successfully for document: ${document_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        text_length: extractedText.length,
        confidence,
        extraction_method: extractionMethod,
        message: 'OCR processing completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OCR] Error in process-document-ocr:', error);
    
    // Try to update document status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { document_id } = await req.json();
      
      await supabaseAdmin
        .from('student_documents')
        .update({ ocr_status: 'failed' })
        .eq('id', document_id);
    } catch (updateError) {
      console.error('[OCR] Failed to update error status:', updateError);
    }
    
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
