import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

import { C, FLAG_LABEL, FLAG_STYLE } from '@/constants/theme';
import { ARRIVAL_TIME_MAP, QUESTIONS, TICKETS } from '@/lib/data';
import { buildSchedule, type ScheduleResult, type ScheduleStop } from '@/lib/routing';
import {
  buildChatSystemPrompt,
  fetchGreeting,
  getDefaultGreeting,
  sendChatMessage,
} from '@/lib/api';

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
    setTimeout(() => advance(), 280);
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
          <View style={s.loadingView}>
            <Text style={s.loadingTitle}>Building your personalized day...</Text>
            <Text style={s.loadingSubtitle}>Mapping your route through the center</Text>
            <ActivityIndicator color={C.orange} style={{ marginTop: 16 }} />
          </View>
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
      <Text style={s.qTitle}>{q.title}</Text>
      <Text style={s.qSub}>{q.sub}</Text>

      {(q.type === 'single' || q.type === 'multi') && (
        <View style={s.optGrid}>
          {q.options.map((opt: any) => {
            const sel = q.type === 'single'
              ? (answers as any)[q.id] === opt.value
              : ((answers as any)[q.id] || []).includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.optBtn, sel && s.optBtnSel]}
                onPress={() => q.type === 'single' ? onSingle(q.id, opt.value) : onMulti(q.id, opt.value)}
                activeOpacity={0.75}>
                <Text style={s.optIcon}>{opt.icon}</Text>
                <Text style={[s.optLabel, sel && s.optLabelSel]}>{opt.label}</Text>
                {opt.sub ? <Text style={[s.optSub, sel && s.optSubSel]}>{opt.sub}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {q.type === 'select' && (
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
        {(q.type !== 'single') && (
          <TouchableOpacity
            style={[s.mainBtn, !isComplete && s.mainBtnDisabled]}
            onPress={onNext}
            disabled={!isComplete}>
            <Text style={s.mainBtnText}>{isLast ? 'Build my schedule' : 'Next'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.qContent}>
      {greeting ? <View style={s.greetingCard}><Text style={s.greetingText}>{greeting}</Text></View> : null}

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

      <TouchableOpacity style={s.restartBtn} onPress={onRestart}>
        <Text style={s.restartBtnText}>↺  Plan a new day</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ScheduleStopRow({ stop, isLast }: { stop: ScheduleStop; isLast: boolean }) {
  return (
    <View style={[s.schedItem, stop.highlight && s.schedItemHighlight, isLast && { borderBottomWidth: 0 }]}>
      <Text style={s.schedTime}>{stop.time}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.schedVillage}>{stop.village}</Text>
        <Text style={s.schedTitle}>{stop.title}</Text>
        {stop.desc ? <Text style={s.schedDesc}>{stop.desc}</Text> : null}
        {stop.flags.length > 0 && (
          <View style={s.schedFlags}>
            {stop.flags.map(f => {
              const fs = FLAG_STYLE[f]; const fl = FLAG_LABEL[f];
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
  root:       { flex: 1, backgroundColor: C.bg },
  safeArea:   { flex: 1 },

  header:     { textAlign: 'center' as any, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: C.border, marginBottom: 0 },
  headerSub:  { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888', marginBottom: 3 },
  headerTitle:{ fontSize: 22, fontWeight: '600', color: C.text },

  progressBar:  { height: 3, backgroundColor: '#f0f0f0', marginBottom: 0 },
  progressFill: { height: 3, backgroundColor: C.orange, borderRadius: 2 },

  loadingView:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingTitle:   { fontSize: 16, fontWeight: '600', color: C.text, textAlign: 'center', marginBottom: 6 },
  loadingSubtitle:{ fontSize: 13, color: '#aaa', textAlign: 'center' },

  qContent: { padding: 20, paddingBottom: 100, gap: 0 },
  qLabel:   { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: C.orange, marginBottom: 6, marginTop: 16 },
  qTitle:   { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 4, lineHeight: 24 },
  qSub:     { fontSize: 13, color: '#888', marginBottom: 18, lineHeight: 18 },

  optGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optBtn:     { width: '47%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 12, alignItems: 'center', gap: 4 },
  optBtnSel:  { borderColor: C.orange, borderWidth: 1.5, backgroundColor: C.orangeLight },
  optIcon:    { fontSize: 22 },
  optLabel:   { fontSize: 13, fontWeight: '500', color: C.text },
  optLabelSel:{ color: C.orangeText },
  optSub:     { fontSize: 11, color: '#999' },
  optSubSel:  { color: '#c06040' },

  selectGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  timeChip:      { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius },
  timeChipSel:   { borderColor: C.orange, borderWidth: 1.5, backgroundColor: C.orangeLight },
  timeChipText:  { fontSize: 14, color: C.text },
  timeChipTextSel:{ color: C.orangeText, fontWeight: '500' },

  pkgDivider:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 },
  pkgDividerLine:{ flex: 1, height: 1, backgroundColor: C.border },
  pkgDividerText:{ fontSize: 11, color: '#aaa' },
  pkgCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, padding: 14, gap: 4 },
  pkgCardSel:    { borderColor: C.orange, borderWidth: 1.5, backgroundColor: C.orangeLight },
  pkgName:       { fontSize: 14, fontWeight: '600', color: C.text },
  pkgDesc:       { fontSize: 12, color: '#666', lineHeight: 18 },
  badge:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  badgeGreen:    { backgroundColor: '#E1F5EE' },
  badgeBlue:     { backgroundColor: '#E6F1FB' },
  badgeGray:     { backgroundColor: '#f0f0f0' },
  badgeText:     { fontSize: 10, fontWeight: '500' },

  navRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  mainBtn:       { flex: 1, backgroundColor: C.orange, borderRadius: C.radius, paddingVertical: 15, alignItems: 'center' },
  mainBtnDisabled:{ backgroundColor: '#ddd' },
  mainBtnText:   { fontSize: 15, fontWeight: '600', color: '#fff' },
  backBtn:       { paddingHorizontal: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, justifyContent: 'center' },
  backBtnText:   { fontSize: 18, color: '#666' },

  greetingCard:  { backgroundColor: '#f9f9f7', borderRadius: C.radius, padding: 14, borderLeftWidth: 3, borderLeftColor: C.orange, marginBottom: 14 },
  greetingText:  { fontSize: 14, color: '#444', lineHeight: 22 },

  routeBadge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ee', borderRadius: 10, padding: 10, marginBottom: 12 },

  schedSectionLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#999', marginBottom: 8 },
  schedCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, overflow: 'hidden', marginBottom: 12 },
  schedItem:     { flexDirection: 'row', gap: 12, padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', alignItems: 'flex-start' },
  schedItemHighlight: { backgroundColor: '#fff8f6' },
  schedTime:     { fontSize: 11, color: '#aaa', minWidth: 50, paddingTop: 2 },
  schedVillage:  { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: C.orange, fontWeight: '700', marginBottom: 2 },
  schedTitle:    { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  schedDesc:     { fontSize: 12, color: '#666', lineHeight: 18 },
  schedFlags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  schedFlag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  schedFlagText: { fontSize: 9, fontWeight: '500' },

  upgradeCard:   { backgroundColor: '#FAEEDA', borderWidth: 1.5, borderColor: '#EF9F27', borderRadius: C.radius, padding: 16, marginBottom: 10 },
  upgradeLabel:  { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#854F0B', fontWeight: '600', marginBottom: 5 },
  upgradeTitle:  { fontSize: 14, fontWeight: '600', color: '#633806', marginBottom: 4 },
  upgradeDesc:   { fontSize: 12, color: '#854F0B', lineHeight: 18, marginBottom: 12 },
  upgradeBtn:    { backgroundColor: '#BA7517', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  upgradeBtnText:{ fontSize: 13, fontWeight: '600', color: '#fff' },

  infoCardFree3: { backgroundColor: '#E1F5EE', borderWidth: 1, borderColor: '#9FD9C5', borderRadius: C.radius, padding: 14, marginBottom: 10 },
  infoCardTitle: { fontSize: 13, fontWeight: '600', color: '#0F6E56', marginBottom: 3 },
  infoCardDesc:  { fontSize: 12, color: '#1D6B50', lineHeight: 18 },

  restartBtn:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  restartBtnText:{ fontSize: 14, color: '#666' },

  // Chat
  fab:    { position: 'absolute', bottom: 24, right: 24, width: 54, height: 54, backgroundColor: C.orange, borderRadius: 27, justifyContent: 'center', alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8 },
  fabIcon:{ fontSize: 22 },

  overlay:{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 },

  drawer:          { position: 'absolute', bottom: 0, left: 0, right: 0, height: '78%', backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: -4 }, shadowRadius: 20, elevation: 20 },
  drawerHandle:    { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 0 },
  drawerHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  drawerAvatar:    { width: 34, height: 34, backgroundColor: C.orange, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  drawerName:      { fontSize: 14, fontWeight: '600', color: C.text },
  drawerStatus:    { fontSize: 11, color: '#1D9E75' },
  drawerClose:     { padding: 4 },

  chatArea:  { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  msgRow:    { flexDirection: 'row', gap: 7, alignItems: 'flex-end' },
  msgAvatar: { width: 26, height: 26, backgroundColor: C.orange, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  aiBubble:  { backgroundColor: '#f5f5f2', borderRadius: 14, borderBottomLeftRadius: 3, padding: 10, maxWidth: '80%' },
  userBubble:{ backgroundColor: C.orange, borderRadius: 14, borderBottomRightRadius: 3, padding: 10, maxWidth: '80%' },
  typingBubble: { backgroundColor: '#f5f5f2', borderRadius: 14, padding: 10 },

  quickReplies: { maxHeight: 44, flexShrink: 0 },
  qrBtn:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, flexShrink: 0 },
  qrText:  { fontSize: 11, color: '#555' },

  inputArea: { flexDirection: 'row', gap: 7, padding: 8, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0', alignItems: 'flex-end' },
  inputWrap: { flex: 1, backgroundColor: '#f5f5f2', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  input:     { fontSize: 13, color: C.text, maxHeight: 70, lineHeight: 18 },
  sendBtn:   { width: 34, height: 34, backgroundColor: C.orange, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#ddd' },

  miniSchedCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, overflow: 'hidden', marginTop: 4 },
  miniSchedHeader: { backgroundColor: C.orange, padding: 8, paddingHorizontal: 12 },
  miniSchedItem:   { flexDirection: 'row', gap: 8, padding: 7, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f2', alignItems: 'flex-start' },
  miniTime:    { fontSize: 11, color: '#aaa', minWidth: 44, paddingTop: 1 },
  miniVillage: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: C.orange, fontWeight: '700' },
  miniTitle:   { fontSize: 12, fontWeight: '600', color: C.text },
  miniTip:     { fontSize: 11, color: '#888', marginTop: 1 },
});
