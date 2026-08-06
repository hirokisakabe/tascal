import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Task } from "@/types/task";

type DayTaskBottomSheetProps = {
  date: string | null;
  tasks: Task[];
  title: string;
  visible: boolean;
  canAddTask?: boolean;
  emptyMessage?: string;
  onAddTask?: () => void;
  onClose: () => void;
  onOpenTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
};

export function DayTaskBottomSheet({
  date,
  tasks,
  title,
  visible,
  canAddTask = false,
  emptyMessage = "この日のタスクはありません",
  onAddTask,
  onClose,
  onOpenTask,
  onToggleTask,
}: DayTaskBottomSheetProps) {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="閉じる"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View
            style={[styles.dragHandle, { backgroundColor: colors.border }]}
          />
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.sheetTitleGroup}>
              <ThemedText type="defaultSemiBold">{title}</ThemedText>
              <ThemedText style={[styles.taskCount, { color: colors.muted }]}>
                {tasks.length}件
              </ThemedText>
            </View>
            {canAddTask && onAddTask ? (
              <Pressable
                accessibilityHint={`${date ?? "選択日"}のタスクを作成します`}
                accessibilityRole="button"
                onPress={onAddTask}
                style={[styles.addButton, { backgroundColor: colors.tint }]}
              >
                <ThemedText
                  style={[styles.addButtonText, { color: colors.onTint }]}
                >
                  ＋ タスクを追加
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.taskList,
              tasks.length === 0 && styles.emptyTaskList,
            ]}
            style={styles.scrollArea}
          >
            {tasks.length === 0 ? (
              <ThemedText style={[styles.emptyText, { color: colors.muted }]}>
                {emptyMessage}
              </ThemedText>
            ) : (
              tasks.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskRow,
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityLabel={`${task.title}を${
                      task.status === "done" ? "未完了に戻す" : "完了にする"
                    }`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: task.status === "done" }}
                    hitSlop={8}
                    onPress={() => onToggleTask(task)}
                    style={styles.checkboxButton}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: colors.icon,
                          backgroundColor:
                            task.status === "done"
                              ? colors.tint
                              : "transparent",
                        },
                      ]}
                    >
                      {task.status === "done" ? (
                        <ThemedText
                          style={[styles.checkmark, { color: colors.onTint }]}
                        >
                          ✓
                        </ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityHint="タスクの詳細を開きます"
                    accessibilityRole="button"
                    onPress={() => onOpenTask(task)}
                    style={styles.taskButton}
                  >
                    <ThemedText
                      numberOfLines={2}
                      style={[
                        styles.taskTitle,
                        task.status === "done" && styles.completedTask,
                      ]}
                    >
                      {task.title}
                    </ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "72%",
    minHeight: 240,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  dragHandle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginBottom: 8,
    marginTop: 10,
    width: 40,
  },
  sheetHeader: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sheetTitleGroup: {
    flex: 1,
    marginRight: 12,
  },
  taskCount: {
    fontSize: 12,
    lineHeight: 18,
  },
  addButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  scrollArea: {
    flexGrow: 0,
  },
  taskList: {
    gap: 8,
    padding: 16,
  },
  emptyTaskList: {
    minHeight: 132,
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  taskRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 10,
  },
  checkboxButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  checkbox: {
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  taskButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  taskTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  completedTask: {
    opacity: 0.55,
    textDecorationLine: "line-through",
  },
});
