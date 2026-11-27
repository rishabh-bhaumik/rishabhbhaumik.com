# Writing guide

This guide is for anyone who writes copy for this portfolio: Rishabh, and any AI model asked to draft or edit text for the site. It was written mainly for the BimaNetra case study (/netra, the plain rewrite; the original copy is at /netra2), where the copy has to explain an AI agent without sounding like an AI wrote it. The voice to aim for is Shaun Tan's essay on designing Hebbia's autonomous agents for finance (link under Sources). That essay is plain and human. It starts from what its users needed, and it moves at a short film's tempo, a line or two and then the next frame. When this guide and a writing habit disagree, follow the guide.

Copy lives in the data files (`data/site.ts`, `data/bima-netra.ts`, `data/bima-netra-2.ts`), so most of what follows applies to strings in those files.

---

## Before you write

1. Read the whole copy file you are editing, plus the frame each line sits next to. A line that repeats what the frame already shows can go.
2. Know the one new fact each paragraph adds. If you can't name it, cut the paragraph.
3. Decide who acts in every sentence. "I" is Rishabh, "we" is the team (one designer, one PM, three engineers), and Netra and founders are the other two actors. An abstraction ("research", "the data", "the architecture") is never the subject.
4. Use the fixed names, the same on every line of a page.
   - BimaKavach is the insurance broker, the company.
   - BimaNetra™ is the product. Use it in the title and the opening, with the ™ once per page.
   - Netra is the agent, written as a character. In prose it is never "NetraBot", "the bot", "the AI", "the agent" or "the system". `NetraBot` is the code name only, and the little face on screen is Netra too, so they are one character.
   - Peetal is the design system Netra's screens are built from.
   - Founders are the people using it. Keep that word, and use "customers" only where the source counted customers, as the old funnel's drop-off figures did.
5. Find the source for every claim, quote and number before you write it down. No source means a "Placeholder." line (see Honesty).
6. Picture the reader as a design lead skimming many portfolios. They know design well and know little about Indian insurance, so explain D&O, MCA, IRDAI and underwriting authority in a clause the first time each appears.
7. Plan the tempo. Two to four short paragraphs between frames, one idea per paragraph.
8. Say the point aloud the way you would to a colleague, then write that sentence down. Polish comes after, and usually means cutting.
9. Keep the house rules. No em dashes or en dashes in visible copy (use " - " or commas, and sparingly), sentence case, no emoji, no exclamation marks.
10. Leave an existing "Placeholder." line alone unless you have the real material to replace it.

---

## Signs of AI slop

People use every one of these now and then, so a single hit proves little. Density gives a text away. Watch for the same move several times on a page, or three different moves in one paragraph. Rewrite any paragraph with more than two.

Examples in this section are invented unless they quote the Netra copy, which is marked "(Netra copy)". That includes every number, finding and quote in the Fix column. Treat them as illustrations. None of them is material for the site.

Start with the first pattern under Sentences. It is the one Rishabh hates most.

### Words

| Tell | Looks like | Fix |
|---|---|---|
| Classic AI vocabulary | "Let's delve into the intricate interplay between price and cover." "A testament to meticulous research." | Use the plain word, or nothing. "How price and cover affect each other." Swap "meticulous research" for what the research found. |
| The newer soft register | "Netra quietly handles the hard part." "A steady, dependable flow." "And that's okay." | Drop the adverb. "Quietly" is the worst of the set, since it makes a plain feature sound modestly profound. Cut reassurance lines like "And that's okay" and say what happens next. |
| Pitch-deck verbs | "We leverage AI to streamline underwriting and empower brokers." | Name the action and its effect. "Netra reads the company record and fills the Profile step." |
| Empty quality adjectives | "a seamless, robust, cutting-edge quoting experience"; "comprehensive insurance quotes" (Netra copy) | Delete them, or give the fact that would earn the word, such as "a quote from one company name". |
| Scenery nouns | "the evolving landscape of SME insurance", "in the realm of underwriting", "the founder's journey" | Name the thing. "The SME insurance market", "underwriting", "the three steps a founder goes through". |
| Puffed-up significance | "Trust plays a crucial role in insurance." "The launch marked a pivotal moment." "It stands as a defining chapter for the team." | Say what happened and let the reader judge. |
| Avoiding "is" and "has" | "The summary card serves as the founder's checkpoint." "Netra acts as a guide." "The form boasts six fields." | "The summary card is where the founder checks the answers." "The form has six fields." |
| Intensifiers | "truly seamless", "incredibly powerful", "deeply human", "super intuitive" (Netra copy) | Delete them. If something needs emphasis, give the number or the example. |
| Corporate nominalisations | "The implementation of the agent facilitated a reduction in manual effort." "Conduct an analysis of..." | Put the actor and the verb back. "Netra fills the Profile step, so the founder types less." |
| Abstract product nouns | "a quoting solution", "best-in-class capabilities", "a delightful experience", "robust infrastructure" | Describe the thing. "A form that fills itself from the company record." |
| Buzzword stacks | "agentic infrastructure solution" (Netra copy); "an AI-powered risk orchestration platform" | One noun and one plain modifier, then a sentence. "A quote agent. It looks your company up and fills in the form." |
| Hype metaphors and stock cliches | "a game-changer", "a paradigm shift", "our north star", "the secret sauce", "move the needle" | Replace the metaphor with the specific change it stands for. |
| Insight-speak | "valuable insights", "key takeaways", "a deep dive", "lessons learned", "best practices" | State the insight. "Founders didn't know their turnover band, so we stopped asking for it." |
| Brochure and try-hard language | "nestled", "rich heritage", "world-class", "a diverse array", "a bold reimagining", "pushing the boundaries of what's possible" | Facts and one precise detail. Let the reader decide it was bold. |
| Vague association verbs | "The design aligns with founder needs." "The tone resonates with MSMEs." "It speaks to..." | Say what happened and how you know. |
| Synonym cycling | Netra in one paragraph, then "the assistant", "our AI companion", "the bot" | Pick one name, define it once and keep it. On this site the names are fixed (Before you write, item 4). |
| Brand and trademark repetition | "BimaNetra™ is how... With BimaNetra™, businesses..." | Full name with ™ once per page, then "it" or Netra. |

