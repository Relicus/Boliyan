import { Suspense } from "react";
import SignUpClient from "./SignUpClient";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[420px]" />}>
      <SignUpClient />
    </Suspense>
  );
}
