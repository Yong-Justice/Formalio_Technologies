import { Redirect } from 'expo-router';
import { getJson, storageKeys } from '@/services/storage/mmkv';
import { User } from '@/types/domain';

export default function Index() {
  const user = getJson<User | null>(storageKeys.authUser, null);
  const onboardingCompleted = getJson<boolean>(storageKeys.onboardingCompleted, false);
  if (!onboardingCompleted) return <Redirect href="/(onboarding)" />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!user.onboardingCompleted) return <Redirect href="/(auth)/business-setup" />;
  return <Redirect href="/(tabs)/home" />;
}