/**
 * Sends an SMS/MMS group message via Twilio to all configured phone numbers.
 * Uses Twilio's Messaging Service for group messaging support.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID    – your Twilio Account SID
 *   TWILIO_AUTH_TOKEN      – your Twilio Auth Token
 *   TWILIO_FROM_NUMBER     – your Twilio phone number (E.164 format, e.g. +15551234567)
 *   SMS_GROUP_NUMBERS      – comma-separated recipient numbers (E.164, e.g. +15551111111,+15552222222)
 */

export async function sendGroupSMS(
  text: string
): Promise<{ ok: boolean; sent: number; errors: string[] }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  const groupNumbers = process.env.SMS_GROUP_NUMBERS

  if (!accountSid || !authToken || !fromNumber || !groupNumbers) {
    console.log(`[SMS - not configured] ${text}`)
    return { ok: false, sent: 0, errors: ['SMS not configured — missing env vars'] }
  }

  const recipients = groupNumbers
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    return { ok: false, sent: 0, errors: ['No recipient numbers configured'] }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  let sent = 0
  const errors: string[] = []

  // Send to each recipient individually — they all see the same message
  for (const to of recipients) {
    try {
      const body = new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: text,
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        console.error(`[SMS] Failed to send to ${to}: ${response.status} ${errBody}`)
        errors.push(`${to}: ${response.status}`)
      } else {
        sent++
        console.log(`[SMS] Sent to ${to}`)
      }
    } catch (error) {
      console.error(`[SMS] Error sending to ${to}:`, error)
      errors.push(`${to}: ${String(error)}`)
    }
  }

  return { ok: sent > 0, sent, errors }
}