#### Banned and suspect words

Banned. Rewrite on sight: delve, tapestry, testament, leverage, harness, unlock, unleash, empower, elevate, supercharge, revolutionize, reimagine, redefine, embark, utilize, seamless, cutting-edge, groundbreaking, ever-evolving, game-changer, paradigm shift, north star, secret sauce, best-in-class, world-class, nestled, synergy. The stock openers, signposts, connectors and wrap-ups ("In today's...", "It's worth noting", "Moreover", "In conclusion") are banned too, and listed with their fixes under Sentences and Structure.

Suspect. One is fine, three in a paragraph is a rewrite: intricate, interplay, meticulous, pivotal, crucial, vital, key (as an adjective), underscore, showcase, garner, bolster, vibrant, enduring, quietly, steady, dependable, practical, matters, multifaceted, prioritize, streamline, foster, navigate, enhance, optimize, robust, transformative, innovative, holistic, comprehensive, bespoke, nuanced, dynamic, intuitive, powerful, smart, landscape, realm, journey, ecosystem, space, solution, platform, capabilities, experience, insights, learnings, pain points, facilitate, user-centric, human-centred, data-driven, truly, incredibly, deeply, genuinely, highly, absolutely, profoundly, notably, importantly, ultimately, overall, agentic, AI-powered, next-gen, end-to-end, trust (as an abstract noun with no actor).

Suspect phrases, beyond the ones in the tables: "designed to help", "in a matter of minutes" (Netra copy), "at the heart of", "at its core", "when it comes to", "in the world of", "the power of".

### Sentences

#### The worst one: "it's not X, it's Y" and "X, not Y"

Search for it before anything else and treat every hit as a rewrite.

It hides in many shapes:

- "It's not a form, it's a conversation."
- "Speed, not features."
- "Not just faster, but fairer." / "Not only... but also..."
- "Less paperwork, more cover."
- "This was never about the UI. It was about trust."
- "We didn't design the form; we designed the form away." (chiasmus, the same move with the words swapped round)
- "...should be read as a service rather than a tool." / "...instead of a form."
- "Deterministic flows ask every business the same questions; an agentic flow asks only the ones that matter." (Netra copy, a semicolon contrast)
- "...changed how people thought about their insurance, not just how they viewed it." (Netra copy)
- "Most insurance forms ask every business the same questions. Netra asks only the ones that matter." (Netra copy, the "Most X do A, we do B" setup)
- "No forms. No waiting. Just answers." (negative listing, the same move spread over three sentences)

It reads as slop because it argues against a claim nobody made, so the real point arrives dressed as a discovery. Pangram's data puts "not just X but Y" at about three times the human rate, and The Atlantic found it has outlasted tells like "delve" as models changed. Readers now spot it on sight, and a page with several loses their trust.

To fix it, say Y on its own. "Netra asks only what the public record doesn't show." Keep X only when a real person believed it or a real version shipped it, and then say who and show what changed their mind. "Rather than" and "instead of" fall under the same rule. They are fine for a choice between two real options someone weighed, with the reason given, and suspect everywhere else.

#### Other sentence tells

| Tell | Looks like | Fix |
|---|---|---|
| Rule of three | "clear, fast and fair"; three bullets under every heading; "price risk, underwrite smartly, and surface gaps" (Netra copy) | Count what you have and use that number. One, two or four is fine. Drop the weakest item before you pad to three. |
| Dash overuse | "Netra [dash] patient, precise [dash] fills in the rest." Two or three per paragraph. | Most become commas, brackets or full stops. Swapping the dash for " - " keeps the same dramatic rhythm, so rewrite the sentence. |
| Colon reveals and label openers | "The result: quotes in minutes." "The answer was simple: ask less." "The Challenge: Designing trust into a system that guesses before it asks" (Netra copy); "Key insight: ..."; "The catch: ..." | Write the sentence, with a verb. "Quotes now take minutes." "Netra guesses before it asks, so founders need to see how it got each answer." |
| Fragment punchlines and taglines | "Simple. Fast. Human." "Smart Underwriting, engineered." (Netra copy) "Insurance, simplified." | Replace with the claim and its proof, or delete. Taglines can stay inside product screenshots. |
| Self-answered question | "So what did founders want? Speed." "The result? A quote in 90 seconds." "Why does this matter? Because..." | Lead with the answer. |
| Announcers and signposts | "Here's the thing:", "Here's why it matters.", "Let's dive in.", "Let's break it down.", "It's worth noting that...", "It's important to note...", "Importantly,", "In this case study, I'll walk you through..." | Delete the setup. The next sentence stands on its own. In place of "why it matters", give the consequence itself. |
| Staccato drumroll | "We shipped it. It broke. We listened. We fixed it." | Join the events with the real connective (because, so, until) and vary sentence length on purpose. |
| Poster closers | "Clarity beats Options." "Trust is in the details." (both Netra copy) "The best form is no form." | End on the concrete fact, the number or the open question. Or stop after the last real point. |
| Parallel structure overuse | "We listened to founders. We shadowed underwriters. We mapped every field." Every bullet opening with a gerund. | Let items differ in shape and length. Merge two and expand the one that carries the story. |
| Restating | "Most founders quit at the form. In other words, the form was losing people." "Put simply," "This means that..." | Keep the sharper sentence and delete the other. |
| False range | "from bakeries to biotech", "from first click to signed policy", "From chaos to clarity" | Name the actual cases. For an arc, describe the before and the after concretely. |
| "Whether you're A or B" | "Whether you're a founder or a CFO, Netra meets you where you are." | Name who it was built for and what changes for them. |
| The -ing tack-on | "..., ensuring a smooth handoff." "..., highlighting the need for trust." "..., paving the way for..." The same move as its own sentence ("This ensures...") or up front ("Recognising that founders were leaving, we..."). | End at the fact. If the interpretation is real, give it a sentence of its own with a subject and evidence. |
| Agentless passive | "A decision was made to drop the PDF upload." "Feedback was incorporated." | Name who acted. In a case study the hidden actor is usually you, and you are what the reader came to judge. |
| Inanimate agency | "Research shaped the architecture." (Netra copy) "The data told a clear story." | Put a person back. "I mapped every route a business could take from one company name." |
| Stacked hedges | "This may potentially help reduce drop-off to some extent." | One hedge where the doubt is real, with its reason ("we only tested with eight founders"). Otherwise state the claim. |
| Wh-cleft delays | "What we found was that founders skip..." "What makes this hard is..." | "Founders skip..." / "This is hard because..." |
| Essay connectors | Sentence after sentence opening with Moreover, Furthermore, Additionally, Crucially, Thus. | Moreover, Furthermore and Additionally are banned. Cut most of the others. Where the logic needs a link, "and", "but" or "so" says which link it is. |
| Scene-setting openers | "In today's fast-paced digital world...", "In an era where AI is reshaping everything...", "Imagine you run a small bakery..." | Open on the real problem or a real moment from the research. |

