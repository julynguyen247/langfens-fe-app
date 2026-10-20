"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import 3D Langfens Living Art Study Lounge — SSR disabled
const LangfensVisualizer = dynamic(() => import("./LangfensVisualizer"), {
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();
  const goSignUp = () => router.push("/auth/login");

  return <LangfensVisualizer onCTA={goSignUp} />;
}
