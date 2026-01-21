import { Suspense } from "react";
import ListClient from "./ListClient";

export default function ListPage() {
  return (
    <Suspense fallback={<div className="min-h-[420px]" />}>
      <ListClient />
    </Suspense>
  );
}
