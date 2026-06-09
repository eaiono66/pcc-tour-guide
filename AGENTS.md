# PCC Guest Itinerary Builder — Agent Rules

Read https://docs.expo.dev/versions/v56.0.0/ before writing any code.
Expo SDK 56, React 19, React Native 0.85.3, TypeScript strict, expo-router.

## Critical Rules
- Do NOT touch src/lib/routing.ts, src/lib/data.ts, src/lib/api.ts unless a TODO explicitly targets that file
- Do NOT touch src/app/_layout.tsx
- Do NOT restructure any files or folders
- All images use local require() — zero CDN URLs
- Primary font: Inter (system font — use fontFamily: 'Inter' or system-ui)
- Display font: BebasNeue (loaded in _layout.tsx as 'BebasNeue')
- Mono font: DMMono (loaded as 'DMMono' and 'DMMonoMedium')
- Orange accent: #E8612A — ALL buttons, progress bars, selected states
- Brown: #6B3A2A — nav header and back button icon color ONLY
- White: #FFFFFF — primary background for all question screens
- Cream: #F5EFE6 — schedule screen background only

## Image Assets
All images in assets/images/. Exact require() paths:

```typescript
const IMAGES = {
  samoa:    require('../../assets/images/village-samoa.jpg'),
  hawaii:   require('../../assets/images/village-hawaii.jpg'),
  tahiti:   require('../../assets/images/village-tahiti.jpg'),
  fiji:     require('../../assets/images/village-fiji.jpg'),
  aotearoa: require('../../assets/images/village-aotearoa.jpg'),
  tonga:    require('../../assets/images/village-tonga.jpg'),
  haShow:   require('../../assets/images/ha-show.webp'),
  huki:     require('../../assets/images/huki.jpg'),
};
```

## Island Accent Colors
```typescript
const ISLAND_COLORS: Record<string, string> = {
  samoa:    '#E8472A',
  hawaii:   '#2E7D32',
  aotearoa: '#1A237E',
  fiji:     '#212121',
  tonga:    '#B71C1C',
  tahiti:   '#6A1B9A',
};
```

---

## Active TODOs

Implement these in order. Confirm each is working before moving to the next.
Run `npx tsc --noEmit` after every change and fix all errors before proceeding.

---

### TODO 1 — Replace static walk buffer with real distance matrix
**File:** src/lib/routing.ts

Delete the existing TIMING.WALK_BUFFER_MIN constant entirely. Replace it with a
WALKING_MATRIX object that defines real walking times in minutes between every
village pair. Use these exact values:

```typescript
const WALKING_MATRIX: Record<string, Record<string, number>> = {
  entrance: { samoa: 3, tonga: 5, fiji: 7, hawaii: 10, aotearoa: 12, tahiti: 14 },
  samoa:    { entrance: 3, tonga: 4, fiji: 8, hawaii: 12, aotearoa: 14, tahiti: 15 },
  tonga:    { entrance: 5, samoa: 4, fiji: 5, hawaii: 9,  aotearoa: 11, tahiti: 12 },
  fiji:     { entrance: 7, samoa: 8, tonga: 5, hawaii: 6, aotearoa: 8,  tahiti: 10 },
  hawaii:   { entrance: 10, samoa: 12, tonga: 9, fiji: 6, aotearoa: 5,  tahiti: 5  },
  aotearoa: { entrance: 12, samoa: 14, tonga: 11, fiji: 8, hawaii: 5,   tahiti: 4  },
  tahiti:   { entrance: 14, samoa: 15, tonga: 12, fiji: 10, hawaii: 5,  aotearoa: 4 },
};
```

Add a helper function:
```typescript
function getWalkTime(from: string, to: string): number {
  return WALKING_MATRIX[from]?.[to] ?? 8;
}
```

Update every route calculation in buildSmartRoute and any other scheduling
functions to call getWalkTime(currentLocation, nextVillage) instead of the
flat constant. The schedule times must advance correctly using these real values.

---

