export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[STUB] SMS would be sent to ${to}: "${body}"`);
    console.log("[STUB] Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to enable real SMS");
    return { success: true, sid: `stub-${Date.now()}` };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({ To: to, From: from!, Body: body }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("[Twilio Error]", data);
    return { success: false };
  }
  return { success: true, sid: data.sid };
}
