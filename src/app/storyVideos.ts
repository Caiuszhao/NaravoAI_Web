const STORY_BASE = 'https://jiatingkupao.com/story_last_day';

export const STORY1_VIDEOS = {
  intro: `${STORY_BASE}/index_1.mp4`,
  loop: `${STORY_BASE}/index_2.mp4`,
  branches: {
    click: `${STORY_BASE}/ep_2.mp4`,
    hold: `${STORY_BASE}/ep_3.mp4`,
    rapid: `${STORY_BASE}/ep_4.mp4`,
  },
} as const;
