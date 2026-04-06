import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-heading font-bold text-sm">
            RP
          </div>
          <span className="font-heading text-xl font-bold">ReviewPilot</span>
        </Link>
        <div>
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Turn reviews into revenue with AI-powered management.
          </h2>
          <p className="mt-4 text-navy-300 text-lg">
            Join 100+ businesses saving hours every week on review management.
          </p>
        </div>
        <p className="text-sm text-navy-500">
          &copy; {new Date().getFullYear()} ReviewPilot
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
