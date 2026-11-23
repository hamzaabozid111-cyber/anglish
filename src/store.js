import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'captainEnglish.v1';
const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 14]; // أيام لكل صندوق في المراجعة الذكية

export const DEFAULT = {
  name: '',
  coach: 'm',
  dialect: 'eg',
  speed: 'normal',
  limit: 3,
  blind: false,
  roles: [],
  level: 0,
  detail: null,
  testAt: 0,
  score: 0,
  best: 0,
  streakDays: 0,
  lastDay: '',
  srs: {},
  stats: {},
};

export async function loadProfile() {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? { ...DEFAULT, ...JSON.parse(s) } : { ...DEFAULT };
  } catch (e) {
    return { ...DEFAULT };
  }
}

export async function saveProfile(p) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch (e) {}
}

export function srsAfter(srs, item, ok) {
  const cur = srs[item.en];
  if (ok && !cur) return srs; // الجملة الصح من أول مرة مش محتاجة مراجعة
  const box = ok ? Math.min((cur ? cur.box : 0) + 1, INTERVALS.length - 1) : 0;
  return {
    ...srs,
    [item.en]: { eg: item.eg, fus: item.fus, box, due: Date.now() + INTERVALS[box] * DAY },
  };
}

export function dueItems(srs) {
  const now = Date.now();
  return Object.keys(srs)
    .filter((k) => srs[k].due <= now)
    .map((k) => ({ en: k, eg: srs[k].eg, fus: srs[k].fus }));
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function streakPatch(p) {
  const t = dayKey();
  if (p.lastDay === t) return {};
  const y = dayKey(new Date(Date.now() - DAY));
  return { lastDay: t, streakDays: p.lastDay === y ? p.streakDays + 1 : 1 };
}
