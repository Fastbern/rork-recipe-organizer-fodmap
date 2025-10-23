import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import {
  User,
  Download,
  Trash2,
  Info,
  ChevronRight,
  FileText,
  Database,
  Share2,
  LogOut,
  TestTube,
} from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useRecipes } from '@/hooks/recipe-store';
import * as Sharing from 'expo-sharing';
import { useFodmap } from '@/hooks/fodmap-store';
import { useQueryClient } from '@tanstack/react-query';
import { fetchFodmapDataset } from '@/utils/fodmap';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, categories, mealPlans, groceryList, userProfile, signInWithApple, signOut } = useRecipes();
  const [isExporting, setIsExporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  const { dataset, isLoading: isFodmapLoading } = useFodmap();
  const queryClient = useQueryClient();
  const [isRefreshingFodmap, setIsRefreshingFodmap] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }
  }, []);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      console.log('[Export] Starting data export');

      const exportData = {
        recipes,
        categories,
        mealPlans,
        groceryList,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipe-app-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        const FileSystem = require('expo-file-system');
        const filePath = `${FileSystem.documentDirectory}recipe-app-backup-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(filePath, jsonString);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Export Recipe Data',
          });
        } else {
          Alert.alert('Success', `Data exported to: ${filePath}`);
        }
      }

      console.log('[Export] Export completed');
    } catch (error) {
      console.error('[Export] Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignIn = async () => {
    const result = await signInWithApple();
    if (result) {
      Alert.alert('Welcome!', `Signed in as ${result.fullName || result.email || 'User'}`);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Alert.alert('Success', 'You have been signed out.');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your recipes, meal plans, and grocery lists? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Clear] Clearing all data');
              const storage = Platform.OS === 'web'
                ? localStorage
                : require('@react-native-async-storage/async-storage').default;

              if (Platform.OS === 'web') {
                storage.removeItem('recipes');
                storage.removeItem('categories');
                storage.removeItem('mealPlans');
                storage.removeItem('groceryList');
              } else {
                await storage.multiRemove([
                  'recipes',
                  'categories',
                  'mealPlans',
                  'groceryList',
                ]);
              }

              Alert.alert('Success', 'All data has been cleared. Please restart the app.');
            } catch (error) {
              console.error('[Clear] Clear data failed:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    showChevron = true,
    destructive = false,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress: () => void;
    showChevron?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
          <Icon size={20} color={destructive ? Colors.error : Colors.primary} />
        </View>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && <ChevronRight size={20} color={Colors.text.light} />}
      </View>
    </TouchableOpacity>
  );

  const SettingItemWithSwitch = ({
    icon: Icon,
    label,
    value,
    onValueChange,
  }: {
    icon: any;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Icon size={20} color={Colors.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
        thumbColor={value ? Colors.primary : Colors.text.light}
      />
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <User size={32} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.fullName || userProfile?.email || 'Recipe Collector'}
            </Text>
            <Text style={styles.profileStats}>
              {recipes.length} recipes • {categories.length} categories
            </Text>
            {userProfile && (
              <View style={styles.signedInBadge}>
                <Text style={styles.signedInText}>
                  {userProfile.provider === 'apple' ? 'Signed in with Apple' : 'Guest'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {!userProfile && isAppleSignInAvailable && (
        <View style={styles.signInSection}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        </View>
      )}

      <SettingSection title="Data Management">
        <SettingItem
          icon={Download}
          label="Export All Data"
          onPress={handleExportData}
          value={isExporting ? 'Exporting...' : undefined}
        />
        <SettingItem
          icon={Database}
          label="View Storage Usage"
          onPress={() => {
            const dataSize = JSON.stringify({ recipes, categories, mealPlans, groceryList }).length;
            const sizeMB = (dataSize / 1024 / 1024).toFixed(2);
            Alert.alert('Storage Usage', `Approximately ${sizeMB} MB used`);
          }}
        />
      </SettingSection>

      <SettingSection title="FODMAP">
        <SettingItem
          icon={Database}
          label={isFodmapLoading ? 'Loading FODMAP database...' : `FODMAP items: ${dataset?.entries.length ?? 0}`}
          onPress={() => {}}
          showChevron={false}
        />
        <SettingItem
          icon={Download}
          label={isRefreshingFodmap ? 'Refreshing FODMAP DB...' : 'Refresh FODMAP Database'}
          onPress={async () => {
            try {
              setIsRefreshingFodmap(true);
              await fetchFodmapDataset(true);
              await queryClient.invalidateQueries({ queryKey: ['fodmap-dataset'] });
              Alert.alert('FODMAP', 'Database refreshed');
            } catch (e) {
              Alert.alert('FODMAP', 'Failed to refresh');
            } finally {
              setIsRefreshingFodmap(false);
            }
          }}
        />
      </SettingSection>

      <SettingSection title="Preferences">
        <SettingItemWithSwitch
          icon={FileText}
          label="Meal Plan Notifications"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </SettingSection>

      <SettingSection title="Developer">
        <SettingItem
          icon={TestTube}
          label="Test AI Integration"
          onPress={() => router.push('/test-ai')}
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingItem
          icon={Info}
          label="App Version"
          onPress={() => Alert.alert('Version', '1.0.0')}
          value="1.0.0"
          showChevron={false}
        />
        <SettingItem
          icon={FileText}
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device.')}
        />
        <SettingItem
          icon={Share2}
          label="Share App"
          onPress={() => {
            if (Platform.OS === 'web') {
              Alert.alert('Share', 'Share this app with your friends!');
            } else {
              Alert.alert('Share', 'Share this app with your friends!');
            }
          }}
        />
      </SettingSection>

      <SettingSection title="Danger Zone">
        {userProfile && (
          <SettingItem
            icon={LogOut}
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        )}
        <SettingItem
          icon={Trash2}
          label="Clear All Data"
          onPress={handleClearAllData}
          destructive
        />
      </SettingSection>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for home cooks</Text>
        <Text style={styles.footerVersion}>Recipe App v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  profileStats: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  signedInBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  signedInText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  signInSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: Colors.error + '15',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  settingLabelDestructive: {
    color: Colors.error,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.text.light,
  },
});
