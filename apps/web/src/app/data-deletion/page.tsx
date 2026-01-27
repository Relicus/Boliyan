export default function DataDeletionPage() {
  const steps = [
    {
      id: "request",
      title: "Submit a Request",
      description:
        "Use your account settings to request deletion of your personal data and account.",
    },
    {
      id: "verify",
      title: "Verify Ownership",
      description:
        "We confirm the request to protect your account and prevent unauthorized deletions.",
    },
    {
      id: "process",
      title: "Deletion Process",
      description:
        "We remove personal data and deactivate your account within a reasonable timeframe.",
    },
    {
      id: "retain",
      title: "Legal Retention",
      description:
        "Some records may be retained as required by law or for fraud prevention.",
    },
  ];

  return (
    <div id="deletion-page-01" className="w-full bg-slate-50 px-6 py-12 md:py-16">
      <div id="deletion-wrap-01" className="mx-auto w-full max-w-5xl">
        <div id="deletion-hero-01" className="flex flex-col gap-4">
          <div
            id="deletion-badge-01"
            className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
          >
            Data Deletion
          </div>
          <div id="deletion-title-block-01" className="flex flex-col gap-3">
            <h1 id="deletion-title-01" className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Delete Your Data
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              A clear path to remove your personal data and close your account.
            </p>
            <p className="text-sm text-slate-500">
              Boliyan™ is a brand of Relicus, a trademark of Relicus LLC.
            </p>
          </div>
        </div>

        <div
          id="deletion-scoreboard-01"
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-slate-500">Request Flow</span>
            <span className="text-sm font-medium text-slate-700">4-Step Process</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">Account settings</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Verified requests
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              Secure deletion
            </span>
          </div>
        </div>

        <div id="deletion-grid-01" className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              id={`deletion-card-${step.id}`}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-500">Required</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div
          id="deletion-footer-01"
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
        >
          To start, open your account settings and submit a data deletion request. If you cannot
          access your account, contact support for assistance.
        </div>
      </div>
    </div>
  );
}
