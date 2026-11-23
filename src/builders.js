import * as D from './content';
import { dueItems } from './store';

export function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// كل الجمل اللي نقدر نسأل عنها في الترجمة، ومعاها مستوى تقريبي
function pool(level) {
  const all = [
    ...D.PLACEMENT,
    ...D.COMMENTARY.map((c) => ({ ...c, lv: 3 })),
    ...[...D.DAILY, ...D.LOCKER, ...D.PRESS].map((s) => ({ ...s.ok, lv: 3 })),
  ];
  if (!level) return all;
  const near = all.filter((x) => Math.abs(x.lv - level) <= 1);
  return near.length >= 8 ? near : all;
}

function distract(item, list, n, field) {
  const seen = new Set([item[field]]);
  const out = [];
  for (const x of shuffle(list)) {
    if (x.en === item.en || seen.has(x[field])) continue;
    seen.add(x[field]);
    out.push(x);
    if (out.length === n) break;
  }
  return out;
}

// إنجليزي -> اختار الترجمة العربي
export function mkTrans(item, list, dialect, extra = {}) {
  const field = dialect === 'fus' ? 'fus' : 'eg';
  const wrong = distract(item, list, 3, field);
  const options = shuffle([
    { t: item[field], ok: true },
    ...wrong.map((w) => ({ t: w[field], ok: false })),
  ]);
  return { kind: 'trans', key: item.en, srsItem: item, audio: item.en, acc: 'en-US', text: item.en, ar: item[field], options, optLang: 'ar', ...extra };
}

// عربي -> اختار الجملة الإنجليزي
export function mkA2E(item, list, dialect, extra = {}) {
  const field = dialect === 'fus' ? 'fus' : 'eg';
  const wrong = distract(item, list, 3, 'en');
  const options = shuffle([
    { t: item.en, ar: item[field], ok: true },
    ...wrong.map((w) => ({ t: w.en, ar: w[field], ok: false })),
  ]);
  return { kind: 'a2e', key: item.en, srsItem: item, text: item[field], options, optLang: 'en', ...extra };
}

function mkSay(s, dialect) {
  const f = dialect === 'fus' ? 'fus' : 'eg';
  return {
    kind: 'say',
    key: s.ok.en,
    srsItem: s.ok,
    who: s.who,
    acc: s.acc,
    audio: s.q.en,
    text: s.q.en,
    ar: s.q[f],
    optLang: 'en',
    options: shuffle([
      { t: s.ok.en, ar: s.ok[f], ok: true },
      { t: s.wrong[0].en, ar: s.wrong[0][f], ok: false },
      { t: s.wrong[1].en, ar: s.wrong[1][f], ok: false },
    ]),
  };
}

function mkInstruct(i, dialect, kind = 'instruct', extra = {}) {
  const f = dialect === 'fus' ? 'fus' : 'eg';
  return {
    kind,
    key: i.goal.en,
    srsItem: i.goal,
    sit: i.sit[f],
    reply: i.reply,
    optLang: 'en',
    options: shuffle([
      { t: i.goal.en, ar: i.goal[f], ok: true },
      { t: i.wrong[0].en, ar: i.wrong[0][f], ok: false },
      { t: i.wrong[1].en, ar: i.wrong[1][f], ok: false },
    ]),
    ...extra,
  };
}

export function buildQueue(sec, P) {
  const d = P.dialect;
  switch (sec) {
    case 'daily':
      return shuffle(D.DAILY).map((s) => mkSay(s, d));
    case 'locker':
      return shuffle(D.LOCKER).map((s) => mkSay(s, d));
    case 'press':
      return shuffle(D.PRESS).map((s) => mkSay(s, d));
    case 'tactics':
      return shuffle(D.TACTICS).map((i) => mkInstruct(i, d));
    case 'training':
      return shuffle(D.TRAINING).map((i) => mkInstruct(i, d));
    case 'pitch':
      return shuffle(D.PITCH).map((p) => mkInstruct(p, d, 'pitch', { scenario: p }));
    case 'commentary':
      return shuffle(D.COMMENTARY).map((c) => mkTrans(c, pool(0), d));
    case 'translator': {
      const list = pool(P.level || 2);
      return shuffle(list)
        .slice(0, 10)
        .map((it, i) => (i % 2 === 0 ? mkTrans(it, list, d, { timer: true }) : mkA2E(it, list, d, { timer: true })));
    }
    case 'review': {
      const list = pool(0);
      return shuffle(dueItems(P.srs))
        .slice(0, 10)
        .map((it) => mkTrans(it, list, d));
    }
    default:
      return [];
  }
}
