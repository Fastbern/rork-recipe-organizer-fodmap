import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { Calendar, Plus, X, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRecipes, useMealPlanForDate } from '@/hooks/recipe-store';
import { MealType } from '@/types/recipe';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanScreen() {
  const { recipes, addRecipeToMeal, removeRecipeFromMeal, addCustomConsumedItem } = useRecipes();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const plan = useMealPlanForDate(selectedDate);

  const [picker, setPicker] = useState<{ open: boolean; meal?: MealType }>({ open: false });
  const [search, setSearch] = useState<string>('');

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customMeal, setCustomMeal] = useState<MealType | 'other'>('other');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => r.title.toLowerCase().includes(q));
  }, [recipes, search]);

  const days = useMemo(() => {
    const list: string[] = [];
    const base = new Date(selectedDate);
    for (let i = -7; i <= 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [selectedDate]);

  const totals = useMemo(() => {
    let calories = 0; let protein = 0; let carbs = 0; let fat = 0;
    const collectIds = (ids?: string[]) => {
      (ids ?? []).forEach(id => {
        const r = recipes.find(x => x.id === id);
        if (r?.nutrition) {
          calories += r.nutrition.calories ?? 0;
          protein += r.nutrition.protein ?? 0;
          carbs += r.nutrition.carbs ?? 0;
          fat += r.nutrition.fat ?? 0;
        }
      });
    };
    collectIds(plan?.breakfast);
    collectIds(plan?.lunch);
    collectIds(plan?.dinner);
    collectIds(plan?.snack);
    (plan?.customItems ?? []).forEach(ci => {
      calories += ci.calories ?? 0;
      protein += ci.protein ?? 0;
      carbs += ci.carbs ?? 0;
      fat += ci.fat ?? 0;
    });
    return { calories, protein, carbs, fat };
  }, [plan, recipes]);

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    await addCustomConsumedItem(selectedDate, {
      name: customName.trim(),
      calories: Number(customCalories) || undefined,
      mealType: customMeal,
    });
    setCustomName('');
    setCustomCalories('');
    setCustomMeal('other');
    setCustomModalOpen(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeDay(-1)} testID="prev-day">
          <ChevronLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.dateText}>{selectedDate}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDay(1)} testID="next-day">
          <ChevronRight size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {days.map(d => {
          const dateObj = new Date(d);
          const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
          const active = d === selectedDate;
          return (
            <TouchableOpacity key={d} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => setSelectedDate(d)} testID={`day-${d}`}>
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.suggestCard}>
        <Text style={styles.summaryTitle}>Suggestions for now</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginTop: 4 }}>
          {recipes.slice(0, 6).map(r => (
            <View key={r.id} style={styles.suggestPill}>
              <Text style={styles.suggestText}>{r.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {mealTypes.map((mealType) => {
        const ids = (plan?.[mealType] ?? []) as string[];
        const items = ids.map(id => recipes.find(r => r.id === id)).filter(Boolean);
        return (
          <View key={mealType} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealType}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setPicker({ open: true, meal: mealType })} testID={`add-${mealType}`}>
                <Plus size={18} color={Colors.text.secondary} />
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No items yet</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {items.map((r) => (
                  <View key={(r as any).id} style={styles.recipeRow}>
                    <Text style={styles.recipeName}>{(r as any).title}</Text>
                    <TouchableOpacity onPress={() => removeRecipeFromMeal(selectedDate, mealType, (r as any).id)} testID={`remove-${mealType}-${(r as any).id}`}>
                      <X size={18} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setCustomModalOpen(true)} testID="add-custom-item">
          <Plus size={18} color={Colors.text.inverse} />
          <Text style={styles.primaryBtnText}>Add custom eaten item</Text>
        </TouchableOpacity>
      </View>

      {(plan?.customItems ?? []).length > 0 && (
        <View style={styles.customList}>
          <Text style={styles.summaryTitle}>Your items</Text>
          {(plan?.customItems ?? []).map(ci => (
            <View key={ci.id} style={styles.recipeRow}>
              <Text style={styles.recipeName}>{ci.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Calories:</Text>
          <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Protein:</Text>
          <Text style={styles.summaryValue}>{Math.round(totals.protein)}g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Carbs:</Text>
          <Text style={styles.summaryValue}>{Math.round(totals.carbs)}g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fat:</Text>
          <Text style={styles.summaryValue}>{Math.round(totals.fat)}g</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to use the planner</Text>
        <Text style={styles.infoText}>Add meals to Breakfast, Lunch, Dinner, and Snacks. Add your own eaten items for accurate tracking. Use the date strip to switch days and keep a continuous journal.</Text>
        <Text style={[styles.infoText, { marginTop: 8 }]}>Tip: You can add multiple recipes per meal. We’ll summarize your totals below.</Text>
      </View>

      <Modal visible={picker.open} animationType="slide" transparent onRequestClose={() => setPicker({ open: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to {picker.meal}</Text>
              <TouchableOpacity onPress={() => setPicker({ open: false })}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search recipes"
                placeholderTextColor={Colors.text.light}
                style={styles.input}
                testID="meal-search"
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={async () => {
                    if (!picker.meal) return;
                    await addRecipeToMeal(selectedDate, picker.meal, item.id);
                    setPicker({ open: false });
                    setSearch('');
                  }}
                  testID={`pick-${item.id}`}
                >
                  <Text style={styles.listItemText}>{item.title}</Text>
                  <Check size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={customModalOpen} animationType="slide" transparent onRequestClose={() => setCustomModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add custom item</Text>
              <TouchableOpacity onPress={() => setCustomModalOpen(false)}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <TextInput value={customName} onChangeText={setCustomName} placeholder="Name" placeholderTextColor={Colors.text.light} style={styles.input} />
              <TextInput value={customCalories} onChangeText={setCustomCalories} placeholder="Calories (optional)" keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'} placeholderTextColor={Colors.text.light} style={styles.input} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['breakfast','lunch','dinner','snack','other'] as const).map(m => {
                  const active = customMeal === m;
                  return (
                    <TouchableOpacity key={m} style={[styles.mealChip, active && styles.mealChipActive]} onPress={() => setCustomMeal(m)}>
                      <Text style={[styles.mealChipText, active && styles.mealChipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCustom} testID="save-custom-item">
                <Check size={18} color={Colors.text.inverse} />
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  dayStrip: {
    paddingVertical: 8,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  dayChipActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  dayChipText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  dayChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  mealCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  calories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  recipeInfo: {
    gap: 4,
  },
  recipeName: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  recipeTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  addText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.text.light,
  },
  actionsRow: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: Colors.text.inverse,
    fontWeight: '700',
  },
  customList: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  suggestCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  suggestPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestText: {
    fontSize: 12,
    color: Colors.text.primary,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: Colors.primary + '15',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  searchRow: {
    padding: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemText: {
    color: Colors.text.primary,
  },
  mealChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  mealChipActive: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  mealChipText: {
    color: Colors.text.secondary,
  },
  mealChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});