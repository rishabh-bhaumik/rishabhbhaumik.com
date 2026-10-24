import Image from "next/image";
import "@/components/bk/anek.css";

// First-draft build of the Figma case-study page (Peetal DSL, node 8627:5701),
// section by section. Colours and sizes are the Figma values, so the route is
// dark-only (DARK_ONLY_ROUTES in lib/theme-script.ts).

const CAPTION =
  "From Left: BimaKavach Homepage as on March 2023, BimaKavach Homepage as of October 2025";

/** One welcome line per script, set in the matching Anek face (zigzag alignment, as designed). */
const SCRIPT_LINES: { text: string; lang: string; font: string; right?: boolean; small?: boolean }[] = [
  { text: "Welcome, Emerging India!", lang: "en", font: "Anek Latin", right: true },
  { text: "স্বাগতম, উদীয়মান ভারত!", lang: "bn", font: "Anek Bangla" },
  { text: "उभरते भारत का स्वागत है!", lang: "hi", font: "Anek Devanagari", right: true },
  { text: "સ્વાગત છે, ઉભરતા ભારત!", lang: "gu", font: "Anek Gujarati" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ, ਉੱਭਰ ਰਹੇ ਭਾਰਤ!", lang: "pa", font: "Anek Gurmukhi", right: true },
  { text: "ಉದಯೋನ್ಮುಖ ಭಾರತಕ್ಕೆ ಸ್ವಾಗತ!", lang: "kn", font: "Anek Kannada" },
  { text: "സ്വാഗതം, വളർന്നുവരുന്ന ഇന്ത്യ!", lang: "ml", font: "Anek Malayalam", right: true },
  { text: "ସ୍ୱାଗତ, ଉଦୀୟମାନ ଭାରତ!", lang: "or", font: "Anek Odia" },
  { text: "வருக, வளர்ந்து வரும் இந்தியா!", lang: "ta", font: "Anek Tamil", right: true },
  { text: "అభివృద్ధి చెందుతున్న భారతదేశానికి స్వాగతం!", lang: "te", font: "Anek Telugu", small: true },
];

const TOC_TOP = ["Context", "The Problem"];
const TOC_GROUPS: { title: string; items: string[] }[] = [
  { title: "Solutions", items: ["Typography", "Design Systems", "Forms & Modals for Discovery & Quote Generation"] },
  { title: "Interface Design", items: ["Home & Product Page"] },
  { title: "Flows", items: ["Checkout & Payment"] },
  { title: "Visual Design", items: ["Graphic Elements & Visual Motifs", "Implementation & Application Examples"] },
];

const ROW = "flex flex-col gap-6 px-6";
const CARD = "overflow-hidden rounded-[16px] border-[0.5px] border-[#4e5056]";
const BODY = "text-14 leading-[1.7] text-[#a7adb8]";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-[24px] border border-[#1c1c1c] bg-[#2c2c2c] px-3 py-[10px] text-12 leading-none text-[#a7adb8]">
      {children}
    </span>
  );
}

