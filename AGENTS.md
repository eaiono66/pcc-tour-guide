# PCC Tour Guide — UI Rebuild

Read https://docs.expo.dev/versions/v56.0.0/ before writing any code.
This is an Expo SDK 56 app with expo-router, TypeScript strict mode, React 19.

## Execution Rules
- Execute all steps below IN ORDER
- Do NOT stop between steps to ask for confirmation
- Do NOT restructure files, rename files, or change routing
- Do NOT touch any logic, state management, routing.ts, or data.ts
- If a step has an error, note it, skip it, and continue
- At the end print a summary: STEP 1: DONE/SKIPPED, etc.

---

## STEP 1 — Load Fonts in _layout.tsx

Replace the entire contents of src/app/_layout.tsx with:

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'BebasNeue': require('../../assets/fonts/BebasNeue-Regular.ttf'),
    'InstrumentSerif': require('../../assets/fonts/InstrumentSerif-Italic.ttf'),
    'DMMono': require('../../assets/fonts/DMMono-Regular.ttf'),
    'DMMonoMedium': require('../../assets/fonts/DMMono-Medium.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

---

## STEP 2 — Install Dependencies

Run these commands:
```
npx expo install expo-linear-gradient
npx expo install react-native-view-shot
npx expo install expo-sharing
npx expo install expo-media-library
```

---

## STEP 3 — Header and Progress Bar

In src/app/index.tsx update ONLY these StyleSheet entries:

s.headerSub:
  fontFamily: 'DMMono'
  fontSize: 9
  color: 'rgba(255,255,255,0.5)'
  letterSpacing: 2
  textTransform: 'uppercase'
  marginBottom: 2

s.headerTitle:
  fontFamily: 'BebasNeue'
  fontSize: 36
  color: '#FFFFFF'
  letterSpacing: 1
  lineHeight: 36

s.header:
  backgroundColor: C.primary
  paddingHorizontal: 20
  paddingTop: 16
  paddingBottom: 14
  shadowColor: '#3B1F0F'
  shadowOffset: { width: 0, height: 3 }
  shadowOpacity: 0.2
  shadowRadius: 6
  elevation: 6

s.progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)' }
s.progressFill: { backgroundColor: C.accent, borderRadius: 0, height: 3 }

---

## STEP 4 — Question Titles and Step Indicator

In src/app/index.tsx:

1. Update these StyleSheet entries:

s.qLabel:
  fontFamily: 'DMMono'
  fontSize: 10
  color: C.textMid
  textTransform: 'uppercase'
  letterSpacing: 1.4
  marginBottom: 6

s.qTitle:
  fontFamily: 'InstrumentSerif'
  fontSize: 28
  color: C.textDark
  marginBottom: 4
  lineHeight: 34

s.qSub:
  fontFamily: 'DMMono'
  fontSize: 11
  color: C.textMid
  marginBottom: 24
  letterSpacing: 0.3

s.mainBtnText:
  fontFamily: 'BebasNeue'
  fontSize: 20
  color: '#FFFFFF'
  letterSpacing: 1

2. In QuestionView function, after the <Text style={s.qLabel}> line,
   add this step indicator before <Text style={s.qTitle}>:

```tsx
<View style={s.stepRow}>
  <Text style={s.stepCounter}>
    {String(step + 1).padStart(2,'0')} / {String(QUESTIONS.length).padStart(2,'0')}
  </Text>
  <View style={s.stepDots}>
    {QUESTIONS.map((_: any, i: number) => (
      <View key={i} style={[s.stepDot, i === step && s.stepDotActive, i < step && s.stepDotDone]} />
    ))}
  </View>
</View>
```

3. Add to StyleSheet:
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
  stepCounter: { fontFamily: 'DMMono', fontSize: 11, color: C.textMid, letterSpacing: 0.1 }
  stepDots: { flexDirection: 'row', gap: 5 }
  stepDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.divider }
  stepDotActive: { backgroundColor: C.accent, width: 16 }
  stepDotDone: { backgroundColor: C.primary }

---

## STEP 5 — Photo Grid Cards for Single Select

In src/app/index.tsx:

1. Add these imports at the top (after existing imports):
```typescript
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
```

