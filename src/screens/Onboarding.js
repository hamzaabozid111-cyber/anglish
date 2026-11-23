import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ar, Badge, Btn, Card, En, Field, Screen, Seg } from '../components';
import { C } from '../theme';
import { coachSay, stopSpeaking } from '../audio';

const ROLES = [
  { v: 'coach', label: 'مدرب' },
  { v: 'translator', label: 'مترجم' },
  { v: 'hobby', label: 'هواية' },
];

export default function Onboarding({ P, update, next }) {
  const [name, setName] = useState(P.name || '');
  const [coach, setCoach] = useState(P.coach);
  const [dialect, setDialect] = useState(P.dialect);
  const [roles, setRoles] = useState(P.roles.length ? P.roles : []);

  useEffect(() => {
    coachSay(coach, '', "What's your name, Captain?");
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(v) {
    setRoles((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v]));
  }

  function go() {
    const n = name.trim();
    if (!n) return;
    const rs = roles.length ? roles : ['hobby'];
    update({ name: n, coach, dialect, roles: rs });
    stopSpeaking();
    coachSay(coach, '', `Nice to meet you, Captain ${n}!`);
    next();
  }

  return (
    <Screen>
      <En style={{ fontSize: 14, color: C.muted, letterSpacing: 3 }}>CAPTAIN ENGLISH</En>
      <Ar style={{ fontSize: 30, fontWeight: '800' }}>كابتن إنجلش</Ar>
      <Ar style={{ color: C.muted }}>إنجليزي الملاعب والحياة اليومية. تسمع، تفهم، وترد.</Ar>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Badge text="C" />
          <View style={{ flex: 1, gap: 4 }}>
            <En>What's your name, Captain?</En>
            <Ar style={{ color: C.muted }}>اسمك إيه يا كابتن؟</Ar>
            <Btn small title="اسمع السؤال" onPress={() => { stopSpeaking(); coachSay(coach, '', "What's your name, Captain?"); }} style={{ alignSelf: 'flex-start' }} />
          </View>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="اكتب اسمك هنا"
          placeholderTextColor={C.muted}
          maxLength={20}
          style={{ minHeight: 52, borderRadius: 10, borderWidth: 2, borderColor: C.line, backgroundColor: C.bg, color: C.fg, paddingHorizontal: 14, fontSize: 18, textAlign: 'right' }}
        />
        <Field label="صوت المدرب">
          <Seg value={coach} onChange={(v) => { setCoach(v); coachSay(v, '', 'Hello, Captain!'); }} options={[{ v: 'm', label: 'شاب' }, { v: 'f', label: 'بنت' }]} />
        </Field>
        <Field label="لهجة الترجمة العربي">
          <Seg value={dialect} onChange={setDialect} options={[{ v: 'eg', label: 'مصري' }, { v: 'fus', label: 'فصحى مبسطة' }]} />
        </Field>
        <Field label="هتستخدم التطبيق كـ (اختار واحد أو أكتر)">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ROLES.map((r) => {
              const on = roles.includes(r.v);
              return (
                <Pressable key={r.v} onPress={() => toggle(r.v)} style={{ flex: 1, minHeight: 46, borderRadius: 10, borderWidth: 2, borderColor: on ? C.accent : C.line, backgroundColor: on ? C.surface2 : C.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.fg, fontWeight: '800' }}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Btn kind="primary" title="يلا نبدأ" onPress={go} disabled={!name.trim()} />
      </Card>
    </Screen>
  );
}
