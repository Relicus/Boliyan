import { Suspense } from "react";
import CompleteProfileClient from "./CompleteProfileClient";

export const metadata = {
  title: "Complete Your Profile | Boliyan",
  description: "Join Boliyan and start bidding on items",
};

export default function CompleteProfilePage() {
  return (
    <div id="complete-profile-page-01" className="container max-w-lg py-12 px-4">
      <Suspense
        fallback={
          <div
            id="complete-profile-loading-01"
            className="h-10 w-full rounded-lg bg-slate-100"
          />
        }
      >
        <CompleteProfileClient />
      </Suspense>
    </div>
  );
}