### TODO 2 — Fix activity duration bleed
**File:** src/lib/routing.ts

Currently hands-on activities (like Fire Knife Twirling, weaving, etc.) are
attached to their parent show as metadata strings and share the same time slot.
This means a 25-minute show with a 15-minute activity is wrongly crammed into
25 minutes total.

Fix: After inserting a show ScheduleStop, check if that stop has associated
activities. For each activity, insert a second independent ScheduleStop
immediately after the show stop with:
- type: 'activity'
- its own startTime calculated from show endTime
- its own duration in minutes (use 15 min default if not specified)
- the same village assignment as the parent show

Advance currentTimeMin through both blocks so the rest of the schedule
calculates correctly off the activity end time, not the show end time.

---

### TODO 3 — Add weighted dynamic routing with crowd density
**File:** src/lib/data.ts and src/lib/routing.ts

Step 1 — In src/lib/data.ts, add a crowd_density field (number 0.0 to 1.0)
to every village showtime object. Use these simulated realistic values:
- Morning shows (before 11AM): 0.2 to 0.35
- Midday shows (11AM to 2PM): 0.6 to 0.9 (12:30PM Samoa specifically: 0.88)
- Afternoon shows (2PM to 4PM): 0.4 to 0.6
- Evening shows (after 4PM): 0.3 to 0.5

Step 2 — In src/lib/routing.ts, replace the current "pick earliest valid show"
logic with a weighted scoring system. When selecting the next show for a
village, score every available candidate using this formula:

  score = interestMatch (10 pts if show tag matches guest preferences)
        + crowdScore (8 * (1 - crowd_density) so low-density shows rank higher)
        + proximityScore (4 pts if village is adjacent based on WALKING_MATRIX)

Take the top 2 scored candidates and use a weighted random selection between
them rather than always picking index 0. Implement weightedRandomSelect as:

```typescript
function weightedRandomSelect<T extends { score: number }>(candidates: T[]): T {
  const total = candidates.reduce((sum, c) => sum + c.score, 0);
  let rand = Math.random() * total;
  for (const c of candidates) {
    rand -= c.score;
    if (rand <= 0) return c;
  }
  return candidates[candidates.length - 1];
}
```

This ensures two guests with identical inputs get slightly different optimized
paths, proving the engine responds to operational variables.

---

### TODO 4 — Add dynamic directionality based on arrival time
**File:** src/lib/routing.ts

At the very start of buildSmartRoute, before any village selection, determine
the guest's starting track based on arrival time:

- Arrival before 1:00 PM → South-First track: start at Samoa, move toward Tahiti
- Arrival at 1:00 PM or later → North-First track: start at Tahiti, move toward Samoa

This directly addresses the real 12:30 PM Samoa bottleneck. Implement by
setting an ordered village candidate list at the top of the function based on
this condition, then let the weighted scoring in TODO 3 select within that
ordered pool.

Hard constraints (Huki, dinner reservation, Ha: Breath of Life show) must still
be locked in at their fixed times regardless of which track is assigned.

---

### TODO 5 — Add Magic Start button
**File:** src/app/index.tsx

On the first screen of the QuestionView parameter input, add a 'Build it for me'
button positioned above the step indicator dots and below the screen heading.

When tapped it must:
1. Skip all 6 input screens entirely — do not animate through them
2. Read the current device time using new Date()
3. Infer a standard family persona with these exact values:
   - groupType: 'family_kids'
   - groupSize: 4
   - pace: 'medium'
   - dietaryNeeds: 'none'
   - priorityVillages: ['samoa', 'hawaii']
   - haShow: true
4. Call buildSmartRoute immediately with those inferred values
5. Transition directly to the schedule screen

Style the button:
- Full width, same horizontal padding as the existing answer option buttons
- Background: #E8612A (orange accent)
- Text: 'Build my day for me' in BebasNeue, fontSize 20, white, letterSpacing 1
- Subtitle below text: 'Skip the questions — we'll handle it' in DMMono,
  fontSize 11, rgba(255,255,255,0.7)
