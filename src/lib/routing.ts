import {
  ADJACENCY, CANOE, CROWD_FLAGS, GROUP_VILLAGE_PRIORITY,
  INTEREST_SHOWS, INTEREST_VILLAGE_BOOST, SHOWS,
  SPECIAL_EVENTS, TICKETS, TIMING, VILLAGE_ACTIVITIES, VILLAGE_NUMBER,
} from './data';

export interface ScheduleStop {
  time: string;
  timeMin: number;
  type: 'show' | 'canoe' | 'huki' | 'dinner' | 'foodtruck' | 'ha_show';
  village: string;
  title: string;
  desc: string;
  flags: string[];
  highlight?: boolean;
  activities?: string[];
}

export interface ScheduleResult {
  stops: ScheduleStop[];
  isLate: boolean;
  needsUpgrade: boolean;
  islandsOnly: boolean;
  canoeUsed: boolean;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toDisplayTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function timeToDisplay(time: string): string {
  return toDisplayTime(toMinutes(time));
}

function isTransitionValid(
  from: string | null, to: string, canoeUsed: boolean, canoeIsNext: boolean
): boolean {
  if (!from || !to) return true;
  const fromNum = VILLAGE_NUMBER[from];
  const toNum   = VILLAGE_NUMBER[to];
  const rule    = ADJACENCY[`${fromNum}-${toNum}`];
  if (!rule || rule === 'ok') return true;
  if (rule === 'before') return canoeUsed;
  if (rule === 'after')  return canoeIsNext;
  if (rule === 'btw')    return false;
  return true;
}

function getNextCanoeTime(afterMin: number, direction: 'north' | 'south'): number | null {
  const landing   = direction === 'north' ? CANOE.hema : CANOE.akau;
  const opensMin  = toMinutes(landing.opensAt);
  const closesMin = toMinutes(landing.closesAt);
  const earliest  = Math.max(afterMin, opensMin);
  return earliest < closesMin ? earliest : null;
}

function buildCanoeStop(timeMin: number, direction: 'north' | 'south'): ScheduleStop {
  const landing = direction === 'north' ? CANOE.hema : CANOE.akau;
  const dest    = direction === 'north' ? 'northern villages' : 'southern villages';
  return {
    time: toDisplayTime(timeMin), timeMin,
    type: 'canoe', village: 'Lagoon',
    title: `Canoe Ride — ${landing.label}`,
    desc: `Board at ${landing.label} and ride to the ${dest}. One-way scenic trip — canoes run continuously, just show up.`,
    flags: ['transport'],
  };
}

function getBestShow(
  village: string, afterMin: number, preferredShows: string[], cutoffMin: number
): { name: string; time: string; timeMin: number } | null {
  const villageShows = SHOWS[village];
  if (!villageShows) return null;

  let best: { name: string; time: string; timeMin: number } | null = null;
  let bestScore = -1;
  let bestDiff = Infinity;

  for (const [name, times] of Object.entries(villageShows)) {
    for (const time of times) {
      const timeMin = toMinutes(time);
      if (timeMin < afterMin) continue;
      if (timeMin > cutoffMin) continue;
      if (timeMin - afterMin > TIMING.MAX_SCHEDULE_GAP_MIN) continue;
      const diff = timeMin - afterMin;
      const score = preferredShows.includes(name) ? 1 : 0;
      if (score > bestScore || (score === bestScore && diff < bestDiff)) {
        bestScore = score; bestDiff = diff;
        best = { name, time, timeMin };
      }
    }
  }
  return best;
}

function getPreferredShows(interests: string[]): string[] {
  const preferred = new Set<string>();
  interests.forEach(i => (INTEREST_SHOWS[i] || []).forEach(s => preferred.add(s)));
  return [...preferred];
}

function getPriorityVillages(group: string, interests: string[], connection: string[]): string[] {
  const priority: string[] = [];
  const addUnique = (v: string) => { if (!priority.includes(v)) priority.push(v); };

  connection.filter(c => c !== 'none').forEach(addUnique);
  interests.forEach(i => (INTEREST_VILLAGE_BOOST[i] || []).forEach(addUnique));
  const defaults = GROUP_VILLAGE_PRIORITY[group] || GROUP_VILLAGE_PRIORITY.solo;
  defaults.forEach(addUnique);
  return priority;
}

function assignActivities(
  village: string,
  interests: string[],
  energy: string,
  group: string
): string[] {
  const activities = VILLAGE_ACTIVITIES[village.toLowerCase()];
  if (!activities) return [];

  const energyRank: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const guestEnergy = energyRank[energy] ?? 1;

  return activities
    .filter(a => {
      if (energyRank[a.energyMin] > guestEnergy) return false;
      if (group === 'family_kids' && a.ageMin > 8) return false;
      return true;
    })
    .sort((a, b) => {
      const aScore = a.tags.filter(t => interests.includes(t)).length;
      const bScore = b.tags.filter(t => interests.includes(t)).length;
      return bScore - aScore;
    })
    .slice(0, 3)
    .map(a => a.name);
}

function buildShowStop(
  village: string,
  showName: string,
  time: string,
  isBusy: boolean,
  usedVillages: Set<string>,
  interests: string[] = [],
  energy: string = 'medium',
  group: string = 'solo',
  highlight = false
): ScheduleStop | null {
  if (usedVillages.has(village)) return null;
  usedVillages.add(village);

  const timeMin   = toMinutes(time);
  const crowdInfo = CROWD_FLAGS[showName];
  const flags: string[] = [];
  let desc = '';

  if (crowdInfo) {
    flags.push(isBusy && crowdInfo.flag === 'early' ? 'busy_early' : crowdInfo.flag);
    desc = isBusy
      ? crowdInfo.note.replace('5-10 mins', '10-15 mins').replace('a few mins', '7-10 mins')
      : crowdInfo.note;
  }

  return {
    time: timeToDisplay(time), timeMin, type: 'show',
    village: village.charAt(0).toUpperCase() + village.slice(1),
    title: showName, desc, flags, highlight,
    activities: assignActivities(village, interests, energy, group),
  };
}

function buildSmartRoute(
  arrMin: number, priority: string[], preferredShows: string[],
  isBusy: boolean, lastShowCutoff: number,
  interests: string[] = [], energy: string = 'medium', group: string = 'solo'
): ScheduleStop[] {
  const stops: ScheduleStop[] = [];
  const usedVillages = new Set<string>();
  let curMin = arrMin;
  let lastVillage: string | null = null;
  let canoeUsed = false;

  function addStop(stop: ScheduleStop | null) {
    if (!stop) return;
    stops.push(stop);
    curMin = stop.timeMin + TIMING.SHOW_DURATION_MIN + TIMING.WALK_BUFFER_MIN;
    if (stop.type === 'canoe') canoeUsed = true;
    if (stop.type === 'show') lastVillage = stop.village.toLowerCase();
  }

  // Phase 1: Huki
  const hukiMin = toMinutes(SPECIAL_EVENTS.huki.time);
  if (arrMin <= hukiMin) {
    addStop({
      time: timeToDisplay(SPECIAL_EVENTS.huki.time), timeMin: hukiMin,
      type: 'huki', village: 'All Villages',
      title: SPECIAL_EVENTS.huki.title, desc: SPECIAL_EVENTS.huki.desc,
      flags: ['dont_miss'],
    });
    curMin = toMinutes(SPECIAL_EVENTS.huki.endTime);
  }

  const southVillages  = priority.filter(v => ['samoa','tonga'].includes(v));
  const northVillages  = priority.filter(v => ['tahiti','hawaii'].includes(v));
  const middleVillages = priority.filter(v => ['aotearoa','fiji'].includes(v));
  const goingNorth     = northVillages.length > 0;

  // Phase 2: South (skip Samoa, save for fire knife)
  for (const v of southVillages.filter(v => v !== 'samoa')) {
    if (usedVillages.has(v)) continue;
    const show = getBestShow(v, curMin, preferredShows, lastShowCutoff);
    if (!show || !isTransitionValid(lastVillage, v, canoeUsed, false)) continue;
    addStop(buildShowStop(v, show.name, show.time, isBusy, usedVillages, interests, energy, group));
  }

  // Phase 3: Canoe north
  if (goingNorth && !canoeUsed && curMin <= toMinutes('16:30')) {
    const canoeMin = getNextCanoeTime(curMin, 'north');
    if (canoeMin) addStop(buildCanoeStop(canoeMin, 'north'));
  }

  // Phase 4: North + middle
  for (const v of [...northVillages, ...middleVillages.filter(v => !usedVillages.has(v))]) {
    if (usedVillages.has(v)) continue;
    const show = getBestShow(v, curMin, preferredShows, lastShowCutoff);
    if (!show || !isTransitionValid(lastVillage, v, canoeUsed, false)) continue;
    addStop(buildShowStop(v, show.name, show.time, isBusy, usedVillages, interests, energy, group));
  }

  // Phase 5: Remaining middle
  for (const v of middleVillages) {
    if (usedVillages.has(v)) continue;
    if (curMin >= toMinutes('15:30')) break;
    const show = getBestShow(v, curMin, preferredShows, lastShowCutoff);
    if (!show || !isTransitionValid(lastVillage, v, canoeUsed, false)) continue;
    addStop(buildShowStop(v, show.name, show.time, isBusy, usedVillages, interests, energy, group));
  }

  // Phase 6: 4PM Samoa Fire Knife
  const fireKnifeMin     = toMinutes('16:00');
  const preShowBufferMin = toMinutes('15:40');

  if (!usedVillages.has('samoa') && curMin <= preShowBufferMin && fireKnifeMin <= lastShowCutoff) {
    if (lastVillage && ['hawaii','tahiti'].includes(lastVillage) && !canoeUsed) {
      const canoeMin = getNextCanoeTime(curMin, 'south');
      if (canoeMin && canoeMin + TIMING.CANOE_DURATION_MIN <= preShowBufferMin) {
        addStop(buildCanoeStop(canoeMin, 'south'));
        lastVillage = null;
      }
    }
    if (isTransitionValid(lastVillage, 'samoa', canoeUsed, false)) {
      addStop(buildShowStop('samoa', 'Tree of Life & Fire Knife', '16:00', isBusy, usedVillages, interests, energy, group, true));
    }
  } else if (!usedVillages.has('samoa')) {
    const samoaShow = getBestShow('samoa', curMin, preferredShows, lastShowCutoff);
    if (samoaShow && isTransitionValid(lastVillage, 'samoa', canoeUsed, false)) {
      addStop(buildShowStop('samoa', samoaShow.name, samoaShow.time, isBusy, usedVillages, interests, energy, group));
    }
  }

  return stops.filter(Boolean) as ScheduleStop[];
}

function buildLateRoute(
  arrMin: number, priority: string[], isBusy: boolean, lastShowCutoff: number,
  interests: string[] = [], energy: string = 'medium', group: string = 'solo'
): ScheduleStop[] {
  const stops: ScheduleStop[] = [];
  const usedVillages = new Set<string>();
  let curMin = arrMin;
  let lastVillage: string | null = null;

  for (const v of priority.slice(0, 3)) {
    if (usedVillages.has(v)) continue;
    const show = getBestShow(v, curMin, [], lastShowCutoff);
    if (!show || !isTransitionValid(lastVillage, v, false, false)) continue;
    const stop = buildShowStop(v, show.name, show.time, isBusy, usedVillages, interests, energy, group);
    if (!stop) continue;
    stops.push(stop);
    curMin      = stop.timeMin + TIMING.SHOW_DURATION_MIN + TIMING.WALK_BUFFER_MIN;
    lastVillage = v;
  }
  return stops;
}

export function buildSchedule(params: {
  arrival: string; group: string; interests: string[];
  connection: string[]; ticket: string; isBusy: boolean; energy?: string;
}): ScheduleResult {
  const { arrival, group, interests, connection, ticket, isBusy, energy = 'medium' } = params;
  const ticketData   = TICKETS[ticket];
  const arrMin       = toMinutes(arrival);
  const isLateArrival = arrMin >= toMinutes('16:30');

  const lastShowCutoff = ticketData.hasDinner
    ? toMinutes(TIMING.DINNER_CUTOFF)
    : toMinutes('17:00');

  const priority       = getPriorityVillages(group, interests, connection);
  const preferredShows = getPreferredShows(interests);

  let stops: ScheduleStop[] = isLateArrival
    ? buildLateRoute(arrMin, priority, isBusy, lastShowCutoff, interests, energy, group)
    : buildSmartRoute(arrMin, priority, preferredShows, isBusy, lastShowCutoff, interests, energy, group);

  stops = stops
    .filter(s => s.timeMin >= arrMin)
    .sort((a, b) => a.timeMin - b.timeMin);

  // End-of-day south positioning
  const lastVillageStop  = [...stops].reverse().find(s => s.type === 'show');
  const canoeAlreadyUsed = stops.some(s => s.type === 'canoe');
  const northEndVillages = new Set(['hawaii','tahiti']);

  if (lastVillageStop && !canoeAlreadyUsed && northEndVillages.has(lastVillageStop.village.toLowerCase())) {
    const afterLastShow = lastVillageStop.timeMin + TIMING.SHOW_DURATION_MIN + TIMING.WALK_BUFFER_MIN;
    const canoeMin      = getNextCanoeTime(afterLastShow, 'south');
    if (canoeMin && canoeMin <= toMinutes('17:00')) {
      stops.push(buildCanoeStop(canoeMin, 'south'));
      stops.sort((a, b) => a.timeMin - b.timeMin);
    }
  }

  if (ticketData.hasDinner) {
    stops.push({
      time: '5:30 PM', timeMin: toMinutes('17:30'),
      type: 'dinner', village: 'Dining',
      title: ticketData.dinnerTitle!, desc: ticketData.dinnerDesc!, flags: [],
    });
  }

  if (!ticketData.hasDinner) {
    stops.push({
      time: '5:00 PM', timeMin: toMinutes('17:00'),
      type: 'foodtruck',
      village: 'Dining',
      title: 'Dinner — Your Choice',
      desc: 'Hukilau Marketplace is steps away — Pounders Restaurant (sit-down) and food trucks available. Or head out to explore nearby Lāʻie.',
      flags: ['dining_choice'],
    });
  }

  if (ticketData.hasShow) {
    stops.push({
      time: '7:30 PM', timeMin: toMinutes('19:30'),
      type: 'ha_show', village: 'Hā Theater',
      title: 'Hā: Breath of Life',
      desc: 'Seating opens at 7:00 PM — head to the Hā Theater early for the best seats. Show starts at 7:30 PM.',
      flags: ['dont_miss'],
    });
  }

  return {
    stops,
    isLate: isLateArrival,
    needsUpgrade: ticket === 'islands',
    islandsOnly: !ticketData.hasDinner,
    canoeUsed: stops.some(s => s.type === 'canoe'),
  };
}
