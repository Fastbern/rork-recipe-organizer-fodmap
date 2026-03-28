import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAdaptation } from '@/hooks/adaptation-store';
import { useRecipes } from '@/hooks/recipe-store';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react-native';

export default function AdaptReviewScreen() {
  const { proposal, clear, updateChoice, acceptAll, resetAll } = useAdaptation();
  const { saveRecipe, deleteRecipe } = useRecipes();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const canSave = !!proposal;

  const finalIngredients = useMemo(() => {
    if (!proposal) return [] as { amount: string; unit?: string; name: string }[];
    return proposal.adapted.ingredients.map((ing, idx) => {
      const choice = proposal.choices[idx];
      const useName = choice && choice.accepted ? choice.adaptedName : (proposal.original.ingredients[idx]?.name ?? ing.name);
      return { amount: ing.amount, unit: ing.unit, name: useName };
    });
  }, [proposal]);

  const handleSave = () => {
    if (!proposal) return;
    try {
      const newId = `${proposal.original.id}-adapted-${Date.now()}`;
      const title = `${proposal.original.title} (${proposal.diets.join(' & ') || proposal.allergies.join(' & ')} Adapted)`;
      const newRecipe = {
        ...proposal.original,
        id: newId,
        title,
        ingredients: finalIngredients.map((ing, idx) => ({ id: `ing-${Date.now()}-${idx}`, name: ing.name, amount: ing.amount, unit: ing.unit })),
        instructions: proposal.adapted.instructions,
        notes: proposal.adapted.notes,
        tags: [...(proposal.original.tags || []), ...proposal.diets.map(d => d.toLowerCase()), 'adapted'],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isFavorite: proposal.original.isFavorite ?? false,
      };
      console.log('[Adaptation] Saving adapted recipe');
      saveRecipe(newRecipe as any);
      const savedId = newRecipe.id as string;
      const originalId = proposal.original.id;
      clear();
      Alert.alert(
        'Adapted recipe saved',
        'Would you like to delete the original recipe? You can keep it if you want to compare later.',
        [
          { text: 'Keep original', style: 'cancel', onPress: () => router.replace(`/recipe/${savedId}`) },
          { text: 'Delete original', style: 'destructive', onPress: () => {
            console.log('[Adaptation] Deleting original recipe', originalId);
            deleteRecipe(originalId);
            router.replace(`/recipe/${savedId}`);
          } },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save adapted recipe.');
    }
  };

  if (!proposal) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>No adaptation pending</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Review Adaptation' }} />
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }] }>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle}>Ingredients</Text>
              <View style={styles.bulkActions}>
                <TouchableOpacity style={styles.resetAllBtn} onPress={resetAll} testID="reset-all">
                  <Text style={styles.resetAllText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptAllBtn} onPress={acceptAll} testID="accept-all">
                  <Check size={14} color={Colors.text.inverse} />
                  <Text style={styles.acceptAllText}>Accept all</Text>
                </TouchableOpacity>
              </View>
            </View>
            {proposal.adapted.ingredients.map((ing, idx) => {
            const choice = proposal.choices[idx];
            const changed = choice ? choice.adaptedName.toLowerCase() !== choice.originalName.toLowerCase() : false;
            const isExpanded = expanded === idx;
            return (
              <View key={`row-${idx}`} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.amount}>{ing.amount} {ing.unit || ''}</Text>
                  <View style={styles.names}>
                    <Text style={styles.nameOriginal}>{choice?.originalName || ing.name}</Text>
                    <Text style={styles.arrow}>→</Text>
                    <Text style={[styles.nameAdapted, changed ? styles.nameChanged : null]}>{choice?.adaptedName || ing.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setExpanded(isExpanded ? null : idx)} style={styles.expandBtn}>
                    {isExpanded ? <ChevronUp size={18} color={Colors.text.secondary} /> : <ChevronDown size={18} color={Colors.text.secondary} />}
                  </TouchableOpacity>
                </View>
                {isExpanded && (
                  <View style={styles.optionsBox}>
                    {(choice?.options || [ing.name]).map((opt, optIdx) => {
                      const selected = choice?.adaptedName === opt;
                      return (
                        <TouchableOpacity
                          key={`opt-${idx}-${optIdx}`}
                          style={[styles.optionChip, selected ? styles.optionChipSelected : null]}
                          onPress={() => updateChoice(idx, opt, opt !== (choice?.originalName || opt))}
                        >
                          {selected ? <Check size={14} color={Colors.text.inverse} /> : null}
                          <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.keepBtn} onPress={() => updateChoice(idx, choice?.originalName || ing.name, false)} testID={`keep-${idx}`}>
                        <X size={14} color={Colors.primary} />
                        <Text style={styles.keepText}>Keep original</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => {
                        updateChoice(idx, (choice?.adaptedName || ing.name), true);
                        setExpanded(null);
                        if (Platform.OS !== 'web') {
                          console.log('Accepted change with haptic');
                        } else {
                          console.log('Accepted change');
                        }
                        setToast('Change accepted');
                        setTimeout(() => setToast(null), 1500);
                      }} testID={`accept-${idx}`}>
                        <Check size={14} color={Colors.text.inverse} />
                        <Text style={styles.acceptText}>Accept change</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} disabled={!canSave} onPress={handleSave} testID="save-adapted">
          <Text style={styles.saveBtnText}>Save Adapted Recipe</Text>
        </TouchableOpacity>
        </ScrollView>
        {toast ? (
          <View style={styles.toast} testID="accept-toast">
            <Check size={14} color={Colors.text.inverse} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  emptyText: { color: Colors.text.secondary, fontSize: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  row: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { width: 80, color: Colors.text.secondary },
  names: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nameOriginal: { color: Colors.text.secondary },
  arrow: { color: Colors.text.light },
  nameAdapted: { color: Colors.text.primary, fontWeight: '600' },
  nameChanged: { color: Colors.primary },
  expandBtn: { padding: 6 },
  optionsBox: { marginTop: 8, gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignSelf: 'flex-start' },
  optionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.text.primary, fontSize: 13, fontWeight: '500' },
  optionTextSelected: { color: Colors.text.inverse },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  keepBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary + '10' },
  keepText: { color: Colors.primary, fontWeight: '600' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary },
  acceptText: { color: Colors.text.inverse, fontWeight: '600' },
  saveBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.text.inverse, fontWeight: '700', fontSize: 16 },
  toast: { position: 'absolute', bottom: 20, left: 16, right: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  toastText: { color: Colors.text.inverse, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  bulkActions: { flexDirection: 'row', gap: 8 },
  acceptAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 10 },
  acceptAllText: { color: Colors.text.inverse, fontWeight: '700' },
  resetAllBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  resetAllText: { color: Colors.text.primary, fontWeight: '600' },
});
