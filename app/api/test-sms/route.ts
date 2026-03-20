import { NextResponse } from 'next/server'
import { sendGroupSMS } from '@/lib/sms'
import { generateGameMessage, generateStandingsMessage } from '@/lib/messages'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Fake game result using realistic bracket data
  const { text } = generateGameMessage(
    {
      winnerTeam: 'Duke',
      loserTeam: 'Kentucky',
      winnerScore: '78',
      loserScore: '65',
      winnerSeed: 3,
      loserSeed: 6,
      winnerPlayers: ['Austin'],
      loserPlayers: ['Jake'],
      round: 'Round of 64',
    },
    new Set()
  )

  const standings = generateStandingsMessage([
    { name: 'Austin', points: 5, alive: 8 },
    { name: 'Jake', points: 3, alive: 6 },
    { name: 'Mike', points: 2, alive: 7 },
  ])

  const fullMessage = text + '\n\n' + standings

  const result = await sendGroupSMS(fullMessage)

  return NextResponse.json({
    success: result.ok,
    sent: result.sent,
    errors: result.errors,
    message: fullMessage,
  })
}
