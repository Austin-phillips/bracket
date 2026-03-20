// Funny message templates for game results
// {winner} = winning team, {loser} = losing team
// {wp} = winning player(s), {lp} = losing player(s)
// {ws} = winner score, {ls} = loser score
// {seed_w} = winner seed, {seed_l} = loser seed
// {round} = round name
//
// Every message has a unique ID so we never repeat during the tournament.

interface MessageTemplate {
  id: string
  text: string
}

// ---------------------------------------------------------------------------
// WINNER + LOSER BOTH PICKED (the spiciest ones)
// ---------------------------------------------------------------------------
const WINNER_MESSAGES: MessageTemplate[] = [
  { id: 'w1', text: "🔥 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} is feasting right now. {lp}, you okay? Need a tissue?" },
  { id: 'w2', text: "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} just leveled up. Meanwhile {lp} is punching air somewhere." },
  { id: 'w3', text: "💰 *{winner} {ws} - {loser} {ls}* ({round})\nAnother point for {wp}. {lp}, that pick is looking rough my guy." },
  { id: 'w4', text: "🚀 *{winner} {ws} - {loser} {ls}* ({round})\n{wp}'s bracket is cooking. {lp} is down bad and it's only getting worse." },
  { id: 'w5', text: "😤 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} said get that weak shit outta here. +1 for {wp}, -1 reason to live for {lp}." },
  { id: 'w6', text: "🗣️ *{winner} {ws} - {loser} {ls}* ({round})\nThat wasn't even close. {wp} is talking shit tonight. {lp} has gone silent in the group chat like a little bitch." },
  { id: 'w7', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\nRIP to {lp}'s bracket. {wp} just gained another point and an even bigger ego." },
  { id: 'w8', text: "🎯 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} knew exactly what they were doing with that pick. {lp}... did not." },
  { id: 'w9', text: "📈 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} stonks going up. {lp} stonks going to zero." },
  { id: 'w10', text: "🧹 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} swept {loser} out of the fucking tournament. {wp} is grinning. {lp} is rage-deleting the app." },
  { id: 'w11', text: "🍽️ *{winner} {ws} - {loser} {ls}* ({round})\n{wp} eating GOOD tonight. {lp} is eating their words." },
  { id: 'w12', text: "🫡 *{winner} {ws} - {loser} {ls}* ({round})\nSalute to {wp}'s scouting abilities. {lp}, maybe watch a game before you draft next year." },
  { id: 'w13', text: "🪦 *{winner} {ws} - {loser} {ls}* ({round})\nHere lies {lp}'s hopes and dreams. Cause of death: {winner}. {wp} dances on the grave." },
  { id: 'w14', text: "🎪 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} really thought {loser} was gonna do shit this year. Clown-ass behavior. {wp} takes the point." },
  { id: 'w15', text: "📱 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} just threw their phone. {wp} is screenshot-ing the leaderboard." },
  { id: 'w16', text: "🧊 *{winner} {ws} - {loser} {ls}* ({round})\nCold-blooded. {wp} collects another W while {lp} collects another L. Tale as old as time." },
  { id: 'w17', text: "🎭 *{winner} {ws} - {loser} {ls}* ({round})\nComedy for {wp}. Tragedy for {lp}. Shakespeare couldn't write this." },
  { id: 'w18', text: "🏋️ *{winner} {ws} - {loser} {ls}* ({round})\n{wp} carrying their bracket like it's nothing. {lp} couldn't carry their ass to a decent pick if their life depended on it." },
  { id: 'w19', text: "🎰 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} hitting on every pick like they rigged it. {lp} might as well have picked names out of a hat. Oh wait..." },
  { id: 'w20', text: "🐐 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} drafting GOATs. {lp} drafting goats. There's a difference." },
  { id: 'w21', text: "🔔 *{winner} {ws} - {loser} {ls}* ({round})\nDing ding ding! Another point for {wp}. {lp} hearing nothing but L's." },
  { id: 'w22', text: "💅 *{winner} {ws} - {loser} {ls}* ({round})\nEffortless W for {wp}. {lp} in absolute disbelief. The bracket don't lie." },
  { id: 'w23', text: "🤡 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} drafting {loser} was a dumbass choice. {wp} thanks you for the free point, dipshit." },
  { id: 'w24', text: "📉 *{winner} {ws} - {loser} {ls}* ({round})\n{lp}'s bracket approval rating just dropped to 0%. {wp} polling at an all time high." },
  { id: 'w25', text: "🚑 *{winner} {ws} - {loser} {ls}* ({round})\nSomebody call an ambulance for {lp}'s bracket. Actually... don't. It's too late. {wp} scores again." },
  { id: 'w26', text: "🧠 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} is playing chess while {lp} is playing with themselves. And still fucking losing." },
  { id: 'w27', text: "🎤 *{winner} {ws} - {loser} {ls}* ({round})\nI'd like to give {lp} a moment of silence for that pick. Just kidding, {wp} is too loud celebrating." },
  { id: 'w28', text: "🌪️ *{winner} {ws} - {loser} {ls}* ({round})\n{winner} just bulldozed through {loser}. {wp} is thriving. {lp} is barely surviving." },
  { id: 'w29', text: "🪙 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} flipping points like pancakes. {lp} flipping tables." },
  { id: 'w30', text: "🎬 *{winner} {ws} - {loser} {ls}* ({round})\nAnother episode of '{wp} Wins and {lp} Cries Like a Bitch'. Ratings are through the roof." },
]

// ---------------------------------------------------------------------------
// UPSET MESSAGES (lower seed beats higher seed by 4+ seed lines)
// ---------------------------------------------------------------------------
const UPSET_MESSAGES: MessageTemplate[] = [
  { id: 'u1', text: "🚨 UPSET ALERT 🚨\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} is in shambles. A {seed_l}-seed losing to a {seed_w}-seed?? Couldn't be {wp}'s team though 😏" },
  { id: 'u2', text: "⚠️ MADNESS ⚠️\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nThat's why they call it March Madness. {lp} just got absolutely bracket-busted. {wp} is loving this chaos." },
  { id: 'u3', text: "🤯 ARE YOU FUCKING KIDDING ME?!\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nA {seed_w}-seed over a {seed_l}-seed! {lp} in absolute shambles. {wp} might never shut the fuck up about this." },
  { id: 'u4', text: "😱 DOWN GOES THE FAVORITE!\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} really drafted a {seed_l}-seed and watched them lose to a {seed_w}. {wp} sends their regards." },
  { id: 'u5', text: "🔥 THE BRACKET IS ON FIRE 🔥\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nNobody saw this coming except apparently {wp}. {lp} saw their life flash before their eyes." },
  { id: 'u6', text: "💣 BOOM BITCH\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{seed_w} over {seed_l}!!! {lp} thought they were safe picking a {seed_l}-seed. WRONG AS SHIT. {wp} is cackling." },
  { id: 'u7', text: "🎪 MARCH MADNESS IS UNDEFEATED\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} just experienced a hate crime against their bracket. {wp} is the chaos agent we all needed." },
  { id: 'u8', text: "📢 ATTENTION: {lp}'s BRACKET IS IN RUINS\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nA {seed_l}-seed?? Gone to a {seed_w}?? {lp} might need to log off for a while. {wp} ascends." },
  { id: 'u9', text: "🌋 ERUPTION\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{winner} came out of NOWHERE. {lp} is questioning every life choice. {wp} is questioning nothing — just vibing." },
  { id: 'u10', text: "🗣️ EVERYONE GET THE FUCK IN HERE\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{seed_w} over {seed_l}!!! {lp} punching drywall. {wp} losing their shit in celebration." },
  { id: 'u11', text: "🪦 REST IN PEACE\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} trusted a {seed_l}-seed and got betrayed. {wp} is living proof that chaos is a ladder." },
  { id: 'u12', text: "🤮 WHAT THE ACTUAL FUCK\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} is physically ill. A {seed_w} over a {seed_l}?! Holy shit. {wp} might tattoo this scoreline." },
  { id: 'u13', text: "🎢 WHAT A RIDE\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp} just went from confident to cooked in 40 minutes. A {seed_w}-seed over a {seed_l}-seed. {wp} saw it coming." },
  { id: 'u14', text: "😈 PURE EVIL\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\nMarch is ruthless. {lp} lost a {seed_l}-seed to a {seed_w}. Can't make this up. {wp} is the villain now." },
  { id: 'u15', text: "🧨 KABOOM\n*{winner} ({seed_w}) {ws} - {loser} ({seed_l}) {ls}* ({round})\n{lp}'s bracket just exploded. {seed_w} over {seed_l}?! {wp} riding the chaos wave to victory." },
]

// ---------------------------------------------------------------------------
// BLOWOUT MESSAGES (20+ point win)
// ---------------------------------------------------------------------------
const BLOWOUT_MESSAGES: MessageTemplate[] = [
  { id: 'b1', text: "🏀 *{winner} {ws} - {loser} {ls}* ({round})\nThat wasn't a game, that was a fucking crime scene. {wp} +1, {lp} +1 therapy session." },
  { id: 'b2', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} got absolutely cooked. {lp} should've picked literally anyone else. Easy money for {wp}." },
  { id: 'b3', text: "🗑️ *{winner} {ws} - {loser} {ls}* ({round})\n{loser} looked like they didn't even want to be there. {lp}, what the hell were you thinking? Dumbass pick. {wp} cashes in." },
  { id: 'b4', text: "🚨 *{winner} {ws} - {loser} {ls}* ({round})\nThat was assault. {winner} should be arrested. {lp} filing a police report. {wp} filing another point." },
  { id: 'b5', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\nThey mercy-ruled a goddamn tournament game. {lp} in witness protection. {wp} living lavish as fuck." },
  { id: 'b6', text: "🏥 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} needs medical attention after that beating. {lp} needs emotional attention. {wp} needs a trophy case." },
  { id: 'b7', text: "🔨 *{winner} {ws} - {loser} {ls}* ({round})\nThat wasn't a basketball game, that was a demolition. {wp} collects the easiest point of the tournament. {lp}... no comment." },
  { id: 'b8', text: "😵 *{winner} {ws} - {loser} {ls}* ({round})\nThis game was over at halftime. {lp}, your team shit the bed harder than a toddler. Give up on your bracket already. Meanwhile {wp} feasts." },
  { id: 'b9', text: "🗡️ *{winner} {ws} - {loser} {ls}* ({round})\n{winner} showed no mercy. {lp} showed no judgment in picking {loser}. {wp} accepts this generous donation." },
  { id: 'b10', text: "🎯 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} could've won this with 4 players. {lp} could've picked better with their eyes closed. Free point for {wp}." },
  { id: 'b11', text: "📺 *{winner} {ws} - {loser} {ls}* ({round})\nI changed the channel at halftime. So did {lp}. Only {wp} was smiling." },
  { id: 'b12', text: "😴 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} sleepwalked through that one. {lp} wish they were sleeping. {wp} wide awake and stacking points." },
  { id: 'b13', text: "🤧 *{winner} {ws} - {loser} {ls}* ({round})\nThat was hard to watch. Not for {wp} though — they enjoyed every second. {lp} turned the TV off in the 2nd half." },
  { id: 'b14', text: "📦 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} packing their bags before the final buzzer. {lp} packing up their bracket hopes. {wp} packing on points." },
  { id: 'b15', text: "💨 *{winner} {ws} - {loser} {ls}* ({round})\nSmoke. That's all that's left of {loser}. And {lp}'s bitch-ass dignity. {wp} inhales another W." },
]

// ---------------------------------------------------------------------------
// CLOSE GAME MESSAGES (5 or fewer points)
// ---------------------------------------------------------------------------
const CLOSE_GAME_MESSAGES: MessageTemplate[] = [
  { id: 'c1', text: "😰 *{winner} {ws} - {loser} {ls}* ({round})\nThat was a NAIL BITER. {wp} survived by the skin of their teeth. {lp} was THIS close to celebrating." },
  { id: 'c2', text: "🫣 *{winner} {ws} - {loser} {ls}* ({round})\nHeart attack game. {wp} is alive but barely. {lp} is shitting themselves right now." },
  { id: 'c3', text: "🥶 *{winner} {ws} - {loser} {ls}* ({round})\nICE COLD finish. {wp} just aged 10 years watching that. {lp}... pour one out." },
  { id: 'c4', text: "💔 *{winner} {ws} - {loser} {ls}* ({round})\nSo close yet so far for {lp}. One or two bounces different and it's a W. Instead, {wp} steals it." },
  { id: 'c5', text: "😮‍💨 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} BARELY held on. {lp} was tasting victory before it got ripped away. Brutal." },
  { id: 'c6', text: "🫠 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} is literally melting. That was RIGHT FUCKING THERE. {wp} scraped by on pure bullshit luck and vibes." },
  { id: 'c7', text: "🎰 *{winner} {ws} - {loser} {ls}* ({round})\nCoin flip game and it landed {wp}'s way. {lp} wants a recount." },
  { id: 'c8', text: "🤞 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} was praying to every basketball god. Prayers answered. {lp}'s prayers went to voicemail." },
  { id: 'c9', text: "😬 *{winner} {ws} - {loser} {ls}* ({round})\nThat ending had everyone clenching their ass cheeks. {wp} can finally breathe. {lp} might never fucking breathe again." },
  { id: 'c10', text: "🎭 *{winner} {ws} - {loser} {ls}* ({round})\nA game of inches. {wp} got the inches. {lp} got the heartbreak. Welcome to March." },
  { id: 'c11', text: "⏱️ *{winner} {ws} - {loser} {ls}* ({round})\nDown to the wire. {wp} clutched up. {lp} will be replaying that last possession in their nightmares." },
  { id: 'c12', text: "🪫 *{winner} {ws} - {loser} {ls}* ({round})\n{lp}'s team ran out of juice at the worst time. {wp} surviving off fumes and it's enough." },
  { id: 'c13', text: "🥊 *{winner} {ws} - {loser} {ls}* ({round})\nWhat a war. {wp} won by a split decision. {lp} has a legit grievance but nobody cares. Point is a point." },
  { id: 'c14', text: "🧨 *{winner} {ws} - {loser} {ls}* ({round})\nInstant classic and a nightmare for {lp}. So close you could taste it. {wp} actually gets to taste it though." },
  { id: 'c15', text: "🎢 *{winner} {ws} - {loser} {ls}* ({round})\nWhat a roller coaster. {wp} ended at the top. {lp} ended in the ER." },
]

// ---------------------------------------------------------------------------
// BOTH TEAMS PICKED (direct rivalry matchup)
// ---------------------------------------------------------------------------
const BOTH_PICKED_MESSAGES: MessageTemplate[] = [
  { id: 'bp1', text: "⚔️ *{winner} {ws} - {loser} {ls}* ({round})\nHead to head! {wp} comes out on top over {lp}. Talk your shit {wp}." },
  { id: 'bp2', text: "🤝➡️🔪 *{winner} {ws} - {loser} {ls}* ({round})\nFriendship was tested and {wp} chose violence. Sorry {lp}, it's just business." },
  { id: 'bp3', text: "💥 *{winner} {ws} - {loser} {ls}* ({round})\n{wp}'s team just eliminated {lp}'s team. This is personal now." },
  { id: 'bp4', text: "👀 *{winner} {ws} - {loser} {ls}* ({round})\nOH this one hurts different. {wp}'s team sent {lp}'s team packing. Expect a salty text." },
  { id: 'bp5', text: "🏹 *{winner} {ws} - {loser} {ls}* ({round})\nDirect hit on {lp}'s bracket by {wp}'s team. This is the content we're here for." },
  { id: 'bp6', text: "🎯 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} vs {lp} and {wp} wins. Don't let them forget it. EVER." },
  { id: 'bp7', text: "🥊 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} and {lp} went head to head and only one walked away. {lp} crawled." },
  { id: 'bp8', text: "🔪 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} just ended {lp}'s whole fucking career with that matchup. The group chat is about to be TOXIC AS SHIT." },
  { id: 'bp9', text: "☠️ *{winner} {ws} - {loser} {ls}* ({round})\n{wp} team eliminated {lp}'s team. {lp} should probably mute the group chat for a bit." },
  { id: 'bp10', text: "😏 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} really picked the team that knocked out {lp}'s team. You can't write a better script." },
]

// ---------------------------------------------------------------------------
// ONLY LOSER WAS PICKED (pure pain, no one benefits)
// ---------------------------------------------------------------------------
const LOSER_ONLY_MESSAGES: MessageTemplate[] = [
  { id: 'lo1', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} is OUT and {lp} feels every bit of it. Nobody even scores a point from this. Just pain." },
  { id: 'lo2', text: "😭 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} loses a team and nobody gains anything. The universe just wanted {lp} to suffer." },
  { id: 'lo3', text: "🕳️ *{winner} {ws} - {loser} {ls}* ({round})\n{loser} is done. {lp} is down a team with nothing to show for it. Pure bitch-ass L energy." },
  { id: 'lo4', text: "🥀 *{winner} {ws} - {loser} {ls}* ({round})\nAnother one of {lp}'s teams withers away. Nobody benefits. Just a pointless death." },
  { id: 'lo5', text: "🫥 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} just sitting there watching {loser} lose and knowing nobody picked {winner}. Suffering without purpose." },
  { id: 'lo6', text: "📉 *{winner} {ws} - {loser} {ls}* ({round})\n{lp}'s team count drops. Score doesn't change for anyone. Just vibes... bad vibes." },
  { id: 'lo7', text: "💔 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} eliminated. {lp} loses a team. Nobody else gains. Sometimes March is just cruel." },
  { id: 'lo8', text: "🪦 *{winner} {ws} - {loser} {ls}* ({round})\n{lp} watches another team fall. And for what? Nobody scored. Life is pain and this bracket is bullshit." },
]

// ---------------------------------------------------------------------------
// ONLY WINNER WAS PICKED (free point, no one gets hurt)
// ---------------------------------------------------------------------------
const WINNER_ONLY_MESSAGES: MessageTemplate[] = [
  { id: 'wo1', text: "🎁 *{winner} {ws} - {loser} {ls}* ({round})\nFree point for {wp}! Nobody had {loser} so nobody's crying. Well, maybe a little." },
  { id: 'wo2', text: "💸 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} racks up a point and nobody else is even affected. Must be nice." },
  { id: 'wo3', text: "😎 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} quietly collecting points while everyone else wasn't paying attention." },
  { id: 'wo4', text: "🤫 *{winner} {ws} - {loser} {ls}* ({round})\nSilent W for {wp}. Nobody gets hurt, {wp} just gets richer. Smooth." },
  { id: 'wo5', text: "🏦 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} deposits another point. Nobody else involved. Just steady income." },
  { id: 'wo6', text: "📬 *{winner} {ws} - {loser} {ls}* ({round})\nAnother point delivered to {wp}'s doorstep. Nobody else's mailbox. Just {wp} winning in silence." },
  { id: 'wo7', text: "🥷 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} sneaking in another point while nobody's looking. Stealth mode." },
  { id: 'wo8', text: "🧲 *{winner} {ws} - {loser} {ls}* ({round})\n{wp} just attracting points at this rate. Nobody else gains or loses. Just {wp} being {wp}." },
]

// ---------------------------------------------------------------------------
// NOBODY PICKED EITHER TEAM
// ---------------------------------------------------------------------------
const NO_PICK_MESSAGES: MessageTemplate[] = [
  { id: 'np1', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} eliminated. Nobody picked them so nobody gives a shit lmao." },
  { id: 'np2', text: "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{loser} gone. Nobody's bracket moved. This game was background noise." },
  { id: 'np3', text: "👋 *{winner} {ws} - {loser} {ls}* ({round})\nBye bye {loser}. Nobody had them anyway. Next." },
  { id: 'np4', text: "🏀 *{winner} {ws} - {loser} {ls}* ({round})\n{winner} advances but literally nobody here cares. No points. No drama. Moving on." },
  { id: 'np5', text: "😐 *{winner} {ws} - {loser} {ls}* ({round})\nA game happened. Nobody gained. Nobody lost. Nobody gave a flying fuck." },
  { id: 'np6', text: "🦗 *{winner} {ws} - {loser} {ls}* ({round})\n*cricket noises* Nobody picked either team. This game is irrelevant to all of us." },
  { id: 'np7', text: "📰 *{winner} {ws} - {loser} {ls}* ({round})\nIn news that affects absolutely nobody in this group, {winner} won." },
  { id: 'np8', text: "🫥 *{winner} {ws} - {loser} {ls}* ({round})\nNo one picked. No one scored. No one lost. This game was filler content." },
]

// ---------------------------------------------------------------------------
// STANDINGS TAUNTS
// ---------------------------------------------------------------------------
const STANDINGS_TAUNTS = [
  "{leader} is running this thing. {last}... there's always next year.",
  "{leader} on top and loving life. {last} in last and questioning all their choices.",
  "All hail {leader}. {last}, maybe try picking with your eyes open next time.",
  "{leader} built different. {last} built like shit.",
  "{leader} is the main character. {last} is an NPC.",
  "Bow down to {leader}. {last} should get their sorry ass out of here.",
  "{leader} out here playing 4D chess. {last} playing tic-tac-toe. Badly.",
  "{leader} has entered god mode. {last} has entered grief mode.",
  "{leader}'s bracket is a masterpiece. {last}'s bracket is hot garbage. Absolute dogshit.",
  "{leader} drafted a championship team. {last} drafted a participation trophy.",
  "{leader} is inevitable. {last} is insufferable.",
  "{leader} studied the game. {last} studied nothing.",
  "Someone check on {last}. And by someone I don't mean {leader}, they're too busy winning.",
  "{leader} winning so hard it's almost unfair. Almost. Suck it, {last}.",
  "{leader} making this look easy. {last} making this look painful.",
  "{leader} drinking champagne. {last} drinking alone like the sad bitch they are.",
]

// ---------------------------------------------------------------------------
// SAME PLAYER ON BOTH SIDES (picked both winner and loser)
// {sp} = the player who has both teams
// ---------------------------------------------------------------------------
const SELF_INFLICTED_MESSAGES: MessageTemplate[] = [
  { id: 'si1', text: "🤦 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} had teams on BOTH sides. +1 point but also -1 team. {sp} just fucked themselves." },
  { id: 'si2', text: "🎭 *{winner} {ws} - {loser} {ls}* ({round})\n{sp}'s {winner} just eliminated {sp}'s {loser}. Friendly fire. Net gain: confused." },
  { id: 'si3', text: "🔄 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} literally cannot lose this game. Also literally cannot fully win it. The duality of March." },
  { id: 'si4', text: "🪞 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} vs {sp}. A civil war within {sp}'s own bracket. {winner} survived. {loser} did not." },
  { id: 'si5', text: "😵‍💫 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} watching their own team eliminate their own team. The emotions are... complicated." },
  { id: 'si6', text: "🎪 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} drafted both of these teams. One had to die. +1 point, -1 team. {sp} is both happy and sad." },
  { id: 'si7', text: "💀 *{winner} {ws} - {loser} {ls}* ({round})\n{sp}'s bracket is eating itself. {winner} took out {loser} and they're BOTH {sp}'s picks. You can't make this shit up." },
  { id: 'si8', text: "🧠 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} playing 4D chess drafting both sides. Gets a point, loses a team. Balanced, as all things should be." },
  { id: 'si9', text: "🎲 *{winner} {ws} - {loser} {ls}* ({round})\n{sp} hedged their bets and it... worked? {winner} advances. {loser} is gone. {sp} feels everything and nothing." },
  { id: 'si10', text: "🤯 *{winner} {ws} - {loser} {ls}* ({round})\nOnly {sp} could manage to hurt themselves and help themselves in the same game. Peak bracket strategy." },
]

// ---------------------------------------------------------------------------
// Used message tracking and selection
// ---------------------------------------------------------------------------

// Pick a message that hasn't been used yet
function pickUnused(templates: MessageTemplate[], usedIds: Set<string>): MessageTemplate {
  const available = templates.filter((t) => !usedIds.has(t.id))
  if (available.length === 0) {
    // All used up — reset and pick any
    return templates[Math.floor(Math.random() * templates.length)]
  }
  return available[Math.floor(Math.random() * available.length)]
}

function pickRandomString(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MessageContext {
  winnerTeam: string
  loserTeam: string
  winnerScore: string
  loserScore: string
  winnerSeed: number
  loserSeed: number
  winnerPlayers: string[]
  loserPlayers: string[]
  round: string
}

export interface GeneratedMessage {
  text: string
  messageId: string  // store this in the DB to prevent reuse
}

export function generateGameMessage(
  ctx: MessageContext,
  usedMessageIds: Set<string>
): GeneratedMessage {
  const scoreDiff = parseInt(ctx.winnerScore) - parseInt(ctx.loserScore)
  const isUpset = ctx.winnerSeed > ctx.loserSeed + 3
  const isBlowout = scoreDiff >= 20
  const isClose = scoreDiff <= 5

  // Check if same player is on both sides
  const overlap = ctx.winnerPlayers.filter((p) => ctx.loserPlayers.includes(p))
  const isSelfInflicted = overlap.length > 0

  const wp = ctx.winnerPlayers.length > 0 ? ctx.winnerPlayers.join(' & ') : null
  const lp = ctx.loserPlayers.length > 0 ? ctx.loserPlayers.join(' & ') : null

  let template: MessageTemplate

  if (isSelfInflicted) {
    // Same player picked both teams — special case
    template = pickUnused(SELF_INFLICTED_MESSAGES, usedMessageIds)
  } else if (wp && lp) {
    // Both sides picked by different players
    if (isUpset) {
      template = pickUnused(UPSET_MESSAGES, usedMessageIds)
    } else if (isBlowout) {
      template = pickUnused(BLOWOUT_MESSAGES, usedMessageIds)
    } else if (isClose) {
      template = pickUnused(CLOSE_GAME_MESSAGES, usedMessageIds)
    } else {
      template = pickUnused([...WINNER_MESSAGES, ...BOTH_PICKED_MESSAGES], usedMessageIds)
    }
  } else if (wp && !lp) {
    if (isUpset) {
      template = pickUnused(UPSET_MESSAGES, usedMessageIds)
    } else {
      template = pickUnused(WINNER_ONLY_MESSAGES, usedMessageIds)
    }
  } else if (!wp && lp) {
    if (isUpset) {
      template = pickUnused(UPSET_MESSAGES, usedMessageIds)
    } else {
      template = pickUnused(LOSER_ONLY_MESSAGES, usedMessageIds)
    }
  } else {
    template = pickUnused(NO_PICK_MESSAGES, usedMessageIds)
  }

  // Mark as used
  usedMessageIds.add(template.id)

  const text = template.text
    .replace(/{winner}/g, ctx.winnerTeam)
    .replace(/{loser}/g, ctx.loserTeam)
    .replace(/{ws}/g, ctx.winnerScore)
    .replace(/{ls}/g, ctx.loserScore)
    .replace(/{wp}/g, wp ?? 'Nobody')
    .replace(/{lp}/g, lp ?? 'Nobody')
    .replace(/{sp}/g, overlap.join(' & ') || 'Nobody')
    .replace(/{seed_w}/g, ctx.winnerSeed.toString())
    .replace(/{seed_l}/g, ctx.loserSeed.toString())
    .replace(/{round}/g, ctx.round)

  return { text: text + '\n\nhttps://bracket-steel.vercel.app', messageId: template.id }
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

  const taunt = pickRandomString(STANDINGS_TAUNTS)
    .replace(/{leader}/g, leader.name)
    .replace(/{last}/g, last.name)

  return `📊 *Current Standings*\n${lines.join('\n')}\n${taunt}`
}
