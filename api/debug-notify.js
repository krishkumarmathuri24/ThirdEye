// ThirdEye AIOps — Debug endpoint: tests Twilio credentials and shows exact API response
// Hit: GET https://third-eye-eta.vercel.app/api/debug-notify

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const accountSid    = process.env.TWILIO_ACCOUNT_SID;
  const authToken     = process.env.TWILIO_AUTH_TOKEN;
  const waFromNumber  = process.env.TWILIO_PHONE_NUMBER || '+14155238886';
  const toNumber      = process.env.TWILIO_TO_NUMBER;

  // 1. Report env var presence (NEVER expose values)
  const envCheck = {
    TWILIO_ACCOUNT_SID:  accountSid  ? `SET (${accountSid.slice(0,6)}...)` : 'MISSING',
    TWILIO_AUTH_TOKEN:   authToken   ? `SET (${authToken.slice(0,4)}...)` : 'MISSING',
    TWILIO_PHONE_NUMBER: waFromNumber,
    TWILIO_TO_NUMBER:    toNumber    ? `SET (${toNumber.slice(0,5)}...)` : 'MISSING',
    TWILIO_SMS_NUMBER:   process.env.TWILIO_SMS_NUMBER || 'NOT SET (WhatsApp-only mode)',
  };

  if (!accountSid || !authToken || !toNumber) {
    return res.status(200).json({
      status: 'MISSING_CREDENTIALS',
      envCheck,
      message: 'One or more required Vercel env vars are missing. Set them in Vercel Dashboard → Settings → Environment Variables, then redeploy.',
    });
  }

  // 2. Try a real Twilio API call with a short test message
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const twilioUrl  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const cleanTo   = toNumber.replace(/[\s\-\(\)]/g, '');
  const waTo      = cleanTo.startsWith('whatsapp:') ? cleanTo : `whatsapp:${cleanTo}`;
  const waFrom    = waFromNumber.startsWith('whatsapp:') ? waFromNumber : `whatsapp:${waFromNumber}`;

  const params = new URLSearchParams();
  params.append('To',   waTo);
  params.append('From', waFrom);
  params.append('Body', '[ThirdEye Debug] WhatsApp test ping from /api/debug-notify. If you see this, notifications are working!');

  let twilioRaw = null;
  let twilioStatus = null;

  try {
    const r = await fetch(twilioUrl, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    twilioStatus = r.status;
    twilioRaw    = await r.json();
  } catch (e) {
    twilioRaw = { fetch_error: e.message };
  }

  return res.status(200).json({
    status: twilioRaw?.sid ? 'SUCCESS' : 'TWILIO_ERROR',
    envCheck,
    twilio_http_status: twilioStatus,
    twilio_response: twilioRaw,
    // Key fields to look at:
    whatsapp_to:   waTo,
    whatsapp_from: waFrom,
    fix_hint: twilioRaw?.code === 63007
      ? 'SANDBOX JOIN: You must text "join <keyword>" to +14155238886 on WhatsApp first!'
      : twilioRaw?.code === 21608
      ? 'FROM number is not WhatsApp-capable. Check TWILIO_PHONE_NUMBER.'
      : twilioRaw?.code === 21211
      ? 'Invalid TO number format. Check TWILIO_TO_NUMBER (must be E.164: +919876543210).'
      : twilioRaw?.code === 20003
      ? 'Auth failed. TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is wrong.'
      : null,
  });
};
