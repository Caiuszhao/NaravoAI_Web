const STORY_BASE = 'https://jiatingkupao.com/story_last_day';
const COS_STORY_BASE = 'https://playable-1257281110.cos.ap-guangzhou.myqcloud.com/story_last_day';

export const STORY1_VIDEOS = {
  intro: `${STORY_BASE}/index_1.mp4`,
  loop: `${STORY_BASE}/index_2.mp4`,
  branches: {
    click: `${STORY_BASE}/ep_2.mp4`,
    hold: `${STORY_BASE}/ep_3.mp4`,
    rapid: `${STORY_BASE}/ep_4.mp4`,
  },
} as const;

// Demo 3 assets: sourced from mp4 filenames in
// `D:\B04Playable\playable_video\fmp4_convert\fmp4\` and hosted under `/demo2/`.
// Index starts at 1 (i.e. array[0] is index 1).
export const DEMO3_VIDEOS = [
  'index_1.mp4',
  'ep_2.mp4',
  'ep_3_1.mp4',
  'ep_3_2.mp4',
  'ep_3_3.mp4',
  'ep_3-4.mp4',
  'ep_4_5.mp4',
  'ep_3_5.mp4',
  'ep_3_6.mp4',
  'ep4_2.mp4',
  'ep_4_1.mp4',
  'ep_4_3.mp4',
  'ep_4_4.mp4',
  'ep_5.mp4',
  'ep_last.mp4',
].map((name) => `${STORY_BASE}/demo2/${name}`) as readonly string[];
