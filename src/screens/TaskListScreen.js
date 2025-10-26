import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "../components/SafeDateTimePickerModal";
import ConfettiCannon from "react-native-confetti-cannon";
import { Audio } from "expo-av";
import { differenceInDays, format, parseISO } from "date-fns";
import NeonBackground from "../components/NeonBackground";
import TaskItem from "../components/TaskItem";
import PrimaryButton from "../components/PrimaryButton";
import LoadingOverlay from "../components/LoadingOverlay";
import SelectablePill from "../components/SelectablePill";
import { AuthContext } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../api/client";
import { queryClient } from "../lib/queryClient";
import openWebDatePicker from "../lib/openWebDatePicker";

const statusFilters = [
  { value: "all", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "concluida", label: "Concluídas" }
];

const importanceFilters = [
  { value: "all", label: "Todas" },
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" }
];

const categoryFilters = [
  { value: "all", label: "Todas" },
  { value: "trabalho", label: "Trabalho" },
  { value: "estudos", label: "Estudos" },
  { value: "casa", label: "Casa" },
  { value: "saude", label: "Saúde" },
  { value: "pessoal", label: "Pessoal" }
];

const DEFAULT_FILTERS = {
  status: "all",
  importance: "all",
  category: "all",
  dateFrom: null,
  dateTo: null
};

const formatDateDisplay = (date) => (date ? format(date, "dd/MM/yyyy") : "Selecionar data");
const formatIsoParam = (date) => (date ? format(date, "yyyy-MM-dd") : null);

const screenWidth = Dimensions.get("window").width;

const TaskListScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useThemeMode();
  const { pushNotification } = useNotifications();

  const [statusFilter, setStatusFilter] = useState(DEFAULT_FILTERS.status);
  const [importanceFilter, setImportanceFilter] = useState(DEFAULT_FILTERS.importance);
  const [categoryFilter, setCategoryFilter] = useState(DEFAULT_FILTERS.category);
  const [dateFrom, setDateFrom] = useState(DEFAULT_FILTERS.dateFrom);
  const [dateTo, setDateTo] = useState(DEFAULT_FILTERS.dateTo);
  const [datePickerState, setDatePickerState] = useState({ visible: false, target: "from" });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...DEFAULT_FILTERS }));

  const soundRef = useRef(null);
  const notifiedDueSoon = useRef(new Set());
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/tick.wav"));
        if (isMounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn("Falha ao carregar som de conclusão.", error);
      }
    })();
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playTickSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.warn("Não foi possível reproduzir o som de conclusão.", error);
    }
  };

  const getTimestamp = (value) => (value instanceof Date ? value.getTime() : null);

  const filtersKey = useMemo(
    () => ({
      status: appliedFilters.status,
      importance: appliedFilters.importance,
      category: appliedFilters.category,
      dateFrom: formatIsoParam(appliedFilters.dateFrom),
      dateTo: formatIsoParam(appliedFilters.dateTo)
    }),
    [appliedFilters]
  );

  const pendingFilters = useMemo(
    () => ({
      status: statusFilter,
      importance: importanceFilter,
      category: categoryFilter,
      dateFrom,
      dateTo
    }),
    [statusFilter, importanceFilter, categoryFilter, dateFrom, dateTo]
  );

  const hasPendingChanges = useMemo(() => {
    return (
      pendingFilters.status !== appliedFilters.status ||
      pendingFilters.importance !== appliedFilters.importance ||
      pendingFilters.category !== appliedFilters.category ||
      getTimestamp(pendingFilters.dateFrom) !== getTimestamp(appliedFilters.dateFrom) ||
      getTimestamp(pendingFilters.dateTo) !== getTimestamp(appliedFilters.dateTo)
    );
  }, [pendingFilters, appliedFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      appliedFilters.status !== DEFAULT_FILTERS.status ||
      appliedFilters.importance !== DEFAULT_FILTERS.importance ||
      appliedFilters.category !== DEFAULT_FILTERS.category ||
      appliedFilters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
      appliedFilters.dateTo !== DEFAULT_FILTERS.dateTo
    );
  }, [appliedFilters]);

  const {
    data: tasks = [],
    isLoading,
    isRefetching,
    refetch,
    error: fetchError
  } = useQuery({
    queryKey: ["tasks", filtersKey],
    queryFn: async () => {
      const params = {};
      if (filtersKey.status !== "all") params.status = filtersKey.status;
      if (filtersKey.importance !== "all") params.importance = filtersKey.importance;
      if (filtersKey.category !== "all") params.category = filtersKey.category;
      if (filtersKey.dateFrom) params.due_from = filtersKey.dateFrom;
      if (filtersKey.dateTo) params.due_to = filtersKey.dateTo;
      const response = await api.get("tasks/", { params });
      return response.data;
    }
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const toggleMutation = useMutation({
    mutationFn: async (taskId) => {
      const response = await api.post(`tasks/${taskId}/toggle/`);
      return response.data;
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: false });
      if (updatedTask?.status === "concluida") {
        playTickSound();
        pushNotification({ type: "success", message: `Tarefa "${updatedTask.title}" concluída!` });
        setConfettiKey((prev) => prev + 1);
        setShowConfetti(true);
        globalThis.setTimeout(() => setShowConfetti(false), 1800);
      } else {
        pushNotification({ type: "info", message: `Tarefa "${updatedTask.title}" marcada como pendente.` });
      }
    },
    onError: () => {
      pushNotification({ type: "error", message: "Não conseguimos alterar o status. Tente novamente." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`tasks/${taskId}/`);
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: false });
      pushNotification({ type: "info", message: "Tarefa removida com sucesso." });
    },
    onError: () => {
      pushNotification({ type: "error", message: "Não foi possível remover a tarefa agora." });
    }
  });

  const checklistMutation = useMutation({
    mutationFn: async ({ taskId, checklist }) => {
      await api.patch(`tasks/${taskId}/`, { checklist_items: checklist });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: false });
    },
    onError: () => {
      pushNotification({ type: "error", message: "Não foi possível atualizar o checklist." });
    }
  });

  const handleToggle = (task) => toggleMutation.mutate(task.id);
  const handleDelete = (task) => deleteMutation.mutate(task.id);
  const handleCreate = () => navigation.navigate("TaskForm");
  const handleEdit = (task) => navigation.navigate("TaskForm", { task });

  const handleChecklistToggle = (task, item) => {
    const updatedChecklist = task.checklist_items.map((entry) =>
      entry.id === item.id ? { ...entry, done: !entry.done } : entry
    );
    checklistMutation.mutate({
      taskId: task.id,
      checklist: updatedChecklist.map((entry, index) => ({
        id: entry.id,
        label: entry.label,
        done: entry.done,
        order: index
      }))
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    tasks.forEach((task) => {
      if (task.status !== "pendente" || !task.due_date) return;
      const dueDate = parseISO(task.due_date);
      const diff = differenceInDays(dueDate, new Date());
      if (diff >= 0 && diff <= 1 && !notifiedDueSoon.current.has(task.id)) {
        notifiedDueSoon.current.add(task.id);
        pushNotification({
          type: "warning",
          message: `A tarefa "${task.title}" vence em ${diff === 0 ? "hoje" : "1 dia"}.`
        });
      }
    });
  }, [tasks, pushNotification]);

  const dashboard = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "concluida").length;
    const pending = total - completed;
    const dueSoon = tasks.filter(
      (task) =>
        task.status === "pendente" &&
        task.due_date &&
        differenceInDays(parseISO(task.due_date), new Date()) <= 2 &&
        differenceInDays(parseISO(task.due_date), new Date()) >= 0
    ).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, dueSoon, progress };
  }, [tasks]);

  const isMutating = toggleMutation.isPending || deleteMutation.isPending || checklistMutation.isPending;

  const updateDateFilter = (target, value) => {
    if (target === "from") {
      setDateFrom(value);
      if (dateTo && value && value > dateTo) {
        setDateTo(null);
        pushNotification({
          type: "info",
          message: "Data final removida para manter o intervalo válido."
        });
      }
      return;
    }
    if (dateFrom && value && value < dateFrom) {
      pushNotification({
        type: "warning",
        message: "A data final não pode ser anterior à data inicial."
      });
      return;
    }
    setDateTo(value);
  };

  const openDatePicker = async (target) => {
    if (isWeb) {
      const baseDate = target === "from" ? dateFrom : dateTo;
      const selectedDate = await openWebDatePicker(baseDate ?? new Date());
      if (selectedDate) {
        updateDateFilter(target, selectedDate);
      }
      return;
    }
    setDatePickerState({ visible: true, target });
  };

  const closeDatePicker = () => {
    setDatePickerState((prev) => ({ ...prev, visible: false }));
  };

  const handleDateConfirm = (date) => {
    updateDateFilter(datePickerState.target, date);
    closeDatePicker();
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      importance: importanceFilter,
      category: categoryFilter,
      dateFrom,
      dateTo
    });
  };

  const handleClearFilters = () => {
    setStatusFilter(DEFAULT_FILTERS.status);
    setImportanceFilter(DEFAULT_FILTERS.importance);
    setCategoryFilter(DEFAULT_FILTERS.category);
    setDateFrom(DEFAULT_FILTERS.dateFrom);
    setDateTo(DEFAULT_FILTERS.dateTo);
    setAppliedFilters({ ...DEFAULT_FILTERS });
    notifiedDueSoon.current.clear();
  };

  return (
    <NeonBackground>
      <SafeAreaView style={styles.safeArea}>
        <LoadingOverlay visible={isMutating} />
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isLoading}
              onRefresh={refetch}
              tintColor={theme.palette.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: theme.palette.card,
                borderColor: theme.palette.border
              },
              theme.shadows.glow
            ]}
          >
            <View>
              <Text style={[styles.greeting, { color: theme.palette.textPrimary }]}>Olá, {user?.username}</Text>
              <Text style={[styles.subtitle, { color: theme.palette.textSecondary }]}>
                Você tem {tasks.length} tarefas, {dashboard.completed} concluídas.
              </Text>
              <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={16} color={theme.palette.danger} />
                <Text style={[styles.logoutText, { color: theme.palette.danger }]}>Sair</Text>
              </Pressable>
            </View>
            <ThemeToggle mode={theme.mode} onToggle={toggleTheme} palette={theme.palette} />
          </View>

          <MiniDashboard theme={theme} dashboard={dashboard} />

          <View style={styles.section}>
            <View
              style={[
                styles.filtersCard,
                {
                  backgroundColor: theme.palette.surface,
                  borderColor: theme.palette.border
                },
                theme.shadows.soft
              ]}
            >
              <Text style={[styles.filterHeading, { color: theme.palette.textSecondary }]}>Aplicar filtro</Text>
 
              <Text
                style={[styles.filterLabel, { color: theme.palette.textSecondary, marginTop: 0 }]}
              >
                Status
              </Text>
              <View style={styles.filterRow}>
                {statusFilters.map((filter) => (
                  <SelectablePill
                    key={filter.value}
                    label={filter.label}
                    active={statusFilter === filter.value}
                    onPress={() => setStatusFilter(filter.value)}
                  />
                ))}
              </View>
 
              <Text style={[styles.filterLabel, { color: theme.palette.textSecondary }]}>Importância</Text>
              <View style={styles.filterRow}>
                {importanceFilters.map((filter) => (
                  <SelectablePill
                    key={filter.value}
                    label={filter.label}
                    active={importanceFilter === filter.value}
                    onPress={() => setImportanceFilter(filter.value)}
                  />
                ))}
              </View>
 
              <Text style={[styles.filterLabel, { color: theme.palette.textSecondary }]}>Categoria</Text>
              <View style={styles.filterRow}>
                {categoryFilters.map((filter) => (
                  <SelectablePill
                    key={filter.value}
                    label={filter.label}
                    active={categoryFilter === filter.value}
                    onPress={() => setCategoryFilter(filter.value)}
                  />
                ))}
              </View>
 
              <Text style={[styles.filterLabel, { color: theme.palette.textSecondary }]}>Intervalo de data</Text>
              <View style={styles.dateRow}>
                <PrimaryButton
                  title={`De: ${formatDateDisplay(dateFrom)}`}
                  onPress={() => openDatePicker("from")}
                  variant="secondary"
                  style={[styles.dateButton, { marginRight: 12 }]}
                  icon={<Ionicons name="calendar-outline" size={18} color={theme.palette.textPrimary} />}
                />
                <PrimaryButton
                  title={`Até: ${formatDateDisplay(dateTo)}`}
                  onPress={() => openDatePicker("to")}
                  variant="secondary"
                  style={[styles.dateButton, { marginRight: 0 }]}
                  icon={<Ionicons name="calendar-outline" size={18} color={theme.palette.textPrimary} />}
                />
              </View>
 
              <View style={styles.filterActions}>
                <PrimaryButton
                  title="Aplicar filtro"
                  onPress={handleApplyFilters}
                  variant="primary"
                  style={styles.filterButton}
                  disabled={!hasPendingChanges}
                  icon={<Ionicons name="funnel-outline" size={18} color={theme.palette.textPrimary} />}
                />
                <PrimaryButton
                  title="Remover filtros"
                  onPress={handleClearFilters}
                  variant="ghost"
                  style={[styles.filterButton, { marginRight: 0 }]}
                  disabled={!hasPendingChanges && !hasActiveFilters}
                  icon={<Ionicons name="close-circle-outline" size={18} color={theme.palette.textSecondary} />}
                />
              </View>
            </View>
          </View>

          {fetchError ? (
            <Text style={[styles.errorText, { color: theme.palette.danger }]}>
              Não foi possível carregar as tarefas agora.
            </Text>
          ) : null}

          {!isLoading && tasks.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.palette.surface,
                  borderColor: theme.palette.border
                },
                theme.shadows.soft
              ]}
            >
              <Ionicons name="sparkles-outline" size={32} color={theme.palette.accent} />
              <Text style={[styles.emptyTitle, { color: theme.palette.textPrimary }]}>Sem tarefas por aqui</Text>
              <Text style={[styles.emptySubtitle, { color: theme.palette.textSecondary }]}>
                Crie sua primeira tarefa e acompanhe o progresso em tempo real.
              </Text>
              <PrimaryButton
                title="Nova tarefa"
                onPress={handleCreate}
                icon={<Ionicons name="add-circle-outline" size={18} color={theme.palette.textPrimary} />}
              />
            </View>
          ) : null}

          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onChecklistToggle={handleChecklistToggle}
            />
          ))}
        </ScrollView>

        <Pressable style={[styles.floatingButton, theme.shadows.glow, { backgroundColor: theme.palette.accent }]} onPress={handleCreate}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>

        {showConfetti ? (
          <ConfettiCannon
            key={confettiKey}
            count={120}
            origin={{ x: screenWidth / 2, y: 0 }}
            fadeOut
          />
        ) : null}

        {!isWeb ? (
          <DateTimePickerModal
            isVisible={datePickerState.visible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={closeDatePicker}
            date={datePickerState.target === "from" ? dateFrom ?? new Date() : dateTo ?? new Date()}
          />
        ) : null}
      </SafeAreaView>
    </NeonBackground>
  );
};

