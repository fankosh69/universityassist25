import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx';
import { PasswordResetEmail } from './_templates/password-reset.tsx';
import { MagicLinkEmail } from './_templates/magic-link.tsx';
import { EmailChangeEmail } from './_templates/email-change.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
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
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  let parsedPayload: AuthHookPayload;
  
  try {
    const wh = new Webhook(hookSecret);
    parsedPayload = wh.verify(payload, headers) as AuthHookPayload;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: 'Webhook verification failed' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    user,
    email_data: { token, token_hash, redirect_to, email_action_type },
  } = parsedPayload;

  const userName = user.user_metadata?.full_name || '';
  const userEmail = user.email;

  // Build verification URL
  const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

  let html: string;
  let subject: string;

  try {
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

    console.log(`Sending ${email_action_type} email to ${userEmail}`);

    const { error: sendError } = await resend.emails.send({
      from: 'University Assist <info@uniassist.net>',
      to: [userEmail],
      subject,
      html,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: sendError.message } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully sent ${email_action_type} email to ${userEmail}`);
    
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing auth email:', error);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: error.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
