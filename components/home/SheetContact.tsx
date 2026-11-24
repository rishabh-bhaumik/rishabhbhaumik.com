import { HOME } from "@/data/site";
import ContactOrbit from "./ContactOrbit";
import { GreetingRoll } from "./Greeting";
import RollLink from "./RollLink";
import "./hello.css";

/**
 * The sheet's contact block (Figma 8780:36154): the orbit on the left (its still, played
 * on hover; ContactOrbit), "Say" with the hero's rolling greeting, and the email on the
 * right. Stacks on phones. The top of the footer it opens (SheetFooter) carries its top rule.
 */
export default function SheetContact() {
  return (
    <section aria-labelledby="contact" className="grid border-b border-rule md:grid-cols-2">
      <ContactOrbit />
      <div className="flex flex-col justify-center border-rule max-md:border-t md:border-l">
        <div className="flex flex-col px-4 pb-5 pt-7 sm:px-6">
          <p className="text-12 uppercase leading-[17.6px] tracking-[0.13em] text-subtle">Contact</p>
          <h2 id="contact" className="flex items-center gap-[13px] pt-5 text-36 leading-[1.3] tracking-[-0.015em] text-ink sm:text-48">
            Say
            {/* The hero's greeting roll: "Say নমস্কার", "Say Hello", "Say नमस्ते"… */}
            <span className="font-medium">
              <GreetingRoll />
            </span>
          </h2>
        </div>
        <RollLink
          label={HOME.email}
          href={`mailto:${HOME.email}`}
          icon="mail"
          className="flex h-[54px] items-center border-y border-rule px-4 text-12 uppercase leading-[1.2] tracking-[0.08em] text-ink transition-colors hover:text-faint sm:px-6"
        />
      </div>
    </section>
  );
}
