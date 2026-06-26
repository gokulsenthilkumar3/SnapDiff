import Link from 'next/link';
import { Camera, GitPullRequest, CheckCircle, Zap, Shield, DollarSign } from 'lucide-react';

const features = [
  {
    icon: Camera,
    title: 'Auto Screenshot Capture',
    description: 'Playwright-powered headless Chromium captures every page on every Vercel preview deploy.',
  },
  {
    icon: GitPullRequest,
    title: 'GitHub PR Comments',
    description: 'Get a visual diff report posted directly on your pull request — no manual steps.',
  },
  {
    icon: CheckCircle,
    title: 'One-Click Approvals',
    description: 'Approve or reject baseline changes with a single click from the dashboard.',
  },
  {
    icon: Zap,
    title: 'Zero Config',
    description: 'Works out of the box with Next.js and React. Just add the Vercel webhook and you\'re done.',
  },
  {
    icon: Shield,
    title: 'Pixel-Perfect Diffs',
    description: 'pixelmatch engine catches even 1-pixel regressions with configurable thresholds.',
  },
  {
    icon: DollarSign,
    title: '97% Cheaper Than Percy',
    description: 'Percy starts at $599/mo. SnapDiff starts free. Upgrade only when you need to.',
  },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 project', '100 snapshots/mo', 'GitHub PR comments', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$18',
    period: '/month',
    features: ['5 projects', '2,000 snapshots/mo', 'Slack notifications', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    features: ['Unlimited projects', '10,000 snapshots/mo', 'Custom thresholds', 'Dedicated support'],
    cta: 'Contact Us',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-white">SnapDiff</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">
              Sign in
            </Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-4">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-600/10 text-brand-400 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Percy alternative · 97% cheaper
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Catch visual bugs{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-light">
              before your users do
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            SnapDiff automatically captures, compares, and diffs UI screenshots across every Vercel
            preview deployment — and reports results directly in your GitHub PRs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="btn-primary text-base py-3 px-8">
              <Camera className="w-5 h-5" />
              Start for Free
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-base py-3 px-8"
            >
              View on GitHub
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-500">No credit card required · 1 project free forever</p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for visual regression CI
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Zero-config setup. Connect Vercel, connect GitHub, and get diffs on every PR automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card group animate-slide-up">
                <div className="w-10 h-10 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-4 group-hover:bg-brand-600/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, honest pricing</h2>
            <p className="text-gray-400 text-lg">
              Percy starts at{' '}
              <span className="line-through text-gray-500">$599/mo</span>. SnapDiff starts free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col transition-all duration-200 ${
                  plan.highlighted
                    ? 'border-brand-500 bg-brand-950/50 shadow-lg shadow-brand-500/10'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <div className="text-lg font-semibold text-white mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={plan.highlighted ? 'btn-primary justify-center' : 'btn-secondary justify-center'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-semibold text-white">SnapDiff</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SnapDiff. Open source under MIT License.
          </p>
        </div>
      </footer>
    </div>
  );
}
