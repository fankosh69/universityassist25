import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ShortlistEmail } from "./_templates/shortlist-email.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { shortlistId } = await req.json();

    if (!shortlistId) {
      throw new Error("Shortlist ID is required");
    }

    console.log("Fetching shortlist data for:", shortlistId);

    // Fetch shortlist
    const { data: shortlist, error: shortlistError } = await supabaseClient
      .from("program_shortlists")
      .select("*")
      .eq("id", shortlistId)
      .single();

    if (shortlistError || !shortlist) {
      console.error("Shortlist fetch error:", shortlistError);
      throw new Error("Shortlist not found");
    }

    console.log("Shortlist found:", shortlist);

    let recipientEmail: string;
    let recipientName: string;
    const isExternalRecipient = shortlist.recipient_type === 'external';

    if (isExternalRecipient) {
      // Use external recipient data
      recipientEmail = shortlist.recipient_email;
      recipientName = shortlist.recipient_name;
      
      if (!recipientEmail || !recipientName) {
        throw new Error("External recipient data incomplete");
      }
      
      console.log("Sending to external recipient:", recipientEmail);
    } else {
      // Fetch student details from profiles (existing logic)
      const { data: student, error: studentError } = await supabaseClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", shortlist.student_profile_id)
        .single();

      if (studentError || !student) {
        console.error("Student fetch error:", studentError);
        throw new Error("Student not found");
      }
      
      recipientEmail = student.email;
      recipientName = student.full_name || "Student";
      
      console.log("Sending to registered student:", recipientEmail);
    }

    // Fetch creator details
    const { data: creator, error: creatorError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", shortlist.created_by)
      .single();

    if (creatorError || !creator) {
      console.error("Creator fetch error:", creatorError);
      throw new Error("Creator not found");
    }

    // Fetch programs in shortlist
    const { data: shortlistPrograms, error: programsError } = await supabaseClient
      .from("shortlist_programs")
      .select(`
        *,
        program:program_id(
          *,
          university:university_id(name, slug, city_id, logo_url)
        )
      `)
      .eq("shortlist_id", shortlistId)
      .order("sort_order");

    if (programsError) {
      throw new Error("Failed to fetch programs");
    }

    // Fetch cities for programs
    const cityIds = shortlistPrograms
      ?.map((sp: any) => sp.program?.university?.city_id)
      .filter(Boolean);
    
    const { data: cities } = await supabaseClient
      .from("cities")
      .select("id, name")
      .in("id", cityIds || []);

    const cityMap = new Map(cities?.map((c: any) => [c.id, c.name]) || []);

    // Enrich programs with city names
    const enrichedPrograms = shortlistPrograms?.map((sp: any) => ({
      ...sp.program,
      university: {
        ...sp.program.university,
        city_name: cityMap.get(sp.program.university.city_id) || "Germany",
      },
      staff_notes: sp.staff_notes,
    }));

    const staffName = creator.full_name || "Your Advisor";
    
    // Build email HTML with React Email template
    const appUrl = Deno.env.get('APP_URL') || 'https://universityassist.net';
    
    // Use direct production URL for logo (email clients block base64 images)
    const logoUrl = 'https://universityassist.net/lovable-uploads/logo-white-transparent.png';

    if (!recipientEmail) {
      throw new Error("Recipient email not found");
    }

    console.log("Rendering email for:", recipientEmail);

    // Render email
    const html = await renderAsync(
      React.createElement(ShortlistEmail, {
        studentName: recipientName,
        staffName,
        title: shortlist.title,
        message: shortlist.message,
        programs: enrichedPrograms,
        appUrl,
        logoUrl,
        isExternalRecipient,
      })
    );

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "University Assist <info@uniassist.net>",
      to: [recipientEmail],
      subject: "German Universities Shortlist",
      html,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Email sent successfully:", emailData);

    // Update shortlist status
    await supabaseClient
      .from("program_shortlists")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", shortlistId);

    return new Response(
      JSON.stringify({ success: true, message: "Shortlist sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-program-shortlist:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