2. Add this constant after STOP_TYPE_ICONS:
```typescript
const QUESTION_PHOTOS: Record<string, string> = {
  family_kids:  'https://www.polynesia.com/globalassets/samoa-climibing-the-coconut-tree.jpeg',
  family_teens: 'https://www.polynesia.com/globalassets/samoa-fire.jpeg',
  couple:       'https://www.polynesia.com/globalassets/tahiti-women-dancing.jpeg',
  friends:      'https://www.polynesia.com/globalassets/fiji-warrior.jpeg',
  solo:         'https://www.polynesia.com/globalassets/aotearoa-war-face.jpeg',
  high:         'https://www.polynesia.com/globalassets/samoa-fire.jpeg',
  medium:       'https://www.polynesia.com/globalassets/hawaii-hula-.jpeg',
  low:          'https://www.polynesia.com/globalassets/tahiti-dance.jpeg',
  samoa:        'https://www.polynesia.com/globalassets/samoa-fire.jpeg',
  hawaii:       'https://www.polynesia.com/globalassets/hawaii-hula-.jpeg',
  aotearoa:     'https://www.polynesia.com/globalassets/aotearoa-war-face.jpeg',
  fiji:         'https://www.polynesia.com/globalassets/fiji-warrior.jpeg',
  tonga:        'https://www.polynesia.com/globalassets/tongan-performing-drum-beats.jpeg',
  tahiti:       'https://www.polynesia.com/globalassets/tahiti-women-dancing.jpeg',
  none:         'https://www.polynesia.com/globalassets/hawaii-hula-.jpeg',
};
```

3. In QuestionView, find this block:
```
{(q.type === 'single' || q.type === 'multi') && (
```
Replace it with two separate blocks:

```tsx
{q.type === 'single' && (
  <View style={s.photoGrid}>
    {q.options.map((opt: any) => {
      const sel = (answers as any)[q.id] === opt.value;
      const photo = QUESTION_PHOTOS[opt.value];
      return (
        <TouchableOpacity
          key={opt.value}
          style={[s.photoCard, sel && s.photoCardSel]}
          onPress={() => onSingle(q.id, opt.value)}
          activeOpacity={0.85}>
          <ImageBackground
            source={{ uri: photo }}
            style={StyleSheet.absoluteFillObject}
            imageStyle={{ borderRadius: 14 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(59,16,8,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
          {sel && (
            <View style={s.photoCardCheck}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>
            </View>
          )}
          <View style={s.photoCardContent}>
            <Text style={s.photoCardName}>{opt.label}</Text>
            {opt.sub ? <Text style={s.photoCardSub}>{opt.sub}</Text> : null}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
)}

{q.type === 'multi' && (
  <View style={s.optGrid}>
    {q.options.map((opt: any) => {
      const sel = ((answers as any)[q.id] || []).includes(opt.value);
      return (
        <TouchableOpacity
          key={opt.value}
          style={[s.optBtn, sel && s.optBtnSel]}
          onPress={() => onMulti(q.id, opt.value)}
          activeOpacity={0.75}>
          <Text style={s.optIcon}>{opt.icon}</Text>
          <Text style={[s.optLabel, sel && s.optLabelSel]}>{opt.label}</Text>
          {opt.sub ? <Text style={[s.optSub, sel && s.optSubSel]}>{opt.sub}</Text> : null}
        </TouchableOpacity>
      );
    })}
  </View>
)}
```

4. Add to StyleSheet:
```
photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }
photoCard: { width: '47%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.divider }
photoCardSel: { borderWidth: 2.5, borderColor: C.accent }
photoCardCheck: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', zIndex: 2 }
photoCardContent: { padding: 12, zIndex: 1 }
photoCardName: { fontFamily: 'InstrumentSerif', fontSize: 17, color: '#FFFFFF', lineHeight: 20, marginBottom: 2 }
photoCardSub: { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.05 }
```

---

## STEP 6 — Loading Screen Rebuild

In src/app/index.tsx:

1. Add this constant before PlannerScreen:
```typescript
const LOADING_STEPS = [
  'Checking show times for your arrival',
  'Mapping your route through all 6 villages',
  'Prioritizing stops for your group',
  'Checking crowd patterns',
  'Personalizing your schedule',
];
```

