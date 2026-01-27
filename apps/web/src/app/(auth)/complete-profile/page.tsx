import CompleteProfileClient from "./CompleteProfileClient";

export const metadata = {
  title: "Complete Your Profile | Boliyan",
  description: "Join Boliyan and start bidding on items",
};

export default function CompleteProfilePage() {
  return (
    <div className="container max-w-lg py-12 px-4">
      <CompleteProfileClient />
    </div>
  );
}