### Structure and format

| Tell | Looks like | Fix |
|---|---|---|
| Bold lead-in on every bullet | Each bullet starts with a bold label ("Speed", "Trust", "Scale") and repeats it in the sentence. Bold phrases scattered through paragraphs. | Delete the labels and reread. If the bullets still make sense, the labels were noise. Bold one thing per screen at most. |
| Bullets where prose belongs | "Key insights: brokers re-type data / forms are long / trust is low", when the finding was that brokers re-type data because they doubt the prefill. | Bullets drop "because", "so" and "but", and those words carry the thinking. Keep bullets for steps, specs and inventories. Write reasoning as sentences. |
| A heading on every short section | "The Challenge" over two sentences, "Our Approach" over two more, "The Outcome". | Give a section a heading only if a reader would jump straight to it. Merge thin sections. |
| Slogan, template and Title Case headings | "From Friction To Flow", "Where Data Meets Empathy", "Key Takeaways", "Why This Matters", "The Road Ahead" | Sentence case, and name the content. "Why founders left at the form." A question the section answers also works. |
| Symmetric paragraphs and sections | Every paragraph three or four sentences of the same length. Every section runs setup, insight, kicker. | Let length follow content. A one-line paragraph when one line is enough, a long one when explaining how something works. |
| Identical takeaway cards | Three cards, each an icon, a two-word title and one line: "Clarity / Users always know where they are". | Each card has to say something only this project could say. If it could sit in any case study, replace it with one concrete finding. |
| Recap and "despite challenges" endings | "In conclusion, thoughtful design can transform complex processes." "Ultimately, it's about trust." "At the end of the day..." "While challenges remain, the future is bright." A "Learnings" list of "Collaboration is key". | End on the last real thing: what shipped, the open question, or one thing you would do differently. Cut any lesson that would fit every project. |
| Exposition up front | Three paragraphs of company history and market size before the reader learns what you did. | Open on the problem, as a moment or one sentence about what you made. Give context one fact at a time, when the next frame needs it. |
| Emoji and exclamation marks | A rocket emoji before "The Launch". "And it worked!" | Remove them. If a sentence falls flat without its "!", rewrite the sentence. |
| Chatbot residue and template leftovers | "Certainly! Here's a breakdown...", "I hope this helps!", "As of my last update...", "[Company Name]", "2025-XX-XX", "example.com", Markdown asterisks or "##" left inside a plain string | Delete them, then search for leftover slots and brackets. |
| Arrows and symbols as grammar | "Research → insight → design", "Founders ↔ insurers", "✓ Faster ✓ Clearer" in running text | Write the verb the arrow stands for. "&" can stay in short labels. |

### Content and claims

| Tell | Looks like | Fix |
|---|---|---|
| Claims with no source | "Founders loved the new flow." "Research shows people abandon long forms." "Experts agree..." "Many founders told us" (when two did). | Say who, how many and in what setting. "Five of the nine founders we interviewed..." If you don't have it, write a "Placeholder." line. |
| Effort numbers posing as outcomes | "120+ screens designed", "200 hours in Figma", "6 months, 40 interviews, 3 workshops" | Report what changed for someone. Effort figures can stay as texture ("139 commits" is a good human detail on /netra2), and the result still has to be an outcome. |
| Stat piles | "40% faster, 3x conversion, 98% satisfaction" in one line, with no baseline or period. | One or two numbers, each with its baseline, period and how it was measured. Say what probably caused it. |
| Superlatives and firsts | "India's first agentic infrastructure solution" (Netra copy), "world-class", "..., marking a paradigm shift for the industry." | Delete the adjective and keep the fact. A "first" needs someone outside the project saying so. |
| Generic stakes | "Insurance is complex. But it doesn't have to be." "A 200 year old problem" (Netra copy). | Stakes specific to this project: who loses what, and when. "20% of customers left at the proposal form." |
| The frictionless story | Research leads to insight, insight to solution, solution to success, with no dead ends. "After testing, users found it intuitive." | Include something you tried that failed, what showed it was wrong and what you changed, if it really happened. Name one trade-off and its cost. |
| No people, roles or places | "I worked closely with stakeholders and the wider team." | Name roles and settings: "the PM", "an underwriter at one of BimaKavach's insurer partners", "a founder in Pune". |
| Vague "users" | "Users wanted a simpler experience." "Users found the flow confusing." | Describe what people did. "Four of six founders opened a second tab to look up their CIN." What people do is better evidence than what they say. |
| Business value with no human | "This reduced operational overhead and unlocked new revenue streams." | Pair each business result with the person whose day changed. |
| Over-explaining the obvious | "Typography is important because it helps users read content." | Cut anything a design lead already knows. Spend the words on the decision that wasn't obvious. |
| Fails the swap test | "a seamless, intuitive experience", "aligned key stakeholders", "enhanced engagement" | If the sentence could appear unchanged in someone else's case study, replace it with what only this project did. |

