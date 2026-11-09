// CloutRadar scoring engine. Pure functions: no I/O, safe on server and client.
// Scores describe warning signs in the numbers entered. They are never proof.

export type Level = 'ok' | 'warn' | 'bad' | 'na';

export interface VideoStats {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

export interface ScanInput {
  handle: string;
  followers: number | null;
  following: number | null;
  totalLikes: number | null;
  videoCount: number | null;
  videos: VideoStats[];
  // Pro-only inputs
  comments?: string[];
  previousFollowers?: number | null;
  previousDate?: string | null; // YYYY-MM-DD
}

export interface Signal {
  id: string;
  name: string;
  level: Level;
  value: string;
  detail: string;
  explanation: string;
  pro?: boolean;
  // Pro feedback
  benchmark?: string;
  advice?: string;
}

export interface ScanResult {
  handle: string;
  score: number | null;
  band: 'ok' | 'warn' | 'bad' | 'na';
  verdict: string;
  summary: string;
  signals: Signal[];
  checksUsed: number;
  strong: number;
  minor: number;
  tier?: Tier;
  pro: boolean;
}

export const FREE_MAX_VIDEOS = 5;
export const PRO_MAX_VIDEOS = 12;
export const PRO_MAX_COMMENTS = 50;

export type Tier = 'nano' | 'micro' | 'mid' | 'macro';

export const TIERS: Record<Tier, { label: string; reachWarn: number; reachBad: number; likeHigh: number; likeBad: number }> = {
  // Thresholds tighten as accounts grow, because reach naturally falls with size.
  nano: { label: 'Under 10K followers', reachWarn: 0.1, reachBad: 0.04, likeHigh: 0.18, likeBad: 0.28 },
  micro: { label: '10K to 100K followers', reachWarn: 0.06, reachBad: 0.025, likeHigh: 0.16, likeBad: 0.26 },
  mid: { label: '100K to 1M followers', reachWarn: 0.04, reachBad: 0.015, likeHigh: 0.15, likeBad: 0.25 },
  macro: { label: 'Over 1M followers', reachWarn: 0.025, reachBad: 0.01, likeHigh: 0.14, likeBad: 0.24 },
};

export function tierFor(followers: number): Tier {
  if (followers < 10_000) return 'nano';
  if (followers < 100_000) return 'micro';
  if (followers < 1_000_000) return 'mid';
  return 'macro';
}

/* ---------- parsing & formatting ---------- */

export function parseNum(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 ? raw : NaN;
  const s = String(raw).trim().replace(/[,\s_]/g, '').toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!m) return NaN;
  const mult = m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : m[2] === 'b' ? 1e9 : 1;
  return Math.round(parseFloat(m[1]) * mult);
}

export function fmt(n: number): string {
  const trim = (x: string) => x.replace(/\.0$/, '');
  if (n >= 1e9) return trim((n / 1e9).toFixed(1)) + 'B';
  if (n >= 1e6) return trim((n / 1e6).toFixed(1)) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(0) + 'K';
  if (n >= 1e3) return trim((n / 1e3).toFixed(1)) + 'K';
  return String(Math.round(n));
}

export const pct = (x: number, d = 1) => (x * 100).toFixed(d).replace(/\.0+$/, '') + '%';

