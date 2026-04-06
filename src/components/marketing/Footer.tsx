import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "For Businesses", href: "/for-local-business" },
  { label: "For Developers", href: "/for-app-developers" },
  { label: "Blog", href: "/blog" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/docs" },
  { label: "Help Center", href: "/docs" },
  { label: "Request Demo", href: "/demo" },
  { label: "Privacy Policy", href: "/docs" },
  { label: "Terms of Service", href: "/docs" },
];

export function Footer() {
  return (
    <footer className="border-t bg-navy-900 text-navy-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-heading font-bold text-sm">
                RP
              </div>
              <span className="font-heading text-xl font-bold text-white">
                ReviewPilot
              </span>
            </div>
            <p className="text-sm text-navy-400 max-w-md mb-4">
              AI-powered review management for local businesses and app
              developers. Reply to reviews in seconds, collect more reviews via
              SMS, and track sentiment with analytics.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-3 py-1 text-xs text-navy-300">
              <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
              Made in India
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm">
              Product
            </h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm">
              Company
            </h4>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-400 hover:text-teal-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-navy-800 pt-8 text-center text-xs text-navy-500">
          &copy; {new Date().getFullYear()} ReviewPilot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