- borderRadius: 14
- marginBottom: 16
- A thin teal (#00D1C1) bottom border (borderBottomWidth: 3) to visually
  distinguish it from the regular answer buttons

---

### TODO 6 — Add RerouteToast component
**Files:** src/components/RerouteToast.tsx (new), src/app/index.tsx

Create a new component RerouteToast.tsx. Props:
- currentStop: ScheduleStop
- remainingStops: ScheduleStop[]
- currentLocation: string
- elapsedMinutes: number
- scheduledMinutes: number
- onReroute: (newSchedule: ScheduleStop[]) => void
- onDismiss: () => void

The toast renders as a floating card anchored above the bottom nav bar using
position absolute, bottom 90, left 16, right 16. Style:
- backgroundColor: white
- borderRadius: 16
- borderLeftWidth: 4, borderLeftColor: #00D1C1 (teal)
- padding: 14
- shadowColor black, shadowOpacity 0.15, elevation 8
- A single line of suggestion text in DMMono fontSize 12 color #475569
- One 'Reroute Day' button: full width, backgroundColor #E8612A, BebasNeue 18,
  white text, borderRadius 10, paddingVertical 10
- A small X dismiss button top-right corner

Visibility logic in index.tsx:
- Track elapsed time on the current stop using a useRef and setInterval
- Show the toast only when elapsedMinutes exceeds scheduledMinutes by more
  than 5 minutes
- When 'Reroute Day' is tapped, call buildSmartRoute again passing currentLocation
  as the new start point and filtering out already-completed stop IDs from the
  village pool — no page reload, preferences are preserved
- When dismissed, suppress the toast for 15 minutes using a suppressedUntilRef
  set to Date.now() + 15 * 60 * 1000

Wire RerouteToast into the schedule screen view in index.tsx, rendered outside
the ScrollView so it floats above the content.

---

### TODO 7 — Add WalkIndicator between timeline stops
**Files:** src/components/WalkIndicator.tsx (new), src/app/index.tsx

Create a new component WalkIndicator.tsx. Props:
- fromVillage: string
- toVillage: string
- minutes: number

Renders a compact 28px tall row with:
- A vertical dotted teal (#00D1C1) line, 1px wide, centered horizontally,
  running the full 28px height
- A small walking icon (use a unicode figure or a simple SVG path) centered
  on the line
- The walk time as text: '4 min walk' in DMMono fontSize 9 color #888,
  positioned to the right of the line

If minutes is 0 or fromVillage === toVillage, render null.

In index.tsx, in the timeline view where ScheduleStopRow components are mapped,
insert a WalkIndicator between each consecutive pair of stops:

```typescript
stops.map((stop, i) => (
  <>
    <ScheduleStopRow key={stop.id} stop={stop} />
    {i < stops.length - 1 && (
      <WalkIndicator
        fromVillage={stop.village}
        toVillage={stops[i + 1].village}
        minutes={getWalkTime(stop.village, stops[i + 1].village)}
      />
    )}
  </>
))
```

---

## After All TODOs Are Complete

Run the following test scenario to verify everything works end to end:

1. Launch app, tap 'Build my day for me' — confirm it skips questions and
   generates a schedule instantly
2. Run the same 12:00 PM arrival with Samoa + Hawaii priorities three times —
   confirm the output schedule varies between at least 2 of the 3 runs
3. Run a 1:30 PM arrival with same inputs — confirm the route starts from
   Tahiti (North-First track) not Samoa
4. On the schedule screen, check that walk time indicators appear between
   every stop and show correct minutes
5. Simulate dwelling on a stop by manually advancing the elapsed time past
   the scheduled duration + 5 minutes — confirm RerouteToast appears
6. Tap Reroute Day — confirm the remaining schedule recalculates from the
   current village without resetting guest preferences
7. Run npx tsc --noEmit — confirm zero TypeScript errors
8. Confirm all images load with no recycled assets across different screens
