import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useThemeMode } from "../context/ThemeContext";
import { CATEGORY_OPTIONS } from "../theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const statusTokens = (theme) => ({
  pendente: {
    label: "Pendente",
    background: theme.mode === "dark" ? "rgba(96, 165, 250, 0.18)" : "rgba(59, 130, 246, 0.18)",
    color: theme.palette.info
  },
  concluida: {
    label: "Concluída",
    background: theme.mode === "dark" ? "rgba(67, 230, 161, 0.15)" : "rgba(34, 197, 94, 0.18)",
    color: theme.palette.success
  }
});

const importanceColors = (palette) => ({
  baixa: palette.info,
  media: palette.warning,
  alta: palette.danger
});

const categoryIcons = CATEGORY_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.icon;
  return acc;
}, {});

const calculateChecklistProgress = (checklist = []) => {
  if (!checklist.length) return { done: 0, total: 0, percentage: 0 };
  const done = checklist.filter((item) => item.done).length;
  const total = checklist.length;
  return { done, total, percentage: Math.round((done / total) * 100) };
};

const formatCountdown = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffMs = due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { text: "Vence hoje", tone: "warning" };
  if (diffDays === 1) return { text: "Falta 1 dia", tone: "warning" };
  if (diffDays > 1) return { text: `Faltam ${diffDays} dias`, tone: diffDays <= 3 ? "warning" : "info" };
  if (diffDays === -1) return { text: "Venceu há 1 dia", tone: "danger" };
  return { text: `Venceu há ${Math.abs(diffDays)} dias`, tone: "danger" };
};

const toneColor = (palette, tone) => {
  switch (tone) {
    case "success":
      return palette.success;
    case "warning":
      return palette.warning;
    case "danger":
      return palette.danger;
    default:
      return palette.textSecondary;
  }
};

const TaskItem = ({ task, onToggle, onEdit, onDelete, onChecklistToggle }) => {
  const { theme } = useThemeMode();
  const palette = theme.palette;
  const status = statusTokens(theme)[task.status] ?? statusTokens(theme).pendente;
  const createdAt = task.created_at ? format(new Date(task.created_at), "dd/MM/yyyy HH:mm") : "";
  const isCompleted = task.status === "concluida";
  const importanceColor = importanceColors(palette)[task.importance] ?? palette.info;
  const categoryIcon = categoryIcons[task.category] ?? "sparkles-outline";
  const countdown = formatCountdown(task.due_date);
  const checklistProgress = calculateChecklistProgress(task.checklist_items);

  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 80
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  }, [scale, opacity]);

  return (
    <AnimatedPressable
      onPress={() => onEdit(task)}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: isCompleted ? "rgba(67, 230, 161, 0.4)" : "rgba(96, 165, 250, 0.25)",
          opacity,
          transform: [{ scale }]
        },
        theme.shadows.soft
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.titleIcon}>
            <Ionicons name={categoryIcon} size={18} color={palette.accent} />
          </View>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusPill, { backgroundColor: status.background }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
              <View style={[styles.importancePill, { borderColor: importanceColor }]}>
                <Text style={[styles.importanceText, { color: importanceColor }]}>
                  {task.importance === "baixa"
                    ? "Importância baixa"
                    : task.importance === "media"
                      ? "Importância média"
                      : "Importância alta"}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={[styles.timestamp, { color: palette.textMuted }]}>Criada em {createdAt}</Text>
      </View>

      {task.description ? (
        <Text style={[styles.description, { color: palette.textSecondary }]}>{task.description}</Text>
      ) : null}

      <View style={styles.infoRow}>
        {countdown ? (
          <View style={styles.countdown}>
            <Ionicons
              name="time-outline"
              size={16}
              color={toneColor(palette, countdown.tone)}
              style={styles.countdownIcon}
            />
            <Text style={[styles.countdownText, { color: toneColor(palette, countdown.tone) }]}>
              {countdown.text}
            </Text>
            {task.due_date ? (
              <Text style={[styles.countdownSub, { color: palette.textMuted }]}>
                • {format(new Date(task.due_date), "dd/MM/yyyy")}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.countdown}>
            <Ionicons
              name="hourglass-outline"
              size={16}
              color={palette.textMuted}
              style={styles.countdownIcon}
            />
            <Text style={[styles.countdownText, { color: palette.textMuted }]}>Sem data limite</Text>
          </View>
        )}
        {checklistProgress.total > 0 ? (
          <Text style={[styles.progressText, { color: palette.textSecondary }]}>
            Checklist: {checklistProgress.done}/{checklistProgress.total} ({checklistProgress.percentage}%)
          </Text>
        ) : null}
      </View>

      {task.tags?.length ? (
        <View style={styles.tagsRow}>
          {task.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { borderColor: palette.accent }]}>
              <Text style={[styles.tagText, { color: palette.accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {task.checklist_items?.length ? (
        <View style={styles.checklist}>
          {task.checklist_items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checklistItem}
              onPress={() => onChecklistToggle(task, item)}
            >
              <Ionicons
                name={item.done ? "checkbox-outline" : "square-outline"}
                size={18}
                color={item.done ? palette.success : palette.textSecondary}
              />
              <Text
                style={[
                  styles.checklistLabel,
                  {
                    color: item.done ? palette.success : palette.textSecondary,
                    textDecorationLine: item.done ? "line-through" : "none"
                  }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => onToggle(task)} style={styles.actionButton}>
          <Ionicons
            name={isCompleted ? "refresh" : "checkmark-circle-outline"}
            size={18}
            color={isCompleted ? palette.info : palette.success}
          />
          <Text style={[styles.actionText, { color: isCompleted ? palette.info : palette.success }]}>
            {isCompleted ? "Marcar pendente" : "Concluir"}
          </Text>
        </Pressable>
        <Pressable onPress={() => onDelete(task)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={18} color={palette.danger} />
          <Text style={[styles.actionText, { color: palette.danger }]}>Excluir</Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18
  },
  header: {
    marginBottom: 12
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center"
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  titleGroup: {
    flex: 1
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5
  },
  importancePill: {
    marginLeft: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  importanceText: {
    fontSize: 12,
    fontWeight: "600"
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.3
  },
  description: {
    marginBottom: 16,
    lineHeight: 20
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  countdown: {
    flexDirection: "row",
    alignItems: "center"
  },
  countdownIcon: {
    marginRight: 6
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "600"
  },
  countdownSub: {
    fontSize: 12,
    marginLeft: 6
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600"
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600"
  },
  checklist: {
    marginBottom: 16
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  checklistLabel: {
    marginLeft: 10,
    fontSize: 13,
    flex: 1
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center"
  },
  actionText: {
    marginLeft: 8,
    fontWeight: "600",
    letterSpacing: 0.3
  }
});

export default TaskItem;
