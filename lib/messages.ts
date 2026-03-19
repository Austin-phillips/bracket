// Funny Slack message templates for game results
// {winner} = winning team, {loser} = losing team
// {wp} = winning player, {lp} = losing player
// {ws} = winner score, {ls} = loser score
// {seed_w} = winner seed, {seed_l} = loser seed
// {round} = round name

const WINNER_MESSAGES = [
  "🔥 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} is feasting right now. {lp}, you okay? Need a tissue?",
  "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} just leveled up. Meanwhile {lp} is punching air somewhere.",
  "💰 *{winner} {ws} - {loser} {ls}* ({round})\nAnother point for {wp}. {lp}, that pick is looking rough my guy.",
  "🚀 *{winner} {ws} - {loser} {ls}* ({round})\n{wp}'s bracket is cooking. {lp} is down bad and it's only getting worse.",
  "😤 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} said get that weak stuff outta here. +1 for {wp}, -1 reason to live for {lp}.",
  "🗣️ *{winner} {ws} - {loser} {ls}* ({round})\nThat wasn't even close. {wp} is talking crazy tonight. {lp} has gone silent in the group chat.",
  "💀 *{winner} {ws} - {loser} {ls}* ({round})\nRIP to {lp}'s bracket. {wp} just gained another point and an even bigger ego.",
  "🎯 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} knew exactly what they were doing with that pick. {lp}... did not.",
  "📈 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} stonks going up. {lp} stonks going to zero.",
  "🧹 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} swept {loser} out of the tournament. {wp} is grinning. {lp} is deleting the app.",
]

const UPSET_MESSAGES = [
  "🚨 UPSET ALERT 🚨\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} is in shambles. A {seed_l}-seed losing to a {seed_w}-seed?? Couldn't be {wp}'s team though 😏",
  "⚠️ MADNESS ⚠️\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nThat's why they call it March Madness. {lp} just got absolutely bracket-busted. {wp} is loving this chaos.",
  "🤯 ARE YOU KIDDING ME?!\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nA {seed_w}-seed over a {seed_l}-seed! {lp} in absolute shambles. {wp} might never stop talking about this.",
  "😱 DOWN GOES THE FAVORITE!\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} really drafted a {seed_l}-seed and watched them lose to a {seed_w}. {wp} sends their regards.",
]

const BLOWOUT_MESSAGES = [
  "🏀 *{winner} {ws} - {loser} {ls}* ({round})\nThat wasn't a game, that was a crime scene. {wp} +1, {lp} +1 therapy session.",
  "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} got absolutely cooked. {lp} should've picked literally anyone else. Easy money for {wp}.",
  "🗑️ *{winner} {ws} - {loser} {ls}* ({round})\n{loser} looked like they didn't even want to be there. {lp}, what were you thinking? {wp} cashes in.",
]

const CLOSE_GAME_MESSAGES = [
  "😰 *{winner} {ws} - {loser} {ls}* ({round})\nThat was a NAIL BITER. {wp} survived by the skin of their teeth. {lp} was THIS close to celebrating.",
  "🫣 *{winner} {ws} - {loser} {ls}* ({round})\nHeart attack game. {wp} is alive but barely. {lp} is absolutely sick right now.",
  "🥶 *{winner} {ws} - {loser} {ls}* ({round})\nICE COLD finish. {wp} just aged 10 years watching that. {lp}... pour one out.",
]

const ELIMINATION_NO_PICK = [
  "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} has been eliminated. Nobody picked them so nobody cares lmao.",
  "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} is gone and literally nobody's bracket is affected. Moving on.",
  "👋 *{winner} {ws} - {loser} {ls}* ({round})\nBye bye {loser}. Nobody had them anyway. Next.",
]

const WIN_NO_PICK = [
  "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} advances but nobody here picked them. Wasted win smh.",
  "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} won but none of y'all believed in them. Their win goes into the void.",
]

