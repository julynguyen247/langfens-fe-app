"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthWrapperProps = {
  children: React.ReactNode;
};

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = document.cookie.match(/(^| )access_token=([^;]+)/)?.[2];

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
