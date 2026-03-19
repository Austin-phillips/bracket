/**
 * Sends a message to the configured Slack webhook.
 * Returns { ok, status, error } so callers can see if it worked.
 */
export async function sendSlackMessage(text: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.log(`[Slack - no webhook configured] ${text}`)
    return { ok: false, error: 'no webhook configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`Slack webhook returned ${response.status}: ${body}`)
      return { ok: false, status: response.status, error: body }
    }

    return { ok: true, status: response.status }
  } catch (error) {
    console.error('Failed to send Slack message:', error)
    return { ok: false, error: String(error) }
  }
}
