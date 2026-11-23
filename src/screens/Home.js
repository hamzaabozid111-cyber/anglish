import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ar, Btn, Card, Screen } from '../components';
import { C, LEVELS } from '../theme';
import { ORDER, SECTIONS } from '../content';
import { dueItems } from '../store';

function Tile({ title, desc, badge, onPress, accent }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 72, borderRadius: 14, borderWidth: 2, borderColor: accent ? C.accent : C.line, backgroundColor: C.surface, padding: 14, opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: 12 })}
    >
      <View style={{ flex: 1 }}>
        <Ar style={{ fontWeight: '800', fontSize: 18 }}>{title}</Ar>
        <Ar style={{ color: C.muted, fontSize: 14 }}>{desc}</Ar>
      </View>
      {badge ? (
        <View style={{ minWidth: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: C.accentFg, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function Home({ P, go }) {
  const due = dueItems(P.srs).length;
  const primary = P.roles.includes('coach') ? 'coach' : P.roles.includes('translator') ? 'translator' : 'hobby';
  const keys = ORDER[primary];
  const first = P.roles.includes('translator') ? ['translator'] : [];

  return (
    <Screen>
      <Ar style={{ fontSize: 26, fontWeight: '800' }}>أهلاً يا كابتن {P.name}</Ar>

      <Card>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat n={LEVELS[P.level] || '—'} l="مستواك" />
          <Stat n={P.score} l="نقاط" />
          <Stat n={P.streakDays} l="أيام ورا بعض" />
        </View>
      </Card>

      {due > 0 ? <Tile accent title="مراجعة الجمل" desc="جمل غلطت فيها ووقت مراجعتها جه" badge={due} onPress={() => go('quiz', { sec: 'review' })} /> : null}

      {first.map((k) => (
        <Tile key={k} accent title={SECTIONS[k].title} desc={SECTIONS[k].desc} onPress={() => go('quiz', { sec: k })} />
      ))}

      {keys.map((k) => (
        <Tile key={k} title={SECTIONS[k].title} desc={SECTIONS[k].desc} onPress={() => go('quiz', { sec: k })} />
      ))}

      {!first.length ? <Tile title={SECTIONS.translator.title} desc={SECTIONS.translator.desc} onPress={() => go('quiz', { sec: 'translator' })} /> : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn style={{ flex: 1 }} title="تقدمي" onPress={() => go('progress')} />
        <Btn style={{ flex: 1 }} title="الإعدادات" onPress={() => go('settings')} />
      </View>
    </Screen>
  );
}

function Stat({ n, l }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: C.fg, fontWeight: '800', fontSize: 18, textAlign: 'center' }}>{n}</Text>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center' }}>{l}</Text>
    </View>
  );
}
