/**
 * Sends a message to the configured Slack webhook.
 *
 * If SLACK_WEBHOOK_URL is not set, the message is logged to the console instead.
 * Errors are caught and logged — this function never throws.
 */
export async function sendSlackMessage(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.log(`[Slack - no webhook configured] ${text}`)
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      console.error(
        `Slack webhook returned ${response.status}: ${response.statusText}`
      )
    }
  } catch (error) {
    console.error('Failed to send Slack message:', error)
  }
}
