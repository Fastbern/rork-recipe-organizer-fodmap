import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { Check } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const dietaryOptions = [
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'Plant-based meals',
  },
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'No animal products',
  },
  {
    id: 'dairy-free',
    title: 'Dairy-Free',
    description: 'No milk products',
  },
  {
    id: 'gluten-free',
    title: 'Gluten-Free',
    description: 'No wheat, barley, rye',
  },
  {
    id: 'low-fodmap',
    title: 'New to Low FODMAP',
    description: 'I want to learn the basics',
  },
  {
    id: 'fodmap-experienced',
    title: 'FODMAP Experienced',
    description: 'I know my triggers',
  },
];

export default function PersonalizeScreen() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const toggleOption = useCallback((id: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleContinue = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop' }}
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
            { paddingBottom: insets.bottom + 140 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🍽️</Text>
            </View>
          </View>

          <Text style={styles.title}>Let&apos;s Personalize{'\n'}Your Plan</Text>
          <Text style={styles.subtitle}>
            Tell us what works best for your body and taste
          </Text>

          <View style={styles.optionsContainer}>
            {dietaryOptions.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => toggleOption(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionTitle,
                        isSelected && styles.optionTitleSelected
                      ]}>
                        {option.title}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        isSelected && styles.optionDescriptionSelected
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && <Check size={20} color={Colors.primary} strokeWidth={3} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedOptions.length === 0 && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={selectedOptions.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            You can change these preferences anytime
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
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4F1DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#1E7D35',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  optionDescriptionSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#D4F1DB',
    borderColor: Colors.primary,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'transparent',
  },
  continueButton: {
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
  },
});
