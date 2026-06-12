"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) { router.replace("/bi"); }
    else { router.replace("/login"); }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>加载中...</p>
      </div>
    </div>
  );
}
