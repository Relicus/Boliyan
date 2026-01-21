import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[420px]" />}>
      <SignInClient />
    </Suspense>
  );
}
