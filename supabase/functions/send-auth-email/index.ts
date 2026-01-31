import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx';
import { PasswordResetEmail } from './_templates/password-reset.tsx';
import { MagicLinkEmail } from './_templates/magic-link.tsx';
import { EmailChangeEmail } from './_templates/email-change.tsx';

// Check secrets at startup and log their presence (not values)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');

console.log('=== send-auth-email startup check ===');
console.log('SEND_EMAIL_HOOK_SECRET exists:', !!hookSecret);
console.log('RESEND_API_KEY exists:', !!resendApiKey);
console.log('SUPABASE_URL exists:', !!supabaseUrl);

const logoUrl = 'https://zfiexgjcuojodmnsinsz.supabase.co/storage/v1/object/public/email-assets/logo-white-transparent.png?v=1';

interface AuthHookPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

Deno.serve(async (req) => {
  console.log('=== send-auth-email request received ===');
  console.log('Method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Rejected: Method not allowed');
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Early exit if secrets are missing - provides clear error message
  if (!hookSecret) {
    console.error('CRITICAL: SEND_EMAIL_HOOK_SECRET is not configured in Edge Function secrets');
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500, 
          message: 'Missing SEND_EMAIL_HOOK_SECRET in Edge Function secrets. Please configure it in Supabase Dashboard → Project Settings → Edge Functions → Secrets.' 
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!resendApiKey) {
    console.error('CRITICAL: RESEND_API_KEY is not configured in Edge Function secrets');
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500, 
          message: 'Missing RESEND_API_KEY in Edge Function secrets. Please configure it in Supabase Dashboard → Project Settings → Edge Functions → Secrets.' 
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!supabaseUrl) {
    console.error('CRITICAL: SUPABASE_URL is not configured');
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500, 
          message: 'Missing SUPABASE_URL environment variable.' 
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Resend client
  const resend = new Resend(resendApiKey);

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  console.log('Received headers:', Object.keys(headers).join(', '));
  
  let parsedPayload: AuthHookPayload;
  
  // Step 1: Webhook verification
  try {
    console.log('Attempting webhook verification...');
    const wh = new Webhook(hookSecret);
    parsedPayload = wh.verify(payload, headers) as AuthHookPayload;
    console.log('✓ Webhook verification successful');
  } catch (error) {
    console.error('✗ Webhook verification failed:', error.message);
    console.error('This usually means:');
    console.error('  1. The SEND_EMAIL_HOOK_SECRET does not match the Auth Hook secret');
    console.error('  2. The secret format is incorrect (should start with v1,whsec_)');
    console.error('  3. The webhook signature headers are missing or malformed');
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 401, 
          message: 'Webhook verification failed. Ensure SEND_EMAIL_HOOK_SECRET matches the Auth Hook secret exactly.' 
        } 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    user,
    email_data: { token, token_hash, redirect_to, email_action_type },
  } = parsedPayload;

  const userName = user.user_metadata?.full_name || '';
  const userEmail = user.email;

  console.log('Processing email request:');
  console.log('  - Action type:', email_action_type);
  console.log('  - Recipient:', userEmail);
  console.log('  - User name:', userName || '(not provided)');

  // Build verification URL
  const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

  let html: string;
  let subject: string;

  try {
    // Step 2: Render email template
    console.log('Rendering email template for action:', email_action_type);
    
    switch (email_action_type) {
      case 'signup':
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            userName,
            verificationUrl,
            token,
            logoUrl,
          })
        );
        subject = 'Confirm your University Assist account';
        break;

      case 'recovery':
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            userName,
            resetUrl: verificationUrl,
            token,
            logoUrl,
          })
        );
        subject = 'Reset your password - University Assist';
        break;

      case 'magiclink':
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            userName,
            magicLinkUrl: verificationUrl,
            token,
            logoUrl,
          })
        );
        subject = 'Sign in to University Assist';
        break;

      case 'email_change':
        html = await renderAsync(
          React.createElement(EmailChangeEmail, {
            userName,
            newEmail: userEmail,
            confirmUrl: verificationUrl,
            token,
            logoUrl,
          })
        );
        subject = 'Confirm your new email address - University Assist';
        break;

      default:
        console.error('Unknown email action type:', email_action_type);
        return new Response(
          JSON.stringify({ error: { http_code: 400, message: `Unknown email action type: ${email_action_type}` } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.log('✓ Email template rendered successfully');

    // Step 3: Send via Resend
    console.log('Sending email via Resend...');
    console.log('  - From: University Assist <info@uniassist.net>');
    console.log('  - To:', userEmail);
    console.log('  - Subject:', subject);

    const { data, error: sendError } = await resend.emails.send({
      from: 'University Assist <info@uniassist.net>',
      to: [userEmail],
      subject,
      html,
    });

    if (sendError) {
      console.error('✗ Resend API error:', JSON.stringify(sendError));
      console.error('Common causes:');
      console.error('  1. Domain uniassist.net is not verified in Resend');
      console.error('  2. Invalid API key');
      console.error('  3. Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: sendError.message } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✓ Email sent successfully via Resend');
    console.log('  - Resend message ID:', data?.id);
    
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('✗ Error processing auth email:', error.message);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: error.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
