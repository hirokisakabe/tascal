import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createTask,
  fetchTasksRange,
  fetchUnscheduledTasks,
  updateTask,
} from "@/api/tasks";
import { DayTaskBottomSheet } from "@/components/day-task-bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Task } from "@/types/task";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

type CalendarDay = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

function formatMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSheetTitle(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`;
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(year, month - 1, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index,
    );
    return {
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth:
        date.getFullYear() === year && date.getMonth() === month - 1,
    };
  });
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const initialDate = useRef(new Date()).current;
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoad = useRef(true);
  const requestGeneration = useRef(0);

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const loadTasks = useCallback(async () => {
    const generation = ++requestGeneration.current;
    try {
      const visibleDays = getCalendarDays(year, month);
      const [scheduled, unscheduled] = await Promise.all([
        fetchTasksRange(
          visibleDays[0].dateKey,
          visibleDays[visibleDays.length - 1].dateKey,
        ),
        fetchUnscheduledTasks(),
      ]);
      if (generation !== requestGeneration.current) return;
      setScheduledTasks(scheduled);
      setUnscheduledTasks(unscheduled);
    } catch {
      if (generation !== requestGeneration.current) return;
      Alert.alert("エラー", "タスクの取得に失敗しました");
    } finally {
      if (generation === requestGeneration.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setIsLoading(true);
      }
      void loadTasks();
      return () => {
        requestGeneration.current += 1;
      };
    }, [loadTasks]),
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of scheduledTasks) {
      if (!task.date) continue;
      const tasks = map.get(task.date) ?? [];
      tasks.push(task);
      map.set(task.date, tasks);
    }
    return map;
  }, [scheduledTasks]);

  const selectedTasks = selectedDate
    ? (tasksByDate.get(selectedDate) ?? [])
    : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
  };

  const handlePrevMonth = () => {
    setSelectedDate(null);
    if (month === 1) {
      setYear((value) => value - 1);
      setMonth(12);
    } else {
      setMonth((value) => value - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    if (month === 12) {
      setYear((value) => value + 1);
      setMonth(1);
    } else {
      setMonth((value) => value + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDate(formatDateKey(today));
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "todo" ? "done" : "todo";
    const updateList = task.date ? setScheduledTasks : setUnscheduledTasks;
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      updateList((tasks) =>
        tasks.map((value) => (value.id === updated.id ? updated : value)),
      );
    } catch {
      Alert.alert("エラー", "ステータスの更新に失敗しました");
    }
  };

  const handleOpenTask = (task: Task) => {
    const taskDate = task.date ? new Date(`${task.date}T00:00:00`) : null;
    setSelectedDate(null);
    setShowUnscheduled(false);
    requestAnimationFrame(() => {
      router.push({
        pathname: "/task-form",
        params: {
          taskId: task.id,
          year: String(taskDate?.getFullYear() ?? year),
          month: String((taskDate?.getMonth() ?? month - 1) + 1),
        },
      });
    });
  };

  const handleAddTask = () => {
    if (!selectedDate) return;
    Alert.prompt(
      "タスクを追加",
      `${formatSheetTitle(selectedDate)}のタスク名を入力してください`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "追加",
          onPress: (title?: string) => {
            const trimmedTitle = title?.trim();
            if (!trimmedTitle) return;
            void createTask({ title: trimmedTitle, date: selectedDate })
              .then((task) => {
                setScheduledTasks((tasks) => [...tasks, task]);
              })
              .catch(() => {
                Alert.alert("エラー", "タスクの作成に失敗しました");
              });
          },
        },
      ],
      "plain-text",
    );
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">tascal</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            style={[styles.signOutButton, { borderColor: colors.icon }]}
          >
            <ThemedText style={styles.signOutText}>ログアウト</ThemedText>
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <View style={styles.monthTitleGroup}>
            <Pressable
              accessibilityLabel={`未スケジュールタスク ${unscheduledTasks.length}件`}
              accessibilityRole="button"
              onPress={() => setShowUnscheduled(true)}
              style={[
                styles.unscheduledButton,
                { borderColor: colors.icon + "50" },
              ]}
            >
              <ThemedText style={styles.unscheduledIcon}>☷</ThemedText>
              {unscheduledTasks.length > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <ThemedText
                    style={[styles.badgeText, { color: colors.onTint }]}
                  >
                    {unscheduledTasks.length}
                  </ThemedText>
                </View>
              ) : null}
            </Pressable>
            <ThemedText type="subtitle">{formatMonth(year, month)}</ThemedText>
          </View>
          <View style={styles.navButtons}>
            <Pressable
              accessibilityLabel="今日へ移動"
              accessibilityRole="button"
              onPress={handleToday}
              style={[styles.navButton, { borderColor: colors.icon + "50" }]}
            >
              <ThemedText style={styles.todayButtonText}>今日</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel="前の月"
              accessibilityRole="button"
              onPress={handlePrevMonth}
              style={[styles.navButton, { borderColor: colors.icon + "50" }]}
            >
              <ThemedText style={styles.navArrow}>←</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel="次の月"
              accessibilityRole="button"
              onPress={handleNextMonth}
              style={[styles.navButton, { borderColor: colors.icon + "50" }]}
            >
              <ThemedText style={styles.navArrow}>→</ThemedText>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.calendarScrollContent}
            refreshControl={
              <RefreshControl
                onRefresh={() => void handleRefresh()}
                refreshing={isRefreshing}
                tintColor={colors.tint}
              />
            }
          >
            <View
              style={[styles.calendar, { borderColor: colors.icon + "35" }]}
            >
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, index) => (
                  <View key={label} style={styles.weekdayCell}>
                    <ThemedText
                      style={[
                        styles.weekdayText,
                        index === 5 && { color: colors.tint },
                        index === 6 && styles.sundayText,
                      ]}
                    >
                      {label}
                    </ThemedText>
                  </View>
                ))}
              </View>
              <View style={styles.dayGrid}>
                {calendarDays.map((day) => {
                  const taskCount = tasksByDate.get(day.dateKey)?.length ?? 0;
                  const today = isSameDay(day.date, new Date());
                  return (
                    <Pressable
                      accessibilityLabel={`${day.date.getMonth() + 1}月${day.date.getDate()}日、タスク${taskCount}件`}
                      accessibilityRole="button"
                      key={day.dateKey}
                      onPress={() => setSelectedDate(day.dateKey)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        {
                          backgroundColor: day.isCurrentMonth
                            ? colors.background
                            : colorScheme === "dark"
                              ? "#1b1d1f"
                              : "#f5f4f0",
                          borderColor: colors.icon + "25",
                        },
                        pressed && styles.pressedCell,
                      ]}
                    >
                      <View
                        style={[
                          styles.dateCircle,
                          today && { backgroundColor: colors.tint },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dateText,
                            !day.isCurrentMonth && styles.outsideMonthText,
                            today && styles.todayText,
                            today && { color: colors.onTint },
                          ]}
                        >
                          {day.date.getDate()}
                        </ThemedText>
                      </View>
                      {taskCount > 0 ? (
                        <View
                          style={[
                            styles.taskBadge,
                            { backgroundColor: colors.tint },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.taskBadgeText,
                              { color: colors.onTint },
                            ]}
                          >
                            {taskCount}
                          </ThemedText>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <ThemedText style={[styles.refreshHint, { color: colors.icon }]}>
              下に引いて更新
            </ThemedText>
          </ScrollView>
        )}
      </SafeAreaView>

      <DayTaskBottomSheet
        canAddTask
        date={selectedDate}
        onAddTask={handleAddTask}
        onClose={() => setSelectedDate(null)}
        onOpenTask={handleOpenTask}
        onToggleTask={(task) => void handleToggleStatus(task)}
        tasks={selectedTasks}
        title={selectedDate ? formatSheetTitle(selectedDate) : ""}
        visible={selectedDate !== null}
      />
      <DayTaskBottomSheet
        date={null}
        emptyMessage="未スケジュールタスクはありません"
        onClose={() => setShowUnscheduled(false)}
        onOpenTask={handleOpenTask}
        onToggleTask={(task) => void handleToggleStatus(task)}
        tasks={unscheduledTasks}
        title="未スケジュール"
        visible={showUnscheduled}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  signOutButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  signOutText: {
    fontSize: 14,
  },
  monthNav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
  },
  unscheduledButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  unscheduledIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  badge: {
    alignItems: "center",
    borderRadius: 9,
    justifyContent: "center",
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -5,
    top: -5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  navButtons: {
    flexDirection: "row",
    gap: 5,
  },
  navButton: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  navArrow: {
    fontSize: 18,
    lineHeight: 22,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  calendarScrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  calendar: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 32,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  sundayText: {
    color: "#dc2626",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "flex-start",
    minHeight: 56,
    paddingBottom: 4,
    paddingTop: 4,
    width: "14.285714%",
  },
  pressedCell: {
    opacity: 0.55,
  },
  dateCircle: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  dateText: {
    fontSize: 13,
    lineHeight: 17,
  },
  outsideMonthText: {
    opacity: 0.38,
  },
  todayText: {
    fontWeight: "700",
    opacity: 1,
  },
  taskBadge: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 2,
    minHeight: 16,
    minWidth: 16,
    paddingHorizontal: 4,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  refreshHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 10,
    textAlign: "center",
  },
});
