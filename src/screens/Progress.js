import React from 'react';
import { View } from 'react-native';
import { Ar, Btn, Card, Screen } from '../components';
import { C, LEVELS } from '../theme';
import { SECTIONS } from '../content';
import { dueItems } from '../store';

export default function Progress({ P, back }) {
  const rows = Object.keys(SECTIONS)
    .filter((k) => P.stats[k] && P.stats[k].total > 0)
    .map((k) => ({ k, pct: Math.round((P.stats[k].right / P.stats[k].total) * 100), total: P.stats[k].total }));
  const weak = rows.filter((r) => r.total >= 3).sort((a, b) => a.pct - b.pct)[0];
  const due = dueItems(P.srs).length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Btn small title="رجوع" onPress={back} />
        <Ar style={{ fontSize: 22, fontWeight: '800', flex: 1 }}>تقدمك يا كابتن {P.name}</Ar>
      </View>

      <Card>
        <Ar>مستواك: {LEVELS[P.level] || 'لسه ما اتحددش'}</Ar>
        {P.detail ? (
          <Ar style={{ color: C.muted }}>
            في الاختبار: إنجليزي عام {P.detail.general}% · إنجليزي كورة {P.detail.football}%
          </Ar>
        ) : null}
        <Ar>النقاط: {P.score}</Ar>
        <Ar>أيام التدريب ورا بعض: {P.streakDays}</Ar>
        <Ar>أطول سلسلة إجابات صح: {P.best}</Ar>
        <Ar>جمل مستنية المراجعة: {due}</Ar>
      </Card>

      <Card>
        <Ar style={{ fontWeight: '800' }}>نسبة الإجابات الصح في كل قسم</Ar>
        {rows.length ? (
          rows.map((r) => (
            <View key={r.k} style={{ gap: 4 }}>
              <Ar>
                {SECTIONS[r.k].title}: {r.pct}% ({r.total} سؤال)
              </Ar>
              <View style={{ height: 8, backgroundColor: C.line, borderRadius: 4 }}>
                <View style={{ height: 8, width: `${r.pct}%`, backgroundColor: r.pct >= 70 ? C.good : C.accent, borderRadius: 4 }} />
              </View>
            </View>
          ))
        ) : (
          <Ar style={{ color: C.muted }}>لسه ما جاوبتش على أسئلة. ابدأ أي قسم.</Ar>
        )}
      </Card>

      {weak ? (
        <Card>
          <Ar style={{ fontWeight: '800' }}>أضعف نقطة عندك</Ar>
          <Ar>{SECTIONS[weak.k].title} ({weak.pct}%). ركّز عليه الأيام الجاية.</Ar>
        </Card>
      ) : null}
    </Screen>
  );
}