### Case-study tells

| Tell | Looks like | Fix |
|---|---|---|
| The bootcamp template | Headings that are exactly Overview, Problem, Research, Solution, Impact, Learnings, all the same weight, Impact as three big numbers. | Build the piece around the real turns: the question, the wrong first answer, what changed your mind, what shipped. Take headings from the content. |
| "I was tasked with" | "I was tasked with redesigning the quote flow to improve conversion." | Open with what you found or decided. The /netra2 marquee already carries role, timeline, team and tools, so the prose doesn't need to repeat them. |
| Process theatre | "Leveraging design thinking and a double diamond approach, we empathized, defined, ideated, prototyped and tested." | Show one artefact that changed a decision (the whiteboard frame on /netra2 is one) and say what it changed. Name a method only when the method itself was unusual. |
| Resume voice | "Owned end-to-end product design, from research through handoff, partnering closely with engineering and PM." (Netra copy) "Spearheaded", "Drove a 30% uplift". | Replace each verb with the actual act. "On a whiteboard I drew the six routes a business could take from one company name." |
| Voice switching | "I ran the interviews. We decided to cut the risk page. The company launched in March. The team believes..." | Use "I" and "we" as rule 15 below sets out, and the company's name for company-level facts. |
| Stock personas and invented quotes | "Meet Arjun, 38, a busy small-business owner who values efficiency." "I just want it to work!" | Real verbatim quotes, anonymised, with where they came from. Or no persona at all. Use one real quote, messy as it is. |
| Captions that describe the picture | "The dashboard displays key metrics at a glance." | A caption names what plays or the decision behind it. Alt text has a different job. It describes the image for someone who can't see it, and it should never argue a thesis. |
| The magic AI | "Netra understands intent and delivers personalised quotes instantly." No wrong answers, no handoff, no limits. | Show Netra getting things wrong and what the design does then. Netra's three cases (it finds the company, makes a best guess or finds nothing) already tell this story. Add when it asks the founder, or anything it won't guess, only if the product really does it. |
| Design credos | "I believe good design is invisible." "Design is about solving problems, not decorating them." "As designers, we..." | Cut them. Show a decision you made and let the reader work out what you believe. |

---

## Write like the Hebbia essay

What follows describes what the essay does and turns each move into a rule for the Netra case study. It paraphrases the essay throughout. Example lines use facts already in the project (`data/bima-netra.ts`, `data/bima-netra-2.ts`). Anything in [square brackets] is a slot for a real detail still to be confirmed. Brackets are for drafting only. In a data file, a slot nobody can fill yet becomes a "Placeholder." line (see Honesty), and an unfilled bracket never ships. The names are fixed as in Before you write, item 4.

### 1. Open on a real question, then earn the ambition

The essay: its subtitle asks a question the reader half has already. The opening then moves through the wave of agents arriving, why finance needs them more than most fields, and why Hebbia is already trusted with the data. It ends on one line about where the product's core is heading, toward people reviewing and steering the agent's work.

Why it works: a question makes the reader take part. Problem, then the right player, then the future gives the reader a reason to believe the ambition before seeing a screen. The last line reaches a little past the evidence. That is allowed once, at the top, and it lets the reader picture what comes next.

For Netra: ask the question a founder or a design lead would ask about forms and agents. Then the problem (a founder describes their own company line by line before anyone names a price), why BimaKavach (an IRDAI-regulated broker that knows which answers insurers price on [verify]), and why now (an agent can read the public record faster than a founder can type). End on the one forward-looking line, written as Rishabh's view.

Example:

> What happens to an insurance form when an agent can read about your company faster than you can type?
>
> Business insurance in India still starts with a proposal form. A founder describes their own company, line by line, before an insurer will name a price. At BimaKavach, one in five customers left at that form.
>
> BimaKavach already sits between [how many, verify] businesses and the insurers who price them. We know which answers matter to an insurer [verify], and [how many, verify] of them are on the public record.
>
> So the form is turning into something a founder reads and checks.

### 2. Lead with what founders needed and let the business follow

The essay: its first real section opens on a question about how people wanted to work. The business case sits in the stakes of the domain and in what the design makes possible, and the essay leaves the reader to see it.

Why it works: it reads as a designer thinking. The business goals stay in view because a good answer for users is also a good answer for the business, and the reader makes that link without being told.

For Netra: open the build story on a founder question. Did they want to answer questions at all, or would they rather Netra went and looked? Let lead generation, drop-off and underwriting appear as results, one clause each. A sentence like "The business goal was to increase lead generation by X%" never opens a section.

Example:

> First I wanted to know whether founders wanted to answer questions at all, or would rather Netra went and looked. [What we found, and how.] Every question we didn't ask was one less place to leave.

The last sentence carries the drop-off problem without the word "conversion".

### 3. Behaviour first, then one quote, then the call

The essay: a research finding says what people did or leaned toward. The next sentence spells out what that means for the product. Then comes one quote from someone senior, given a role and no name. The designer's decisions follow straight after.

Why it works: behaviour is hard to argue with. One quote reads as a witness, where five read as a survey dump. With the decision placed right after the quote, the reader feels the user made the call.

For Netra: founders did X, here is what that means for Netra, one real quote with its source, then "So I..." or "So we...". The old funnel already has two real review lines to work with.

Example:

> 20% of customers left the old journey at the proposal form. One review said "this form is long and complicated". (a customer review [source, verify])
>
> So Netra fills everything the public record can answer, and asks the founder only what it can't find.

### 4. Tie every iteration to what founders expected

The essay: whenever it shows explorations, the reason is something users expected. The design work is the search for the best way to meet that expectation while keeping something else intact.

Why it works: iterations shown for their own sake look like process theatre. Tied to an expectation, they show judgement. The second half of the sentence names the tension, the thing the design had to protect.

