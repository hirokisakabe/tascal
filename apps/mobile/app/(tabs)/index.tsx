import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { DayTaskBottomSheet } from "@/components/day-task-bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UnscheduledTasksButton } from "@/components/unscheduled-tasks-button";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import {
  useCreateTask,
  useTasks,
  useUnscheduledTasks,
  useUpdateTask,
} from "@/hooks/use-tasks";
import type { Task } from "@/types/task";
import {
  resolveMonthSwipe,
  shiftCalendarMonth,
  shouldActivateMonthSwipe,
  type MonthSwipeDirection,
} from "@/utils/month-swipe";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];
const EMPTY_TASKS: Task[] = [];

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
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  const initialDate = useRef(new Date()).current;
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const displayedMonth = useRef({
    year: initialDate.getFullYear(),
    month: initialDate.getMonth() + 1,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const calendarTranslateX = useRef(new Animated.Value(0)).current;
  const calendarWidth = useRef(0);
  const isMonthTransitioning = useRef(false);

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );
  const scheduledTasksQuery = useTasks(year, month);
  const unscheduledTasksQuery = useUnscheduledTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  useRefreshOnFocus();

  const scheduledTasks = scheduledTasksQuery.data ?? EMPTY_TASKS;
  const unscheduledTasks = unscheduledTasksQuery.data ?? EMPTY_TASKS;
  const isLoading =
    scheduledTasksQuery.isPending || unscheduledTasksQuery.isPending;
  const isRefreshing =
    scheduledTasksQuery.isRefetching || unscheduledTasksQuery.isRefetching;
  const hasTaskError =
    scheduledTasksQuery.isError || unscheduledTasksQuery.isError;

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
    await Promise.all([
      scheduledTasksQuery.refetch(),
      unscheduledTasksQuery.refetch(),
    ]);
  };

  const moveMonth = useCallback((offset: -1 | 1) => {
    const next = shiftCalendarMonth(displayedMonth.current, offset);
    displayedMonth.current = next;
    setSelectedDate(null);
    setYear(next.year);
    setMonth(next.month);
    AccessibilityInfo.announceForAccessibility(
      formatMonth(next.year, next.month),
    );
  }, []);

  const moveMonthImmediately = useCallback(
    (offset: -1 | 1) => {
      calendarTranslateX.stopAnimation();
      calendarTranslateX.setValue(0);
      isMonthTransitioning.current = false;
      moveMonth(offset);
    },
    [calendarTranslateX, moveMonth],
  );

  const handlePrevMonth = useCallback(
    () => moveMonthImmediately(-1),
    [moveMonthImmediately],
  );
  const handleNextMonth = useCallback(
    () => moveMonthImmediately(1),
    [moveMonthImmediately],
  );

  const settleMonthSwipe = useCallback(
    (direction: MonthSwipeDirection | null) => {
      if (isMonthTransitioning.current) return;

      const width = calendarWidth.current;
      const destination =
        direction === "next" ? -width : direction === "previous" ? width : 0;

      isMonthTransitioning.current = true;
      Animated.timing(calendarTranslateX, {
        duration: reduceMotion ? 0 : direction ? 160 : 180,
        easing: direction ? Easing.out(Easing.cubic) : Easing.out(Easing.quad),
        toValue: destination,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && direction) {
          moveMonth(direction === "next" ? 1 : -1);
        }
        calendarTranslateX.setValue(0);
        isMonthTransitioning.current = false;
      });
    },
    [calendarTranslateX, moveMonth, reduceMotion],
  );

  const calendarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isMonthTransitioning.current &&
          shouldActivateMonthSwipe(gesture.dx, gesture.dy),
        onPanResponderMove: (_, gesture) => {
          calendarTranslateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          settleMonthSwipe(
            resolveMonthSwipe(gesture.dx, gesture.vx, calendarWidth.current),
          );
        },
        onPanResponderTerminate: () => settleMonthSwipe(null),
        onPanResponderTerminationRequest: () => true,
      }),
    [calendarTranslateX, settleMonthSwipe],
  );

  const handleToday = () => {
    calendarTranslateX.stopAnimation();
    calendarTranslateX.setValue(0);
    isMonthTransitioning.current = false;
    const today = new Date();
    displayedMonth.current = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    };
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDate(formatDateKey(today));
    AccessibilityInfo.announceForAccessibility(
      formatMonth(today.getFullYear(), today.getMonth() + 1),
    );
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "todo" ? "done" : "todo";
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
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
            void createTaskMutation
              .mutateAsync({ title: trimmedTitle, date: selectedDate })
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
        onPress: () => {
          void signOut().finally(() => queryClient.clear());
        },
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
            style={[
              styles.signOutButton,
              { borderColor: colors.controlBorder },
            ]}
          >
            <ThemedText style={styles.signOutText}>ログアウト</ThemedText>
          </Pressable>
        </View>

        <View style={styles.monthNav}>
          <View style={styles.monthTitleGroup}>
            <UnscheduledTasksButton
              count={unscheduledTasks.length}
              onPress={() => setShowUnscheduled(true)}
            />
            <ThemedText accessibilityLiveRegion="polite" type="subtitle">
              {formatMonth(year, month)}
            </ThemedText>
          </View>
          <View style={styles.navButtons}>
            <Pressable
              accessibilityLabel="今日へ移動"
              accessibilityRole="button"
              onPress={handleToday}
              style={[styles.navButton, { borderColor: colors.controlBorder }]}
            >
              <ThemedText style={styles.todayButtonText}>今日</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel="前の月"
              accessibilityRole="button"
              onPress={handlePrevMonth}
              style={[styles.navButton, { borderColor: colors.controlBorder }]}
            >
              <ThemedText style={styles.navArrow}>←</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel="次の月"
              accessibilityRole="button"
              onPress={handleNextMonth}
              style={[styles.navButton, { borderColor: colors.controlBorder }]}
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
            {hasTaskError ? (
              <View style={styles.errorBanner}>
                <ThemedText>タスクの取得に失敗しました</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleRefresh()}
                >
                  <ThemedText style={{ color: colors.tint }}>再試行</ThemedText>
                </Pressable>
              </View>
            ) : null}
            <Animated.View
              accessibilityHint="左右にスワイプして月を移動できます"
              onLayout={(event) => {
                calendarWidth.current = event.nativeEvent.layout.width;
              }}
              style={[
                styles.calendar,
                { borderColor: colors.borderLight },
                { transform: [{ translateX: calendarTranslateX }] },
              ]}
              {...calendarPanResponder.panHandlers}
            >
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, index) => (
                  <View key={label} style={styles.weekdayCell}>
                    <ThemedText
                      style={[
                        styles.weekdayText,
                        { color: colors.icon },
                        index === 5 && { color: colors.tint },
                        index === 6 && { color: colors.danger },
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
                            : colors.surface,
                          borderColor: colors.borderLight,
                        },
                        pressed && styles.pressedCell,
                      ]}
                    >
                      <View
                        style={[
                          styles.dateCircle,
                          today && { backgroundColor: colors.tintBackground },
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
                            { backgroundColor: colors.tintBackground },
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
            </Animated.View>
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
  errorBanner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    paddingBottom: 10,
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
