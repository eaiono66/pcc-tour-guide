export const C = {
  // Brand
  primary:          '#6B3A2A',
  background:       '#F5EFE6',
  card:             '#FFFFFF',
  cardElevated:     '#FDF8F3',
  accent:           '#C8963E',
  accentLight:      '#FAEEDA',

  // Text
  textDark:         '#3B1F0F',
  textMid:          '#7A4F38',
  textLight:        '#B08070',

  // UI
  divider:          '#E5D8C8',
  navBar:           '#6B3A2A',
  progressBar:      '#C8963E',
  white:            '#FFFFFF',

  // Semantic (keep these keys so existing references don't break)
  orange:           '#C8963E',
  green:            '#2D6A2D',
  success:          '#2D6A2D',
  warning:          '#9A5B00',
  error:            '#C0392B',

  // Flag backgrounds
  flagBusy:         '#FEF3E2',
  flagBusyText:     '#9A5B00',
  flagDontMiss:     '#EBF5EB',
  flagDontMissText: '#2D6A2D',

  // Legacy aliases — keeps existing inline and mini-card references working
  bg:          '#F5EFE6',
  border:      '#E5D8C8',
  text:        '#3B1F0F',
  radius:      12,
  orangeLight: '#FAEEDA',
  orangeText:  '#7A4F38',
  orangeHover: '#6B3A2A',
  textSub:     '#7A4F38',
  textMuted:   '#B08070',
  greenLight:  '#EBF5EB',
  greenText:   '#2D6A2D',
} as const;

export const FLAG_STYLE: Record<string, { bg: string; color: string }> = {
  busy_early:   { bg: C.flagBusy,     color: C.flagBusyText },
  early:        { bg: C.flagBusy,     color: C.flagBusyText },
  gem:          { bg: C.flagDontMiss, color: C.flagDontMissText },
  preshow:      { bg: '#E6F1FB',      color: '#185FA5' },
  transport:    { bg: '#EEF0FB',      color: '#3D4AB5' },
  dont_miss:    { bg: C.flagDontMiss, color: C.flagDontMissText },
  indoor_small: { bg: C.flagBusy,     color: C.flagBusyText },
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
