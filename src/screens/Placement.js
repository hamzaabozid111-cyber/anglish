import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ar, Badge, Btn, Card, En, Screen } from '../components';
import { C, LEVELS } from '../theme';
import { PLACEMENT } from '../content';
import { mkTrans } from '../builders';
import { RATE, speak, stopSpeaking } from '../audio';

const TOTAL = 15;
const ACCENTS = ['en-US', 'en-GB', 'en-AU', 'en-IN', 'en-ZA'];
const ABOUT = {
  1: 'هنبدأ بالأساسيات: كلمات وجمل قصيرة جداً ومواقف بسيطة.',
  2: 'بتفهم الجمل البسيطة. هندرّبك على الجمل اليومية وتعليمات الملعب السريعة.',
  3: 'مستواك كويس في الجمل العادية. هنركز على السرعة وجمل المدرب واللاعيبة.',
  4: 'بتفهم أغلب الكلام. هندرّبك على الجمل الطويلة واللهجات والتكتيك.',
  5: 'مستواك عالي. هنشتغل على السرعة والمؤتمرات الصحفية والترجمة الفورية.',
};

function pickNext(level, used, dialect) {
  for (const delta of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
    const lv = level + delta;
    const cands = PLACEMENT.filter((x) => x.lv === lv && !used.includes(x.en));
    if (cands.length) {
      const item = cands[Math.floor(Math.random() * cands.length)];
      const near = PLACEMENT.filter((x) => Math.abs(x.lv - item.lv) <= 1);
      return { item, q: mkTrans(item, near, dialect) };
    }
  }
  return null;
}

function finish(hist) {
  const last = hist.slice(-8);
  const mean = last.reduce((a, h) => a + h.lv, 0) / last.length;
  const acc = last.filter((h) => h.ok).length / last.length;
  const level = Math.max(1, Math.min(5, Math.round(mean + (acc - 0.5) * 2)));
  const pct = (cat) => {
    const l = hist.filter((h) => h.cat === cat);
    return l.length ? Math.round((l.filter((h) => h.ok).length / l.length) * 100) : 0;
  };
  return { level, detail: { general: pct('general'), football: pct('football') } };
}

export default function Placement({ P, update, done, skip }) {
  const [hist, setHist] = useState([]);
  const [used, setUsed] = useState([]);
  const [cur, setCur] = useState(() => pickNext(2, [], P.dialect));
  const [lv, setLv] = useState(2);
  const [result, setResult] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!cur || result) return undefined;
    setReveal(false);
    const acc = ACCENTS[hist.length % ACCENTS.length];
    speak(cur.q.audio, { lang: acc, who: 'p', rate: RATE[P.speed], onStart: () => setSpeaking(true), onDone: () => setSpeaking(false) });
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  function hear(mult) {
    const acc = ACCENTS[hist.length % ACCENTS.length];
    stopSpeaking();
    speak(cur.q.audio, { lang: acc, who: 'p', rate: RATE[P.speed] * mult });
  }

  function pick(opt) {
    const h = [...hist, { lv: cur.item.lv, ok: opt.ok, cat: cur.item.cat }];
    const u = [...used, cur.item.en];
    setHist(h);
    setUsed(u);
    stopSpeaking();
    if (h.length >= TOTAL) {
      const r = finish(h);
      update({ level: r.level, detail: r.detail, testAt: Date.now() });
      setResult(r);
      return;
    }
    const nl = opt.ok ? Math.min(5, lv + 1) : Math.max(1, lv - 1);
    setLv(nl);
    setCur(pickNext(nl, u, P.dialect));
  }

  if (result) {
    return (
      <Screen>
        <Ar style={{ fontSize: 26, fontWeight: '800' }}>نتيجة الاختبار يا كابتن {P.name}</Ar>
        <Card>
          <Ar style={{ color: C.muted }}>مستواك</Ar>
          <Ar style={{ fontSize: 34, fontWeight: '800', color: C.accent }}>{LEVELS[result.level]}</Ar>
          <Ar>{ABOUT[result.level]}</Ar>
        </Card>
        <Card>
          <Ar style={{ fontWeight: '800' }}>التفاصيل</Ar>
          <Bar label="إنجليزي عام" pct={result.detail.general} />
          <Bar label="إنجليزي كورة" pct={result.detail.football} />
        </Card>
        <Btn kind="primary" title="ابدأ التدريب" onPress={done} />
      </Screen>
    );
  }

  if (!cur) return null;
  const showText = !P.blind || reveal;

  return (
    <Screen>
      <Ar style={{ fontSize: 22, fontWeight: '800' }}>اختبار تحديد المستوى</Ar>
      <Ar style={{ color: C.muted }}>
        سؤال {hist.length + 1} من {TOTAL}. اسمع الجملة واختار ترجمتها الصح.
      </Ar>
      <View style={{ height: 6, backgroundColor: C.line, borderRadius: 3 }}>
        <View style={{ height: 6, width: `${(hist.length / TOTAL) * 100}%`, backgroundColor: C.accent, borderRadius: 3 }} />
      </View>
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Badge text="?" speaking={speaking} />
          <View style={{ flex: 1 }}>
            {showText ? <En style={{ fontSize: 24 }}>{cur.q.text}</En> : <En style={{ fontSize: 24, color: C.muted }}>••••••••</En>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Btn small kind="primary" title="اسمع" onPress={() => hear(1)} />
          <Btn small title="أبطأ" onPress={() => hear(0.65)} />
          {P.blind && !reveal ? <Btn small title="اظهر النص" onPress={() => setReveal(true)} /> : null}
        </View>
      </Card>
      <View style={{ gap: 10 }}>
        {cur.q.options.map((o, i) => (
          <Btn key={`${cur.item.en}-${i}`} title={o.t} onPress={() => pick(o)} style={{ alignItems: 'flex-end' }} />
        ))}
      </View>
      {skip ? <Btn small title="تخطي الاختبار دلوقتي" onPress={skip} /> : null}
    </Screen>
  );
}

function Bar({ label, pct }) {
  return (
    <View style={{ gap: 4 }}>
      <Ar>
        {label}: {pct}%
      </Ar>
      <View style={{ height: 8, backgroundColor: C.line, borderRadius: 4 }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: C.good, borderRadius: 4 }} />
      </View>
    </View>
  );
}
