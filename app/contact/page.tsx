import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { IMAGES, SITE } from "@/lib/data";

export const metadata = { title: "Contact Us — Netkathir Technologies" };

export default function Contact() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Let's Build Your Next Intelligent Solution."
        image={IMAGES.heroes.contact}
      />
      <section className="pb-32">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.3fr_1fr] gap-12">
          <ContactForm />
          <aside data-reveal className="space-y-8">
            {SITE.offices.map((o) => (
              <div key={o.country} className="glass rounded-3xl p-7">
                <p className="font-mono text-xs uppercase tracking-widest text-ice mb-3">{o.country}</p>
                <p className="text-muted">{o.address}</p>
              </div>
            ))}
            <div className="glass rounded-3xl p-7 space-y-2">
              <a href={`mailto:${SITE.email}`} className="block text-lg hover:text-ice">{SITE.email}</a>
              {SITE.phones.map((p) => (
                <p key={p} className="text-muted">{p}</p>
              ))}
              <a href={SITE.whatsapp} className="inline-block mt-2 text-ice hover:underline">Chat on WhatsApp ↗</a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
