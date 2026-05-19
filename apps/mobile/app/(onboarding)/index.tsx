import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { setJson, storageKeys } from '@/services/storage/mmkv';

const slides = [
  { title: 'Gérez votre business', copy: 'Suivez vos ventes, dépenses, trésorerie et rapports en quelques secondes.' },
  { title: 'Mobile Money & Offline', copy: 'Travaillez sans connexion et synchronisez MTN MoMo ou Orange Money plus tard.' },
  { title: 'Score Mosika', copy: 'Construisez votre crédibilité financière et préparez vos demandes de prêt.' }
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const finish = () => {
    setJson(storageKeys.onboardingCompleted, true);
    router.replace('/(auth)/login');
  };
  const slide = slides[index];
  return (
    <Screen>
      <View className="min-h-[650px] justify-between">
        <View className="items-center pt-10">
          <Image source={require('../../assets/images/onboarding-1.png')} className="h-64 w-64 rounded-3xl" resizeMode="contain" />
          <Text className="mt-8 text-center text-3xl font-black text-navy">{slide.title}</Text>
          <Text className="mt-3 text-center text-base leading-6 text-surface-500">{slide.copy}</Text>
          <View className="mt-8 flex-row gap-2">
            {slides.map((_, i) => <View key={i} className={`h-2 rounded-full ${i === index ? 'w-8 bg-teal' : 'w-2 bg-surface-200'}`} />)}
          </View>
        </View>
        <View className="gap-3">
          <Button title={index === slides.length - 1 ? 'Commencer' : 'Continuer'} onPress={() => index === slides.length - 1 ? finish() : setIndex(index + 1)} />
          <Button title="Passer" variant="ghost" onPress={finish} />
        </View>
      </View>
    </Screen>
  );
}