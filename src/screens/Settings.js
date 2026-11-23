import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ar, Btn, Card, Field, Screen, Seg } from '../components';
import { C } from '../theme';
import { DEFAULT } from '../store';
import { coachSay } from '../audio';

const DAY = 86400000;
const ROLES = [
  { v: 'coach', label: 'مدرب' },
  { v: 'translator', label: 'مترجم' },
  { v: 'hobby', label: 'هواية' },
];

export default function Settings({ P, update, back, retest, reset }) {
  const [name, setName] = useState(P.name);
  const wait = Math.ceil((P.testAt + 14 * DAY - Date.now()) / DAY);
  const canRetest = !P.testAt || wait <= 0;

  function toggleRole(v) {
    const r = P.roles.includes(v) ? P.roles.filter((x) => x !== v) : [...P.roles, v];
    update({ roles: r.length ? r : [v] });
  }

  function askReset() {
    Alert.alert('مسح كل التقدم؟', 'هتفقد النقاط والمستوى والجمل المحفوظة.', [
      { text: 'لا', style: 'cancel' },
      { text: 'امسح', style: 'destructive', onPress: () => reset({ ...DEFAULT }) },
    ]);
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Btn small title="رجوع" onPress={back} />
        <Ar style={{ fontSize: 22, fontWeight: '800', flex: 1 }}>الإعدادات</Ar>
      </View>
      <Card>
        <Field label="اسمك">
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => name.trim() && update({ name: name.trim() })}
            maxLength={20}
            placeholderTextColor={C.muted}
            style={{ minHeight: 48, borderRadius: 10, borderWidth: 2, borderColor: C.line, backgroundColor: C.bg, color: C.fg, paddingHorizontal: 14, fontSize: 17, textAlign: 'right' }}
          />
        </Field>
        <Field label="صوت المدرب">
          <Seg value={P.coach} onChange={(v) => { update({ coach: v }); coachSay(v, '', `Ready, Captain ${P.name}?`); }} options={[{ v: 'm', label: 'شاب' }, { v: 'f', label: 'بنت' }]} />
        </Field>
        <Field label="لهجة الترجمة العربي">
          <Seg value={P.dialect} onChange={(v) => update({ dialect: v })} options={[{ v: 'eg', label: 'مصري' }, { v: 'fus', label: 'فصحى مبسطة' }]} />
        </Field>
        <Field label="سرعة صوت اللاعب">
          <Seg value={P.speed} onChange={(v) => update({ speed: v })} options={[{ v: 'slow', label: 'بطيء' }, { v: 'normal', label: 'عادي' }, { v: 'fast', label: 'سريع' }]} />
        </Field>
        <Field label="عدد الغلطات ورا بعض قبل ما المدرب يتضايق">
          <Seg value={P.limit} onChange={(v) => update({ limit: v })} options={[{ v: 2, label: '2' }, { v: 3, label: '3' }, { v: 5, label: '5' }]} />
        </Field>
        <Field label="وضع الودان (من غير نص)">
          <Seg value={P.blind} onChange={(v) => update({ blind: v })} options={[{ v: false, label: 'قفل' }, { v: true, label: 'شغّال' }]} />
        </Field>
        <Field label="بتستخدم التطبيق كـ">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ROLES.map((r) => {
              const on = P.roles.includes(r.v);
              return (
                <Pressable key={r.v} onPress={() => toggleRole(r.v)} style={{ flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 2, borderColor: on ? C.accent : C.line, backgroundColor: on ? C.surface2 : C.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.fg, fontWeight: '800' }}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      </Card>
      <Card>
        <Ar style={{ fontWeight: '800' }}>اختبار المستوى</Ar>
        <Ar style={{ color: C.muted, fontSize: 14 }}>{canRetest ? 'تقدر تعمله دلوقتي.' : `متاح بعد ${wait} يوم عشان القياس يبقى حقيقي.`}</Ar>
        <Btn title="اعمل الاختبار تاني" onPress={retest} disabled={!canRetest} />
      </Card>
      <Btn kind="danger" title="مسح كل التقدم" onPress={askReset} />
    </Screen>
  );
}
