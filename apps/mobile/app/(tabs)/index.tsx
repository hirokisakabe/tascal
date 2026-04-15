import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/auth-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchTasks, fetchUnscheduledTasks, updateTask } from "@/api/tasks";
import type { Task } from "@/types/task";

type Section = {
  title: string;
  data: Task[];
};

function formatMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day}（${weekday}）`;
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
}

function buildSections(
  scheduledTasks: Task[],
  unscheduledTasks: Task[],
): Section[] {
  const dateMap = new Map<string, Task[]>();
  for (const task of scheduledTasks) {
    if (!task.date) continue;
    const existing = dateMap.get(task.date) ?? [];
    existing.push(task);
    dateMap.set(task.date, existing);
  }

  const sortedDates = [...dateMap.keys()].sort();
  const sections: Section[] = sortedDates.map((date) => ({
    title: formatDateLabel(date),
    data: dateMap.get(date)!,
  }));

  if (unscheduledTasks.length > 0) {
    sections.push({
      title: `未スケジュール（${unscheduledTasks.length}件）`,
      data: unscheduledTasks,
    });
  }

  return sections;
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme() ?? "light";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const loadTasks = useCallback(async () => {
    try {
      const [scheduled, unscheduled] = await Promise.all([
        fetchTasks(year, month),
        fetchUnscheduledTasks(),
      ]);
      setScheduledTasks(scheduled);
      setUnscheduledTasks(unscheduled);
    } catch {
      Alert.alert("エラー", "タスクの取得に失敗しました");
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setIsLoading(true);
        void loadTasks().finally(() => setIsLoading(false));
      } else {
        void loadTasks();
      }
    }, [loadTasks]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const isTodayMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "todo" ? "done" : "todo";
    const updateList = task.date ? setScheduledTasks : setUnscheduledTasks;
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      updateList((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
    } catch {
      Alert.alert("エラー", "ステータスの更新に失敗しました");
    }
  };

  const handleSignOut = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

  const sections = buildSections(scheduledTasks, unscheduledTasks);

  const renderTask = ({ item }: { item: Task }) => (
    <Pressable
      style={[
        styles.taskRow,
        { borderBottomColor: Colors[colorScheme].icon + "30" },
      ]}
      onPress={() =>
        router.push({
          pathname: "/task-form",
          params: { taskId: item.id, year: String(year), month: String(month) },
        })
      }
    >
      <Pressable
        style={styles.checkbox}
        onPress={() => void handleToggleStatus(item)}
        hitSlop={8}
      >
        <View
          style={[
            styles.checkboxInner,
            {
              borderColor: Colors[colorScheme].icon,
              backgroundColor:
                item.status === "done"
                  ? Colors[colorScheme].tint
                  : "transparent",
            },
          ]}
        >
          {item.status === "done" && (
            <ThemedText style={styles.checkmark}>✓</ThemedText>
          )}
        </View>
      </Pressable>
      <View style={styles.taskContent}>
        <ThemedText
          style={[
            styles.taskTitle,
            item.status === "done" && styles.taskTitleDone,
          ]}
        >
          {item.title}
        </ThemedText>
      </View>
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const dateStr = scheduledTasks.find(
      (t) => t.date && formatDateLabel(t.date) === section.title,
    )?.date;
    const today = dateStr ? isToday(dateStr) : false;

    return (
      <View
        style={[
          styles.sectionHeader,
          {
            backgroundColor:
              colorScheme === "dark" ? Colors.dark.background : "#f5f4f0",
          },
        ]}
      >
        <ThemedText
          style={[
            styles.sectionHeaderText,
            today && {
              color: Colors[colorScheme].tint,
              fontWeight: "bold",
            },
          ]}
        >
          {section.title}
          {today && " — 今日"}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">tascal</ThemedText>
        <Pressable
          style={[
            styles.signOutButton,
            { borderColor: Colors[colorScheme].icon },
          ]}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutText}>ログアウト</ThemedText>
        </Pressable>
      </View>

      <View style={styles.monthNav}>
        <Pressable onPress={handlePrevMonth} hitSlop={8}>
          <ThemedText style={styles.navArrow}>◀</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">{formatMonth(year, month)}</ThemedText>
        <Pressable onPress={handleNextMonth} hitSlop={8}>
          <ThemedText style={styles.navArrow}>▶</ThemedText>
        </Pressable>
        {!isTodayMonth && (
          <Pressable
            style={[
              styles.todayButton,
              { borderColor: Colors[colorScheme].tint },
            ]}
            onPress={handleToday}
            hitSlop={4}
          >
            <ThemedText
              style={[
                styles.todayButtonText,
                { color: Colors[colorScheme].tint },
              ]}
            >
              今日
            </ThemedText>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          renderSectionHeader={renderSectionHeader}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          stickySectionHeadersEnabled
          contentContainerStyle={
            sections.length === 0 ? styles.centered : undefined
          }
          ListEmptyComponent={
            <ThemedText style={{ color: Colors[colorScheme].icon }}>
              タスクがありません
            </ThemedText>
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: Colors[colorScheme].tint }]}
        onPress={() =>
          router.push({
            pathname: "/task-form",
            params: { year: String(year), month: String(month) },
          })
        }
      >
        <ThemedText
          style={[
            styles.fabText,
            {
              color:
                colorScheme === "dark"
                  ? Colors.dark.background
                  : Colors.light.background,
            },
          ]}
        >
          +
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutText: {
    fontSize: 14,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  navArrow: {
    fontSize: 18,
  },
  todayButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 18,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 30,
  },
});