function SectionHead({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      <div className="flex flex-col gap-4">
        <Tag>{tag}</Tag>
        <h2 className="py-[2px] text-[36px] font-normal leading-none text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Caption() {
  return <p className="text-center text-12 leading-[1.5] text-[#bcbcbc]">{CAPTION}</p>;
}

export default function DraftContent() {
  return (
    <main className="flex w-full flex-col gap-20">
      {/* Cover + intro */}
      <section className="flex flex-col items-center gap-6 py-[60px]">
        <div className="relative h-[850px] w-full bg-[#1c1d1f]">
          <p className="absolute left-1/2 top-[calc(50%-10.5px)] -translate-x-1/2 whitespace-nowrap text-center text-12 leading-[normal] text-[#a3a3a3]">
            MEDIA INCOMING...
          </p>
        </div>
        <div className="flex w-full flex-col justify-between gap-6 px-6 lg:flex-row">
          <h1 className="text-[40px] font-normal leading-[1.3] text-white">For Your Consideration</h1>
          <p className={`${BODY} lg:w-[700px] lg:shrink-0`}>
            Hello World, I’m Rishabh - a Designer based out of Bengaluru, India. As a thespian &amp;
            film student who’s started his career in video editing &amp; creative direction, I have
            seen how the power of stories help shape experiences.
          </p>
        </div>
      </section>

      {/* Media + contents */}
      <section className="flex items-start px-6 py-[60px]">
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:gap-0">
          <div className={`relative aspect-[1100/640] min-w-0 flex-1 bg-[#1c1d1f] ${CARD}`}>
            <p className="absolute left-[calc(50%+0.5px)] top-[calc(50%-6.67px)] -translate-x-1/2 whitespace-nowrap text-center text-12 leading-[normal] text-[#8a8a8a]">
              MEDIA INCOMING
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-6 px-6 py-3 lg:w-[427px]">
            {TOC_TOP.map((t) => (
              <p key={t} className="text-24 leading-[normal] text-[#363636]">
                {t}
              </p>
            ))}
            {TOC_GROUPS.map((g) => (
              <div key={g.title} className="flex flex-col gap-3">
                <p className="text-24 leading-[normal] text-[#363636]">{g.title}</p>
                {g.items.map((i) => (
                  <p key={i} className="text-16 leading-[normal] text-[#807d73]">
                    {i}
                  </p>
                ))}
              </div>
            ))}
            <p className="text-24 leading-[normal] text-[#363636]">End</p>
          </div>
        </div>
      </section>

      {/* 001 */}
      <section className="px-6 py-4">
        <div className="flex flex-col justify-between gap-10 px-6 lg:flex-row">
          <div className="flex flex-col gap-4 lg:flex-1">
            <Tag>001</Tag>
            <h2 className="py-[2px] text-[36px] font-normal leading-none text-white">
              How did my story start?
            </h2>
          </div>
          <div className="flex flex-col gap-20 lg:w-[480px] lg:shrink-0">
            <div className="text-[24px] leading-[1.7] text-[#a7adb8]">
              <p>
                I was hired at <b className="font-normal text-white">BimaKavach</b> in{" "}
                <b className="font-normal text-white">2023</b> when the company was nascent, and was
                still a <b className="font-normal text-white">simple recommendation engine</b>.
              </p>
              <p className="mt-[1.7em]">
                Since then, the company has been able to{" "}
                <b className="font-normal text-white">display live quotes</b> enabling user-product
                discovery, and has recently{" "}
                <b className="font-normal text-white">enabled payments</b> for immediate online
                purchase, and has{" "}
                <b className="font-normal text-white">grown it’s user base to 4.7×*</b>
              </p>
            </div>
            <p className="text-12 leading-[1.5] text-[#a7adb8]">
              *from 800 during March 2023 to around 3,760 by October 2025.
            </p>
          </div>
        </div>
      </section>

      {/* 002 · The Pivot and the Problem */}
      <section className={ROW}>
        <SectionHead tag="002." title="The Pivot and the Problem">
          <div className={`${BODY} flex flex-col gap-[1.7em]`}>
            <p>
              I started off as a Senior Designer - and had to tackle challenges outside the
              Product’s Design -&nbsp; not only in the Visual Language and Branding of the company.
            </p>
            <p>
              This helped in pivoting BimaKavach from a Recommendation Engine for urban startups to
              an SME Focused Online Insurance Broking Firm.
            </p>
          </div>
        </SectionHead>
        <div className={CARD}>
          <Image
            src="/media/draft/pivot-card.png"
            alt="BimaKavach's mobile homepage in March 2023 (dark, violet) beside October 2025 (light, blue)"
            width={1464}
            height={802}
            sizes="(min-width: 1512px) 1464px, 100vw"
            className="block h-auto w-full"
          />
        </div>
        <Caption />
      </section>

      {/* 002 · Typography */}
      <section className={ROW}>
        <SectionHead tag="002." title="Solutions - Typography">
          <p className={BODY}>
            In order to cater to the multicultural hyperlocal nature of Tier 2 &amp; Tier 3
            Businesses, we started with Foundational Typography. We had decided that Anek Variable
            would be the typeface of choice. Anek is a contemporary, multi-script, open-source
            typeface family created by the Indian foundry Ek Type (in collaboration with Google).
            <br />
            It supports multiple Indian scripts (including Devanagari, Tamil, Bengali, etc.) as well
            as Latin, and it’s offered in a variable font format.
          </p>
        </SectionHead>
        <div className={`flex h-[850px] flex-col items-center justify-center bg-[#1c1d1f] ${CARD}`}>
          <div className="flex w-full flex-col gap-[33.791px] px-6 tracking-[-0.5199px] text-white">
            {SCRIPT_LINES.map((l) => (
              <p
                key={l.lang}
                lang={l.lang}
                className={`${l.small ? "text-[31.191px]" : "text-[34.657px]"} leading-[41.588px] ${
                  l.right ? "text-right" : ""
                }`}
                style={{
                  fontFamily: `"${l.font}"`,
                  fontVariationSettings: '"wdth" 100',
                  fontFeatureSettings: '"zero" 1, "kern" 0, "liga" 0, "dlig" 1',
                }}
              >
                {l.text}
              </p>
            ))}
          </div>
        </div>
        <Caption />
      </section>

      {/* 002 · Design Systems */}
      <section className={ROW}>
        <SectionHead tag="002." title="Solutions - Design Systems">
          <p className={BODY}>
            Scaling Anek to work for Disvovery, Conversation and Retention, we had quickly developed
            a modern Design System Library, aptly called Peetal. Peetal is built completely
            in-house, with whiffs of Blade and UX4G - taking cues from Blade’s Collaborative
            Structure and Usefulness to Developers, and UX4G’s scalability and simplicity.
          </p>
        </SectionHead>
        <div className={CARD}>
          <Image
            src="/media/draft/design-systems.png"
            alt="Peetal design system: colour scales, borders, buttons, elevation"
            width={1464}
            height={850}
            sizes="(min-width: 1512px) 1464px, 100vw"
            className="block h-auto w-full"
          />
        </div>
        <Caption />
      </section>

      {/* 002 · Forms & Modals */}
      <section className={ROW}>
        <SectionHead tag="002." title="Solutions - Forms & Modals for Discovery & Quote Generation">
          <p className={BODY}>
            Redesigning Forms &amp; Modals in order to boost discovery, expedite Quote Generation,
            and build intuitive journies towards Quote Generation was the next task.
          </p>
        </SectionHead>
        <div className={`flex h-[850px] flex-col items-center justify-end bg-white ${CARD}`}>
          <Image
            src="/media/draft/quote-form-phone.png"
            alt="BimaKavach's Get Quotes in a Few Steps form on an iPhone"
            width={449}
            height={720}
            className="block h-[720px] w-[448.73px] max-w-none"
          />
        </div>
        <Caption />
      </section>
    </main>
  );
}
