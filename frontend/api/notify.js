// Vercel Serverless Function: Twilio WhatsApp & SMS Dispatcher
// Dispatches alerts for scenario triggers and >=90% live telemetry breaches

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const accountSid = body.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = body.authToken || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = body.from || process.env.TWILIO_PHONE_NUMBER || '+14155238886';
    const toNumber = body.to || process.env.TWILIO_TO_NUMBER;
    const channel = body.channel || 'both'; // 'whatsapp' | 'sms' | 'both'
    const message = body.message || '🚨 ThirdEye AIOps Alert: Telemetry Threshold Breached!';

    if (!accountSid || !authToken || !toNumber) {
      return res.status(200).json({
        success: false,
        simulated: true,
        error: 'Missing Twilio credentials or recipient phone number',
        preview: message,
        channels: channel,
        recipient: toNumber || 'Not configured',
        timestamp: new Date().toISOString()
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const results = [];

    // Helper to format clean phone number
    const cleanTo = toNumber.replace(/[\s\-\(\)]/g, '');
    const cleanFrom = fromNumber.replace(/[\s\-\(\)]/g, '');

    // 1. Dispatch WhatsApp if selected
    if (channel === 'whatsapp' || channel === 'both') {
      try {
        const waTo = cleanTo.startsWith('whatsapp:') ? cleanTo : `whatsapp:${cleanTo}`;
        const waFrom = cleanFrom.startsWith('whatsapp:') ? cleanFrom : `whatsapp:${cleanFrom}`;

        const waParams = new URLSearchParams();
        waParams.append('To', waTo);
        waParams.append('From', waFrom);
        waParams.append('Body', message);

        const waRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: waParams.toString()
        });

        const waData = await waRes.json();
        results.push({
          channel: 'whatsapp',
          status: waRes.ok ? 'sent' : 'error',
          sid: waData.sid,
          error: waData.message || null
        });
      } catch (waErr) {
        results.push({ channel: 'whatsapp', status: 'error', error: waErr.message });
      }
    }

    // 2. Dispatch SMS if selected
    if (channel === 'sms' || channel === 'both') {
      try {
        const smsTo = cleanTo.replace('whatsapp:', '');
        const smsFrom = cleanFrom.replace('whatsapp:', '');

        const smsParams = new URLSearchParams();
        smsParams.append('To', smsTo);
        smsParams.append('From', smsFrom);
        smsParams.append('Body', message);

        const smsRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: smsParams.toString()
        });

        const smsData = await smsRes.json();
        results.push({
          channel: 'sms',
          status: smsRes.ok ? 'sent' : 'error',
          sid: smsData.sid,
          error: smsData.message || null
        });
      } catch (smsErr) {
        results.push({ channel: 'sms', status: 'error', error: smsErr.message });
      }
    }

    return res.status(200).json({
      success: results.some(r => r.status === 'sent'),
      dispatched: results,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};
