import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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
import { fetchTasks, updateTask } from "@/api/tasks";
import type { Task } from "@/types/task";

function formatMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme() ?? "light";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks(year, month);
      setTasks(data);
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

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "todo" ? "done" : "todo";
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
        {item.date && (
          <ThemedText
            style={[styles.taskDate, { color: Colors[colorScheme].icon }]}
          >
            {item.date}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

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
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={
            tasks.length === 0 ? styles.centered : undefined
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
    gap: 24,
    paddingVertical: 12,
  },
  navArrow: {
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  taskDate: {
    fontSize: 13,
    marginTop: 2,
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
