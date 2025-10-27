import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles, Users, TrendingUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const screens = [
  {
    id: 1,
    title: 'Reclaim Your Joy\nof Eating',
    subtitle: 'No more guessing. No more discomfort.',
    description: 'Living with IBS means every meal can feel like a risk. We understand your journey, and we\'re here to help you rediscover the pleasure of eating without fear.',
    icon: Heart,
    gradient: ['#2d5016', '#4a7c28', '#5a8f30'],
  },
  {
    id: 2,
    title: 'Feel the Difference\nin Days',
    subtitle: 'Backed by medical research',
    description: 'Studies show 75% of IBS sufferers experience significant relief within 2-4 weeks on a Low FODMAP diet. Transform your relationship with food and feel lighter, energized, and confident again.',
    icon: TrendingUp,
    gradient: ['#3d6b1f', '#4a7c28', '#5a8f30'],
    stats: [
      { value: '75%', label: 'Experience relief' },
      { value: '2-4 weeks', label: 'To see results' },
      { value: '10,000+', label: 'Lives transformed' },
    ],
  },
  {
    id: 3,
    title: 'Your Personalized\nRecipe Journey',
    subtitle: 'Tailored to your unique needs',
    description: 'Every body is different. Select your dietary preferences and restrictions, and we\'ll create a custom meal plan that works for YOU.',
    icon: Users,
    gradient: ['#4a7c28', '#5a8f30', '#6ba53c'],
  },
  {
    id: 4,
    title: 'Scientifically\nProven Relief',
    subtitle: 'Developed with gastroenterologists',
    description: 'The Low FODMAP diet was developed by Monash University researchers and is recommended by gastroenterologists worldwide as the gold standard for managing IBS symptoms.',
    icon: Sparkles,
    gradient: ['#5a8f30', '#6ba53c', '#7cb848'],
    source: 'Based on research from Monash University & peer-reviewed clinical trials',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handleNext = useCallback(() => {
    if (currentIndex < screens.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: false,
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      router.push('/personalize');
    }
  }, [currentIndex, fadeAnim, router]);

  const handleSkip = useCallback(() => {
    router.push('/personalize');
  }, [router]);

  const currentScreen = screens[currentIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={currentScreen.gradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {currentIndex < screens.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => (
          <Animated.View
            key={screen.id}
            style={[
              styles.screenContainer,
              {
                opacity: index === currentIndex ? fadeAnim : 0,
              },
            ]}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <screen.icon size={64} color="#d4f1d4" strokeWidth={1.5} />
                </View>
              </View>

              <Text style={styles.title}>{screen.title}</Text>
              <Text style={styles.subtitle}>{screen.subtitle}</Text>
              <Text style={styles.description}>{screen.description}</Text>

              {screen.stats && (
                <View style={styles.statsContainer}>
                  {screen.stats.map((stat, idx) => (
                    <View key={idx} style={styles.statItem}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {screen.source && (
                <Text style={styles.source}>{screen.source}</Text>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === screens.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
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
  skipButton: {
    position: 'absolute' as const,
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
    paddingBottom: 180,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  title: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#d4f1d4',
    marginBottom: 20,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  source: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 24,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    paddingTop: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#4a7c28',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