2. Add this component before PlannerScreen:
```tsx
function LoadingScreen({ group }: { group?: string }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={s.loadingView}>
      <View style={s.loadingIconWrap}>
        <Text style={s.loadingIconEmoji}>🗺️</Text>
      </View>
      <Text style={s.loadingEyebrow}>Charting your course</Text>
      <Text style={s.loadingTitle}>{'Building\nYour Day'}</Text>
      <Text style={s.loadingSubtitle}>Our guide knows every corner of the center</Text>
      <View style={s.loadingLines}>
        {LOADING_STEPS.map((step, i) => (
          <View key={i} style={[
            s.loadingLine,
            i < activeStep && s.loadingLineDone,
            i === activeStep && s.loadingLineActive,
            i > activeStep && s.loadingLineWait,
          ]}>
            <Text style={[
              s.loadingLineIcon,
              i < activeStep && { color: C.success },
              i === activeStep && { color: C.accent },
              i > activeStep && { color: C.divider },
            ]}>
              {i < activeStep ? '✓' : i === activeStep ? '◉' : '○'}
            </Text>
            <Text style={[
              s.loadingLineText,
              i < activeStep && { color: C.textDark },
              i === activeStep && { color: C.primary, fontFamily: 'DMMonoMedium' },
              i > activeStep && { color: C.textLight },
            ]}>
              {step}{i === activeStep ? '...' : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

3. In the main render, replace:
```
{loading ? (
  <View style={s.loadingView}>
    <Text style={s.loadingTitle}>Building your personalized day...</Text>
    <Text style={s.loadingSubtitle}>Mapping your route through the center</Text>
    <ActivityIndicator color={C.orange} style={{ marginTop: 16 }} />
  </View>
```
With:
```
{loading ? (
  <LoadingScreen group={answers.group} />
```

4. Update StyleSheet loading styles:
```
loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background, padding: 28 }
loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#3B1F0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }
loadingIconEmoji: { fontSize: 28 }
loadingEyebrow: { fontFamily: 'DMMono', fontSize: 10, color: C.textMid, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }
loadingTitle: { fontFamily: 'BebasNeue', fontSize: 52, color: C.textDark, letterSpacing: 1, textAlign: 'center', lineHeight: 52, marginBottom: 6 }
loadingSubtitle: { fontFamily: 'InstrumentSerif', fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 28 }
loadingLines: { width: '100%', gap: 8 }
loadingLine: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' }
loadingLineDone: { backgroundColor: C.card, borderColor: C.divider }
loadingLineActive: { backgroundColor: '#FDF5EC', borderColor: C.accent, borderWidth: 1.5 }
loadingLineWait: { backgroundColor: 'rgba(229,216,200,0.2)' }
loadingLineIcon: { fontSize: 14, width: 18, textAlign: 'center', fontWeight: '700' }
loadingLineText: { fontFamily: 'DMMono', fontSize: 11, letterSpacing: 0.3, flex: 1 }
```

---

## STEP 7 — Schedule Screen and Stop Cards Rebuild

In src/app/index.tsx:

1. In ScheduleView, replace the greeting card block:
```
{greeting ? <View style={s.greetingCard}><Text style={s.greetingText}>{greeting}</Text></View> : null}
```
With:
```tsx
{greeting ? (
  <View style={s.greetingHero}>
    <ImageBackground
      source={{ uri: 'https://www.polynesia.com/globalassets/tahiti-dance.jpeg' }}
      style={StyleSheet.absoluteFillObject}
      imageStyle={{ borderRadius: 16 }}
      resizeMode="cover">
      <LinearGradient
        colors={['rgba(107,58,42,0.3)', 'rgba(59,16,8,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />
    </ImageBackground>
    <View style={s.greetingHeroContent}>
      <Text style={s.greetingEye}>Your guide says</Text>
      <Text style={s.greetingText}>{greeting}</Text>
    </View>
  </View>
) : null}
```

2. Add to StyleSheet:
```
greetingHero: { height: 110, borderRadius: 16, overflow: 'hidden', marginBottom: 14, justifyContent: 'flex-end' }
greetingHeroContent: { padding: 14 }
greetingEye: { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 }
```

3. Update existing styles:
```
greetingText: { fontFamily: 'InstrumentSerif', fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 21 }
schedSectionLabel: { fontFamily: 'DMMono', fontSize: 9, color: C.textMid, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10, marginTop: 6 }
schedTime: { fontFamily: 'DMMonoMedium', fontSize: 12, color: C.accent, width: 54 }
schedVillage: { fontFamily: 'DMMono', fontSize: 8, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 2 }
schedTitle: { fontFamily: 'InstrumentSerif', fontSize: 15, color: C.textDark, marginBottom: 3 }
upgradeTitle: { fontFamily: 'BebasNeue', fontSize: 28, color: C.textDark, letterSpacing: 0.5, marginBottom: 8, lineHeight: 28 }
```

4. Replace the entire ScheduleStopRow function with:
```tsx
function ScheduleStopRow({ stop, isLast }: { stop: ScheduleStop; isLast: boolean }) {
  const villageKey = stop.type === 'show'
    ? stop.village.toLowerCase()
    : stop.type;
  const borderColor = ISLAND_COLORS[villageKey] || C.accent;
  const imgSrc = stop.type === 'show'
    ? VILLAGE_IMAGES[stop.village.toLowerCase()]
    : undefined;
  const typeIcon = STOP_TYPE_ICONS[stop.type];

  if (stop.type === 'ha_show') {
    return (
      <View style={s.finaleCard}>
        <View style={s.finaleInner}>
          <View style={s.finaleTopRow}>
            <View style={s.finaleBadge}>
              <Text style={s.finaleBadgeText}>✦ Grand Finale</Text>
            </View>
            <Text style={s.finaleTime}>{stop.time}</Text>
          </View>
          <Text style={s.finaleTitle}>{'Hā: Breath\nof Life'}</Text>
          <Text style={s.finaleDesc}>{stop.desc}</Text>
        </View>
      </View>
    );
  }

  if (stop.type === 'show' && imgSrc) {
    return (
      <View style={[s.heroStopCard, !isLast && s.heroStopCardBorder]}>
        <ImageBackground
          source={imgSrc}
          style={s.heroStopImg}
          resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(59,16,8,0.7)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.heroStopImgRow}>
            <View style={s.heroStopIslandBadge}>
              <Text style={s.heroStopIslandText}>{stop.village}</Text>
            </View>
            <Text style={s.heroStopImgTime}>{stop.time}</Text>
          </View>
        </ImageBackground>
        <View style={[s.heroStopBody, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
          <Text style={s.heroStopTitle}>{stop.title}</Text>
          {stop.desc ? <Text style={s.heroStopDesc}>{stop.desc}</Text> : null}
          {stop.activities && stop.activities.length > 0 && (
            <View style={s.activitiesRow}>
              {stop.activities.map((a: string, i: number) => (
                <View key={i} style={s.activityPill}>
                  <Text style={s.activityPillText}>{a}</Text>
                </View>
              ))}
            </View>
          )}
          {stop.flags.length > 0 && (
            <View style={s.schedFlags}>
              {stop.flags.map((f: string) => {
                const fs = FLAG_STYLE[f];
                const fl = FLAG_LABEL[f];
                if (!fs || !fl) return null;
                return (
                  <View key={f} style={[s.schedFlag, { backgroundColor: fs.bg }]}>
                    <Text style={[s.schedFlagText, { color: fs.color }]}>{fl}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[
      s.schedItem,
      stop.highlight && s.schedItemHighlight,
      isLast && { borderBottomWidth: 0 },
      { borderLeftWidth: 4, borderLeftColor: borderColor }
    ]}>
      {typeIcon ? (
        <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: typeIcon.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{typeIcon.icon}</Text>
        </View>
      ) : null}
      <Text style={s.schedTime}>{stop.time}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.schedVillage}>{stop.village}</Text>
        <Text style={s.schedTitle}>{stop.title}</Text>
        {stop.desc ? <Text style={s.schedDesc}>{stop.desc}</Text> : null}
        {stop.flags.length > 0 && (
          <View style={s.schedFlags}>
            {stop.flags.map((f: string) => {
              const fs = FLAG_STYLE[f];
              const fl = FLAG_LABEL[f];
              if (!fs || !fl) return null;
              return (
                <View key={f} style={[s.schedFlag, { backgroundColor: fs.bg }]}>
                  <Text style={[s.schedFlagText, { color: fs.color }]}>{fl}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
```

5. Add to StyleSheet:
```
heroStopCard: { backgroundColor: C.card, overflow: 'hidden' }
heroStopCardBorder: { borderBottomWidth: 1, borderBottomColor: C.divider }
heroStopImg: { height: 110, justifyContent: 'flex-end' }
heroStopImgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }
heroStopIslandBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }
heroStopIslandText: { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.1, textTransform: 'uppercase' }
heroStopImgTime: { fontFamily: 'DMMonoMedium', fontSize: 13, color: C.accent }
heroStopBody: { padding: 14 }
heroStopTitle: { fontFamily: 'InstrumentSerif', fontSize: 18, color: C.textDark, marginBottom: 4, lineHeight: 22 }
heroStopDesc: { fontSize: 12, color: C.textMid, lineHeight: 17, marginBottom: 8 }
activitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }
activityPill: { backgroundColor: C.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.divider }
activityPillText: { fontFamily: 'DMMono', fontSize: 9, color: C.textMid, letterSpacing: 0.3 }
finaleCard: { overflow: 'hidden' }
finaleInner: { backgroundColor: '#2D0A5E', padding: 20 }
finaleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
finaleBadge: { backgroundColor: 'rgba(200,150,62,0.2)', borderWidth: 1, borderColor: 'rgba(200,150,62,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }
finaleBadgeText: { fontFamily: 'DMMono', fontSize: 9, color: C.accent, letterSpacing: 0.1 }
finaleTime: { fontFamily: 'DMMono', fontSize: 13, color: 'rgba(255,255,255,0.5)' }
finaleTitle: { fontFamily: 'BebasNeue', fontSize: 40, color: '#FFFFFF', letterSpacing: 1, lineHeight: 40, marginBottom: 6 }
finaleDesc: { fontFamily: 'InstrumentSerif', fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20 }
```

---

## STEP 8 — Share Card Feature

In src/app/index.tsx:

1. Add imports after existing imports:
```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
```

2. In ScheduleView, add these inside the function body before return:
```typescript
const viewShotRef = useRef<any>(null);
const [saving, setSaving] = useState(false);
const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

async function saveSchedule() {
  try {
    setSaving(true);
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) { setSaving(false); return; }
    }
    const uri = await viewShotRef.current.capture();
    await MediaLibrary.saveToLibraryAsync(uri);
    setSaving(false);
  } catch (e) {
    setSaving(false);
  }
}

async function shareSchedule() {
  try {
    setSaving(true);
    const uri = await viewShotRef.current.capture();
    await Sharing.shareAsync(uri);
    setSaving(false);
  } catch (e) {
    setSaving(false);
  }
}
```

3. Add hidden ViewShot just before the ScrollView in ScheduleView return:
```tsx
<ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}
  style={{ position: 'absolute', left: -9999, top: 0 }}>
  <ShareCard schedule={schedule} ticket={ticket} />
</ViewShot>
```

4. Add save/share buttons above the restart button:
```tsx
<TouchableOpacity style={s.saveBtn} onPress={saveSchedule} disabled={saving}>
  <Text style={s.saveBtnText}>{saving ? 'Saving...' : '↓  Save to Camera Roll'}</Text>
</TouchableOpacity>
<TouchableOpacity style={s.shareBtn} onPress={shareSchedule} disabled={saving}>
  <Text style={s.shareBtnText}>Share with Friends</Text>
</TouchableOpacity>
```

5. Add ShareCard component before ScheduleView:
```tsx
function ShareCard({ schedule, ticket }: { schedule: ScheduleResult; ticket: string }) {
  const ticketData = TICKETS[ticket];
  return (
    <View style={s.shareCard}>
      <ImageBackground
        source={{ uri: 'https://www.polynesia.com/globalassets/samoa-fire.jpeg' }}
        style={s.shareCardHeader}
        resizeMode="cover">
        <LinearGradient
          colors={['rgba(59,16,8,0.3)', 'rgba(59,16,8,0.9)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.shareCardHeaderContent}>
          <Text style={s.shareCardLogo}>Polynesian Cultural Center</Text>
          <Text style={s.shareCardTitle}>{'My Day\nat PCC'}</Text>
        </View>
      </ImageBackground>
      <View style={s.shareCardBody}>
        <View style={s.shareCardMeta}>
          <View style={s.shareCardPill}>
            <Text style={s.shareCardPillText}>{ticketData?.name || 'Islands'}</Text>
          </View>
        </View>
        {schedule.stops.map((stop, i) => (
          <View key={i} style={s.shareCardStop}>
            <Text style={s.shareCardTime}>{stop.time}</Text>
            <View style={[s.shareCardDot, { backgroundColor: ISLAND_COLORS[stop.type === 'show' ? stop.village.toLowerCase() : stop.type] || C.accent }]} />
            <Text style={s.shareCardStopTitle} numberOfLines={1}>{stop.title}</Text>
          </View>
        ))}
      </View>
      <View style={s.shareCardFooter}>
        <Text style={s.shareCardFooterText}>polynesia.com</Text>
        <View style={s.shareCardFooterBadge}>
          <Text style={s.shareCardFooterBadgeText}>Plan My Day</Text>
        </View>
      </View>
    </View>
  );
}
```

6. Add to StyleSheet:
```
saveBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }
saveBtnText: { fontFamily: 'BebasNeue', fontSize: 20, color: '#FFFFFF', letterSpacing: 1 }
shareBtn: { backgroundColor: C.card, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, borderWidth: 1.5, borderColor: C.divider }
shareBtnText: { fontFamily: 'BebasNeue', fontSize: 20, color: C.primary, letterSpacing: 1 }
shareCard: { width: 320, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }
shareCardHeader: { height: 140, justifyContent: 'flex-end' }
shareCardHeaderContent: { padding: 16 }
shareCardLogo: { fontFamily: 'DMMono', fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 }
shareCardTitle: { fontFamily: 'BebasNeue', fontSize: 36, color: '#FFFFFF', letterSpacing: 1, lineHeight: 36 }
shareCardBody: { padding: 16 }
shareCardMeta: { flexDirection: 'row', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0E6D8' }
shareCardPill: { backgroundColor: '#F5EFE6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }
shareCardPillText: { fontFamily: 'DMMono', fontSize: 9, color: C.primary, letterSpacing: 0.05 }
shareCardStop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#FAF3EB' }
shareCardTime: { fontFamily: 'DMMonoMedium', fontSize: 11, color: C.accent, width: 52 }
shareCardDot: { width: 8, height: 8, borderRadius: 4 }
shareCardStopTitle: { fontFamily: 'InstrumentSerif', fontSize: 13, color: C.textDark, flex: 1 }
shareCardFooter: { backgroundColor: C.primary, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
shareCardFooterText: { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.1 }
shareCardFooterBadge: { backgroundColor: 'rgba(200,150,62,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(200,150,62,0.35)' }
shareCardFooterBadgeText: { fontFamily: 'DMMono', fontSize: 9, color: C.accent, letterSpacing: 0.08 }
```

---

## STEP 9 — Final Check

1. Verify no TypeScript errors
2. Verify all 4 fonts load (BebasNeue, InstrumentSerif, DMMono, DMMonoMedium)
3. Verify LinearGradient is imported and used correctly
4. Verify ImageBackground is imported
5. Verify no raw '#fff' strings remain in updated StyleSheet entries
6. Confirm app compiles and runs in Expo Go

Print final summary:
- STEP 1: DONE / SKIPPED (reason)
- STEP 2: DONE / SKIPPED (reason)
- STEP 3: DONE / SKIPPED (reason)
- STEP 4: DONE / SKIPPED (reason)
- STEP 5: DONE / SKIPPED (reason)
- STEP 6: DONE / SKIPPED (reason)
- STEP 7: DONE / SKIPPED (reason)
- STEP 8: DONE / SKIPPED (reason)
- STEP 9: DONE / SKIPPED (reason)
- Any errors or notes:
