import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';


import { C, FLAG_LABEL, FLAG_STYLE } from '@/constants/theme';
import { ARRIVAL_TIME_MAP, QUESTIONS, TICKETS } from '@/lib/data';
import { buildSchedule, type ScheduleResult, type ScheduleStop } from '@/lib/routing';
import {
  buildChatSystemPrompt,
  fetchGreeting,
  getDefaultGreeting,
  sendChatMessage,
} from '@/lib/api';

const ISLAND_COLORS: Record<string, string> = {
  samoa:     '#E8472A',
  hawaii:    '#2E7D32',
  aotearoa:  '#1A237E',
  fiji:      '#212121',
  tonga:     '#B71C1C',
  tahiti:    '#6A1B9A',
  canoe:     '#0277BD',
  dinner:    '#E65100',
  ha_show:   '#4A148C',
  huki:      '#00695C',
  foodtruck: '#4E342E',
};

const VILLAGE_IMAGES: Record<string, { uri: string }> = {
  samoa:    { uri: 'https://www.polynesia.com/globalassets/samoa-fire.jpeg' },
  hawaii:   { uri: 'https://www.polynesia.com/globalassets/hawaii-hula-.jpeg' },
  aotearoa: { uri: 'https://www.polynesia.com/globalassets/aotearoa-war-face.jpeg' },
  fiji:     { uri: 'https://www.polynesia.com/globalassets/fiji-warrior.jpeg' },
  tonga:    { uri: 'https://www.polynesia.com/globalassets/tonga-dance.jpeg' },
  tahiti:   { uri: 'https://www.polynesia.com/globalassets/tahiti-dance.jpeg' },
};

const STOP_TYPE_ICONS: Record<string, { bg: string; icon: string }> = {
  dinner:    { bg: '#FAEEDA', icon: '🍽️' },
  ha_show:   { bg: '#F0E8F8', icon: '🌟' },
  canoe:     { bg: '#E8F4FD', icon: '🛶' },
  huki:      { bg: '#EBF5EB', icon: '🎭' },
  foodtruck: { bg: '#F5F5F5', icon: '🍜' },
};

