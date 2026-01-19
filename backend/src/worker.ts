import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

interface Env {
    RESEND_API_KEY: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders,
            });
        }

        // ---------------------------------------------------------------------
        // SEND EMAIL ENDPOINT
        // ---------------------------------------------------------------------
        if (url.pathname === '/api/send' && request.method === 'POST') {
            try {
                const body = await request.json() as any;
                const { to, subject, html, fromName, fromEmail } = body;

                if (!to || !subject || !html) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const resend = new Resend(env.RESEND_API_KEY);

                // Use provided name/email or fallback to hardcoded defaults for safety
                // Note: The email must still be verified in Resend when in production, 
                // or use the testing email if verified.
                const senderEmail = fromEmail || 'test@ramg.fun';
                const senderName = fromName || 'Glass Mail';
                const fromString = `${senderName} <${senderEmail}>`;

                const data = await resend.emails.send({
                    from: fromString,
                    to: to, // In testing, this must be the user's verified email or they need to verify a domain
                    subject: subject,
                    html: html,
                });

                if (data.error) {
                    return new Response(JSON.stringify(data), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                return new Response(JSON.stringify(data), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });

            } catch (error: any) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // ---------------------------------------------------------------------
        // INCOMING WEBHOOK (Resend -> Worker -> Supabase)
        // ---------------------------------------------------------------------
        if (url.pathname === '/webhooks/incoming' && request.method === 'POST') {
            try {
                const payload = await request.json() as any;

                // Resend sends the email object in the payload
                // Docs: https://resend.com/docs/dashboard/webhooks/incoming-email
                const { from, to, subject, html, text } = payload;

                // Parse sender "Name <email@domain.com>" or just "email@domain.com"
                let senderName = '';
                let senderEmail = '';

                // Simple parser
                if (from.includes('<')) {
                    const parts = from.split('<');
                    senderName = parts[0].trim().replace(/"/g, '');
                    senderEmail = parts[1].replace('>', '').trim();
                } else {
                    senderEmail = from;
                    senderName = from.split('@')[0];
                }

                // Initialize Supabase
                const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

                // Insert into 'inbox'
                const { error } = await supabase.from('emails').insert({
                    sender_name: senderName,
                    sender_email: senderEmail,
                    recipient_email: Array.isArray(to) ? to.join(', ') : to,
                    subject: subject,
                    body: html || text || '(No content)',
                    folder: 'inbox',
                    is_read: false
                });

                if (error) {
                    console.error('Supabase Insert Error:', error);
                    return new Response('Error saving email', { status: 500 });
                }

                return new Response('OK', { status: 200 });

            } catch (err: any) {
                console.error('Webhook Error:', err);
                return new Response(JSON.stringify({ error: err.message }), { status: 500 });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
};
