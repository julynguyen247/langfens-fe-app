"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import GLBErrorBoundary from "./GLBErrorBoundary";
import IcebergsProc from "./IcebergsProc";

// Dynamic import IcebergsGLB — only loads when GLB files exist
const IcebergsGLB = dynamic(() => import("./IcebergsGLB"), {
  ssr: false,
  loading: () => <IcebergsProc />,
});

export default function Icebergs() {
  return (
    <GLBErrorBoundary fallback={<IcebergsProc />}>
      <Suspense fallback={<IcebergsProc />}>
        <IcebergsGLB />
      </Suspense>
    </GLBErrorBoundary>
  );
}
