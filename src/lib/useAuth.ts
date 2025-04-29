import { useRouter } from "next/router";
import { useEffect } from "react";

export function useAuth(allowedRole: "ADMIN" | "CLIENT") {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== allowedRole) {
        router.replace("/");
      }
    } catch (e) {
      router.replace("/");
    }
  }, [allowedRole, router]);
}
