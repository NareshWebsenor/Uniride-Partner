import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { themeType } from '@/interface';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const IconGradientBorder = ({ children }: { children: React.ReactNode }) => {
  const styles = useThemedStyles(createStyles);
  const themeColor = useThemeColor();
  return (
    <LinearGradient
      colors={[themeColor.primary, themeColor.primaryS1]}
      style={styles.iconGradientBorder}
    >
      <View style={styles.iconInner}>{children}</View>
    </LinearGradient>
  );
};

export default IconGradientBorder;

const createStyles = (theme: themeType) =>
  StyleSheet.create({
    iconGradientBorder: {
      width: 56,
      height: 56,
      borderRadius: 18,
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconInner: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.surfaceRaised,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