For Netra: give every set of variants one sentence of the form "founders expected [X], so I tried [N] ways of [Y] while keeping [Z]". The brief already names one tension, that Netra has to show its working while it searches.

Example:

> Founders [in testing, verify] wanted to see what Netra was doing while it searched. I tried [N] ways of showing the search as it happened, and the hard part was keeping the form readable while it filled.

### 5. Describe a set plainly

The essay: when it introduces a family of prebuilt agents, it says who they were built with (in-house domain experts), then lists the names with no adjectives or descriptions and leaves the video to show what each one does.

Why it works: plain names read as confident and are easy to scan. Saying who it was built with borrows their expertise without a paragraph of justification.

For Netra: use it for Netra's three cases, the three steps it fills, or the Peetal pieces it's built from. One line of who or why, then the list, then the frame. No sentence under each item. An item that needs explaining gets its own section.

Example:

> Netra fills the quote in three steps: Profile, Business, Risk.

Or, if the source is real:

> One company name sends a business down one of three paths, mapped with [who, verify]: verified, best guess, not found.

### 6. Write the agent as a character

The essay: it gives its agent a name and a fond aside the first time it appears. After that the name does the verbs. Max takes on more of the work, and people do a task with Max before turning that chat into an agent. The company and product names stay in the background.

Why it works: a named character is easier to follow than "the system". The reader pictures someone doing the work, which is the point of an agent, and the case study gains a protagonist.

For Netra: introduce Netra once with one human line, then make Netra the subject. Netra looks the company up, guesses, asks and fills in. Keep BimaNetra™ for the product.

Example:

> Netra looks the company up first and hands the founder its answers to check.

First mention, if it matches how Netra behaves in the product [verify]: "Netra, our agent, keeps an eye on your cursor while it works."

### 7. One brand moment, named once

The essay: it is about function, and it allows exactly one moment about feeling, the point where an ordinary chat turns into a specialist. It calls that a brand moment in one sentence and moves on.

Why it works: naming it shows the designer knows the difference between need and delight, which makes the delight easy to trust, and doing it only once keeps it special.

For Netra: pick one, at a point where something changes. The strongest candidate is the moment Netra hands the founder the quote form, which arrives through Netra's orange Bayer dither with the Profile step already filled in (the quote scene on /netra2).

Example:

> Netra handing over the filled form felt like the right place for a brand moment. The form arrives through Netra's orange dither with the Profile step already filled in. [verify this ships in the product]

### 8. The constraint story, only if it happened

The essay: midway through, it turns into a short thriller about a problem nobody asked for, keeping an expensive animated agent running on customers' locked-down work machines. The beats go roughly like this:

1. The ambitious first version, and what it cost.
2. The real environment that broke it.
3. The stopgap that kept user testing going.
4. The moment they nearly cut it.
5. A second approach that also fell short.
6. A plain, older technique that worked.
7. The proof.

The section heading shrugs at the problem.

Why it works: each compromise raises the stakes, and the near-cut tells the reader that taste was at risk. The answer is humble, so it feels obvious in hindsight, and it shows a designer who can build.