const ThemeToggle = ({ mode, onToggle, palette }) => (
  <Pressable
    onPress={onToggle}
    style={[
      styles.themeToggle,
      {
        borderColor: palette.border,
        backgroundColor: mode === "dark" ? "rgba(15, 27, 50, 0.6)" : "rgba(206, 226, 255, 0.65)"
      }
    ]}
  >
    <Ionicons name={mode === "dark" ? "moon-outline" : "sunny-outline"} size={18} color={palette.accentSoft} />
    <Text style={[styles.themeToggleText, { color: palette.textSecondary }]}>
      {mode === "dark" ? "Modo escuro" : "Modo claro"}
    </Text>
  </Pressable>
);

const MiniDashboard = ({ theme, dashboard }) => (
  <View style={styles.dashboard}>
    <View style={[styles.dashboardCard, { backgroundColor: theme.palette.cardAlt }, theme.shadows.soft]}>
      <Text style={[styles.dashboardTitle, { color: theme.palette.textPrimary }]}>Progresso</Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${dashboard.progress}%`,
              backgroundColor: theme.palette.accent
            }
          ]}
        />
      </View>
      <Text style={[styles.progressLabel, { color: theme.palette.textSecondary }]}>
        {dashboard.progress}% concluído
      </Text>
    </View>
    <View style={styles.dashboardGrid}>
      <DashboardTile
        label="Pendentes"
        value={dashboard.pending}
        icon="time-outline"
        palette={theme.palette}
      />
      <DashboardTile
        label="Concluídas"
        value={dashboard.completed}
        icon="checkmark-done-outline"
        palette={theme.palette}
      />
      <DashboardTile label="Total" value={dashboard.total} icon="list-outline" palette={theme.palette} />
      <DashboardTile label="Próximas" value={dashboard.dueSoon} icon="alarm-outline" palette={theme.palette} />
    </View>
  </View>
);

const DashboardTile = ({ label, value, icon, palette }) => (
  <View style={[styles.dashboardTile, { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <Ionicons name={icon} size={18} color={palette.accent} style={styles.tileIcon} />
    <Text style={[styles.tileValue, { color: palette.textPrimary }]}>{value}</Text>
    <Text style={[styles.tileLabel, { color: palette.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scroll: {
    paddingBottom: 120
  },
  headerCard: {
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    maxWidth: 240,
    lineHeight: 18,
    marginBottom: 12
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12
  },
  logoutText: {
    fontWeight: "600",
    marginLeft: 6
  },
  themeToggle: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  themeToggleText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600"
  },
  dashboard: {
    marginBottom: 24
  },
  dashboardCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  dashboardTile: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  tileIcon: {
    marginBottom: 8
  },
  tileValue: {
    fontSize: 20,
    fontWeight: "700"
  },
  tileLabel: {
    fontSize: 12,
    marginTop: 4
  },
  section: {
    marginBottom: 24
  },
  filtersCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12
  },
  filterHeading: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  dateButton: {
    flex: 1,
    marginRight: 12
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  filterButton: {
    flex: 1,
    marginRight: 12
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600"
  },
  emptyCard: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12
  },
  emptySubtitle: {
    textAlign: "center",
    marginVertical: 8,
    lineHeight: 18
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center"
  }
});

export default TaskListScreen;