const BOTH_PICKED_MESSAGES = [
  "⚔️ *{winner} {ws} - {loser} {ls}* ({round})\nHead to head! {wp} comes out on top over {lp}. Talk your trash {wp}.",
  "🤝➡️🔪 *{winner} {ws} - {loser} {ls}* ({round})\nFriendship was tested and {wp} chose violence. Sorry {lp}, it's just business.",
  "💥 *{winner} {ws} - {loser} {ls}* ({round})\n{wp}'s team just eliminated {lp}'s team. This is personal now.",
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface MessageContext {
  winnerTeam: string
  loserTeam: string
  winnerScore: string
  loserScore: string
  winnerSeed: number
  loserSeed: number
  winnerPlayers: string[]  // players who picked the winner
  loserPlayers: string[]   // players who picked the loser
  round: string
}

export function generateGameMessage(ctx: MessageContext): string {
  const scoreDiff = parseInt(ctx.winnerScore) - parseInt(ctx.loserScore)
  const isUpset = ctx.winnerSeed > ctx.loserSeed + 3  // significant upset
  const isBlowout = scoreDiff >= 20
  const isClose = scoreDiff <= 5

  const wp = ctx.winnerPlayers.length > 0 ? ctx.winnerPlayers.join(' & ') : null
  const lp = ctx.loserPlayers.length > 0 ? ctx.loserPlayers.join(' & ') : null

  let template: string

  // Pick message template based on context
  if (wp && lp) {
    // Both sides picked — this is the spiciest scenario
    if (isUpset) {
      template = pickRandom(UPSET_MESSAGES)
    } else if (isBlowout) {
      template = pickRandom(BLOWOUT_MESSAGES)
    } else if (isClose) {
      template = pickRandom(CLOSE_GAME_MESSAGES)
    } else {
      template = pickRandom([...WINNER_MESSAGES, ...BOTH_PICKED_MESSAGES])
    }
  } else if (wp && !lp) {
    // Only winner was picked
    if (isUpset) {
      template = pickRandom(UPSET_MESSAGES)
    } else {
      template = pickRandom(WINNER_MESSAGES)
    }
    // Override lp references
  } else if (!wp && lp) {
    // Only loser was picked — maximum pain
    if (isUpset) {
      template = pickRandom(UPSET_MESSAGES)
    } else {
      template = pickRandom(ELIMINATION_NO_PICK)
    }
  } else {
    // Nobody picked either team
    template = pickRandom([...ELIMINATION_NO_PICK, ...WIN_NO_PICK])
  }

  // Fill in template
  let msg = template
    .replace(/{winner}/g, ctx.winnerTeam)
    .replace(/{loser}/g, ctx.loserTeam)
    .replace(/{ws}/g, ctx.winnerScore)
    .replace(/{ls}/g, ctx.loserScore)
    .replace(/{wp}/g, wp ?? 'Nobody')
    .replace(/{lp}/g, lp ?? 'Nobody')
    .replace(/{seed_w}/g, ctx.winnerSeed.toString())
    .replace(/{seed_l}/g, ctx.loserSeed.toString())
    .replace(/{round}/g, ctx.round)

  return msg
}

export function generateStandingsMessage(
  standings: { name: string; points: number; alive: number }[]
): string {
  const sorted = [...standings].sort((a, b) => b.points - a.points)
  const leader = sorted[0]
  const last = sorted[sorted.length - 1]

  const lines = sorted.map((s, i) => {
    const pos = i + 1
    const emoji = pos === 1 ? '👑' : pos === sorted.length ? '🪦' : '  '
    return `${emoji} ${pos}. *${s.name}* — ${s.points} pts (${s.alive} teams alive)`
  })

  const taunts = [
    `\n${leader.name} is running this thing. ${last.name}... there's always next year.`,
    `\n${leader.name} on top and loving life. ${last.name} in last and questioning all their choices.`,
    `\nAll hail ${leader.name}. ${last.name}, maybe try picking with your eyes open next time.`,
    `\n${leader.name} built different. ${last.name} built wrong.`,
  ]

  return `📊 *Current Standings*\n${lines.join('\n')}${pickRandom(taunts)}`
}
