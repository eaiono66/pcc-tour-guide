export const VILLAGE_NUMBER: Record<string, number> = {
  samoa: 1, aotearoa: 2, fiji: 3, hawaii: 4, tahiti: 5, tonga: 6,
};

export const ADJACENCY: Record<string, string> = {
  '1-2':'ok',  '1-3':'ok',  '1-4':'btw', '1-5':'btw', '1-6':'ok',
  '2-1':'ok',  '2-3':'ok',  '2-4':'ok',  '2-5':'after','2-6':'ok',
  '3-1':'ok',  '3-2':'ok',  '3-4':'ok',  '3-5':'after','3-6':'ok',
  '4-1':'btw', '4-2':'before','4-3':'ok','4-5':'ok',  '4-6':'before',
  '5-1':'before','5-2':'before','5-3':'before','5-4':'before','5-6':'before',
  '6-1':'ok',  '6-2':'ok',  '6-3':'ok',  '6-4':'after','6-5':'after',
};

export const CANOE = {
  hema: { label: 'Hema (South Landing)', direction: 'north', opensAt: '13:30', closesAt: '17:00' },
  akau: { label: 'Akau (North Landing)', direction: 'south', opensAt: '14:00', closesAt: '17:00' },
};

export const SHOWS: Record<string, Record<string, string[]>> = {
  samoa: {
    'Tree of Life':               ['12:30','14:00','15:00','16:30'],
    'Traditional Cooking':        ['13:30','14:30'],
    'Traditional Food Tasting':   ['15:30'],
    'Tree of Life & Fire Knife':  ['15:30','16:00'],
  },
  aotearoa: {
    'Te Whare Tapere':            ['12:30','17:00'],
    'Toi Whakaari Māori':         ['14:00','15:00','16:00'],
    'Mau Rākau (Māori Weaponry)': ['14:30','15:30'],
  },
  fiji: {
    'Derua Instrument Activity':         ['12:30','17:00'],
    'Canoe & Navigation Stories':        ['13:30','16:30'],
    'Migration through Chants & Dance':  ['14:00','15:00','16:00'],
    'Derua Presentation':                ['14:30','15:30'],
  },
  hawaii: {
    "Kūpa'a Hawai'i: Stories of Aloha": ['13:30','14:30','15:30','16:30','17:00'],
  },
  tahiti: {
    'Rhythms of the Islands':    ['12:30','13:30','16:30'],
    'Tahiti Dance':               ['14:00','15:00'],
    'Tahitian Wedding Ceremony': ['14:30','15:30'],
    'Intro to French Polynesia': ['14:30'],
  },
  tonga: {
    'Cultural Core Values':             ['12:30'],
    'Cultural Core Values & the Nafa':  ['14:00','15:00','16:00','16:30'],
  },
};

export const SPECIAL_EVENTS = {
  huki: {
    title: 'Huki — A Canoe Celebration',
    time: '13:00', endTime: '13:20',
    desc: "Head to the lagoon — this canoe-side show only happens once a day. Don't miss it!",
  },
};

export const CROWD_FLAGS: Record<string, { flag: string; note: string }> = {
  'Tree of Life & Fire Knife':        { flag: 'busy_early',   note: 'Most watched show of the day — arrive 10+ mins early. Pre-show starts 10 mins before!' },
  'Tree of Life':                     { flag: 'preshow',      note: 'Pre-show starts 10 mins before — arrive early!' },
  'Traditional Cooking':              { flag: 'preshow',      note: 'Pre-show starts 10 mins before!' },
  'Traditional Food Tasting':         { flag: 'preshow',      note: 'Pre-show starts 10 mins before!' },
  'Tahitian Wedding Ceremony':        { flag: 'indoor_small', note: 'Small indoor venue — arrive 5-10 mins early' },
  'Migration through Chants & Dance': { flag: 'early',        note: 'Popular show — arrive a few mins early' },
  'Cultural Core Values & the Nafa':  { flag: 'early',        note: 'Popular show — large outdoor venue' },
  'Derua Presentation':               { flag: 'gem',          note: '💎 Hidden gem — worth seeking out' },
  'Tahiti Dance':                     { flag: 'gem',          note: '💎 Local favorite — most guests miss this one' },
};

export const INTEREST_SHOWS: Record<string, string[]> = {
  watch_performances: ['Toi Whakaari Māori','Rhythms of the Islands','Tahitian Wedding Ceremony',"Kūpa'a Hawai'i: Stories of Aloha",'Cultural Core Values & the Nafa','Tree of Life & Fire Knife'],
  hands_on:          ['Derua Presentation','Traditional Cooking','Traditional Food Tasting','Mau Rākau (Māori Weaponry)'],
  learn_history:     ['Toi Whakaari Māori','Intro to French Polynesia','Te Whare Tapere','Cultural Core Values'],
  food:              ['Traditional Cooking','Traditional Food Tasting','Derua Presentation'],
};

export const GROUP_VILLAGE_PRIORITY: Record<string, string[]> = {
  family_kids:  ['samoa','hawaii','fiji','tonga','aotearoa','tahiti'],
  family_teens: ['samoa','aotearoa','fiji','tonga','hawaii','tahiti'],
  couple:       ['tahiti','aotearoa','tonga','fiji','hawaii','samoa'],
  friends:      ['fiji','samoa','tahiti','aotearoa','tonga','hawaii'],
  solo:         ['samoa','tahiti','aotearoa','fiji','tonga','hawaii'],
};

