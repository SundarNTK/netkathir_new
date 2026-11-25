import Link from "next/link";
import { NAV, SITE } from "@/lib/data";
import FooterCta from "./FooterCta";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-10 bg-[#0B0E1A] text-white [--muted:#9aa3c4] [--ice:#bbf7d0] [--gold:#fbbf24]">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/netkathir-logo-light.png" alt="Netkathir Technologies" className="mb-8 h-[4.5rem] w-auto sm:h-20" />
        <FooterCta />

        <div className="mt-12 grid gap-10 md:grid-cols-4 text-sm">
          <div>
            <p className="text-muted mb-4 font-mono text-xs uppercase tracking-widest">Explore</p>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-ice transition-colors">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted mb-4 font-mono text-xs uppercase tracking-widest">Contact</p>
            <ul className="space-y-2">
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-ice">{SITE.email}</a>
              </li>
              {SITE.phones.map((p) => (
                <li key={p}>{p}</li>
              ))}
              <li>
                <a href={SITE.whatsapp} className="hover:text-ice">WhatsApp</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-muted mb-4 font-mono text-xs uppercase tracking-widest">Offices</p>
            <ul className="space-y-4 text-muted">
              {SITE.offices.map((o) => (
                <li key={o.country}>
                  <span className="text-white">{o.country}</span>
                  <br />
                  {o.address}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-muted mb-4 font-mono text-xs uppercase tracking-widest">Follow</p>
            <ul className="space-y-2">
              {Object.entries(SITE.social).map(([k, v]) => (
                <li key={k}>
                  <a href={v} target="_blank" rel="noreferrer" className="hover:text-ice">{k} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-between text-xs text-muted">
          <p>Copyright © 2026 Netkathir Technologies. All rights reserved.</p>
          <p className="flex gap-5">
            <a href="https://netkathir.com/privacy-policy" className="hover:text-white">Privacy Policy</a>
            <a href="https://netkathir.com/terms-and-conditions" className="hover:text-white">Terms &amp; Conditions</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
