"use client";

import dynamic from "next/dynamic";

const ListClient = dynamic(() => import("./ListClient"), {
  ssr: false,
  loading: () => <div id="list-loading-01" className="min-h-[420px]" />,
});

export default function ListPageClient() {
  return (
    <div id="list-page-01">
      <ListClient />
    </div>
  );
}