const QUESTION_PHOTOS: Record<string, string> = {
  family_kids:  'https://www.polynesia.com/globalassets/samoa-fire.jpeg',
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlannerAnswers {
  group?: string;
  vibe?: string[];
  connection?: string[];
  arrival?: string;
  ticket?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ScheduleJsonData {
  greeting: string;
  items: { time: string; village: string; title: string; tip?: string; flags?: string[] }[];
  upgrade?: { show: boolean; title: string; reason: string; cta: string };
  free3?: boolean;
}

const LOADING_STEPS = [
  'Checking show times for your arrival',
  'Mapping your route through all 6 villages',
  'Prioritizing stops for your group',
  'Checking crowd patterns',
  'Personalizing your schedule',
];

// ─── Loading Screen ───────────────────────────────────────────────────────────

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<PlannerAnswers>({});
  const [loading, setLoading]   = useState(false);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [greeting, setGreeting] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInit, setChatInit] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const drawerAnim = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  const today    = new Date();
  const dayName  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
  const isBusy   = [1, 4, 5].includes(today.getDay());
  const progress = Math.round((step / QUESTIONS.length) * 100);

  // ─── Option Selection ───────────────────────────────────────────────────────

  function selectSingle(id: string, value: string) {
    setAnswers(a => ({ ...a, [id]: value }));
  }

  function toggleMulti(id: string, value: string) {
    setAnswers(a => {
      const cur: string[] = (a as any)[id] || [];
      let next: string[];
      if (value === 'none') {
        next = ['none'];
      } else {
        const withoutNone = cur.filter(v => v !== 'none');
        next = withoutNone.includes(value)
          ? withoutNone.filter(v => v !== value)
          : [...withoutNone, value];
      }
      return { ...a, [id]: next };
    });
  }

  function selectTicket(id: string) {
    setAnswers(a => ({ ...a, ticket: id }));
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  function isComplete() {
    const q = QUESTIONS[step];
    switch (q.type) {
      case 'single': return !!(answers as any)[q.id];
      case 'multi':  return ((answers as any)[q.id] || []).length > 0;
      case 'select': return !!(answers as any)[q.id];
      case 'ticket': return !!answers.ticket;
      default:       return true;
    }
  }

  function advance() {
    if (!isComplete()) return;
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      buildPlan();
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setSchedule(null);
    setGreeting('');
  }

  // ─── Build Schedule ──────────────────────────────────────────────────────────

  async function buildPlan() {
    setLoading(true);
    const { group = 'solo', vibe = [], connection = [], arrival = '1:00 PM', ticket = 'islands' } = answers;
    const arrivalHHMM = ARRIVAL_TIME_MAP[arrival] || '13:00';

    const result = buildSchedule({
      arrival: arrivalHHMM, group, interests: vibe,
      connection, ticket, isBusy,
    });

    const gr = await fetchGreeting(group, vibe, connection);
    setGreeting(gr || getDefaultGreeting());
    setSchedule(result);
    setLoading(false);
  }

  // ─── Chat ────────────────────────────────────────────────────────────────────

  function openChat() {
    setChatOpen(true);
    Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
    if (!chatInit) {
      setChatInit(true);
      const opening = isBusy
        ? `Aloha! 🌺 It's a busy ${dayName} today — I'll help you beat the crowds. Who's with you?`
        : `Aloha! 🌺 Welcome to PCC! I'm here to help you plan the perfect day. Who's with you today?`;
      const msg: ChatMessage = { role: 'assistant', content: opening };
      setChatMsgs([msg]);
      setQuickReplies(['Just me', 'My family', "Couple's trip", 'Group of friends']);
    }
  }

  function closeChat() {
    Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => setChatOpen(false));
  }

  async function sendChat(text: string) {
    if (!text.trim() || chatBusy) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newHistory = [...chatMsgs, userMsg];
    setChatMsgs(newHistory);
    setChatInput('');
    setQuickReplies([]);
    setChatBusy(true);

    const systemPrompt = buildChatSystemPrompt(isBusy, dayName);
    const reply = await sendChatMessage(
      newHistory.map(m => ({ role: m.role, content: m.content })),
      systemPrompt
    );

    const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
    setChatMsgs(h => [...h, assistantMsg]);
    setChatBusy(false);
    updateQuickReplies(reply);
  }

  function updateQuickReplies(reply: string) {
    if (reply.includes('SCHEDULE_JSON_START')) {
      setQuickReplies(['Tell me more about Samoa', 'Any hidden gems?', 'What after dinner?']);
      return;
    }
    const lower = reply.toLowerCase();
    if (lower.includes('ticket') || lower.includes('package')) {
      setQuickReplies(["Islands of Polynesia", "Islands + Hā Show", "Gateway Buffet", "Self-Guided Ali'i Lū'au"]);
    } else if (lower.includes('arriv') || lower.includes('time')) {
      setQuickReplies(['12:30 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']);
    } else if (lower.includes('interest') || lower.includes('excited') || lower.includes('enjoy')) {
      setQuickReplies(['Performances', 'Hands-on activities', 'Food', 'Learning history']);
    } else {
      setQuickReplies([]);
    }
  }

  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMsgs]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const drawerTranslate = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safeArea} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerSub}>Polynesian Cultural Center</Text>
          <Text style={s.headerTitle}>Plan My Day</Text>
        </View>

        {/* Progress */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${loading || schedule ? 100 : progress}%` as any }]} />
        </View>

        {/* Content */}
        {loading ? (
          <LoadingScreen group={answers.group} />
        ) : schedule ? (
          <ScheduleView
            schedule={schedule}
            greeting={greeting}
            isBusy={isBusy}
            ticket={answers.ticket || 'islands'}
            onRestart={restart}
          />
        ) : (
          <QuestionView
            step={step}
            answers={answers}
            onSingle={selectSingle}
            onMulti={toggleMulti}
            onTicket={selectTicket}
            onNext={advance}
            onBack={back}
            isComplete={isComplete()}
          />
        )}
      </SafeAreaView>

      {/* Chat FAB */}
      <TouchableOpacity style={s.fab} onPress={chatOpen ? closeChat : openChat} activeOpacity={0.85}>
        <Text style={s.fabIcon}>{chatOpen ? '✕' : '💬'}</Text>
      </TouchableOpacity>

      {/* Chat Drawer */}
      {(chatOpen || chatMsgs.length > 0) && (
        <>
          {chatOpen && <Pressable style={s.overlay} onPress={closeChat} />}
          <Animated.View style={[s.drawer, { transform: [{ translateY: drawerTranslate }] }]}>
            <View style={s.drawerHandle} />
            <View style={s.drawerHeader}>
              <View style={s.drawerAvatar}><Text style={{ color: '#fff', fontSize: 14 }}>📍</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.drawerName}>Your PCC Guide</Text>
                <Text style={s.drawerStatus}>● Online now</Text>
              </View>
              <TouchableOpacity onPress={closeChat} style={s.drawerClose}>
                <Text style={{ fontSize: 18, color: '#aaa' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={chatScrollRef}
              style={s.chatArea}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled">
              {chatMsgs.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {chatBusy && (
                <View style={s.msgRow}>
                  <View style={s.msgAvatar}><Text style={{ fontSize: 11 }}>📍</Text></View>
                  <View style={s.typingBubble}>
                    <ActivityIndicator size="small" color="#bbb" />
                  </View>
                </View>
              )}
            </ScrollView>

            {quickReplies.length > 0 && (
              <ScrollView horizontal style={s.quickReplies} showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 5, paddingHorizontal: 12, paddingVertical: 6 }}>
                {quickReplies.map((r, i) => (
                  <TouchableOpacity key={i} style={s.qrBtn} onPress={() => sendChat(r)}>
                    <Text style={s.qrText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={s.inputArea}>
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Ask your guide anything..."
                    placeholderTextColor="#bbb"
                    multiline
                    onSubmitEditing={() => sendChat(chatInput)}
                    blurOnSubmit
                  />
                </View>
                <TouchableOpacity
                  style={[s.sendBtn, (!chatInput.trim() || chatBusy) && s.sendBtnDisabled]}
                  onPress={() => sendChat(chatInput)}
                  disabled={!chatInput.trim() || chatBusy}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>↑</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ─── Question View ────────────────────────────────────────────────────────────

function QuestionView({ step, answers, onSingle, onMulti, onTicket, onNext, onBack, isComplete }: {
  step: number;
  answers: PlannerAnswers;
  onSingle: (id: string, v: string) => void;
  onMulti: (id: string, v: string) => void;
  onTicket: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  isComplete: boolean;
}) {
  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.qContent} keyboardShouldPersistTaps="handled">
      <Text style={s.qLabel}>{q.label}</Text>
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
      <Text style={s.qTitle}>{q.title}</Text>
      <Text style={s.qSub}>{q.sub}</Text>

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
                  style={StyleSheet.absoluteFill}
                  imageStyle={{ borderRadius: 14 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(59,16,8,0.85)']}
                  style={StyleSheet.absoluteFill}
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

      {q.type === 'multi' && q.id === 'connection' && (
        <View style={s.photoGrid}>
          {q.options.map((opt: any) => {
            const sel = ((answers as any)[q.id] || []).includes(opt.value);
            const photo = QUESTION_PHOTOS[opt.value];
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.photoCard, sel && s.photoCardSel]}
                onPress={() => onMulti(q.id, opt.value)}
                activeOpacity={0.85}>
                {photo ? (
                  <>
                    <ImageBackground
                      source={{ uri: photo }}
                      style={StyleSheet.absoluteFill}
                      imageStyle={{ borderRadius: 14 }}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(59,16,8,0.85)']}
                      style={StyleSheet.absoluteFill}
                    />
                  </>
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, borderRadius: 14 }]} />
                )}
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

      {q.type === 'multi' && q.id !== 'connection' && (
        <View style={s.optGrid}>
          {q.options.map((opt: any) => {
            const sel = ((answers as any)[q.id] || []).includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.optBtn, sel && s.optBtnSel]}
                onPress={() => onMulti(q.id, opt.value)}
                activeOpacity={0.75}>
                <View style={[s.optIconBox, sel && s.optIconBoxSel]}>
                  <Text style={[s.optIconChar, sel && s.optIconCharSel]}>
                    {opt.value === 'watch_performances' ? '▶' :
                     opt.value === 'hands_on'           ? '✦' :
                     opt.value === 'learn_history'      ? '◈' :
                     opt.value === 'food'               ? '◉' : '●'}
                  </Text>
                </View>
                <Text style={[s.optLabel, sel && s.optLabelSel]}>{opt.label}</Text>
                {opt.sub ? <Text style={[s.optSub, sel && s.optSubSel]}>{opt.sub}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {q.type === 'select' && (
        <>
          <View style={s.selectGrid}>
            {QUESTIONS[step].options.map((opt: any) => {
              const sel = (answers as any)[q.id] === opt || (!((answers as any)[q.id]) && opt === QUESTIONS[step].options[0]);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[s.timeChip, sel && s.timeChipSel]}
                  onPress={() => onSingle(q.id, opt)}
                  activeOpacity={0.75}>
                  <Text style={[s.timeChipText, sel && s.timeChipTextSel]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.arrivalNote}>PCC is open 12:15 PM – 5:30 PM · Closed Sundays</Text>
        </>
      )}

      {q.type === 'ticket' && (
        <View style={{ gap: 8 }}>
          {Object.values(TICKETS).map((ticket, i) => {
            const sel = (answers as any).ticket === ticket.id;
            return (
              <View key={ticket.id}>
                {ticket.divider && (
                  <View style={s.pkgDivider}>
                    <View style={s.pkgDividerLine} />
                    <Text style={s.pkgDividerText}>Declined guided tour</Text>
                    <View style={s.pkgDividerLine} />
                  </View>
                )}
                <TouchableOpacity
                  style={[s.pkgCard, sel && s.pkgCardSel]}
                  onPress={() => onTicket(ticket.id)}
                  activeOpacity={0.8}>
                  <View style={[s.ticketAccentBar, {
                    backgroundColor:
                      ticket.id === 'islands'    ? '#B08070' :
                      ticket.id === 'islands-ha' ? '#0277BD' :
                      ticket.id === 'gateway'    ? C.accent  :
                      C.primary
                  }]} />
                  {ticket.badge === 'popular' && <View style={[s.badge, s.badgeGreen]}><Text style={[s.badgeText, { color: C.green }]}>Most popular</Text></View>}
                  {ticket.badge === 'show'    && <View style={[s.badge, s.badgeBlue]}><Text style={[s.badgeText, { color: '#185FA5' }]}>Includes Hā Show</Text></View>}
                  {ticket.badge === 'self'    && <View style={[s.badge, s.badgeGray]}><Text style={[s.badgeText, { color: '#666' }]}>Self-guided</Text></View>}
                  <Text style={s.pkgName}>{ticket.name}</Text>
                  <Text style={s.pkgDesc}>{ticket.desc}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <View style={s.navRow}>
        {step > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        {q.type === 'single' ? (
          (answers as any)[q.id] ? (
            <TouchableOpacity style={s.mainBtn} onPress={onNext}>
              <Text style={s.mainBtnText}>Continue →</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          <TouchableOpacity
            style={[s.mainBtn, !isComplete && s.mainBtnDisabled]}
            onPress={onNext}
            disabled={!isComplete}>
            <Text style={s.mainBtnText}>{isLast ? 'Build my schedule' : 'Next'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.questionFooter}>
        <Text style={s.questionFooterText}>POLYNESIAN CULTURAL CENTER</Text>
      </View>
    </ScrollView>
  );
}

// ─── Share Card ───────────────────────────────────────────────────────────────

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
          style={StyleSheet.absoluteFill}
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

// ─── Schedule View ────────────────────────────────────────────────────────────

function ScheduleView({ schedule, greeting, isBusy, ticket, onRestart }: {
  schedule: ScheduleResult;
  greeting: string;
  isBusy: boolean;
  ticket: string;
  onRestart: () => void;
}) {
  const canoeStop  = schedule.stops.find(s => s.type === 'canoe');
  const routeLabel = canoeStop ? 'Walk south → Canoe north route' : 'Walking route through the center';

  const viewShotRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <>
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}
      style={{ position: 'absolute', left: -9999, top: 0 }}>
      <ShareCard schedule={schedule} ticket={ticket} />
    </ViewShot>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.qContent}>
      {greeting ? (
        <View style={s.greetingHero}>
          <ImageBackground
            source={{ uri: 'https://www.polynesia.com/globalassets/tahiti-dance.jpeg' }}
            style={StyleSheet.absoluteFill}
            imageStyle={{ borderRadius: 16 }}
            resizeMode="cover">
            <LinearGradient
              colors={['rgba(107,58,42,0.3)', 'rgba(59,16,8,0.92)']}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
          <View style={s.greetingHeroContent}>
            <Text style={s.greetingEye}>Your guide says</Text>
            <Text style={s.greetingText}>{greeting}</Text>
          </View>
        </View>
      ) : null}

      {isBusy && (
        <View style={[s.routeBadge, { backgroundColor: '#FEF3E2', borderColor: '#F5DFA0' }]}>
          <Text style={{ color: '#9A5B00', fontSize: 12, fontWeight: '500' }}>
            ⚠️ Busy day — extra buffer time built into popular shows
          </Text>
        </View>
      )}

      <View style={s.routeBadge}>
        <Text style={{ color: '#2D6A2D', fontSize: 12, fontWeight: '500' }}>🗺️ {routeLabel}</Text>
      </View>

      <Text style={s.schedSectionLabel}>Your personalized schedule</Text>

      <View style={s.schedCard}>
        {schedule.stops.map((stop, i) => (
          <ScheduleStopRow key={i} stop={stop} isLast={i === schedule.stops.length - 1} />
        ))}
      </View>

      {schedule.needsUpgrade && (
        <View style={s.upgradeCard}>
          <Text style={s.upgradeLabel}>Make your night unforgettable</Text>
          <Text style={s.upgradeTitle}>Add dinner + the Hā Show</Text>
          <Text style={s.upgradeDesc}>Your ticket covers the villages — but the evening really comes alive with dinner and Hā: Breath of Life. Most guests say it's the highlight of their trip.</Text>
          <TouchableOpacity style={s.upgradeBtn} onPress={() => Linking.openURL('https://packages.polynesia.com')}>
            <Text style={s.upgradeBtnText}>View upgrade options →</Text>
          </TouchableOpacity>
        </View>
      )}

      {schedule.isLate && (
        <View style={s.infoCardFree3}>
          <Text style={s.infoCardTitle}>💡 Free Within 3 Days</Text>
          <Text style={s.infoCardDesc}>Arriving late? Your ticket lets you return to PCC within the next 3 days at no charge — so don't stress about seeing everything today.</Text>
        </View>
      )}

      <TouchableOpacity style={s.shareBtn} onPress={shareSchedule} disabled={saving}>
        <Text style={s.shareBtnText}>Share with Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.restartBtn} onPress={onRestart}>
        <Text style={s.restartBtnText}>↺  Plan a new day</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

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
            style={StyleSheet.absoluteFill}
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

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const jsonMatch = msg.content.match(/SCHEDULE_JSON_START([\s\S]*?)SCHEDULE_JSON_END/);
  const displayText = msg.content.replace(/SCHEDULE_JSON_START[\s\S]*?SCHEDULE_JSON_END/g, '').trim();

  if (msg.role === 'user') {
    return (
      <View style={[s.msgRow, { justifyContent: 'flex-end' }]}>
        <View style={s.userBubble}><Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{displayText}</Text></View>
      </View>
    );
  }

  return (
    <View style={s.msgRow}>
      <View style={s.msgAvatar}><Text style={{ fontSize: 11 }}>📍</Text></View>
      <View style={{ flex: 1, gap: 4 }}>
        {displayText ? (
          <View style={s.aiBubble}>
            <Text style={{ fontSize: 13, lineHeight: 20, color: C.text }}>{displayText}</Text>
          </View>
        ) : null}
        {jsonMatch ? <ChatScheduleCard jsonStr={jsonMatch[1].trim()} /> : null}
      </View>
    </View>
  );
}

function ChatScheduleCard({ jsonStr }: { jsonStr: string }) {
  let data: ScheduleJsonData;
  try { data = JSON.parse(jsonStr); } catch { return null; }

  return (
    <View style={s.miniSchedCard}>
      <View style={s.miniSchedHeader}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{data.greeting || 'Your Schedule'}</Text>
      </View>
      {(data.items || []).map((item, i) => (
        <View key={i} style={[s.miniSchedItem, i === (data.items.length - 1) && { borderBottomWidth: 0 }]}>
          <Text style={s.miniTime}>{item.time}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.miniVillage}>{item.village}</Text>
            <Text style={s.miniTitle}>{item.title}</Text>
            {item.tip ? <Text style={s.miniTip}>{item.tip}</Text> : null}
          </View>
        </View>
      ))}
      {data.upgrade?.show && (
        <View style={{ backgroundColor: '#FAEEDA', padding: 10, borderTopWidth: 0.5, borderTopColor: '#EF9F27' }}>
          <Text style={{ fontSize: 11, color: '#854F0B', fontWeight: '600' }}>{data.upgrade.title}</Text>
          <Text style={{ fontSize: 11, color: '#854F0B', marginTop: 2 }}>{data.upgrade.reason}</Text>
        </View>
      )}
      {data.free3 && (
        <View style={{ backgroundColor: '#E1F5EE', padding: 10, borderTopWidth: 0.5, borderTopColor: '#9FD9C5' }}>
          <Text style={{ fontSize: 11, color: '#0F6E56', fontWeight: '600' }}>💡 Free Within 3 Days</Text>
          <Text style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>You can return within 3 days at no charge.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.background },
  safeArea: { flex: 1, backgroundColor: C.background },

  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#3B1F0F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  headerSub: {
    fontFamily: 'DMMono',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 1,
    lineHeight: 36,
  },

  progressBar:  { height: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { backgroundColor: C.accent, borderRadius: 0, height: 3 },

  loadingView:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background, padding: 28 },
  loadingIconWrap:    { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#3B1F0F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  loadingIconEmoji:   { fontSize: 28 },
  loadingEyebrow:     { fontFamily: 'DMMono', fontSize: 10, color: C.textMid, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  loadingTitle:       { fontFamily: 'BebasNeue', fontSize: 52, color: C.textDark, letterSpacing: 1, textAlign: 'center', lineHeight: 52, marginBottom: 6 },
  loadingSubtitle:    { fontFamily: 'InstrumentSerif', fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 28 },
  loadingLines:       { width: '100%', gap: 8 },
  loadingLine:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  loadingLineDone:    { backgroundColor: C.card, borderColor: C.divider },
  loadingLineActive:  { backgroundColor: '#FDF5EC', borderColor: C.accent, borderWidth: 1.5 },
  loadingLineWait:    { backgroundColor: 'rgba(229,216,200,0.2)' },
  loadingLineIcon:    { fontSize: 14, width: 18, textAlign: 'center', fontWeight: '700' },
  loadingLineText:    { fontFamily: 'DMMono', fontSize: 11, letterSpacing: 0.3, flex: 1 },

  qContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  qLabel: {
    fontFamily: 'DMMonoMedium',
    fontSize: 10,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  qTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 26,
    color: C.textDark,
    marginBottom: 4,
    lineHeight: 32,
    fontWeight: '400',
  },
  qSub: {
    fontFamily: 'DMMono',
    fontSize: 11,
    color: C.textMid,
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  photoGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  photoCard:        { width: '47%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.divider },
  photoCardSel:     { borderWidth: 2.5, borderColor: C.accent },
  photoCardCheck:   { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  photoCardContent: { padding: 12, zIndex: 1 },
  photoCardName:    { fontFamily: 'InstrumentSerif', fontSize: 17, color: '#FFFFFF', lineHeight: 20, marginBottom: 2 },
  photoCardSub:     { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.05 },

  stepRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stepCounter:    { fontFamily: 'DMMono', fontSize: 11, color: C.textMid, letterSpacing: 0.1 },
  stepDots:       { flexDirection: 'row', gap: 5 },
  stepDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.divider },
  stepDotActive:  { backgroundColor: C.accent, width: 16 },
  stepDotDone:    { backgroundColor: C.primary },

  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  optBtn: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.divider,
    width: '47%',
    shadowColor: '#3B1F0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'center',
  },
  optBtnSel:   { backgroundColor: '#FDF5EC', borderColor: C.accent, borderWidth: 2 },
  optIcon:     { fontSize: 32, marginBottom: 10 },
  optLabel:    { fontFamily: 'InstrumentSerif', fontSize: 16, color: C.textDark, marginBottom: 2 },
  optLabelSel: { color: C.primary },
  optSub:      { fontFamily: 'DMMono', fontSize: 10, color: C.textMid, letterSpacing: 0.3 },
  optSubSel:   { color: C.textMid },

  selectGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeChip:        { paddingHorizontal: 0, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.divider, backgroundColor: C.card, width: '30%', alignItems: 'center' },
  timeChipSel:     { backgroundColor: C.primary, borderColor: C.primary },
  timeChipText:    { fontFamily: 'DMMono', fontSize: 13, color: C.textMid, fontWeight: '500', textAlign: 'center' },
  timeChipTextSel: { color: C.white, fontWeight: '700' },
  arrivalNote:     { fontFamily: 'DMMono', fontSize: 10, color: C.textLight, textAlign: 'center', marginBottom: 24, letterSpacing: 0.3 },

  navRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  mainBtn:         { backgroundColor: C.primary, borderRadius: 26, paddingVertical: 15, paddingHorizontal: 28, alignItems: 'center', flex: 1 },
  mainBtnDisabled: { backgroundColor: '#C4A898', opacity: 0.6 },
  mainBtnText: { fontFamily: 'BebasNeue', fontSize: 20, color: '#FFFFFF', letterSpacing: 1 },
  backBtn:         { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  backBtnText:     { fontSize: 20, color: C.textDark },

  pkgCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.divider,
    shadowColor: '#3B1F0F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  pkgCardSel:     { backgroundColor: '#FDF5EC', borderColor: C.accent, borderLeftWidth: 4, borderLeftColor: C.accent },
  pkgName:        { fontFamily: 'InstrumentSerif', fontSize: 17, color: C.textDark, marginBottom: 4 },
  pkgDesc:        { fontFamily: 'DMMono', fontSize: 11, color: C.textMid, lineHeight: 17 },
  ticketAccentBar: { height: 4, borderRadius: 2, marginBottom: 12, marginHorizontal: -18, marginTop: -18 },
  badge:          { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, marginBottom: 8 },
  badgeGreen:     { backgroundColor: '#EBF5EB' },
  badgeBlue:      { backgroundColor: '#E8F0FB' },
  badgeGray:      { backgroundColor: '#F2F2F2' },
  badgeText:      { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  pkgDivider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  pkgDividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  pkgDividerText: { fontSize: 11, color: C.textLight, marginHorizontal: 10, fontStyle: 'italic' },

  greetingHero:        { height: 110, borderRadius: 16, overflow: 'hidden', marginBottom: 14, justifyContent: 'flex-end' },
  greetingHeroContent: { padding: 14 },
  greetingEye:         { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.14, textTransform: 'uppercase', marginBottom: 4 },
  greetingText:        { fontFamily: 'InstrumentSerif', fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 21 },

  routeBadge: { backgroundColor: '#EBF5EB', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#C5E0C5', marginBottom: 8 },

  schedSectionLabel: { fontFamily: 'DMMono', fontSize: 9, color: C.textMid, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10, marginTop: 6 },
  schedCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.divider,
    shadowColor: '#3B1F0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  schedItem:          { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.divider, alignItems: 'center' },
  schedItemHighlight: { backgroundColor: '#FDF5EC' },
  schedTime:    { fontFamily: 'DMMonoMedium', fontSize: 12, color: C.accent, width: 54 },
  schedVillage: { fontFamily: 'DMMono', fontSize: 8, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.1, marginBottom: 2 },
  schedTitle:   { fontFamily: 'InstrumentSerif', fontSize: 15, color: C.textDark, marginBottom: 3 },
  schedDesc:          { fontSize: 12, color: C.textMid, lineHeight: 17 },
  schedFlags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  schedFlag:          { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  schedFlagText:      { fontSize: 10, fontWeight: '600' },

  heroStopCard:         { backgroundColor: C.card, overflow: 'hidden' },
  heroStopCardBorder:   { borderBottomWidth: 1, borderBottomColor: C.divider },
  heroStopImg:          { height: 110, justifyContent: 'flex-end' },
  heroStopImgRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  heroStopIslandBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroStopIslandText:   { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.1, textTransform: 'uppercase' },
  heroStopImgTime:      { fontFamily: 'DMMonoMedium', fontSize: 13, color: C.accent },
  heroStopBody:         { padding: 14 },
  heroStopTitle:        { fontFamily: 'InstrumentSerif', fontSize: 18, color: C.textDark, marginBottom: 4, lineHeight: 22 },
  heroStopDesc:         { fontSize: 12, color: C.textMid, lineHeight: 17, marginBottom: 8 },
  activitiesRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  activityPill:         { backgroundColor: C.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.divider },
  activityPillText:     { fontFamily: 'DMMono', fontSize: 9, color: C.textMid, letterSpacing: 0.3 },
  finaleCard:           { overflow: 'hidden' },
  finaleInner:          { backgroundColor: '#2D0A5E', padding: 20 },
  finaleTopRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  finaleBadge:          { backgroundColor: 'rgba(200,150,62,0.2)', borderWidth: 1, borderColor: 'rgba(200,150,62,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  finaleBadgeText:      { fontFamily: 'DMMono', fontSize: 9, color: C.accent, letterSpacing: 0.1 },
  finaleTime:           { fontFamily: 'DMMono', fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  finaleTitle:          { fontFamily: 'BebasNeue', fontSize: 40, color: '#FFFFFF', letterSpacing: 1, lineHeight: 40, marginBottom: 6 },
  finaleDesc:           { fontFamily: 'InstrumentSerif', fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },

  upgradeCard:    { backgroundColor: C.accentLight, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: C.accent, marginTop: 14 },
  upgradeLabel:   { fontSize: 10, color: C.warning, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', marginBottom: 4 },
  upgradeTitle:   { fontFamily: 'BebasNeue', fontSize: 28, color: C.textDark, letterSpacing: 0.5, marginBottom: 8, lineHeight: 28 },
  upgradeDesc:    { fontSize: 13, color: C.textMid, lineHeight: 20, marginBottom: 14 },
  upgradeBtn:     { backgroundColor: C.primary, borderRadius: 24, paddingVertical: 13, alignItems: 'center' },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  infoCardFree3: { backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#A5D6A7', marginTop: 12 },
  infoCardTitle: { fontSize: 13, fontWeight: '700', color: '#2D6A2D', marginBottom: 4 },
  infoCardDesc:  { fontSize: 12, color: '#2D6A2D', lineHeight: 18 },

  saveBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontFamily: 'BebasNeue', fontSize: 20, color: '#FFFFFF', letterSpacing: 1 },
  shareBtn:    { backgroundColor: C.card, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, borderWidth: 1.5, borderColor: C.divider },
  shareBtnText:{ fontFamily: 'BebasNeue', fontSize: 20, color: C.primary, letterSpacing: 1 },

  shareCard:               { width: 320, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  shareCardHeader:         { height: 140, justifyContent: 'flex-end' },
  shareCardHeaderContent:  { padding: 16 },
  shareCardLogo:           { fontFamily: 'DMMono', fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.16, textTransform: 'uppercase', marginBottom: 4 },
  shareCardTitle:          { fontFamily: 'BebasNeue', fontSize: 36, color: '#FFFFFF', letterSpacing: 1, lineHeight: 36 },
  shareCardBody:           { padding: 16 },
  shareCardMeta:           { flexDirection: 'row', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0E6D8' },
  shareCardPill:           { backgroundColor: '#F5EFE6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  shareCardPillText:       { fontFamily: 'DMMono', fontSize: 9, color: C.primary, letterSpacing: 0.05 },
  shareCardStop:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#FAF3EB' },
  shareCardTime:           { fontFamily: 'DMMonoMedium', fontSize: 11, color: C.accent, width: 52 },
  shareCardDot:            { width: 8, height: 8, borderRadius: 4 },
  shareCardStopTitle:      { fontFamily: 'InstrumentSerif', fontSize: 13, color: C.textDark, flex: 1 },
  shareCardFooter:         { backgroundColor: C.primary, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareCardFooterText:     { fontFamily: 'DMMono', fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.1 },
  shareCardFooterBadge:    { backgroundColor: 'rgba(200,150,62,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(200,150,62,0.35)' },
  shareCardFooterBadgeText:{ fontFamily: 'DMMono', fontSize: 9, color: C.accent, letterSpacing: 0.08 },

  questionFooter:     { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  questionFooterText: { fontFamily: 'DMMono', fontSize: 9, color: C.divider, letterSpacing: 2, textTransform: 'uppercase' },

  optIconBox:     { width: 44, height: 44, borderRadius: 12, backgroundColor: C.background, borderWidth: 1.5, borderColor: C.divider, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  optIconBoxSel:  { backgroundColor: C.primary, borderColor: C.primary },
  optIconChar:    { fontSize: 18, color: C.textMid },
  optIconCharSel: { color: '#FFFFFF' },

  restartBtn:     { borderWidth: 1.5, borderColor: C.divider, borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  restartBtnText: { fontSize: 14, color: C.textMid, fontWeight: '500' },

  fab: {
    position: 'absolute', bottom: 28, right: 20, width: 54, height: 54,
    borderRadius: 27, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B1F0F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { fontSize: 22, color: '#FFFFFF' },

  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(59,31,15,0.4)', zIndex: 10 },

  drawer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 530,
    backgroundColor: C.card,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    shadowColor: '#3B1F0F', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 14, zIndex: 20,
  },
  drawerHandle: { width: 38, height: 4, backgroundColor: C.divider, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 6 },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider, gap: 10,
  },
  drawerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  drawerName:   { fontSize: 14, fontWeight: '700', color: C.textDark },
  drawerStatus: { fontSize: 11, color: C.success },
  drawerClose:  { padding: 6 },

  chatArea:     { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
  msgRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 2 },
  msgAvatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0E8DE', alignItems: 'center', justifyContent: 'center' },
  aiBubble:     { backgroundColor: C.cardElevated, borderRadius: 14, borderBottomLeftRadius: 4, padding: 10, maxWidth: '80%', borderWidth: 1, borderColor: C.divider },
  userBubble:   { backgroundColor: C.primary, borderRadius: 14, borderBottomRightRadius: 4, padding: 10, maxWidth: '80%' },
  typingBubble: { backgroundColor: C.cardElevated, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.divider },

  quickReplies: { maxHeight: 46, borderTopWidth: 1, borderTopColor: C.divider },
  qrBtn:        { backgroundColor: C.cardElevated, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: C.divider },
  qrText:       { fontSize: 12, color: C.textDark, fontWeight: '500' },

  inputArea:       { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: C.divider, alignItems: 'flex-end' },
  inputWrap:       { flex: 1, backgroundColor: C.cardElevated, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.divider, minHeight: 42 },
  input:           { fontSize: 14, color: C.textDark, maxHeight: 80 },
  sendBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },

  miniSchedCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, overflow: 'hidden', marginTop: 4 },
  miniSchedHeader: { backgroundColor: C.orange, padding: 8, paddingHorizontal: 12 },
  miniSchedItem:   { flexDirection: 'row', gap: 8, padding: 7, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f2', alignItems: 'flex-start' },
  miniTime:        { fontSize: 11, color: '#aaa', minWidth: 44, paddingTop: 1 },
  miniVillage:     { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: C.orange, fontWeight: '700' },
  miniTitle:       { fontSize: 12, fontWeight: '600', color: C.text },
  miniTip:         { fontSize: 11, color: '#888', marginTop: 1 },
});
