import { SITE } from "@/lib/data";

/* Office photos: CC0 (public domain) images from Wikimedia Commons
   - puducherry.jpg: "OLD LIGHT HOUSE, PONDICHERRY"
   - dubai.jpg: "Dubai skyline unsplash" */
const OFFICE_META = [
  { city: "Puducherry", tz: "IST · UTC+5:30", image: "/images/contact/puducherry.jpg", pos: "center 35%" },
  { city: "Dubai", tz: "GST · UTC+4", image: "/images/contact/dubai.jpg", pos: "center 45%" },
];

const I = {
  mail: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  mobile: <path d="M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

function Svg({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 000-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.4-.3z" />
  </svg>
);

export default function ContactCards() {
  const [office, mobile] = SITE.phones;
  const actions = [
    { href: `mailto:${SITE.email}`, label: "Email us", value: SITE.email, icon: <Svg>{I.mail}</Svg>, cls: "ct-act-mail min-[420px]:col-span-2", ext: false },
    { href: `tel:${office.replace(/\s+/g, "")}`, label: "Office", value: office, icon: <Svg>{I.phone}</Svg>, cls: "ct-act-phone", ext: false },
    { href: `tel:${(mobile ?? office).replace(/\s+/g, "")}`, label: "Mobile", value: mobile ?? office, icon: <Svg>{I.mobile}</Svg>, cls: "ct-act-phone", ext: false },
    { href: SITE.whatsapp, label: "WhatsApp", value: "Chat now", icon: WhatsAppIcon, cls: "ct-act-wa min-[420px]:col-span-2", ext: true },
  ];

  return (
    <aside className="grid gap-4 sm:grid-cols-2 lg:flex lg:h-full lg:flex-col lg:justify-between">
      {SITE.offices.map((o, i) => {
        const m = OFFICE_META[i] ?? OFFICE_META[0];
        return (
          <article key={o.country} data-reveal data-delay={i * 0.1} className="ct-card glass group flex flex-col overflow-hidden rounded-3xl">
            <div className="relative h-28 overflow-hidden sm:h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image}
                alt={`${m.city} office location`}
                loading="lazy"
                className="ct-photo absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: m.pos }}
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#04140c]/85 via-[#04140c]/25 to-transparent" />
              <span aria-hidden className="ct-shine" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#14532d] shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
                </span>
                {o.country}
              </span>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                <h3 className="text-xl font-semibold leading-none drop-shadow sm:text-2xl">{m.city}</h3>
                <span className="font-mono text-[11px] text-white/80">{m.tz}</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-[#dcfce7] text-ice">
                <Svg className="h-4 w-4">{I.pin}</Svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-muted">{o.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ice"
                >
                  Get directions
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          </article>
        );
      })}

      <div data-reveal data-delay={0.2} className="ct-card glass rounded-3xl p-4 sm:col-span-2 sm:p-5">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ice">Reach us directly</p>
        <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`ct-act ${a.cls} group/act`}
              aria-label={`${a.label}: ${a.value}`}
            >
              <span className="ct-act-icon">{a.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="ct-act-label">{a.label}</span>
                <span className="ct-act-value">{a.value}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
