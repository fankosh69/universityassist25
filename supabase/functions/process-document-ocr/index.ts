import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379';
import Tesseract from 'npm:tesseract.js@5.0.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextWithTesseract(fileData: Blob): Promise<{ text: string; confidence: number }> {
  try {
    console.log('[OCR] Starting Tesseract OCR for scanned document');
    const arrayBuffer = await fileData.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    let totalConfidence = 0;
    const numPages = pdfDocument.numPages;
    
    console.log(`[OCR] Processing ${numPages} pages with Tesseract`);
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas to render page
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error(`[OCR] Failed to get canvas context for page ${pageNum}`);
        continue;
      }
      
      await page.render({
        canvasContext: context as any,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const imageBuffer = await blob.arrayBuffer();
      
      console.log(`[OCR] Running Tesseract on page ${pageNum}...`);
      
      // Run Tesseract OCR
      const result = await Tesseract.recognize(
        new Uint8Array(imageBuffer),
        'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              console.log(`[OCR] Page ${pageNum} progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      const pageText = result.data.text.trim();
      const pageConfidence = result.data.confidence / 100;
      
      console.log(`[OCR] Page ${pageNum} extracted ${pageText.length} chars, confidence: ${pageConfidence.toFixed(2)}`);
      
      if (pageText) {
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        totalConfidence += pageConfidence;
      }
    }
    
    const avgConfidence = numPages > 0 ? totalConfidence / numPages : 0;
    console.log(`[OCR] Tesseract completed. Total text: ${fullText.length} chars, avg confidence: ${avgConfidence.toFixed(2)}`);
    
    return { 
      text: fullText.trim(), 
      confidence: avgConfidence 
    };
  } catch (error) {
    console.error('[OCR] Tesseract error:', error);
    return { 
      text: `[Tesseract OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}]`, 
      confidence: 0.0 
    };
  }
}

async function extractTextFromPDF(fileData: Blob): Promise<{ text: string; confidence: number; method: string }> {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDocument.numPages;
    
    console.log(`[OCR] Processing ${numPages} pages with PDF.js (fast path)`);
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageTexts: string[] = [];
      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          pageTexts.push(item.str.trim());
        }
      });
      
      const pageText = pageTexts.join(' ');
      
      if (pageText.trim()) {
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }
    }
    
    const actualTextLength = fullText.replace(/--- Page \d+ ---/g, '').trim().length;
    console.log(`[OCR] PDF.js extracted ${actualTextLength} characters`);
    
    // If no text found, use Tesseract
    if (actualTextLength === 0) {
      console.log('[OCR] No text found with PDF.js, falling back to Tesseract OCR');
      const tesseractResult = await extractTextWithTesseract(fileData);
      return { ...tesseractResult, method: 'tesseract' };
    }
    
    const confidence = actualTextLength > 100 ? 0.95 : actualTextLength > 50 ? 0.7 : 0.4;
    
    return { text: fullText.trim(), confidence, method: 'pdfjs' };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return { 
      text: `[PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`, 
      confidence: 0.0,
      method: 'failed'
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

    // Require authenticated caller and verify ownership of the document
    // (or admin role) before triggering privileged OCR processing.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;

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

    // Authorize: caller must own the document or be an admin
    if (document.uploaded_by !== callerId) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('profile_id', callerId)
        .eq('role', 'admin');
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
      extractionMethod = result.method;
      console.log(`[OCR] PDF extraction completed with ${result.method}, text length: ${extractedText.length}, confidence: ${confidence}`);
    } else if (document.mime_type?.startsWith('image/')) {
      console.log(`[OCR] Processing image file with Tesseract`);
      const result = await Tesseract.recognize(
        await fileData.arrayBuffer(),
        'eng'
      );
      extractedText = result.data.text;
      confidence = result.data.confidence / 100;
      extractionMethod = 'tesseract';
      console.log(`[OCR] Image OCR completed, text length: ${extractedText.length}, confidence: ${confidence}`);
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