For Netra: use this only for a story that really happened. Candidates to check against the record: [the MCA lookup too slow to show its working live], [Netra's face or the dither on low-end Android phones], [fuzzy matches landing on the wrong company]. One or two sentences per beat. Name the real stopgap even if it's embarrassing (a static screenshot, a fake loader, a hardcoded company), name the attempt that failed, and keep the answer to one sentence.

Example (the shape only, every bracket must be true):

> The first version of Netra waited for the whole [MCA] record before showing anything. On [a founder's phone on 4G], that was [N] seconds of nothing.
>
> We put in a [static loader] so testing could go on, and for a while we seriously talked about cutting the live search.
>
> I tried [first fix], and [why it failed].
>
> Then [the simple answer, for example showing each field the moment it comes back].

If the build went smoothly, skip the section. A made-up near-cut is worse than none.

### 9. Field notes: show the loop

The essay: in a couple of sentences it explains how the new version was brought level with the reference, a compare-and-fix loop run round after round, covering shape, light and motion.

Why it works: it shows how quality was reached. Taste becomes a method another designer could repeat.

For Netra: describe the loop you ran. The coded prototype on Peetal with each screen traced back to its Figma frame, and every case audited against Nielsen's heuristics before handoff, are both in the copy already. Say what was compared against what and what each round fixed.

Example:

> We traced every screen of the coded prototype back to its Figma frame, then audited each of Netra's three cases against Nielsen's heuristics before handoff. [What each round fixed, verify.]

### 10. Few numbers, each one earned

The essay: one block of results, placed right after the story that produced them. Each line proves one claim the story made. Almost no numbers appear anywhere else.

Why it works: numbers after a struggle feel like a payoff, and numbers in a header feel like a pitch. Each stat answers a doubt the story raised.

For Netra: four stats at most, each placed after the section it proves. The impact block has four ($30M direct underwriting authority, 50% more lead generation, 67% less form filling at checkout, 2 new insurers onboarded). Each needs a baseline or a "per what", a period, and a cause in the sentence before it. Explain "direct underwriting authority" in a clause. Cut any number you can't source.

Example:

> Netra fills answers from the public record, so founders fill in [67%, verify baseline and period] less of the form at checkout.

### 11. Pulling it together, as the founders' request

The essay: the last build section opens on a research signal. People didn't want one more thing to watch. They wanted to hear when something needed them and to look at the rest in their own time. Only after that does the designer assemble the system of parts, so it reads as an answer to that request.

Why it works: "I built a system" on its own can read as scope creep. Opening on the request shows the system answers something people asked for.

For Netra: start with the founder signal, then the assembly. The pieces are one timeline across risk profiling, quote and policy (from the third takeaway, still a Placeholder line), the three cases, the chat and the risk score (both still placeholder frames in the gallery).

Example:

> [What founders asked for, with its source.] So I brought profiling, the quote and the policy onto one timeline.

### 12. Close on a personal turn and a view of the field

The essay: two short closing paragraphs. The first says what the project changed in how the designer thinks. The second says plainly what that means for designers in general and where the work is going.

Why it works: the personal note earns the right to the big claim, and the big claim gives the reader something to take away, so the essay ends by looking at where the field is going.

For Netra: first, what building Netra changed about how Rishabh sees forms, guessing or trust. Then, what a designer's job becomes when agents do the filling, and why insurance raises the stakes. Both are opinions, so write them as Rishabh's.

Example:

> Building Netra changed how I think about forms. Most of the design work ended up in the moment a founder reads the answers Netra filled in for them and decides whether to believe them. [Rishabh's view, confirm]
>
> As agents do more of the filling, I think a designer's job is to make their guesses easy to check and easy to fix. In insurance a wrong answer can follow a business all the way to a claim, so that is most of the job.

### 13. Tempo: cut it like a short film

The essay moves like a cut sequence. Its paragraphs run one to three sentences with one idea each, and a media frame comes every few paragraphs with a short caption saying what plays. Background arrives only when the next frame needs it, and there are almost no callouts.

Why it works: the reader moves at a trailer's pace, shot then line then shot. Nothing reads as padding, so every line feels chosen.

For Netra:

- One idea per paragraph. If a paragraph says "and also", split it.
- A frame after every two to four paragraphs.
- Captions as short phrases naming what plays: "Netra finding Pepe Jeans from four letters", "Netra filling the Risk step", "Three cases from one company name".
- Jargon (D&O, MCA, underwriting authority) gets one explaining clause the first time it appears.
- No pull quotes or "key insight" boxes beyond one research quote per section.
- Read it aloud. If you run out of breath, cut.

### 14. Headings: plain, or lightly playful

The essay: most headings are plain labels. One or two carry a light twist that sums up the section, and the most playful one sits on the most surprising section.

Why it works: plain headings help people skim. One playful heading at the turning point shows personality without making the reader decode it.

For Netra: mostly plain ("Context", "Research", "Three cases", "Putting it together", "Impact"). One or two lightly playful ("Nobody fills a form", "Show your working", "One name, three answers"). Avoid puns on "Bima", hype words, and headings that only make sense after reading the section.

### 15. "I" for your calls, "we" for the team's work

The essay: the designer says "I" for questions explored, ideas pitched and things built alone, and "we" for research done with others, partnerships, team decisions and fallbacks.

Why it works: the reader knows exactly what the designer owns, which makes the claims believable, and the "we" keeps it from turning into a solo hero story.

For Netra: the team was one designer, one PM and three engineers. The copy already says "we" for the 60-day build, the 139 commits, cutting the questions from twelve to ten and the Nielsen audit, and /netra says "I" for the research, the flows and screens, and drawing the six routes on the whiteboard. The coded prototype is "we" in both pages' execution copy and "I" in /netra's My Role row, so settle which is true [verify] and use it everywhere.

Example:

> We cut the questions from twelve to ten.
>
> Placeholder. Which two went, who chose them and why.

### How the beats map onto the page

| Essay beat | Netra section (`data/bima-netra.ts`) | Rules |
|---|---|---|
| Question, problem, why BimaKavach now, the forward line | `title`, `intro`, `overview` | 1, 6 |
| The first founder question | `context`, `brief` | 2 |
| Research, one quote, the call | `context.media` (the review lines), `brief`, `thesis` frames | 3 |
| Iterations from expectations | `thesis` (sketches) | 4 |
| Three cases, listed plainly | `execution` | 5 |
| Netra on stage, and the brand moment | `execution.media` (quote scene) | 6, 7 |
| Constraint story, then field notes | a new section after `execution`, only if real | 8, 9 |
| Putting it together | `showcase`, `gallery` | 11 |
| Results | `impact` | 10 |
| Reflection and a view of the field | `takeaways`, closing | 12 |

---

## Netra copy audit

An audit of `data/bima-netra.ts` (/netra2) and `data/bima-netra-2.ts` (/netra), November 2026. Line numbers will drift, so search for the quoted text. /netra inherits the tags, marquee, splash, context alt, thesis alts and execution media from /netra2, so fixing those lines in /netra2 fixes both pages. Placeholder media labels were skipped. The /netra title, "Designing an AI Agent for Business Insurance Quotes", is plain and is the title Rishabh chose, so it stays, Title Case included.

### /netra2

| Where | Now | Rewrite |
|---|---|---|
| `title`, line 30 | "BimaNetra™: India's first agentic infrastructure solution / for a 200 year old problem" | Use the /netra title. |
| `intro`, line 31 | "BimaNetra™ is how BimaKavach can price risk, underwrite smartly, and surface gaps in their business." | "With BimaNetra™, a founder types their company's name. Netra looks the business up in public records and asks only what the records don't show." |
| `overview.lead`, line 51 | "Smart Underwriting, engineered. profiling, quote generation, and checkout, in a matter of minutes" | "A founder types the company's name and reaches real quotes in minutes." |
| `overview.body`, lines 53 to 55 | "...generate comprehensive insurance quotes without filling forms. I had two jobs here: revisit the existing checkout flow post rebranding to investigate lead generation and drop-offs, and create the new probabilistic based journey super intuitive for first-time users." | "After the rebrand I had two jobs. I looked at the old checkout to find where and why people left. Then I designed the new flow, where Netra guesses before it asks, so a first-time founder could follow it." |
| `context.media.alt`, line 63 | Ends "Core thesis: deterministic flows ask every business the same questions; an agentic flow asks only the ones that matter, and does the rest for them. Probabilistic models can also infer..." | Alt text describes, so end it after the drop-offs. Also match the review's casing: "i dont know what to pick". Put any thesis in the body copy. |
| `context.rows` Overview, line 70 | "...an IRDAI-regulated insurance broker designed to help startups, micro, small, and medium enterprises (MSMEs), and growing businesses understand, compare, purchase, and manage business insurance." | "BimaKavach is an IRDAI-regulated insurance broker. Startups and MSMEs use it to buy and manage business insurance." |
| `context.rows` My Role, line 74 | "Product Designer. Owned end-to-end product design, from research through handoff, partnering closely with engineering and PM." | "I was the only designer, working with one PM and three engineers from research to handoff." |
| `brief.challenge`, line 87 (and /netra line 48) | "The Challenge: Designing trust into a system that guesses before it asks" | "Netra guesses before it asks, so founders need to see how it got each answer." |
| `brief.constraint`, line 89 | One 44-word sentence with a list of three inside a bracket inside another list of three. | "It had to work whether Netra found the company, made a best guess or found nothing, and show its working while it searched. We built it from Peetal in the new identity so three engineers could ship it in 60 days." |
| `thesis[0].alt`, line 98 | "...the product page, eleven questions, the quote page..." | Fact check against "twelve to ten". If the board shows eleven, say it was an earlier count. If not, correct it. |
| `thesis[1].alt`, line 104 | "...the agent fails, gets a fuzzy match or passes, then fills or validates..." | "A whiteboard of six routes from one company name. Netra finds nothing, finds a close match or finds the company, then fills in the answers or validates them, shows a modal with or without a nudge, and reaches the quote. The last route's quote is pre-underwritten." |
| `execution.body`, line 113 | "Research shaped the architecture: one company name routes a business into three cases, verified, guessed or not found." | "I mapped every route a business could take from one company name, and they came down to three cases: verified, guessed or not found." |
| `execution.body`, line 114 | "...tracing each screen to Figma." | "...and kept every screen matched to its Figma frame." Keep "139 commits". |
| `takeaways` titles, lines 134, 138, 142 | "Clarity beats Options" / "Trust is in the details" / "Risk the Business. Insurance comes later" | "Ask fewer questions" / "Show Netra working" / "Start from the business's risk" |
| `takeaways[0].body`, line 135 | "Progressive disclosure outperformed a packed dashboard. Showing less up front made people act with more confidence." | "We cut the questions from twelve to ten. Placeholder. What changed after, as a number or a tester's words." |
| `takeaways[1].body`, line 139 | "Micro-interactions around input, AI built UI calls, and balance in what we offer did more for perceived trust than any marketing copy." | "Netra fills in each answer while the founder watches, so they can check it before they confirm. Placeholder. How you know this helped." |
| `takeaways[2].body`, line 143 | "...changed how people thought about their insurance, not just how they viewed it." | "Placeholder. Risk profiling, quotes and policy issuance sit on one timeline. Say what people did differently because of it." |
| `impact.stats`, lines 162 to 165 | "$ 30M." / "Increase in", "Lead Generation" / "Less Form filing", "during Checkout" | "$30M" with "increase in direct underwriting authority", "50%" with "more leads", "67%" with "less form filling at checkout", sentence case throughout. Fix the stray space, the stray full stop and the typo "filing", and add the period each figure covers. |

### /netra

| Where | Now | Rewrite |
|---|---|---|
| `intro`, line 14 | "BimaNetra™ looks the company up in public records and only asks what it can't find." | The agent is acting, so "Netra looks the company up in public records and asks only what it can't find." |
| `overview`, lines 18 and 22 | "...I wanted to know why." then "I had two questions. Why were customers leaving the old checkout, and could a business get a real quote without filling a form?" | Lead: "20% of customers left at our proposal form, and 35% left at the quote page." Body: "After the rebrand I set out to learn why, and to test whether a founder could get a real quote by typing one name." |
| line 46 | "In reviews, customers said the form was too long and they didn't know which quote to pick." | Quote them: "In reviews, customers wrote ‘this form is long and complicated’ and ‘i dont know what to pick’." |
| line 47 | "So we decided to look the business up in public records first, and only ask the founder what the records don't show." | The same idea is already in the intro and the closing. "So we decided to start from the public record." |
| line 57 | "I drew every route a business could take from one company name on a whiteboard. There were six, and they came down to three cases..." | "On a whiteboard I drew every route a business could take from one company name. There were six, and they fell into the three cases above." |
| line 61 | "We built a coded prototype with Peetal's components and checked every case against Nielsen's heuristics before handoff." | "In 60 days and 139 commits we built a coded prototype with Peetal's components, and checked every case against Nielsen's heuristics before handoff." |
| lines 71, 75, 79 | Three takeaway bodies in the same shape, each claiming a result with no evidence. | Start each from something that shipped and mark the gap. Line 75: "Netra fills in each field while the founder watches. Placeholder. What testers said or did." |
| lines 87 and 88 | "$ 30M." / "More", "Leads" | Same fixes as /netra2's impact block. |
| closing, line 95 | "Most insurance forms ask every business the same questions. Netra asks only the ones that matter and works out the rest..." | A "Most X... Netra..." contrast and the fourth telling of the main idea. "The next question is what Netra could do with more data, such as suggesting the cover a business is likely to need." |

Smaller fixes on both pages: the ™ once per page; "the agent" in prose becomes Netra; consistent casing in the marquee ("1 designer, 1 PM, 3 engineers", "Figma, FigJam, Claude Cowork, Claude Code"); lowercase "60 days" and "on web" in the timeline row.

### The top patterns

1. Superlatives and buzzwords with no proof. "India's first agentic infrastructure solution", "Smart Underwriting, engineered", "comprehensive", "super intuitive", "underwrite smartly". Replace each with what a founder does, which is type one name and get quotes in minutes. /netra has mostly fixed this.
2. Results with no evidence. Every takeaway body claims confidence or trust went up, and the impact stats have no baseline or period. Keep the facts on record (twelve to ten questions, 139 commits, the Nielsen audit, the 20% and 35% drop-offs) and mark everything else "Placeholder.".
3. Abstract nouns doing the work. "Designing trust into a system", "Research shaped the architecture", "perceived trust", "balance in what we offer", "surface gaps". Make a person or Netra the subject, with a concrete verb. The trust line is still on both pages.
4. Formula shapes. Triplets everywhere, slogan titles, contrast frames (the line 63 semicolon, "not just how they viewed it", the "Most forms... Netra..." closing) and kicker endings ("I wanted to know why.", "A quote should start with..."). State the point once, plainly, and stop.
5. Saying the same thing again, mostly on /netra. "Look it up in public records, ask only what's missing" appears in the intro, the brief and the closing, the three cases appear almost word for word twice, and the review quotes are paraphrased when they could be quoted. Give each section one new fact and use the customers' own words.

---

## Honesty

- Anonymous attribution is fine, and often better. Give a role and a setting, and leave out any name the person didn't agree to share: "founder of a D2C apparel brand, Bengaluru", "an underwriter at one of BimaKavach's insurer partners".
- Never invent research. That rules out made-up quotes, a "users said" stitched together from several people, a paraphrase placed inside quote marks, and numbers rounded up.
- Never invent numbers, stats, baselines or periods. A figure goes in only with a source Rishabh can point to.
- Never invent failures, near-cuts or constraint stories to make the narrative more dramatic. The essay's constraint story works because it happened.
- Sources that count: interview notes, usability session recordings, support tickets, sales call notes, app store or Google reviews, analytics. Put a pointer to the source beside each quote in the data file, as a code comment.
- Behaviour with no quote is fine. Write the behaviour and skip the quote. If you have neither, leave it out.
- If a story beat is missing, leave a visible line for Rishabh to fill. It starts with "Placeholder." and says what is needed, the way the takeaways already do:

  ```ts
  body: "We cut the questions from twelve to ten. Placeholder. What changed after, as a number or a tester's words.",
  ```

- An AI editing copy never replaces a "Placeholder." line with plausible text. It can sharpen the request inside the placeholder, nothing more.
- Opinions are allowed when they are written as opinions. The forward-looking line at the top and the view of the field at the end are Rishabh's, so they read as his.
- Check what's already on the page before building on it. The two review lines in the Context frame (`context.media`, "this form is long and complicated", "i dont know what to pick") need their source noted. The takeaways are marked Placeholder. The four impact stats need a baseline, a period and a source.

---

## Final pass

Run this before shipping any copy. Every hit is a candidate, and a person decides. The commands assume zsh or bash in the repo root; swap in the file you edited.

1. Dashes. Visible copy has none.

   ```sh
   grep -nE $'\xe2\x80\x94|\xe2\x80\x93' data/bima-netra.ts data/bima-netra-2.ts
   ```

2. Contrast frames, the top priority. Read every hit and rewrite any "not X, it's Y", "X, not Y", "not just", "rather than", "instead of", "never about", "less X, more Y" or "Most X... Netra..." line.

   ```sh
   grep -niE "\bnot\b|n't|rather than|instead of|never about|not just|not only|less .*, more " data/bima-netra.ts data/bima-netra-2.ts
   ```

3. Essay connectors, signposts and wrap-ups.

   ```sh
   grep -nE "Moreover|Furthermore|Additionally|Crucially|Importantly|Notably|Interestingly|Ultimately|In conclusion|In summary|Overall,|worth noting|important to note|Here's|Let's" data/bima-netra.ts data/bima-netra-2.ts
   ```

4. Banned and suspect words (extend the list from the Words section as needed).

   ```sh
   grep -niE "delve|testament|leverage|harness|unlock|empower|elevate|utili[sz]e|embark|redefin|groundbreaking|seamless|robust|cutting-edge|comprehensive|intuitive|smart|quietly|crucial|pivotal|landscape|journey|solution|platform|experience|insight|truly|deeply|super |agentic|first|heart of|when it comes" data/bima-netra.ts data/bima-netra-2.ts
   ```

5. Colons used as reveals or labels. Any colon followed by a capitalised payoff, a "The X:" opener, or a question answered in the next sentence.

   ```sh
   grep -nE "(The [A-Za-z]+|Key [a-z]+|Result|Answer|Catch|Challenge|Insight)[:?] " data/bima-netra.ts data/bima-netra-2.ts
   ```

6. Triplets. Look for "A, B, and C" and "A, B or C" lists, and cut each to the true number.

   ```sh
   grep -nE "[a-z]+, [a-z ]+,? (and|or) [a-z]+" data/bima-netra.ts data/bima-netra-2.ts
   ```

7. Trailing -ing clauses: ", ensuring", ", highlighting", ", making", ", paving", ", reflecting", ", showcasing".
8. "Serves as", "stands as", "acts as", "boasts", "aligns with", "resonates with".
9. Names. Netra is never "NetraBot", "the bot", "the AI" or "the agent" in prose, BimaNetra™ carries its ™ once, and "founders" stays "founders".
10. Numbers. Each has a source, a baseline and a period, or it is a "Placeholder.". No more than four on the page.
11. Brackets and slots. No "[", "TODO", "XX" or "verify" left in visible copy.
12. Repetition. The main idea is told once. Each section adds one new fact.
13. Title Case headings, exclamation marks, emoji, arrows in running text, bold labels on bullets.
14. Read it aloud at the short-film tempo. One idea per paragraph, two to four paragraphs per frame, and cut wherever you run out of breath.

---

## Sources

- Shaun Tan, "Designing Autonomous Agents for Finance" (Hebbia): https://x.com/shaunmtn/status/2125278178646348158
- Wikipedia, "Signs of AI writing" (WikiProject AI Cleanup): https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Pangram, "9 Signs of AI Writing, Backed by Data": https://www.pangram.com/signs-of-ai-writing
- Decrypt, "The 5 Biggest Tells That Something Was Written By AI": https://decrypt.co/348923/5-biggest-tells-something-written-ai
- Robots Ate My Homework, "The internet made a ban list for AI writing": https://robotsatemyhomework.substack.com/p/ai-writing-patterns
- AI Weekly, a summary of The Atlantic on the "It's not X, it's Y" tic: https://aiweekly.co/alerts/atlantic-ais-its-not-x-its-y-tic-proves-hardest-to-shake
