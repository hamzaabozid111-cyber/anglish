import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Ar, Badge, Btn, Card, En, Screen } from '../components';
import { C } from '../theme';
import { SECTIONS } from '../content';
import { buildQueue } from '../builders';
import { streakPatch, srsAfter } from '../store';
import { RATE, coachSay, similarity, speak, stopSpeaking, useMic } from '../audio';

const CHALK = 'rgba(255,255,255,0.78)';

function PitchView({ sc, pos, state }) {
  const W = Math.min(Dimensions.get('window').width - 32, 340);
  const stripes = [0, 1, 2, 3, 4, 5, 6];
  return (
    <View style={{ alignSelf: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: C.line }}>
      <Svg width={W} height={W * 1.4} viewBox="0 0 300 420">
        {stripes.map((i) => (
          <Rect key={i} x={0} y={i * 60} width={300} height={60} fill={i % 2 ? C.grass : C.grass2} />
        ))}
        <Rect x={8} y={8} width={284} height={404} stroke={CHALK} strokeWidth={2} fill="none" />
        <Line x1={8} y1={210} x2={292} y2={210} stroke={CHALK} strokeWidth={2} />
        <Circle cx={150} cy={210} r={36} stroke={CHALK} strokeWidth={2} fill="none" />
        <Rect x={85} y={8} width={130} height={62} stroke={CHALK} strokeWidth={2} fill="none" />
        <Rect x={85} y={350} width={130} height={62} stroke={CHALK} strokeWidth={2} fill="none" />
        <Rect x={120} y={8} width={60} height={22} stroke={CHALK} strokeWidth={2} fill="none" />
        <Rect x={120} y={390} width={60} height={22} stroke={CHALK} strokeWidth={2} fill="none" />
        {state === 'ok' ? <Circle cx={sc.to[0]} cy={sc.to[1]} r={20} stroke="#fff" strokeWidth={2} strokeDasharray="4,4" fill="none" /> : null}
        {sc.P.map((p) => {
          const isMover = p[0] === sc.mover;
          const x = isMover && pos ? pos[0] : p[2];
          const y = isMover && pos ? pos[1] : p[3];
          const opp = p[4] === 'opp';
          return (
            <React.Fragment key={p[0]}>
              {isMover ? <Circle cx={x} cy={y} r={21} stroke={state === 'ok' ? '#4fe08e' : C.bad} strokeWidth={3} fill="none" /> : null}
              <Circle cx={x} cy={y} r={14} fill={opp ? '#e9eeec' : '#f2b632'} stroke="#0b1a12" strokeWidth={1.5} />
              <SvgText x={x} y={y + 4.5} fontSize={13} fontWeight="bold" fill="#10241a" textAnchor="middle">
                {String(p[1])}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default function Quiz({ P, update, sec, exit }) {
  const [queue, setQueue] = useState(() => buildQueue(sec, P));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [miss, setMiss] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState({ score: 0, right: 0, total: 0 });
  const [drama, setDrama] = useState(false);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const [pos, setPos] = useState(null);
  const [note, setNote] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [reveal, setReveal] = useState(false);
  const moveRef = useRef(null);

  const q = queue[idx];
  const qRef = useRef(q);
  const chosenRef = useRef(chosen);
  const answerRef = useRef(null);
  qRef.current = q;
  chosenRef.current = chosen;

  const mic = useMic((text) => {
    const qq = qRef.current;
    if (!qq || chosenRef.current !== null || qq.optLang !== 'en') return;
    let bi = -1;
    let bs = 0;
    qq.options.forEach((o, i) => {
      const sc = similarity(text, o.t);
      if (sc > bs) {
        bs = sc;
        bi = i;
      }
    });
    if (bs >= 0.5) {
      setNote(bs >= 0.85 ? 'نطقك ممتاز!' : bs >= 0.65 ? 'نطق كويس، كمّل.' : 'قريب، حاول تنطقها أوضح المرة الجاية.');
      answerRef.current(bi);
    } else {
      setNote(`سمعتك بتقول: "${text}". مش مطابقة لأي اختيار، جرّب تاني.`);
    }
  });

  /* صوت السؤال + تجهيز كل سؤال */
  useEffect(() => {
    if (!q || done) return undefined;
    setNote('');
    setReveal(false);
    setTimeLeft(12);
    if (q.kind === 'pitch') {
      const m = q.scenario.P.find((p) => p[0] === q.scenario.mover);
      setPos([m[2], m[3]]);
    }
    if (q.audio) {
      speak(q.audio, { lang: q.acc || 'en-US', who: 'p', rate: RATE[P.speed], onStart: () => setSpeaking(true), onDone: () => setSpeaking(false) });
    } else if (q.sit) {
      speak(q.sit, { lang: 'ar', who: P.coach });
    }
    return () => {
      stopSpeaking();
      if (moveRef.current) clearInterval(moveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  /* العداد في وضع المترجم */
  useEffect(() => {
    if (!q || !q.timer || chosen !== null || done) return undefined;
    const iv = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [idx, chosen, done, q]);

  useEffect(() => {
    if (q && q.timer && chosen === null && !done && timeLeft <= 0) answerRef.current(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function hear(mult) {
    if (!q || !q.audio) return;
    stopSpeaking();
    speak(q.audio, { lang: q.acc || 'en-US', who: 'p', rate: RATE[P.speed] * mult });
  }

  function moveTo(to) {
    if (!pos) return;
    const from = pos;
    let t = 0;
    if (moveRef.current) clearInterval(moveRef.current);
    moveRef.current = setInterval(() => {
      t += 1 / 30;
      const e = Math.min(1, t);
      const k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
      setPos([from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]);
      if (e >= 1) clearInterval(moveRef.current);
    }, 33);
  }

  function answer(i) {
    if (chosenRef.current !== null || !q) return;
    chosenRef.current = i;
    setChosen(i);
    stopSpeaking();
    const ok = i >= 0 && q.options[i].ok;
    const pts = ok ? 10 + (q.timer ? Math.max(0, timeLeft) : 0) : 0;
    const ns = ok ? streak + 1 : 0;
    setStreak(ns);
    setRound((r) => ({ score: r.score + pts, right: r.right + (ok ? 1 : 0), total: r.total + 1 }));
    const old = P.stats[sec] || { right: 0, total: 0 };
    update({
      ...streakPatch(P),
      score: P.score + pts,
      best: Math.max(P.best, ns),
      srs: srsAfter(P.srs, q.srsItem, ok),
      stats: { ...P.stats, [sec]: { right: old.right + (ok ? 1 : 0), total: old.total + 1 } },
    });
    const right = q.options.find((o) => o.ok);
    if (ok) {
      setMiss(0);
      coachSay(P.coach, `برافو يا كابتن ${P.name}!`, `Well done, Captain ${P.name}!`);
      if (q.kind === 'pitch') {
        moveTo(q.scenario.to);
        speak(q.reply, { lang: 'en-GB', who: 'p', rate: RATE[P.speed] });
      }
    } else {
      coachSay(P.coach, 'قريب يا كابتن.', 'Almost, Captain!');
      if (!q._again) {
        setQueue((qs) => {
          const copy = qs.slice();
          copy.splice(Math.min(idx + 3, copy.length), 0, { ...q, _again: true });
          return copy;
        });
      }
      const nm = miss + 1;
      if (nm >= P.limit) {
        setDrama(true);
        setMiss(0);
        const sentence = q.kind === 'trans' ? q.text : right.t;
        const meaning = q.kind === 'trans' ? right.t : right.ar;
        speak(`كابتن ${P.name}... لقد خيبت ظني بك!`, { lang: 'ar', who: P.coach, rate: 0.95 });
        speak(`ترجمة الجملة: ${meaning}`, { lang: 'ar', who: P.coach, rate: 0.95 });
        speak(sentence, { lang: 'en-US', who: P.coach, rate: 0.85 });
      } else {
        setMiss(nm);
      }
    }
  }
  answerRef.current = answer;

  function next() {
    chosenRef.current = null;
    setChosen(null);
    setNote('');
    setDrama(false);
    if (idx + 1 >= queue.length) setDone(true);
    else setIdx(idx + 1);
  }

  const title = SECTIONS[sec].title;

  if (!queue.length) {
    return (
      <Screen>
        <Ar style={{ fontSize: 22, fontWeight: '800' }}>{title}</Ar>
        <Card>
          <Ar>مفيش جمل للمراجعة دلوقتي يا كابتن. كمّل تدريب في الأقسام التانية، والجمل اللي بتغلط فيها هتظهر هنا.</Ar>
        </Card>
        <Btn kind="primary" title="رجوع" onPress={exit} />
      </Screen>
    );
  }

  if (done) {
    const pct = round.total ? Math.round((round.right / round.total) * 100) : 0;
    return (
      <Screen>
        <Ar style={{ fontSize: 26, fontWeight: '800' }}>خلصت الجولة يا كابتن {P.name}</Ar>
        <Card>
          <Ar>
            جمعت {round.score} نقطة، وجاوبت صح على {round.right} من {round.total} ({pct}%).
          </Ar>
          <Ar style={{ color: C.muted }}>الجمل اللي غلطت فيها اتحفظت وهترجعلك في المراجعة.</Ar>
        </Card>
        <Btn kind="primary" title="رجوع للقائمة" onPress={exit} />
      </Screen>
    );
  }

  const answered = chosen !== null;
  const right = q.options.find((o) => o.ok);
  const ok = answered && chosen >= 0 && q.options[chosen].ok;
  const showText = !P.blind || reveal || answered;
  const hasAudio = !!q.audio;
  const canMic = q.optLang === 'en' && !answered;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Btn small title="رجوع" onPress={exit} />
        <Ar style={{ flex: 1, color: C.muted, fontSize: 14 }}>
          {title} · {idx + 1} من {queue.length}
        </Ar>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {Array.from({ length: P.limit }).map((_, i) => (
            <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i < miss ? C.bad : C.line }} />
          ))}
        </View>
      </View>

      {q.timer && !answered ? (
        <View style={{ height: 8, backgroundColor: C.line, borderRadius: 4 }}>
          <View style={{ height: 8, width: `${Math.max(0, timeLeft) / 12 * 100}%`, backgroundColor: timeLeft <= 4 ? C.bad : C.accent, borderRadius: 4 }} />
        </View>
      ) : null}

      <Card>
        {q.kind === 'say' || q.kind === 'trans' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Badge text={(q.who || 'C')[0]} speaking={speaking} />
              <View style={{ flex: 1 }}>
                {q.who ? <Ar style={{ color: C.muted, fontSize: 13 }}>{q.who} بيتكلم</Ar> : null}
                {showText ? <En>{q.text}</En> : <En style={{ color: C.muted }}>••••••••</En>}
                {answered && q.ar && q.kind === 'say' ? <Ar style={{ color: C.muted }}>{q.ar}</Ar> : null}
              </View>
            </View>
            {hasAudio ? (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Btn small kind="primary" title="اسمع" onPress={() => hear(1)} />
                <Btn small title="أبطأ" onPress={() => hear(0.65)} />
                {P.blind && !reveal && !answered ? <Btn small title="اظهر النص" onPress={() => setReveal(true)} /> : null}
              </View>
            ) : null}
          </>
        ) : null}

        {q.kind === 'a2e' ? <Ar style={{ fontSize: 24, fontWeight: '800' }}>{q.text}</Ar> : null}

        {q.kind === 'instruct' || q.kind === 'pitch' ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Badge text="C" />
            <View style={{ flex: 1, gap: 4 }}>
              <Ar>{q.sit}</Ar>
              <Ar style={{ color: C.muted, fontSize: 14 }}>اختار الجملة اللي تقولها بالإنجليزي.</Ar>
            </View>
          </View>
        ) : null}

        {q.kind === 'pitch' ? <PitchView sc={q.scenario} pos={pos} state={ok ? 'ok' : 'wrong'} /> : null}
      </Card>

      <View style={{ gap: 10 }}>
        {q.options.map((o, i) => {
          const isRight = answered && o.ok;
          const isBad = answered && chosen === i && !o.ok;
          return (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => answer(i)}
              accessibilityRole="button"
              style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: isRight ? C.good : isBad ? C.bad : C.line, backgroundColor: isRight ? '#17402c' : isBad ? '#4a1f1b' : C.surface, paddingHorizontal: 16, paddingVertical: 10, gap: 2 }}
            >
              {q.optLang === 'ar' ? <Ar style={{ fontSize: 19, fontWeight: '700' }}>{o.t}</Ar> : <En style={{ fontSize: 21 }}>{o.t}</En>}
              {answered && o.ar ? <Ar style={{ color: C.muted, fontSize: 14 }}>{o.ar}</Ar> : null}
            </Pressable>
          );
        })}
      </View>

      {canMic ? (
        <View style={{ gap: 8 }}>
          <Btn kind={mic.listening ? 'danger' : undefined} title={mic.listening ? 'بسمعك... اضغط للإيقاف' : 'قول الإجابة بصوتك'} onPress={mic.listening ? mic.stop : mic.start} />
          {mic.err ? (
            <Ar style={{ color: C.muted, fontSize: 14 }}>
              {mic.err === 'permission' ? 'لازم تسمح للتطبيق بالميكروفون من إعدادات الموبايل.' : 'الميكروفون مش شغال دلوقتي. اختار الإجابة بالضغط.'}
            </Ar>
          ) : null}
        </View>
      ) : null}
      {note ? <Ar style={{ color: C.accent }}>{note}</Ar> : null}

      {answered ? (
        <View style={{ borderRadius: 12, borderWidth: 2, borderColor: ok ? C.good : C.bad, padding: 14, gap: 6 }}>
          {ok ? (
            <>
              <En>Well done, Captain {P.name}!</En>
              <Ar>برافو يا كابتن {P.name}!{q.timer ? ` +${10 + Math.max(0, timeLeft)} نقطة` : ''}</Ar>
            </>
          ) : (
            <>
              <En>{chosen === -1 ? "Time's up, Captain!" : 'Almost, Captain! Try again.'}</En>
              <Ar>
                الصح هو:{' '}
                <Text style={{ fontWeight: '800' }}>{q.optLang === 'ar' ? `${q.text} = ${right.t}` : `${right.t}${right.ar ? ` = ${right.ar}` : ''}`}</Text>
              </Ar>
            </>
          )}
          {q.kind === 'pitch' && ok ? <En style={{ fontSize: 18, color: C.muted }}>{q.reply}</En> : null}
        </View>
      ) : null}

      {drama ? (
        <View style={{ borderRadius: 12, backgroundColor: C.bad, padding: 14, gap: 8 }}>
          <Ar style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>كابتن {P.name}... لقد خيبت ظني بك!</Ar>
          <Ar style={{ color: '#fff' }}>ترجمة الجملة:</Ar>
          <En style={{ color: '#fff' }}>{q.kind === 'trans' ? q.text : right.t}</En>
          <Ar style={{ color: '#fff' }}>{q.kind === 'trans' ? right.t : right.ar}</Ar>
        </View>
      ) : null}

      {answered ? <Btn kind="primary" title={idx + 1 >= queue.length ? 'خلّص الجولة' : 'كمّل'} onPress={next} /> : null}
    </Screen>
  );
}
