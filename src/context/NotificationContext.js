import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext({
  notifications: [],
  pushNotification: () => {},
  dismissNotification: () => {}
});

const generateNotificationId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const pushNotification = useCallback((notification) => {
    const id = notification.id ?? generateNotificationId();
    const payload = {
      id,
      type: notification.type ?? "info",
      message: notification.message ?? "",
      duration: notification.duration ?? 5000,
      createdAt: Date.now()
    };
    setNotifications((prev) => [...prev.filter((item) => item.id !== id), payload]);
    return id;
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      pushNotification,
      dismissNotification
    }),
    [notifications, pushNotification, dismissNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => useContext(NotificationContext);
