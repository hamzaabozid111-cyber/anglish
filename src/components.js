import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from './theme';

export function Screen({ children, scroll = true, style }) {
  const ins = useSafeAreaInsets();
  const pad = { paddingTop: ins.top + 12, paddingBottom: ins.bottom + 24, paddingLeft: Math.max(16, ins.left), paddingRight: Math.max(16, ins.right) };
  if (!scroll) return <View style={[s.screen, pad, style]}>{children}</View>;
  return (
    <ScrollView style={s.screen} contentContainerStyle={[pad, { gap: 14 }, style]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Ar({ children, style, ...p }) {
  return (
    <Text {...p} style={[s.ar, style]}>
      {children}
    </Text>
  );
}

export function En({ children, style, ...p }) {
  return (
    <Text {...p} style={[s.en, style]}>
      {children}
    </Text>
  );
}

export function Btn({ title, onPress, kind, small, disabled, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, kind === 'primary' && s.primary, kind === 'danger' && s.danger, small && s.small, disabled && { opacity: 0.45 }, pressed && { opacity: 0.8 }, style]}
    >
      <Text style={[s.btnT, kind === 'primary' && { color: C.accentFg }, small && { fontSize: 14 }]}>{title}</Text>
    </Pressable>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} onPress={() => onChange(o.v)} style={[s.segB, on && { backgroundColor: C.grass }]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={[s.segT, on && { color: '#fff' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, children }) {
  return (
    <View style={{ gap: 6 }}>
      <Ar style={{ color: C.muted, fontSize: 14, fontWeight: '600' }}>{label}</Ar>
      {children}
    </View>
  );
}

export function Badge({ text, speaking }) {
  return (
    <View style={[s.badge, speaking && { borderColor: '#fff' }]}>
      <Text style={s.badgeT}>{text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  ar: { color: C.fg, fontSize: 16, lineHeight: 26, textAlign: 'right', writingDirection: 'rtl' },
  en: { color: C.fg, fontSize: 22, fontWeight: '700', textAlign: 'left', writingDirection: 'ltr' },
  btn: { minHeight: 50, borderRadius: 10, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: C.accent, borderColor: C.accent },
  danger: { backgroundColor: C.bad, borderColor: C.bad },
  small: { minHeight: 40, paddingVertical: 6, paddingHorizontal: 12 },
  btnT: { color: C.fg, fontWeight: '800', fontSize: 17 },
  seg: { flexDirection: 'row', borderWidth: 2, borderColor: C.line, borderRadius: 10, overflow: 'hidden' },
  segB: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  segT: { color: C.fg, fontWeight: '700' },
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.grass, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  badgeT: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
