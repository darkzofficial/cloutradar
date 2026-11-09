import { analyze, type ScanInput } from './scoring';

// A fictional account used for the sample reports on the home page.
export const EXAMPLE_INPUT: ScanInput = {
  handle: 'sample_creator_demo',
  followers: 412_000,
  following: 1_890,
  totalLikes: 380_000,
  videoCount: 64,
  videos: [
    { views: 6_100, likes: 2_400, comments: 11, shares: 3 },
    { views: 4_800, likes: 1_900, comments: 7, shares: 1 },
    { views: 9_300, likes: 3_000, comments: 16, shares: 8 },
    { views: 5_500, likes: 2_200, comments: 5, shares: 2 },
    { views: 38_000, likes: 4_100, comments: 52, shares: 40 },
  ],
  comments: ['🔥🔥🔥', 'nice', 'wow', 'love it', 'nice', 'follow me back', '😍😍', 'great video', 'where is this jacket from?', 'nice'],
  previousFollowers: 251_000,
  previousDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
};

export const exampleFree = () => analyze(EXAMPLE_INPUT, { pro: false });
export const examplePro = () => analyze(EXAMPLE_INPUT, { pro: true });
