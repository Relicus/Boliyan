import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[420px]" />}>
      <DashboardClient />
    </Suspense>
  );
}
