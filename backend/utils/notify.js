// SMS / WhatsApp / Email sending — NOT connected to a real provider.
//
// Sending an actual SMS or WhatsApp message needs a paid account with a
// provider (e.g. MSG91, Twilio, Gupshup, Interakt) and their API key in
// .env. Rather than pretend a message was delivered when it wasn't, every
// function here just logs what WOULD be sent, and returns { sent: false }
// so calling code can decide what to tell the user (e.g. the OTP route
// below returns the code directly in the API response ONLY outside
// production, so you can still test the flow before a provider is wired up).
//
// To go live: implement the marked TODOs with the real provider's SDK/API
// call, keep the same function signatures, and nothing else needs to change.

function logOutbound(channel, to, message) {
  console.log(`[notify:${channel}] (NOT actually sent — no provider configured) to=${to} :: ${message}`);
}

async function sendSms(mobile, message) {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    logOutbound('sms', mobile, message);
    return { sent: false, reason: 'SMS_PROVIDER_API_KEY not configured' };
  }
  // TODO: call your SMS provider's API here (e.g. MSG91, Twilio).
  return { sent: false, reason: 'provider integration not implemented yet' };
}

async function sendWhatsApp(mobile, message) {
  if (!process.env.WHATSAPP_PROVIDER_API_KEY) {
    logOutbound('whatsapp', mobile, message);
    return { sent: false, reason: 'WHATSAPP_PROVIDER_API_KEY not configured' };
  }
  // TODO: call your WhatsApp Business API provider here (e.g. Gupshup, Interakt).
  return { sent: false, reason: 'provider integration not implemented yet' };
}

async function sendEmail(to, subject, body) {
  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    logOutbound('email', to, `${subject} :: ${body}`);
    return { sent: false, reason: 'EMAIL_PROVIDER_API_KEY not configured' };
  }
  // TODO: call your email provider's API here (e.g. SendGrid, Amazon SES).
  return { sent: false, reason: 'provider integration not implemented yet' };
}

// Sends the same confirmation across all three channels (best-effort — each
// one independently logs/no-ops until its provider is configured) and
// reports which, if any, actually went out.
async function sendConfirmation({ mobile, email, message, subject }) {
  const results = await Promise.all([
    mobile ? sendSms(mobile, message) : Promise.resolve({ sent: false, reason: 'no mobile on file' }),
    mobile ? sendWhatsApp(mobile, message) : Promise.resolve({ sent: false, reason: 'no mobile on file' }),
    email ? sendEmail(email, subject, message) : Promise.resolve({ sent: false, reason: 'no email on file' })
  ]);
  return { sms: results[0], whatsapp: results[1], email: results[2] };
}

module.exports = { sendSms, sendWhatsApp, sendEmail, sendConfirmation };
