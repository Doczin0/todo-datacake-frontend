import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { getNotificationColors } from "../theme";
import { useNotifications } from "../context/NotificationContext";
import { useThemeMode } from "../context/ThemeContext";

const NotificationToast = ({ notification, onDismiss, palette, shadows }) => {
  const progress = useRef(new Animated.Value(1)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: notification.duration,
      useNativeDriver: false
    });
    animation.start(({ finished }) => {
      if (finished) {
        onDismiss(notification.id);
      }
    });
    return () => animation.stop();
  }, [notification, onDismiss, progress]);

  const colors = getNotificationColors(palette, notification.type);

  return (
    <Pressable
      onPress={() => onDismiss(notification.id)}
      style={[
        styles.toast,
        {
          backgroundColor: colors.background,
          borderColor: colors.border
        },
        shadows.soft
      ]}
    >
      <Text style={[styles.message, { color: colors.text }]}>{notification.message}</Text>
      <View
        style={styles.progressBase}
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.progress,
            {
              backgroundColor: colors.border,
              width: barWidth
                ? progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, barWidth]
                  })
                : "100%"
            }
          ]}
        />
      </View>
    </Pressable>
  );
};

const NotificationCenter = () => {
  const { notifications, dismissNotification } = useNotifications();
  const { theme } = useThemeMode();

  if (!notifications.length) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View pointerEvents="box-none" style={styles.stack}>
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
            palette={theme.palette}
            shadows={theme.shadows}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 40,
    right: 24,
    zIndex: 9999,
    width: 320,
    maxWidth: "90%"
  },
  stack: {
    gap: 12
  },
  toast: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    overflow: "hidden"
  },
  message: {
    fontSize: 14,
    fontWeight: "600"
  },
  progress: {
    height: 3,
    borderRadius: 999
  },
  progressBase: {
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12
  }
});

export default NotificationCenter;
