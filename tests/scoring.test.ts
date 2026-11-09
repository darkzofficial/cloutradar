import { describe, it, expect } from 'vitest';
import { analyze, analyzeComments, parseNum, parseTarget, sanitizeInput, tierFor } from '@/lib/scoring';
import { EXAMPLE_INPUT } from '@/lib/example';

describe('parseNum', () => {
  it('reads shorthand and separators', () => {
    expect(parseNum('1.2M')).toBe(1_200_000);
    expect(parseNum('45k')).toBe(45_000);
    expect(parseNum('12,400')).toBe(12_400);
    expect(parseNum('')).toBeNull();
    expect(Number.isNaN(parseNum('abc'))).toBe(true);
  });
});

describe('parseTarget', () => {
  it('pulls the handle from a video link', () => {
    expect(parseTarget('https://www.tiktok.com/@Some.User_1/video/7312345')).toEqual({ handle: 'some.user_1' });
  });
  it('accepts a bare or @ handle', () => {
    expect(parseTarget('@abc')).toEqual({ handle: 'abc' });
  });
  it('rejects short share links', () => {
    expect('error' in parseTarget('https://vm.tiktok.com/ZMabc/')).toBe(true);
  });
});

describe('analyze', () => {
  const organic = {
    handle: 'organic', followers: 50_000, following: 200, totalLikes: 900_000, videoCount: 120,
    videos: [
      { views: 22_000, likes: 1_800, comments: 40, shares: 30 },
      { views: 15_000, likes: 1_100, comments: 25, shares: 12 },
      { views: 30_000, likes: 2_600, comments: 70, shares: 55 },
      { views: 18_000, likes: 1_400, comments: 33, shares: 20 },
    ],
  };
  it('scores an organic-looking account low', () => {
    const r = analyze(organic, { pro: false });
    expect(r.band).toBe('ok');
    expect(r.score).toBe(0);
    expect(r.signals).toHaveLength(6);
  });
  it('flags the example account', () => {
    const r = analyze(EXAMPLE_INPUT, { pro: false });
    expect(r.band).toBe('warn');
    expect(r.signals.find((s) => s.id === 'reach')!.level).toBe('bad');
  });
  it('adds three Pro checks with benchmarks', () => {
    const r = analyze(EXAMPLE_INPUT, { pro: true });
    expect(r.signals).toHaveLength(9);
    expect(r.signals.filter((s) => s.pro).map((s) => s.id)).toEqual(['shares', 'growth', 'commentq']);
    expect(r.signals[0].benchmark).toBeTruthy();
    expect(r.tier).toBe('mid');
    expect(r.signals.find((s) => s.id === 'commentq')!.level).toBe('bad');
  });
  it('returns no score without data', () => {
    const r = analyze({ handle: 'x', followers: null, following: null, totalLikes: null, videoCount: null, videos: [] }, { pro: false });
    expect(r.score).toBeNull();
    expect(r.band).toBe('na');
  });
});

describe('sanitizeInput', () => {
  it('caps free scans at 5 videos and drops Pro fields', () => {
    const body = { target: '@abc', followers: '10K', videos: Array.from({ length: 12 }, () => ({ views: '1K', likes: '100' })), comments: 'hi\nyo' };
    const { input } = sanitizeInput(body, false);
    expect(input!.videos).toHaveLength(5);
    expect(input!.comments).toBeUndefined();
  });
  it('rejects unreadable numbers', () => {
    expect(sanitizeInput({ target: '@abc', followers: 'lots', videos: [] }, false).error).toMatch(/couldn't be read/);
  });
  it('rejects future comparison dates', () => {
    const { input } = sanitizeInput({ target: '@abc', followers: '10K', previousFollowers: '5K', previousDate: '2999-01-01',
      videos: [{ views: '1K', likes: '100' }, { views: '2K', likes: '150' }] }, true);
    expect(input!.previousDate).toBeNull();
  });
});

describe('helpers', () => {
  it('assigns tiers', () => {
    expect(tierFor(5_000)).toBe('nano');
    expect(tierFor(2_000_000)).toBe('macro');
  });
  it('spots bot-style comments', () => {
    const c = analyzeComments(['🔥🔥', 'nice', 'nice', 'follow me back', 'how did you film the second shot?']);
    expect(c.emojiOnly).toBe(1);
    expect(c.duplicates).toBe(2);
    expect(c.promo).toBe(1);
  });
});
