import { useAuthStore } from "@/store/authStore";
import { Redirect } from "expo-router";

export default function Index() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return isLoggedIn ? (
    <Redirect href="/dashboard" />
  ) : (
    <Redirect href="/login" />
  );
}
