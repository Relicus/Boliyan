export default function PrivacyPolicyPage() {
  const pillars = [
    {
      id: "collection",
      title: "What We Collect",
      description:
        "Account details, listings, bids, and basic usage data to keep the marketplace reliable.",
    },
    {
      id: "usage",
      title: "How We Use It",
      description:
        "Operate the platform, protect against fraud, improve features, and support transactions.",
    },
    {
      id: "cookies",
      title: "Cookies",
      description:
        "Remember preferences, keep you signed in, and measure performance. You control them.",
    },
    {
      id: "rights",
      title: "Your Rights",
      description:
        "Request access, correction, or deletion of personal data where applicable.",
    },
  ];

  return (
    <div id="privacy-page-01" className="w-full bg-slate-50 px-6 py-12 md:py-16">
      <div id="privacy-wrap-01" className="mx-auto w-full max-w-5xl">
        <div id="privacy-hero-01" className="flex flex-col gap-4">
          <div
            id="privacy-badge-01"
            className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
          >
            Data Playbook
          </div>
          <div id="privacy-title-block-01" className="flex flex-col gap-3">
            <h1 id="privacy-title-01" className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              Clear choices on what data we collect and how it powers a trusted marketplace.
            </p>
            <p className="text-sm text-slate-500">
              Boliyan™ is a brand of Relicus, a trademark of Relicus LLC.
            </p>
          </div>
        </div>

        <div
          id="privacy-scoreboard-01"
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-slate-500">Control Center</span>
            <span className="text-sm font-medium text-slate-700">You Own Your Data</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">No data sales</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Cookie controls
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Access requests
            </span>
          </div>
        </div>

        <div id="privacy-grid-01" className="mt-8 grid gap-4 md:grid-cols-2">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.id}
              id={`privacy-card-${pillar.id}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Pillar {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500">Core</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{pillar.title}</h2>
              <p className="text-sm text-slate-600">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div
          id="privacy-footer-01"
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
        >
          For data requests or privacy questions, contact support through your account settings.
        </div>
      </div>
    </div>
  );
}