export const INTEREST_VILLAGE_BOOST: Record<string, string[]> = {
  watch_performances: ['tahiti','tonga','hawaii'],
  hands_on:           ['fiji','samoa','aotearoa'],
  learn_history:      ['aotearoa','fiji','tonga'],
  food:               ['samoa','fiji','hawaii'],
};

export interface Ticket {
  id: string;
  name: string;
  desc: string;
  hasDinner: boolean;
  hasShow: boolean;
  badge: string | null;
  divider?: boolean;
  dinnerTitle?: string;
  dinnerDesc?: string;
}

export const TICKETS: Record<string, Ticket> = {
  islands: {
    id: 'islands', name: 'Islands of Polynesia',
    desc: 'Self-guided tour through all 6 island villages',
    hasDinner: false, hasShow: false, badge: null,
  },
  'islands-ha': {
    id: 'islands-ha', name: 'Islands of Polynesia + Hā Show',
    desc: 'Self-guided villages + Hā: Breath of Life evening show',
    hasDinner: false, hasShow: true, badge: 'show',
  },
  gateway: {
    id: 'gateway', name: 'Gateway Buffet',
    desc: 'Self-guided villages + island buffet dinner + Hā Silver seating',
    hasDinner: true, hasShow: true, badge: 'popular',
    dinnerTitle: 'Gateway Buffet',
    dinnerDesc: 'Gateway Buffet opens at 4:30 PM and runs until 6:30 PM — head over when you\'re ready.',
  },
  'self-alii': {
    id: 'self-alii', name: "Self-Guided Ali'i Lū'au",
    desc: "Declined guided tour — Ali'i Lu'au dinner + Hā Gold seating",
    hasDinner: true, hasShow: true, badge: 'self', divider: true,
    dinnerTitle: "Ali'i Lu'au",
    dinnerDesc: "The Ali'i Lu'au venue opens at 4:30 PM — get settled in. The show officially starts at 5:00 PM.",
  },
};

export const BUSY_DAYS = new Set([1, 4, 5]);

export const TIMING = {
  SHOW_DURATION_MIN:    20,
  WALK_BUFFER_MIN:       5,
  CANOE_DURATION_MIN:   15,
  MAX_SCHEDULE_GAP_MIN: 120,
  DINNER_CUTOFF:        '16:00',
  HA_SEATING:           '19:00',
};

export const ARRIVAL_TIME_OPTIONS = [
  '12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM',
];

export const ARRIVAL_TIME_MAP: Record<string, string> = {
  '12:30 PM':'12:30','1:00 PM':'13:00','1:30 PM':'13:30',
  '2:00 PM':'14:00','2:30 PM':'14:30','3:00 PM':'15:00',
  '3:30 PM':'15:30','4:00 PM':'16:00','4:30 PM':'16:30',
  '5:00 PM':'17:00',
};

export const QUESTIONS = [
  {
    id: 'group', label: 'Your group', title: "Who's joining you today?",
    sub: "We'll tailor your day around your crew.", type: 'single' as const,
    options: [
      { value: 'family_kids',  icon: '👨‍👩‍👧‍👦', label: 'Family',  sub: 'With young kids' },
      { value: 'family_teens', icon: '👨‍👩‍👦', label: 'Family',  sub: 'With teens' },
      { value: 'couple',       icon: '❤️',    label: 'Couple',  sub: 'Just the two of us' },
      { value: 'friends',      icon: '🤙',    label: 'Friends', sub: 'Group of adults' },
      { value: 'solo',         icon: '🙋',    label: 'Solo',    sub: 'Just me' },
    ],
  },
  {
    id: 'vibe', label: 'Your style', title: 'How do you like to experience a new culture?',
    sub: 'Pick everything that sounds like you.', type: 'multi' as const,
    options: [
      { value: 'watch_performances', icon: '🎭', label: 'Watch performances', sub: 'Sit back and enjoy' },
      { value: 'hands_on',           icon: '🤲', label: 'Get hands-on',       sub: 'Try it yourself' },
      { value: 'learn_history',      icon: '📖', label: 'Learn the stories',  sub: 'History & meaning' },
      { value: 'food',               icon: '🍖', label: 'Eat everything',     sub: 'Food first' },
    ],
  },
  {
    id: 'connection', label: 'Your roots', title: 'Any personal connection to these cultures?',
    sub: "We'll make sure you don't miss your heritage.", type: 'multi' as const,
    options: [
      { value: 'samoa',    icon: '🌊', label: 'Samoa',    sub: '' },
      { value: 'hawaii',   icon: '🌺', label: "Hawai'i",  sub: '' },
      { value: 'tonga',    icon: '👑', label: 'Tonga',    sub: '' },
      { value: 'fiji',     icon: '🔥', label: 'Fiji',     sub: '' },
      { value: 'tahiti',   icon: '🌸', label: 'Tahiti',   sub: '' },
      { value: 'aotearoa', icon: '🍃', label: 'Aotearoa', sub: '' },
      { value: 'none',     icon: '🌏', label: 'No connection', sub: 'All new to me' },
    ],
  },
  {
    id: 'arrival', label: 'Your arrival', title: 'What time are you arriving?',
    sub: "We'll catch you the best shows at the right times.", type: 'select' as const,
    options: ARRIVAL_TIME_OPTIONS,
  },
  {
    id: 'ticket', label: 'Your ticket', title: 'What ticket do you have?',
    sub: "This tells us what's included in your day.", type: 'ticket' as const,
    options: [],
  },
];
