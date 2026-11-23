import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from './src/theme';
import { loadProfile, saveProfile } from './src/store';
import { stopSpeaking } from './src/audio';
import Onboarding from './src/screens/Onboarding';
import Placement from './src/screens/Placement';
import Home from './src/screens/Home';
import Quiz from './src/screens/Quiz';
import Settings from './src/screens/Settings';
import Progress from './src/screens/Progress';

export default function App() {
  const [P, setP] = useState(null);
  const [route, setRoute] = useState('boot');
  const [params, setParams] = useState({});
  const routeRef = useRef(route);
  routeRef.current = route;

  useEffect(() => {
    loadProfile().then((p) => {
      setP(p);
      setRoute(!p.name ? 'onboarding' : !p.level ? 'placement' : 'home');
    });
  }, []);

  const update = useCallback((patch) => {
    setP((prev) => {
      const n = { ...prev, ...patch };
      saveProfile(n);
      return n;
    });
  }, []);

  const go = useCallback((r, p = {}) => {
    stopSpeaking();
    setParams({ ...p, n: Date.now() });
    setRoute(r);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const r = routeRef.current;
      if (r === 'quiz' || r === 'settings' || r === 'progress') {
        go('home');
        return true;
      }
      if (r === 'placement' || r === 'onboarding') return true;
      return false;
    });
    return () => sub.remove();
  }, [go]);

  let body = <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (P) {
    if (route === 'onboarding') body = <Onboarding P={P} update={update} next={() => go('placement')} />;
    else if (route === 'placement')
      body = (
        <Placement
          P={P}
          update={update}
          done={() => go('home')}
          skip={P.level ? null : () => { update({ level: 2 }); go('home'); }}
        />
      );
    else if (route === 'home') body = <Home P={P} go={go} />;
    else if (route === 'quiz') body = <Quiz key={`${params.sec}-${params.n}`} P={P} update={update} sec={params.sec} exit={() => go('home')} />;
    else if (route === 'settings')
      body = <Settings P={P} update={update} back={() => go('home')} retest={() => go('placement')} reset={(d) => { update(d); go('onboarding'); }} />;
    else if (route === 'progress') body = <Progress P={P} back={() => go('home')} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {body}
    </SafeAreaProvider>
  );
}
