import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUnscheduledTasks,
  useUpdateTask,
} from "@/hooks/use-tasks";
import type { Task } from "@/types/task";

export default function TaskFormScreen() {
  const { taskId, year, month } = useLocalSearchParams<{
    taskId?: string;
    year: string;
    month: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const isEditing = !!taskId;
  const numericYear = Number(year);
  const numericMonth = Number(month);

  // デフォルト日付: 表示中の月が当月なら今日、それ以外なら月初
  const defaultDate = (() => {
    const now = new Date();
    const y = numericYear;
    const m = numericMonth;
    if (y === now.getFullYear() && m === now.getMonth() + 1) {
      return `${y}-${String(m).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    return `${y}-${String(m).padStart(2, "0")}-01`;
  })();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(isEditing ? "" : defaultDate);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const initializedTaskId = useRef<string | null>(null);
  const scheduledTasksQuery = useTasks(numericYear, numericMonth, isEditing);
  const unscheduledTasksQuery = useUnscheduledTasks(isEditing);
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const task = [
    ...(scheduledTasksQuery.data ?? []),
    ...(unscheduledTasksQuery.data ?? []),
  ].find((value) => value.id === taskId);
  const isLoadingTask =
    isEditing &&
    (scheduledTasksQuery.isPending || unscheduledTasksQuery.isPending);
  const hasTaskError =
    isEditing && (scheduledTasksQuery.isError || unscheduledTasksQuery.isError);
  const isSaving = createTaskMutation.isPending || updateTaskMutation.isPending;

  useEffect(() => {
    if (!taskId || !task || initializedTaskId.current === taskId) return;

    initializedTaskId.current = taskId;
    setOriginalTask(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDate(task.date ?? "");
  }, [task, taskId]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }

    const trimmedDate = date.trim();
    if (trimmedDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      Alert.alert("エラー", "日付はYYYY-MM-DD形式で入力してください");
      return;
    }

    try {
      if (isEditing && taskId) {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          data: {
            title: trimmedTitle,
            description: description.trim() || null,
            date: trimmedDate || null,
          },
        });
      } else {
        await createTaskMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || null,
          date: trimmedDate || null,
        });
      }
      router.back();
    } catch {
      Alert.alert(
        "エラー",
        isEditing ? "タスクの更新に失敗しました" : "タスクの作成に失敗しました",
      );
    }
  };

  const handleDelete = () => {
    if (!taskId) return;
    Alert.alert("削除", "このタスクを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTaskMutation.mutateAsync(taskId);
            router.back();
          } catch {
            Alert.alert("エラー", "タスクの削除に失敗しました");
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async () => {
    if (!taskId || !originalTask) return;
    const newStatus = originalTask.status === "todo" ? "done" : "todo";
    try {
      const updated = await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus },
      });
      setOriginalTask(updated);
    } catch {
      Alert.alert("エラー", "ステータスの更新に失敗しました");
    }
  };

  if (isLoadingTask) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (hasTaskError) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>タスクの取得に失敗しました</ThemedText>
        <Pressable
          onPress={() => {
            void Promise.all([
              scheduledTasksQuery.refetch(),
              unscheduledTasksQuery.refetch(),
            ]);
          }}
        >
          <ThemedText style={{ color: Colors[colorScheme].tint }}>
            再試行
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText style={styles.cancelText}>キャンセル</ThemedText>
          </Pressable>
          <ThemedText type="defaultSemiBold">
            {isEditing ? "タスクの詳細" : `タスクを追加`}
          </ThemedText>
          <Pressable onPress={handleSave} disabled={isSaving} hitSlop={8}>
            <ThemedText
              style={[
                styles.saveText,
                { color: Colors[colorScheme].tint },
                isSaving && { opacity: 0.5 },
              ]}
            >
              保存
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText style={styles.label}>タイトル</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].controlBorder,
                  backgroundColor: Colors[colorScheme].surface,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="タスクのタイトル"
              placeholderTextColor={Colors[colorScheme].icon}
              autoFocus={!isEditing}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>日付 (YYYY-MM-DD)</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].controlBorder,
                  backgroundColor: Colors[colorScheme].surface,
                },
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="例: 2026-04-15"
              placeholderTextColor={Colors[colorScheme].icon}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>説明</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].controlBorder,
                  backgroundColor: Colors[colorScheme].surface,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="タスクの説明（任意）"
              placeholderTextColor={Colors[colorScheme].icon}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {isEditing && originalTask && (
            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.actionButton,
                  { borderColor: Colors[colorScheme].tint },
                ]}
                onPress={handleToggleStatus}
              >
                <ThemedText
                  style={[
                    styles.actionButtonText,
                    { color: Colors[colorScheme].tint },
                  ]}
                >
                  {originalTask.status === "todo"
                    ? "完了にする"
                    : "未完了に戻す"}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.actionButton,
                  { borderColor: Colors[colorScheme].danger },
                ]}
                onPress={handleDelete}
              >
                <ThemedText
                  style={[
                    styles.actionButtonText,
                    { color: Colors[colorScheme].danger },
                  ]}
                >
                  削除
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  actions: {
    gap: 12,
    marginTop: 12,
    marginBottom: 40,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