function median(a: number[]): number {
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

export type TargetResult = { handle: string } | { error: string };

export function parseTarget(raw: string): TargetResult {
  const v = (raw || '').trim();
  if (!v) return { error: 'Enter a username or a video link.' };
  let m = v.match(/tiktok\.com\/@([A-Za-z0-9._]{2,24})/i);
  if (m) return { handle: m[1].toLowerCase() };
  if (/(vm|vt)\.tiktok\.com\//i.test(v) || /tiktok\.com\/t\//i.test(v))
    return { error: 'Short share links hide the username. Open the link and paste the full address, or type the @username.' };
  if (/^https?:\/\//i.test(v)) return { error: "That doesn't look like a TikTok link. Paste a tiktok.com/@username address." };
  m = v.match(/^@?([A-Za-z0-9._]{2,24})$/);
  if (m) return { handle: m[1].toLowerCase() };
  return { error: 'Usernames use letters, numbers, dots and underscores, 2 to 24 characters.' };
}

/* ---------- comment analysis (Pro) ---------- */

const GENERIC = [
  'nice', 'wow', 'cool', 'great', 'amazing', 'love it', 'love this', 'awesome', 'beautiful', 'so good', 'good',
  'fire', 'first', 'omg', 'lol', 'lmao', 'yes', 'perfect', 'wonderful', 'best', 'super', 'great video', 'nice video',
  'great content', 'keep it up', 'follow me', 'check my page', 'follow back', 'f4f', 'l4l',
];

export function analyzeComments(comments: string[]) {
  const list = comments.map((c) => c.trim()).filter(Boolean).slice(0, PRO_MAX_COMMENTS);
  const norm = (c: string) => c.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  let emojiOnly = 0, generic = 0, promo = 0;
  const counts = new Map<string, number>();
  for (const c of list) {
    const n = norm(c);
    if (!n) emojiOnly++;
    else if (GENERIC.includes(n) || (n.split(' ').length <= 2 && n.length <= 12)) generic++;
    if (/follow (me|back)|check (out )?my|f4f|l4l|dm (me|for)|promo|giveaway link/i.test(c)) promo++;
    if (n) counts.set(n, (counts.get(n) || 0) + 1);
  }
  const duplicates = [...counts.values()].filter((v) => v > 1).reduce((a, v) => a + v, 0);
  const low = emojiOnly + generic;
  return { total: list.length, emojiOnly, generic, promo, duplicates, lowShare: list.length ? low / list.length : 0 };
}

/* ---------- main analysis ---------- */

export function analyze(input: ScanInput, opts: { pro: boolean }): ScanResult {
  const pro = opts.pro;
  const maxVideos = pro ? PRO_MAX_VIDEOS : FREE_MAX_VIDEOS;
  const v = input.videos.filter((x) => (x.views ?? 0) > 0).slice(0, maxVideos);
  const S: Signal[] = [];
  const tier = input.followers && input.followers > 0 ? tierFor(input.followers) : undefined;
  const T = TIERS[tier ?? 'mid'];
  const reachWarn = pro && tier ? T.reachWarn : 0.05;
  const reachBad = pro && tier ? T.reachBad : 0.02;
  const likeHigh = pro && tier ? T.likeHigh : 0.15;
  const likeBad = pro && tier ? T.likeBad : 0.25;
  const tierNote = pro && tier ? ` for accounts with ${T.label.toLowerCase()}` : '';

  // 1. Views reach
  if (input.followers && input.followers > 0 && v.length >= 2) {
    const r = median(v.map((x) => x.views!)) / input.followers;
    const level: Level = r < reachBad ? 'bad' : r < reachWarn ? 'warn' : 'ok';
    S.push({
      id: 'reach', name: 'Views reach', level, value: pct(r), detail: 'median views ÷ followers',
      explanation: level === 'ok'
        ? 'Videos reach a healthy share of the audience, which suggests followers are real people who watch.'
        : `Recent videos reach ${pct(r)} of the follower count. Real followers usually push this above ${pct(reachWarn, 0)}${tierNote}; inactive or bought followers drag it down.`,
      benchmark: pro ? `Typical${tierNote}: above ${pct(reachWarn, 1)}. Strong warning below ${pct(reachBad, 1)}.` : undefined,
      advice: pro && level !== 'ok' ? 'Check whether the low reach is recent: if older videos reached far more people, the account may have bought a batch of followers or gone quiet.' : undefined,
    });
  } else S.push({ id: 'reach', name: 'Views reach', level: 'na', value: '—', detail: 'needs followers + 2 videos', explanation: 'Add the follower count and views for at least two videos.' });

  // 2. Like rate
  const withLikes = v.filter((x) => x.likes !== null && x.likes !== undefined);
  if (withLikes.length >= 2) {
    const r = withLikes.reduce((a, x) => a + x.likes!, 0) / withLikes.reduce((a, x) => a + x.views!, 0);
    const level: Level = r > likeBad ? 'bad' : r > likeHigh ? 'warn' : 'ok';
    S.push({
      id: 'likerate', name: 'Like rate', level, value: pct(r), detail: 'likes ÷ views',
      explanation: level !== 'ok'
        ? `${pct(r)} of viewers tapped like. Most videos land between 2% and ${pct(likeHigh, 0)}${tierNote}, so likes this high often come from a like service.`
        : r < 0.01
          ? 'Likes are low for the views, which can mean bought views but is also common on ads and very broad audiences.'
          : 'Likes are in the normal range for the views these videos get.',
      benchmark: pro ? `Typical${tierNote}: 2% to ${pct(likeHigh, 0)}. Strong warning above ${pct(likeBad, 0)}.` : undefined,
      advice: pro && level !== 'ok' ? 'Open the likes list on a video if you can. Bought likes often come from accounts with no profile picture, no videos and random usernames.' : undefined,
    });
  } else S.push({ id: 'likerate', name: 'Like rate', level: 'na', value: '—', detail: 'needs views + likes', explanation: 'Add views and likes for at least two videos.' });

  // 3. Comment depth
  const withC = v.filter((x) => (x.likes ?? 0) > 0 && x.comments !== null && x.comments !== undefined);
  if (withC.length >= 2) {
    const r = (withC.reduce((a, x) => a + x.comments!, 0) / withC.reduce((a, x) => a + x.likes!, 0)) * 1000;
    const level: Level = r < 2 ? 'bad' : r < 5 ? 'warn' : 'ok';
    S.push({
      id: 'comments', name: 'Comment depth', level, value: r.toFixed(1), detail: 'comments per 1,000 likes',
      explanation: level !== 'ok'
        ? `Only ${r.toFixed(1)} comments for every 1,000 likes. Bot likes rarely come with conversation, so a silent comment section is a classic sign.`
        : 'People are talking under the videos, which is hard to fake at scale.',
      benchmark: pro ? 'Typical: 5 to 30 comments per 1,000 likes. Strong warning below 2.' : undefined,
      advice: pro && level !== 'ok' ? 'Paste a sample of comments into the comment check below to see whether the comments that do exist look real.' : undefined,
    });
  } else S.push({ id: 'comments', name: 'Comment depth', level: 'na', value: '—', detail: 'needs likes + comments', explanation: 'Add likes and comments for at least two videos.' });

  // 4. Likes vs followers
  if (input.followers && input.followers > 0 && input.totalLikes !== null && input.totalLikes !== undefined) {
    const r = input.totalLikes / input.followers;
    const level: Level = r < 1 ? 'bad' : r < 3 ? 'warn' : 'ok';
    S.push({
      id: 'lvf', name: 'Likes vs followers', level, value: r.toFixed(1) + '×', detail: 'profile likes ÷ followers',
      explanation: level !== 'ok'
        ? `The account has ${fmt(input.totalLikes)} likes in total but ${fmt(input.followers)} followers. Organic accounts almost always collect several likes per follower; fewer suggests followers were added without engagement.`
        : 'Total likes comfortably outnumber followers, as they do on organically grown accounts.',
      benchmark: pro ? 'Typical: 5× to 20× more total likes than followers. Strong warning below 1×.' : undefined,
      advice: pro && level !== 'ok' && (input.videoCount ?? 0) < 15 ? 'This account has few videos, so a low ratio can also mean a recently deleted back catalogue. Ask whether old videos were removed.' : undefined,
    });
  } else S.push({ id: 'lvf', name: 'Likes vs followers', level: 'na', value: '—', detail: 'needs profile likes', explanation: 'Add followers and the profile Likes total.' });

  // 5. Follow-back pattern
  if (input.followers && input.followers > 0 && input.following !== null && input.following !== undefined) {
    const r = input.following / input.followers;
    const level: Level = input.following < 1000 ? 'ok' : r > 0.8 ? 'bad' : r > 0.3 ? 'warn' : 'ok';
    S.push({
      id: 'f4f', name: 'Follow-back pattern', level, value: r < 0.01 ? '<0.01' : r.toFixed(2), detail: `follows ${fmt(input.following)} accounts`,
      explanation: level === 'ok'
        ? 'The account follows a normal number of people for its size.'
        : `Following ${fmt(input.following)} accounts points to follow-for-follow or mass-follow tools, which inflate followers with people who don't watch.`,
      benchmark: pro ? 'Typical: following under 30% of the follower count once past 1,000 follows.' : undefined,
    });
  } else S.push({ id: 'f4f', name: 'Follow-back pattern', level: 'na', value: '—', detail: 'needs following', explanation: 'Add the Following count.' });

  // 6. Uneven likes
  const rates = withLikes.map((x) => x.likes! / x.views!);
  if (rates.length >= 3) {
    const sorted = [...rates].sort((a, b) => b - a);
    const rest = median(sorted.slice(1));
    const r = rest > 0 ? sorted[0] / rest : 0;
    const level: Level = r >= 5 ? 'bad' : r >= 3 ? 'warn' : 'ok';
    S.push({
      id: 'uneven', name: 'Uneven likes', level, value: r.toFixed(1) + '×', detail: 'top like rate vs the rest',
      explanation: level !== 'ok'
        ? `One video's like rate is ${r.toFixed(1)} times the others. Likes bought for a single post often show up like this.`
        : 'Like rates are consistent from video to video.',
      benchmark: pro ? 'Typical: the best video is under 3× the like rate of the others.' : undefined,
    });
  } else S.push({ id: 'uneven', name: 'Uneven likes', level: 'na', value: '—', detail: 'needs 3 videos', explanation: 'Add views and likes for at least three videos.' });

  // ---- Pro-only signals ----
  if (pro) {
    // 7. Share rate
    const withS = v.filter((x) => x.shares !== null && x.shares !== undefined && (x.likes ?? 0) > 0);
    if (withS.length >= 2) {
      const r = (withS.reduce((a, x) => a + x.shares!, 0) / withS.reduce((a, x) => a + x.likes!, 0)) * 1000;
      const level: Level = r < 1 ? 'bad' : r < 4 ? 'warn' : 'ok';
      S.push({
        id: 'shares', name: 'Share rate', level, value: r.toFixed(1), detail: 'shares per 1,000 likes', pro: true,
        explanation: level !== 'ok'
          ? `Only ${r.toFixed(1)} shares per 1,000 likes. Real viewers who like something often send it on; bought likes never do.`
          : 'Viewers share these videos at a normal rate.',
        benchmark: 'Typical: 5 to 50 shares per 1,000 likes. Strong warning below 1.',
      });
    } else S.push({ id: 'shares', name: 'Share rate', level: 'na', value: '—', detail: 'needs shares', explanation: 'Add shares for at least two videos.', pro: true });

    // 8. Follower growth
    if (input.followers && input.previousFollowers && input.previousDate) {
      const days = Math.max(1, Math.round((Date.now() - new Date(input.previousDate + 'T00:00:00Z').getTime()) / 86400000));
      const gained = input.followers - input.previousFollowers;
      const perDay = gained / days;
      const avgViews = v.length ? v.reduce((a, x) => a + x.views!, 0) / v.length : 0;
      // Followers gained per day compared with how many people a typical video reaches.
      const ratio = avgViews > 0 ? perDay / avgViews : 0;
      const level: Level = gained <= 0 ? 'ok' : ratio > 0.5 ? 'bad' : ratio > 0.15 ? 'warn' : 'ok';
      S.push({
        id: 'growth', name: 'Follower growth', level, pro: true,
        value: (gained >= 0 ? '+' : '') + fmt(Math.abs(gained)) + (gained < 0 ? ' lost' : ''),
        detail: `over ${days} days (${fmt(Math.abs(Math.round(perDay)))}/day)`,
        explanation: level !== 'ok'
          ? `The account gained about ${fmt(Math.round(perDay))} followers a day while a typical video gets ${fmt(Math.round(avgViews))} views. Growth that fast without the views to drive it often comes from bought followers.`
          : gained <= 0 ? 'Followers have not grown since the earlier count. A sudden drop can mean TikTok removed fake accounts.' : 'Follower growth is in line with how many people the videos reach.',
        benchmark: 'Typical: daily new followers are well under 15% of average views per video.',
      });
    } else S.push({ id: 'growth', name: 'Follower growth', level: 'na', value: '—', detail: 'needs an earlier count', explanation: 'Add an earlier follower count and its date, or scan the same account again later.', pro: true });

    // 9. Comment quality
    if (input.comments && input.comments.filter((c) => c.trim()).length >= 5) {
      const c = analyzeComments(input.comments);
      const level: Level = c.lowShare > 0.6 || c.duplicates / c.total > 0.3 ? 'bad' : c.lowShare > 0.35 || c.promo / c.total > 0.2 ? 'warn' : 'ok';
      S.push({
        id: 'commentq', name: 'Comment quality', level, pro: true, value: pct(c.lowShare, 0), detail: `low-effort, of ${c.total} comments`,
        explanation: level !== 'ok'
          ? `${c.emojiOnly} emoji-only, ${c.generic} generic one-liners, ${c.duplicates} repeats and ${c.promo} self-promotion in the sample. Comment bots post short, interchangeable messages like these.`
          : `Most comments in the sample are specific to the video. ${c.emojiOnly} emoji-only and ${c.generic} generic one-liners is normal.`,
        benchmark: 'Typical: under 35% low-effort comments. Strong warning above 60% or lots of repeats.',
      });
    } else S.push({ id: 'commentq', name: 'Comment quality', level: 'na', value: '—', detail: 'needs 5+ comments', explanation: 'Paste at least five comments from recent videos.', pro: true });
  }

  const scored = S.filter((s) => s.level !== 'na');
  const strong = scored.filter((s) => s.level === 'bad').length;
  const minor = scored.filter((s) => s.level === 'warn').length;
  const score = scored.length ? Math.round(((strong * 2 + minor) / (scored.length * 2)) * 100) : null;
  const band: ScanResult['band'] = score === null ? 'na' : score >= 55 ? 'bad' : score >= 25 ? 'warn' : 'ok';
  const verdict = { na: 'Not enough data', ok: 'Looks organic', warn: 'Some warning signs', bad: 'Strong signs of fake engagement' }[band];
  const summary = {
    na: 'Fill in more numbers to get a score.',
    ok: 'The numbers line up the way real audiences usually do.',
    warn: 'A few numbers look off. Check the comments and follower list.',
    bad: 'Several numbers look like bought followers or likes.',
  }[band];

  return { handle: input.handle, score, band, verdict, summary, signals: S, checksUsed: scored.length, strong, minor, tier, pro };
}

/* ---------- validation of untrusted request bodies ---------- */

export function sanitizeInput(body: any, pro: boolean): { input?: ScanInput; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'Missing scan details.' };
  const t = parseTarget(String(body.target ?? ''));
  if ('error' in t) return { error: t.error };
  const num = (x: unknown) => {
    const n = parseNum(x);
    if (Number.isNaN(n)) throw new Error('bad');
    return n;
  };
  try {
    const max = pro ? PRO_MAX_VIDEOS : FREE_MAX_VIDEOS;
    const videos: VideoStats[] = (Array.isArray(body.videos) ? body.videos : []).slice(0, max).map((r: any) => ({
      views: num(r?.views), likes: num(r?.likes), comments: num(r?.comments), shares: num(r?.shares),
    }));
    const input: ScanInput = {
      handle: t.handle,
      followers: num(body.followers),
      following: num(body.following),
      totalLikes: num(body.totalLikes),
      videoCount: num(body.videoCount),
      videos,
    };
    if (pro) {
      input.comments = Array.isArray(body.comments)
        ? body.comments.map((c: unknown) => String(c).slice(0, 300)).slice(0, PRO_MAX_COMMENTS)
        : typeof body.comments === 'string' ? body.comments.split('\n').map((c: string) => c.slice(0, 300)).slice(0, PRO_MAX_COMMENTS) : [];
      input.previousFollowers = num(body.previousFollowers);
      const d = String(body.previousDate ?? '');
      input.previousDate = /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(d) <= new Date() ? d : null;
    }
    if (!(input.followers && input.followers > 0) || videos.filter((x) => (x.views ?? 0) > 0).length < 2)
      return { error: 'Add at least the follower count and the views and likes for two videos.' };
    return { input };
  } catch {
    return { error: "Some numbers couldn't be read. Use digits with an optional K, M or B, like 12,400 or 1.2M." };
  }
}
