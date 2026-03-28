import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Check, Sparkles, Heart, Shield } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/hooks/onboarding-store';

const features = [
  { icon: Sparkles, text: 'Unlimited Low FODMAP recipes' },
  { icon: Heart, text: 'Personalized meal plans' },
  { icon: Shield, text: 'Dietary adaptation for any recipe' },
  { icon: Check, text: 'Ingredient substitution guides' },
  { icon: Check, text: 'Weekly grocery lists' },
  { icon: Check, text: 'Track your progress' },
];

const plans = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$3.99',
    period: 'month',
    savings: null,
    popular: false,
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$39.99',
    period: 'year',
    savings: 'Save 17%',
    popular: true,
  },
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, updateSubscriptionStatus } = useOnboarding();

  const handleAppleSignIn = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Demo Mode',
          'Apple Sign In is only available on iOS devices. Continuing with demo access.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await completeOnboarding({
                  dietaryRestrictions: [],
                  hasActiveSubscription: true,
                });
                router.replace('/(tabs)/(home)/home');
              },
            },
          ]
        );
        return;
      }

      setIsLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple Sign In successful:', credential);

      await completeOnboarding({
        dietaryRestrictions: [],
        hasActiveSubscription: true,
      });

      router.replace('/(tabs)/(home)/home');
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [completeOnboarding, router]);

  const handleStartTrial = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await completeOnboarding({
        dietaryRestrictions: [],
        hasActiveSubscription: true,
      });

      router.replace('/(tabs)/(home)/home');
    } catch (error) {
      console.error('Trial start error:', error);
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [completeOnboarding, router]);

  const handleRestore = useCallback(() => {
    Alert.alert(
      'Restore Purchases',
      'This feature will restore your previous purchases.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            await updateSubscriptionStatus(true);
            router.replace('/(tabs)/(home)/home');
          },
        },
      ]
    );
  }, [updateSubscriptionStatus, router]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1600&auto=format&fit=crop' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[`#1E7D35CC`, `${Colors.primary}E6`, `#6FD17E` as const]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 200 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>START FREE TRIAL</Text>
            </View>
            <Text style={styles.title}>
              On average{'\n'}you&apos;ll feel better{'\n'}in days
            </Text>
            <Text style={styles.subtitle}>
              Join thousands finding relief with Low FODMAP
            </Text>
          </View>

          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.planContent}>
                  <View style={styles.planInfo}>
                    <Text style={[
                      styles.planTitle,
                      selectedPlan === plan.id && styles.planTitleSelected
                    ]}>
                      {plan.title}
                    </Text>
                    {plan.savings && (
                      <Text style={styles.planSavings}>{plan.savings}</Text>
                    )}
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[
                      styles.planPrice,
                      selectedPlan === plan.id && styles.planPriceSelected
                    ]}>
                      {plan.price}
                    </Text>
                    <Text style={[
                      styles.planPeriod,
                      selectedPlan === plan.id && styles.planPeriodSelected
                    ]}>
                      /{plan.period}
                    </Text>
                  </View>
                  <View style={[
                    styles.planRadio,
                    selectedPlan === plan.id && styles.planRadioSelected
                  ]}>
                    {selectedPlan === plan.id && (
                      <View style={styles.planRadioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What&apos;s included:</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <feature.icon size={18} color="#d4f1d4" strokeWidth={2} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            style={[styles.startButton, isLoading && styles.buttonDisabled]}
            onPress={handleStartTrial}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.startButtonText}>Start my Free Trial</Text>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={16}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.appleButtonWeb}
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.appleButtonText}>Sign in with Apple (Demo)</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.footerLink}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Free trial for 7 days, then {selectedPlan === 'yearly' ? '$39.99/year' : '$3.99/month'}. 
            Cancel anytime.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: '#d4f1d4',
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  plansContainer: {
    gap: 12,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4F1DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardPopular: {
    borderColor: '#d4f1d4',
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#D4F1DB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#1E7D35',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  planTitleSelected: {
    color: '#1E7D35',
  },
  planSavings: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 16,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  planPriceSelected: {
    color: '#1E7D35',
  },
  planPeriod: {
    fontSize: 16,
    color: '#666666',
  },
  planPeriodSelected: {
    color: Colors.primary,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#D4F1DB',
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  appleButton: {
    width: '100%',
    height: 56,
    marginBottom: 16,
  },
  appleButtonWeb: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textDecorationLine: 'underline' as const,
  },
  footerDivider: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 8,
    fontSize: 12,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
});
