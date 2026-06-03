export const C = {
  bg:           '#f5f5f0',
  card:         '#ffffff',
  border:       '#e8e8e8',
  text:         '#1a1a1a',
  textSub:      '#888888',
  textMuted:    '#aaaaaa',
  orange:       '#D85A30',
  orangeHover:  '#993C1D',
  orangeLight:  '#FAECE7',
  orangeText:   '#993C1D',
  green:        '#0F6E56',
  greenLight:   '#E1F5EE',
  greenText:    '#1D9E75',
  radius:       12,
} as const;

export const FLAG_STYLE: Record<string, { bg: string; color: string }> = {
  busy_early:   { bg: '#FEF3E2', color: '#9A5B00' },
  early:        { bg: '#FAECE7', color: '#993C1D' },
  gem:          { bg: '#E1F5EE', color: '#0F6E56' },
  preshow:      { bg: '#E6F1FB', color: '#185FA5' },
  transport:    { bg: '#EEF0FB', color: '#3D4AB5' },
  dont_miss:    { bg: '#FAECE7', color: '#993C1D' },
  indoor_small: { bg: '#FEF3E2', color: '#9A5B00' },
};

export const FLAG_LABEL: Record<string, string> = {
  busy_early:   '🔥 Arrive 10-15 mins early',
  early:        '⏰ Arrive a few mins early',
  gem:          '💎 Hidden gem',
  preshow:      '🎭 Pre-show 10 mins before',
  transport:    '🛶 Canoe transport',
  dont_miss:    "⭐ Don't miss",
  indoor_small: '🏠 Small indoor venue',
};
