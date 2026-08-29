import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/glass';

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }, []);

  const backgroundColor =
    toast.type === 'success'
      ? colors.success
      : toast.type === 'error'
        ? colors.error
        : colors.primary;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[styles.toast, { backgroundColor }, shadows.md]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Typography variant="button" style={styles.text}>
            {toast.message}
          </Typography>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    textAlign: 'center',
  },
});
