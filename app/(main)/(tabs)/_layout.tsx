import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../src/themes';
import { BottomTabBar } from '../../../src/components';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
});