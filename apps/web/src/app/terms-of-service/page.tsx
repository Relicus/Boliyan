export default function TermsOfServicePage() {
  const rules = [
    {
      id: "accounts",
      title: "Account Integrity",
      description:
        "Keep your profile accurate and secure. You are responsible for activity under your account.",
    },
    {
      id: "bidding",
      title: "Bids Are Commitments",
      description:
        "Place only bids you can honor. Sellers may set reserves and minimum increments.",
    },
    {
      id: "sellers",
      title: "Seller Clarity",
      description:
        "List items honestly, disclose defects, and complete accepted deals promptly.",
    },
    {
      id: "prohibited",
      title: "Prohibited Items",
      description:
        "Illegal, unsafe, or counterfeit goods are not allowed and may be removed without notice.",
    },
    {
      id: "termination",
      title: "Fair Play",
      description:
        "We may suspend accounts that violate these rules or harm the marketplace.",
    },
  ];

  return (
    <div id="terms-page-01" className="w-full bg-slate-50 px-6 py-12 md:py-16">
      <div id="terms-wrap-01" className="mx-auto w-full max-w-5xl">
        <div id="terms-hero-01" className="flex flex-col gap-4">
          <div
            id="terms-badge-01"
            className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
          >
            Marketplace Ruleset
          </div>
          <div id="terms-title-block-01" className="flex flex-col gap-3">
            <h1 id="terms-title-01" className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Terms of Service
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              Simple, fair rules that keep bidding fast, listings honest, and deals reliable.
            </p>
            <p className="text-sm text-slate-500">
              Boliyan™ is a brand of Relicus, a trademark of Relicus LLC.
            </p>
          </div>
        </div>

        <div
          id="terms-scoreboard-01"
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-slate-500">Status</span>
            <span className="text-sm font-medium text-slate-700">Active Ruleset</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">No chat before deal</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Verified bids
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Clear listings
            </span>
          </div>
        </div>

        <div id="terms-grid-01" className="mt-8 grid gap-4 md:grid-cols-2">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              id={`terms-card-${rule.id}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Rule {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500">Required</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{rule.title}</h2>
              <p className="text-sm text-slate-600">{rule.description}</p>
            </div>
          ))}
        </div>

        <div
          id="terms-footer-01"
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
        >
          Keep your activity aligned with these rules to protect the marketplace. If you have
          questions or need help, contact support through your account settings.
        </div>
      </div>
    </div>
  );
}
