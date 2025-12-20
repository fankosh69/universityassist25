import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  content: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  contentType?: 'program' | 'university' | 'general';
  preserveFormatting?: boolean;
}

interface BatchTranslationRequest {
  batch: Array<{ content: string; field?: string }>;
  sourceLanguage?: string;
  targetLanguage?: string;
  contentType?: 'program' | 'university' | 'general';
}

interface TranslationResponse {
  translatedContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  preservedTerms: string[];
}

interface BatchTranslationResponse {
  translations: Array<{
    field?: string;
    translatedContent: string;
    sourceLanguage: string;
    targetLanguage: string;
  }>;
  confidence: number;
  preservedTerms: string[];
}

function getTranslationPrompt(sourceLanguage: string, targetLanguage: string, contentType: string): string {
  const contextInstructions = {
    program: `You are translating university program/course information. Pay special attention to:
- Academic terminology (prerequisites, credit hours, semesters)
- Degree types and abbreviations
- Course requirements and admission criteria`,
    university: `You are translating university institutional content. Pay special attention to:
- Department and faculty names
- Administrative terminology
- Campus and facility descriptions`,
    general: `You are translating general educational content.`
  };

  return `You are a professional academic translator specializing in German university content.
Translate the following content from ${sourceLanguage} to ${targetLanguage}.

${contextInstructions[contentType as keyof typeof contextInstructions] || contextInstructions.general}

CRITICAL RULES:
1. PRESERVE exactly as-is (do not translate):
   - German university names (e.g., "Technische Universität München", "Universität Heidelberg")
   - German degree abbreviations (B.Sc., M.Sc., B.A., M.A., Diplom, Staatsexamen)
   - German city names (keep "München" not "Munich", "Köln" not "Cologne")
   - Course codes and abbreviations (e.g., "WS 2024/25", "SoSe")
   - ECTS credits, GPA scales, NC (Numerus Clausus)
   - Specific dates and semester formats
   - Email addresses and URLs

2. TRANSLATE accurately:
   - Program descriptions and overviews
   - Requirements and prerequisites text
   - Admission information and procedures
   - General descriptive content
   - Career prospects and outcomes

3. MAINTAIN:
   - All markdown formatting (headings, lists, bold, links)
   - Paragraph structure and spacing
   - Technical terminology accuracy
   - Professional academic tone

4. LANGUAGE DETECTION:
   - If content is already in the target language, return it unchanged
   - If content is mixed languages, translate only the non-target portions

5. OUTPUT FORMAT:
   - Return ONLY the translated text
   - No explanations, notes, or meta-commentary
   - Preserve exact formatting of the original`;
}

async function translateContent(
  content: string,
  sourceLanguage: string,
  targetLanguage: string,
  contentType: string,
  apiKey: string
): Promise<{ translatedContent: string; preservedTerms: string[] }> {
  const systemPrompt = getTranslationPrompt(sourceLanguage, targetLanguage, contentType);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Translate the following content:\n\n${content}` }
      ],
      temperature: 0.1, // Low temperature for consistent translations
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Translation API error:', response.status, errorText);
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  const translatedContent = data.choices?.[0]?.message?.content || content;

  // Extract preserved terms (German terms that appear in both original and translation)
  const preservedTerms: string[] = [];
  const germanTermPatterns = [
    /Technische Universität \w+/g,
    /Universität \w+/g,
    /Hochschule \w+/g,
    /B\.Sc\.|M\.Sc\.|B\.A\.|M\.A\.|Diplom|Staatsexamen/g,
    /WS \d{4}\/\d{2}|SoSe \d{4}/g,
    /\d+\s*ECTS/g,
  ];

  for (const pattern of germanTermPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      preservedTerms.push(...matches.filter(m => translatedContent.includes(m)));
    }
  }

  return {
    translatedContent,
    preservedTerms: [...new Set(preservedTerms)],
  };
}

function detectLanguage(content: string): string {
  // Simple language detection based on common patterns
  const germanPatterns = [
    /\b(und|oder|der|die|das|ist|sind|für|mit|von|zu|bei|auf|aus|nach|über|unter|vor|zwischen)\b/gi,
    /\b(Universität|Hochschule|Studium|Semester|Vorlesung|Prüfung|Bewerbung)\b/gi,
    /ä|ö|ü|ß/gi,
  ];

  const arabicPattern = /[\u0600-\u06FF]/g;

  const germanMatches = germanPatterns.reduce((count, pattern) => {
    const matches = content.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);

  const arabicMatches = (content.match(arabicPattern) || []).length;

  if (arabicMatches > content.length * 0.1) return 'ar';
  if (germanMatches > 5) return 'de';
  
  return 'en'; // Default to English
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    
    // Handle batch translation
    if (body.batch && Array.isArray(body.batch)) {
      const batchRequest = body as BatchTranslationRequest;
      const targetLanguage = batchRequest.targetLanguage || 'en';
      const contentType = batchRequest.contentType || 'general';
      
      console.log(`Batch translating ${batchRequest.batch.length} items to ${targetLanguage}`);

      const translations: Array<{
        field?: string;
        translatedContent: string;
        sourceLanguage: string;
        targetLanguage: string;
      }> = [];
      
      const allPreservedTerms: string[] = [];
      let totalConfidence = 0;

      for (const item of batchRequest.batch) {
        const detectedSource = batchRequest.sourceLanguage || detectLanguage(item.content);
        
        // Skip translation if already in target language
        if (detectedSource === targetLanguage) {
          translations.push({
            field: item.field,
            translatedContent: item.content,
            sourceLanguage: detectedSource,
            targetLanguage,
          });
          totalConfidence += 100;
          continue;
        }

        const result = await translateContent(
          item.content,
          detectedSource,
          targetLanguage,
          contentType,
          LOVABLE_API_KEY
        );

        translations.push({
          field: item.field,
          translatedContent: result.translatedContent,
          sourceLanguage: detectedSource,
          targetLanguage,
        });

        allPreservedTerms.push(...result.preservedTerms);
        totalConfidence += 85; // Base confidence for successful translation
      }

      const response: BatchTranslationResponse = {
        translations,
        confidence: Math.round(totalConfidence / batchRequest.batch.length),
        preservedTerms: [...new Set(allPreservedTerms)],
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle single translation
    const request = body as TranslationRequest;
    
    if (!request.content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetLanguage = request.targetLanguage || 'en';
    const sourceLanguage = request.sourceLanguage || detectLanguage(request.content);
    const contentType = request.contentType || 'general';

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}, type: ${contentType}`);

    // Skip translation if already in target language
    if (sourceLanguage === targetLanguage) {
      const response: TranslationResponse = {
        translatedContent: request.content,
        sourceLanguage,
        targetLanguage,
        confidence: 100,
        preservedTerms: [],
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await translateContent(
      request.content,
      sourceLanguage,
      targetLanguage,
      contentType,
      LOVABLE_API_KEY
    );

    const response: TranslationResponse = {
      translatedContent: result.translatedContent,
      sourceLanguage,
      targetLanguage,
      confidence: 85, // Base confidence for successful translation
      preservedTerms: result.preservedTerms,
    };

    console.log(`Translation complete. Preserved ${result.preservedTerms.length} terms.`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    // Handle rate limiting
    if (error instanceof Error && error.message.includes('429')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
