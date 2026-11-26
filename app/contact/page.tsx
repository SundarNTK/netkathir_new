import PageHero from "@/components/PageHero";
import { FlightStrip } from "@/components/Flight";
import ContactForm from "@/components/ContactForm";
import ContactCards from "@/components/ContactCards";
import { IMAGES } from "@/lib/data";

export const metadata = { title: "Contact Us — Netkathir Technologies" };

export default function Contact() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Let's Build Your Next Intelligent Solution."
        image={IMAGES.heroes.contact}
        room
      />
      <FlightStrip from="Your message" to="Our inbox" note="We reply within one working day." />
      <section className="pb-10 md:pb-14">
        <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 sm:px-6 md:gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-stretch lg:gap-10">
          <ContactForm />
          <ContactCards />
        </div>
      </section>
    </>
  );
}
