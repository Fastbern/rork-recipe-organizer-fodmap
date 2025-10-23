import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DietaryAdaptationModalProps {
  visible: boolean;
  onClose: () => void;
  onAdapt: (diets: string[], allergies: string[], customAllergies: string) => Promise<void>;
}

const DIETARY_OPTIONS = [
  'Low FODMAP',
  'Vegan',
  'Vegetarian',
  'Keto',
  'Paleo',
  'Gluten-free',
  'Dairy-free',
  'Low-carb',
  'Low-sodium',
];

const ALLERGY_OPTIONS = [
  'FODMAP-sensitive',
  'Garlic',
  'Onion',
  'Lactose',
  'Wheat',
  'Nuts',
  'Dairy',
  'Eggs',
  'Shellfish',
  'Soy',
  'Gluten',
  'Fish',
  'Sesame',
];

export default function DietaryAdaptationModal({
  visible,
  onClose,
  onAdapt,
}: DietaryAdaptationModalProps) {
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);

  const toggleDiet = (diet: string) => {
    setSelectedDiets(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleAdapt = async () => {
    if (selectedDiets.length === 0 && selectedAllergies.length === 0 && !customAllergies.trim()) {
      Alert.alert('No Selection', 'Please select at least one dietary preference or allergy.');
      return;
    }

    setIsAdapting(true);
    try {
      await onAdapt(selectedDiets, selectedAllergies, customAllergies);
      setSelectedDiets([]);
      setSelectedAllergies([]);
      setCustomAllergies('');
      onClose();
    } catch (error) {
      console.error('[Dietary] Adaptation failed:', error);
      Alert.alert('Error', 'Failed to adapt recipe. Please try again.');
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles size={24} color={Colors.primary} />
              <Text style={styles.title}>Adapt Recipe</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥗 Dietary Preferences</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply (worldwide support)</Text>
              <View style={styles.optionsGrid}>
                {DIETARY_OPTIONS.map(diet => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.optionButton,
                      selectedDiets.includes(diet) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleDiet(diet)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedDiets.includes(diet) && styles.optionTextSelected,
                      ]}
                    >
                      {diet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Allergies/Intolerances</Text>
              <Text style={styles.sectionSubtitle}>Select any you need to avoid</Text>
              <View style={styles.optionsGrid}>
                {ALLERGY_OPTIONS.map(allergy => (
                  <TouchableOpacity
                    key={allergy}
                    style={[
                      styles.optionButton,
                      selectedAllergies.includes(allergy) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleAllergy(allergy)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedAllergies.includes(allergy) && styles.optionTextSelected,
                      ]}
                    >
                      {allergy}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                The AI will adapt this recipe while preserving its essence and flavor profile.
                Major substitutions will be explained in the recipe notes.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.adaptButton, isAdapting && styles.adaptButtonDisabled]}
              onPress={handleAdapt}
              disabled={isAdapting}
            >
              {isAdapting ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <>
                  <Sparkles size={20} color={Colors.text.inverse} />
                  <Text style={styles.adaptButtonText}>Adapt for Dietary Needs</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  adaptButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  adaptButtonDisabled: {
    opacity: 0.6,
  },
  adaptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
