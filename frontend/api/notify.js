// ThirdEye AIOps — Vercel Serverless: Twilio WhatsApp & SMS Dispatcher
// Reads ALL credentials from Vercel environment variables ONLY.
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TO_NUMBER are required.
// TWILIO_PHONE_NUMBER  = WhatsApp sandbox FROM number (default: +14155238886)
// TWILIO_SMS_NUMBER    = Optional separate Twilio number for plain SMS
//                        (if not set, only WhatsApp is sent)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Parse body safely
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Credentials come ONLY from Vercel env vars
    const accountSid   = process.env.TWILIO_ACCOUNT_SID;
    const authToken    = process.env.TWILIO_AUTH_TOKEN;
    const waFromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886';
    const smsFromNumber = process.env.TWILIO_SMS_NUMBER || null;   // separate SMS number (optional)
    const toNumber     = process.env.TWILIO_TO_NUMBER;

    // Sanitize message — ensure it's always a plain string, strip garbled bytes
    let message = body.message;
    if (Array.isArray(message)) message = message.join('\n');
    if (typeof message !== 'string' || !message.trim()) {
      message = '[ThirdEye AIOps] Critical alert dispatched. Check your console immediately.';
    }
    // Strip any non-printable or high-byte characters that break SMS gateways
    message = message.replace(/[^\x20-\x7E\n\r\t]/g, '');

    // If no credentials, return a clean simulated preview (not an error)
    if (!accountSid || !authToken || !toNumber) {
      console.log('[ThirdEye /api/notify] SIMULATED (no Twilio creds in env). Message preview:', message.slice(0, 120));
      return res.status(200).json({
        success: false,
        simulated: true,
        reason: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_TO_NUMBER not set in Vercel env vars',
        preview: message.slice(0, 300),
        recipient: 'Not configured',
        timestamp: new Date().toISOString(),
      });
    }

    const authHeader  = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const twilioUrl   = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const cleanTo     = toNumber.replace(/[\s\-\(\)]/g, '');
    const results     = [];

    // ── 1. WhatsApp (always attempted when sandbox number is configured) ──────
    try {
      const waTo   = cleanTo.startsWith('whatsapp:') ? cleanTo : `whatsapp:${cleanTo}`;
      const waFrom = waFromNumber.startsWith('whatsapp:') ? waFromNumber : `whatsapp:${waFromNumber}`;

      const waParams = new URLSearchParams();
      waParams.append('To', waTo);
      waParams.append('From', waFrom);
      waParams.append('Body', message);

      const waRes  = await fetch(twilioUrl, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: waParams.toString(),
      });
      const waData = await waRes.json();

      if (waRes.ok && waData.sid) {
        results.push({ channel: 'whatsapp', status: 'sent', sid: waData.sid });
        console.log('[ThirdEye /api/notify] WhatsApp sent:', waData.sid);
      } else {
        results.push({ channel: 'whatsapp', status: 'error', error: waData.message || waData.code || 'Unknown Twilio error' });
        console.error('[ThirdEye /api/notify] WhatsApp error:', waData.message, 'Code:', waData.code);
      }
    } catch (waErr) {
      results.push({ channel: 'whatsapp', status: 'error', error: waErr.message });
      console.error('[ThirdEye /api/notify] WhatsApp exception:', waErr.message);
    }

    // ── 2. SMS (only if a separate SMS from-number is configured) ────────────
    // The WhatsApp sandbox number (+14155238886) CANNOT send plain SMS.
    // Set TWILIO_SMS_NUMBER to your verified Twilio SMS number to enable this.
    if (smsFromNumber) {
      try {
        const smsTo   = cleanTo.replace('whatsapp:', '');
        const smsFrom = smsFromNumber.replace('whatsapp:', '');

        const smsParams = new URLSearchParams();
        smsParams.append('To', smsTo);
        smsParams.append('From', smsFrom);
        smsParams.append('Body', message);

        const smsRes  = await fetch(twilioUrl, {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: smsParams.toString(),
        });
        const smsData = await smsRes.json();

        if (smsRes.ok && smsData.sid) {
          results.push({ channel: 'sms', status: 'sent', sid: smsData.sid });
          console.log('[ThirdEye /api/notify] SMS sent:', smsData.sid);
        } else {
          results.push({ channel: 'sms', status: 'error', error: smsData.message || smsData.code });
          console.error('[ThirdEye /api/notify] SMS error:', smsData.message, 'Code:', smsData.code);
        }
      } catch (smsErr) {
        results.push({ channel: 'sms', status: 'error', error: smsErr.message });
      }
    } else {
      // Log that SMS was skipped — not an error
      results.push({ channel: 'sms', status: 'skipped', reason: 'TWILIO_SMS_NUMBER not set; WhatsApp-only mode' });
    }

    const anySuccess = results.some((r) => r.status === 'sent');
    return res.status(200).json({
      success: anySuccess,
      dispatched: results,
      recipient: cleanTo,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[ThirdEye /api/notify] Fatal error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};
