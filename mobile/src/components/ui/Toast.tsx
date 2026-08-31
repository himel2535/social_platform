import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ToastType = 'success' | 'error' | 'info';

type ToastAction = {
  actionLabel: string;
  onAction: () => void;
};

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
  action?: ToastAction;
};

type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ACCENT = {
  success: '#5DCAA5',
  error: colors.error,
  info: colors.primary,
} as const;

const ICON: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 24, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast((prev) => ({ ...prev, visible: false, action: undefined }));
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      const action =
        options?.actionLabel && options.onAction
          ? { actionLabel: options.actionLabel, onAction: options.onAction }
          : undefined;

      setToast({ message, type, visible: true, action });

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      hideTimerRef.current = setTimeout(hideToast, 3000);
    },
    [hideToast, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const accentColor = ACCENT[toast.type];

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <BlurView intensity={70} tint="dark" style={styles.toast}>
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
              <Ionicons name={ICON[toast.type]} size={18} color={accentColor} style={styles.icon} />
              <Typography variant="button" style={styles.text}>
                {toast.message}
              </Typography>
              {toast.action ? (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    toast.action?.onAction();
                    hideToast();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={toast.action.actionLabel}
                >
                  <Typography variant="button" style={styles.actionText}>
                    {toast.action.actionLabel}
                  </Typography>
                </Pressable>
              ) : null}
            </BlurView>
          ) : (
            <View style={[styles.toast, styles.toastSolid]}>
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
              <Ionicons name={ICON[toast.type]} size={18} color={accentColor} style={styles.icon} />
              <Typography variant="button" style={styles.text}>
                {toast.message}
              </Typography>
              {toast.action ? (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => {
                    toast.action?.onAction();
                    hideToast();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={toast.action.actionLabel}
                >
                  <Typography variant="button" style={styles.actionText}>
                    {toast.action.actionLabel}
                  </Typography>
                </Pressable>
              ) : null}
            </View>
          )}
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
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(20,22,35,0.65)',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  toastSolid: {
    backgroundColor: 'rgba(20,22,35,0.92)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  icon: {
    marginLeft: spacing.xs,
  },
  text: {
    flex: 1,
    color: colors.textPrimary,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(29,158,117,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.4)',
  },
  actionText: {
    color: '#5DCAA5',
    fontSize: 13,
  },
});
