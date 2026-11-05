import { workoutService, WorkoutSummary } from "@/api/workoutService";
import { FilterChips, FilterOption } from "@/components/FilterChips";
import { WorkoutCard } from "@/components/home/WorkoutCard";
import { useAuthStore } from "@/store/authStore";
import { WorkoutType } from "@/store/workoutStore";
import { tabStyles } from "@/styles/tabScreen";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "ALL" | WorkoutType;

const FILTER_OPTIONS: FilterOption<Filter>[] = [
  { value: "ALL", label: "Mind" },
  { value: "CARDIO", label: "Kardió" },
  { value: "STRENGTH", label: "Erőedzés" },
];

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const requestedIdRef = useRef(0);
  const typeParam = filter === "ALL" ? undefined : filter;

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestedIdRef.current;
    setLoading(true);

    try {
      const response = await workoutService.getUserWorkouts(
        0,
        PAGE_SIZE,
        typeParam,
      );
      if (requestId !== requestedIdRef.current) return;

      setWorkouts(response.content);
      setNextPage(1);
      setHasMore(response.number + 1 < response.totalPages);
    } catch (error) {
      console.error("Hiba az edzések lekérésekor", error);
    } finally {
      if (requestId === requestedIdRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [typeParam]);

  const loadMore = async () => {
    if (!hasMore || loading || isLoadingMore || isRefreshing) return;

    const requestId = requestedIdRef.current;
    setLoading(true);

    try {
      const response = await workoutService.getUserWorkouts(
        nextPage,
        PAGE_SIZE,
        typeParam,
      );
      if (requestId !== requestedIdRef.current) return;

      setWorkouts((prev) => [...prev, ...response.content]);
      setNextPage((page) => page + 1);
      setHasMore(response.number + 1 < response.totalPages);
    } catch (error) {
      console.error("Hiba a további edzések lekérésekor", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [loadFirstPage]),
  );

  const handleFilterChange = (value: Filter) => {
    if (value === filter) return;
    setWorkouts([]);
    setFilter(value);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFirstPage();
  };

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WorkoutCard
            item={item}
            onPress={() => router.push(`/workouts/${item.id}`)}
          />
        )}
        contentContainerStyle={tabStyles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={tabStyles.title}>Szia, {user?.username}!</Text>
            <FilterChips
              options={FILTER_OPTIONS}
              selected={filter}
              onSelect={handleFilterChange}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#FC4C02" style={styles.spinner} />
          ) : (
            <Text style={tabStyles.mutedText}>
              {filter === "ALL"
                ? "Még nincs edzésed."
                : "Ebben a kategóriában még nincs edzésed."}
            </Text>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color="#FC4C02" style={styles.spinner} />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FC4C02"
            colors={["#FC4C02"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  spinner: { marginVertical: 24 },
});
