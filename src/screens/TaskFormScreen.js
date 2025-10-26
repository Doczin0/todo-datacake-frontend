import React, { useEffect, useMemo, useState } from "react";
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "../components/SafeDateTimePickerModal";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import LoadingOverlay from "../components/LoadingOverlay";
import NeonBackground from "../components/NeonBackground";
import SelectablePill from "../components/SelectablePill";
import api from "../api/client";
import { queryClient } from "../lib/queryClient";
import openWebDatePicker from "../lib/openWebDatePicker";
import { AVAILABLE_TAGS, CATEGORY_OPTIONS, IMPORTANCE_OPTIONS } from "../theme";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const formatDateDisplay = (date) => (date ? format(date, "dd/MM/yyyy") : "Selecionar data");
const toISODate = (date) => (date ? format(date, "yyyy-MM-dd") : null);

const normalizeChecklist = (items = []) =>
  (items || []).map((item, index) => ({
    id: item.id ?? `temp-${index}`,
    label: item.label ?? "",
    done: Boolean(item.done),
    order: item.order ?? index
  }));

const TaskFormScreen = ({ navigation, route }) => {
  const task = route.params?.task ?? null;
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();

  const [title, setTitle] = useState(() => (task?.title ? task.title.slice(0, 20) : ""));
  const [description, setDescription] = useState(task?.description ?? "");
  const [importance, setImportance] = useState(task?.importance ?? "media");
  const [category, setCategory] = useState(task?.category ?? "pessoal");
  const [tags, setTags] = useState(task?.tags ?? []);
  const [dueDate, setDueDate] = useState(() => (task?.due_date ? parseISO(task.due_date) : null));
  const [checklistItems, setChecklistItems] = useState(() => normalizeChecklist(task?.checklist_items));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";

  const handleTitleChange = (text) => {
    setTitle(text.slice(0, 20));
  };

  const handleDueDatePress = async () => {
    if (isWeb) {
      const selectedDate = await openWebDatePicker(dueDate ?? new Date());
      if (selectedDate) {
        setDueDate(selectedDate);
        setDraftMessage("Data limite definida.");
      }
      return;
    }

    if (isAndroid) {
      DateTimePickerAndroid.open({
        mode: "date",
        value: dueDate ?? new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === "dismissed" || !selectedDate) {
            return;
          }
          setDueDate(selectedDate);
          setDraftMessage("Data limite definida.");
        }
      });
      return;
    }

    setDatePickerVisible(true);
  };

  const handleClearDueDate = () => {
    if (!dueDate) {
      return;
    }
    setDueDate(null);
    setDraftMessage("Data limite removida. Você pode definir outra quando quiser.");
  };

  useEffect(() => {
    if (!draftMessage) {
      return undefined;
    }
    const timeout = globalThis.setTimeout(() => setDraftMessage(""), 3000);
    return () => globalThis.clearTimeout(timeout);
  }, [draftMessage]);

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const addChecklistItem = () => {
    setChecklistItems((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, label: "Novo item", done: false, order: prev.length }
    ]);
    setDraftMessage("Checklist atualizado. Suas alterações serão salvas.");
  };

  const updateChecklistLabel = (id, label) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, label } : item)));
    setDraftMessage("Checklist atualizado. Suas alterações serão salvas.");
  };

  const toggleChecklistDone = (id) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeChecklistItem = (id) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
    setDraftMessage("Item removido do checklist.");
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (task) {
        const response = await api.patch(`tasks/${task.id}/`, payload);
        return response.data;
      }
      const response = await api.post("tasks/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: false });
      pushNotification({
        type: "success",
        message: task ? "Tarefa atualizada com sucesso." : "Tarefa criada com sucesso."
      });
      navigation.goBack();
    },
    onError: (err) => {
      const data = err.response?.data;
      let message = "Não foi possível salvar a tarefa.";
      if (typeof data === "object" && data) {
        const first = Object.values(data)[0];
        message = Array.isArray(first) ? first[0] : String(first);
      }
      pushNotification({ type: "error", message });
    }
  });

  const pageTitle = useMemo(() => (task ? "Editar tarefa" : "Nova tarefa"), [task]);

  const handleSubmit = () => {
    if (!title.trim()) {
      pushNotification({ type: "warning", message: "Informe um título para a tarefa." });
      return;
    }

    const payload = {
      title: title.trim(),
      description,
      importance,
      category,
      tags,
      recurrence: "nenhuma",
      due_date: toISODate(dueDate),
      checklist_items: checklistItems.map((item, index) => ({
        id: typeof item.id === "number" ? item.id : undefined,
        label: item.label,
        done: item.done,
        order: index
      }))
    };
    mutation.mutate(payload);
  };

  return (
    <NeonBackground>
      <SafeAreaView style={styles.safeArea}>
        <LoadingOverlay visible={mutation.isPending} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.palette.textPrimary }]}>{pageTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.palette.textSecondary }]}>
              Defina títulos claros (máximo de 20 caracteres), organize categorias, tags e checklist para acelerar sua
              rotina.
            </Text>
            {draftMessage ? (
              <Text style={[styles.draftMessage, { color: theme.palette.info }]}>{draftMessage}</Text>
            ) : null}
          </View>

          <TextField
            label="Título"
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Resumo da tarefa"
          />
          <Text style={[styles.helperText,  { color: theme.palette.textMuted }]}>
            {title.length}/20 caracteres utilizados.
          </Text>

          <TextField
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Detalhes, links ou critérios"
            multiline
            numberOfLines={5}
          />

          <SectionLabel text="Importância" />
          <View style={styles.rowWrap}>
            {IMPORTANCE_OPTIONS.map((option) => (
              <SelectablePill
                key={option.value}
                label={option.label}
                active={importance === option.value}
                onPress={() => setImportance(option.value)}
              />
            ))}
          </View>
          <Text style={[styles.helperText, { color: theme.palette.textMuted }]}>
            Selecione a prioridade para que possamos destacar tarefas urgentes.
          </Text>

          <SectionLabel text="Categoria" />
          <View style={styles.rowWrap}>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectablePill
                key={option.value}
                label={option.label}
                active={category === option.value}
                onPress={() => setCategory(option.value)}
                icon={option.icon}
              />
            ))}
          </View>

          <SectionLabel text="Tags rápidas" />
          <View style={styles.rowWrap}>
            {AVAILABLE_TAGS.map((tag) => (
              <SelectablePill key={tag} label={tag} active={tags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>

          <SectionLabel text="Data limite" />
          <PrimaryButton
            title={formatDateDisplay(dueDate)}
            onPress={handleDueDatePress}
            variant="secondary"
            icon={<Ionicons name="calendar-outline" size={18} color={theme.palette.textPrimary} />}
          />
          {dueDate ? (
            <PrimaryButton
              title="Limpar data limite"
              onPress={handleClearDueDate}
              variant="ghost"
              icon={<Ionicons name="close-circle-outline" size={18} color={theme.palette.textSecondary} />}
            />
          ) : null}
          <Text style={[styles.helperText, { color: theme.palette.textMuted }]}>
            {dueDate ? formatCountdownLabel(dueDate) : "Defina uma data para ativar alertas de prazo."}
          </Text>

          <SectionLabel text="Checklist" />
          <View
            style={[
              styles.checklistContainer,
              {
                borderColor: theme.mode === "dark" ? "rgba(96, 165, 250, 0.25)" : "rgba(15, 23, 42, 0.2)"
              }
            ]}
          >
            {checklistItems.map((item) => (
              <View key={item.id} style={styles.checklistRow}>
                <TouchableCheckbox
                  label={item.label}
                  done={item.done}
                  onPress={() => toggleChecklistDone(item.id)}
                  onChangeText={(text) => updateChecklistLabel(item.id, text)}
                  theme={theme}
                />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeChecklistItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={theme.palette.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <PrimaryButton
              title="Adicionar item"
              onPress={addChecklistItem}
              variant="ghost"
              icon={<Ionicons name="add-circle-outline" size={18} color={theme.palette.textSecondary} />}
            />
          </View>

          <PrimaryButton
            title={task ? "Atualizar tarefa" : "Criar tarefa"}
            onPress={handleSubmit}
            loading={mutation.isPending}
            style={styles.submitButton}
          />
        </ScrollView>
      </SafeAreaView>
      {Platform.OS === "ios" ? (
        <DateTimePickerModal
          isVisible={datePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setDatePickerVisible(false);
            setDueDate(date);
            setDraftMessage("Data limite definida.");
          }}
          onCancel={() => setDatePickerVisible(false)}
          date={dueDate ?? new Date()}
        />
      ) : null}
    </NeonBackground>
  );
};

const SectionLabel = ({ text }) => {
  const { theme } = useThemeMode();
  return <Text style={[styles.sectionLabel, { color: theme.palette.textSecondary }]}>{text}</Text>;
};

const formatCountdownLabel = (dueDate) => {
  const today = new Date();
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Vence hoje!";
  if (diffDays === 1) return "Falta 1 dia";
  if (diffDays > 1) return `Faltam ${diffDays} dias`;
  if (diffDays === -1) return "Venceu há 1 dia";
  return `Venceu há ${Math.abs(diffDays)} dias`;
};

const TouchableCheckbox = ({ label, done, onPress, onChangeText, theme }) => (
  <View style={styles.checkboxRow}>
    <PrimaryButton
      title={done ? "Feito" : "Pendente"}
      onPress={onPress}
      variant={done ? "secondary" : "ghost"}
      style={styles.checkboxButton}
      icon={
        <Ionicons
          name={done ? "checkmark-circle-outline" : "ellipse-outline"}
          size={16}
          color={done ? theme.palette.success : theme.palette.textSecondary}
        />
      }
    />
    <View style={styles.checkboxInput}>
      <TextField value={label} onChangeText={onChangeText} placeholder="Descrição do item" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scroll: {
    paddingBottom: 140
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10
  },
  subtitle: {
    lineHeight: 20
  },
  draftMessage: {
    marginTop: 10,
    fontSize: 12
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: 0.3
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  helperText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 20,
    alignSelf: 'start',
    marginLeft: 5,
  },
  checklistContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    marginTop: 4
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  checkboxButton: {
    flex: 0
  },
  checkboxInput: {
    flex: 1,
    marginLeft: 12
  },
  removeButton: {
    marginLeft: 8
  },
  submitButton: {
    marginTop: 10
  }
});

export default TaskFormScreen;
