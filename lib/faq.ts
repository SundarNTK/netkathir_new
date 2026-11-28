// "Smart FAQ" chat: answers visitors from the site's own data (services, products, offices, contacts, blog posts)
// without any AI service. A question is normalised, scored against topics by keyword / phrase / typo-tolerant
// matching, and the best topic's answer is returned with buttons. Unknown questions get a hand-over to the team.
import { COUNTRIES, PRODUCTS, SERVICE_GROUPS, SITE } from "@/lib/data";

export type ChatAction = { label: string; href: string };
export type FaqReply = { reply: string; actions: ChatAction[]; topic: string };
export type FaqPost = { slug: string; title: string; tags: string[] };

const WHATSAPP: ChatAction = { label: "Chat on WhatsApp", href: SITE.whatsapp };
const CALL: ChatAction = { label: `Call ${SITE.phones[1]}`, href: `tel:${SITE.phones[1].replace(/\s/g, "")}` };
const ENQUIRY: ChatAction = { label: "Send an enquiry", href: "/contact" };
const EMAIL: ChatAction = { label: "Email us", href: `mailto:${SITE.email}` };

/* ------------------------------------------------------------------ text helpers */

// spelling variants and short forms folded to one word before matching
const SYNONYMS: [RegExp, string][] = [
  [/\be[\s-]?commerce\b/g, "ecommerce"],
  [/\bartificial intelligence\b/g, "ai"],
  [/\bmachine learning\b/g, "ml"],
  [/\bgen[\s-]?ai\b|\bgenerative ai\b/g, "genai"],
  [/\bci\s*\/\s*cd\b|\bci cd\b/g, "cicd"],
  [/\bdot\s?net\b|\.net\b/g, "dotnet"],
  [/\bpondicherry\b|\bpondy\b/g, "puducherry"],
  [/\bu\.?a\.?e\b/g, "uae"],
  [/\bwhats\s?app\b/g, "whatsapp"],
  [/\bh\.?r\.?m\.?s\b/g, "hrms"],
  [/\bmobile app(lication)?s?\b/g, "mobileapp"],
  [/\bweb ?sites?\b/g, "website"],
  [/\bhow much\b/g, "price"],
  [/\bhow long\b/g, "timeline"],
  [/\bget in touch\b|\breach (you|out)\b|\btalk to\b/g, "contact"],
];

const STOP = new Set(
  "a an the and or of to in on for with about is are am be do does did can could would should will i you we us me my your our it its this that what which who how why when where any some please tell know want need like have has get give show more info information".split(" ")
);

export function normalize(s: string) {
  let t = ` ${s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")} `;
  t = t.replace(/[^\p{L}\p{N}./+#\s-]/gu, " ");
  for (const [re, to] of SYNONYMS) t = t.replace(re, to);
  return t.replace(/[^\p{L}\p{N}\s+#]/gu, " ").replace(/\s+/g, " ").trim();
}

const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|s)$/, "") : w);

function words(s: string) {
  return normalize(s).split(" ").filter(Boolean);
}

/** edit distance, capped (only used for short single words) */
function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/* ------------------------------------------------------------------ topics */

type Topic = {
  id: string;
  /** single words (matched on stems, typo-tolerant from 5 letters) or phrases (matched as text); weight defaults to 1 */
  keys: (string | [string, number])[];
  reply: string;
  actions: ChatAction[];
};

const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
const groupKeys: Record<string, (string | [string, number])[]> = {
  "AI & GenAI": [["ai", 2], ["ml", 2], ["genai", 3], ["chatbot", 3], ["rag", 3], ["llm", 3], "gpt", ["agent", 2], "assistant", "automation", "automate", "analytics", "intelligence", "predictive", "nlp", ["fine tuning", 2]],
  "Enterprise Software": [["saas", 3], ["erp", 3], ["crm", 3], ["website", 2], ["mobileapp", 3], ["web app", 2], "app", "flutter", "react", "angular", "dotnet", ["iot", 3], ["software development", 2], "application", "portal", "ecommerce", "platform", "android", "ios"],
  "Cloud & DevOps": [["cloud", 3], ["aws", 2], ["azure", 2], ["gcp", 2], ["devops", 3], ["cicd", 3], ["docker", 2], ["kubernetes", 2], ["jenkins", 2], "migration", "hosting", "server", "deployment", "pipeline", "infrastructure"],
  "Digital Transformation": [["digital transformation", 4], ["consulting", 3], "consultant", "architecture", ["legacy", 3], "modernization", "modernise", "modernize", "strategy", "transformation", "roadmap"],
};

const TOPICS: Topic[] = [
  {
    id: "greeting",
    keys: [["hi", 3], ["hello", 3], ["hey", 3], ["hai", 3], ["hii", 3], ["vanakkam", 3], ["good morning", 3], ["good afternoon", 3], ["good evening", 3], ["namaste", 3]],
    reply: `Hello! 👋 Welcome to ${SITE.name}. I can tell you about our services, products, offices or how to start a project. What would you like to know?`,
    actions: [{ label: "Our services", href: "/services" }, { label: "Our products", href: "/products" }, ENQUIRY],
  },
  {
    id: "thanks",
    keys: [["thank", 3], ["thanks", 3], ["thx", 3], ["great", 1], ["awesome", 1], ["helpful", 2], ["cool", 1]],
    reply: "You're welcome! 😊 Anything else I can help you with?",
    actions: [{ label: "Start a project", href: "/contact" }, WHATSAPP],
  },
  {
    id: "bye",
    keys: [["bye", 3], ["goodbye", 3], ["see you", 3], ["later", 1]],
    reply: "Thanks for visiting Netkathir! Whenever you're ready, our team is a message away. 👋",
    actions: [ENQUIRY, WHATSAPP],
  },
  {
    id: "bot",
    keys: [["bot", 3], ["robot", 2], ["human", 3], ["real person", 3], ["who are you", 3], ["your name", 3]],
    reply: `I'm the ${SITE.name} website assistant. I answer from our company information instantly. For anything specific, a real person from our team will gladly help.`,
    actions: [WHATSAPP, CALL, ENQUIRY],
  },
  {
    id: "services",
    keys: [["services", 3], ["service", 2], ["offer", 2], ["what do you do", 4], ["solutions", 2], ["capabilities", 2], ["expertise", 2], ["specialise", 2], ["specialize", 2], ["provide", 1], ["help with", 1]],
    reply: `We're an AI-first software company. Our services cover four areas:\n${list(SERVICE_GROUPS.map((g) => `${g.name}: ${g.blurb}`))}\n\nTell me which one interests you and I'll share more.`,
    actions: [{ label: "See all services", href: "/services" }, ENQUIRY],
  },
  ...SERVICE_GROUPS.map((g) => ({
    id: `service:${g.name}`,
    keys: groupKeys[g.name] ?? [],
    reply: `${g.name} — ${g.blurb}\nWhat we deliver:\n${list(g.items)}\n\nWant to discuss your requirement with our team?`,
    actions: [{ label: `${g.name} services`, href: "/services" }, ENQUIRY, WHATSAPP],
  })),
  {
    id: "products",
    keys: [["products", 3], ["product", 2], ["own software", 2], ["ready made", 2], ["readymade", 2], ["tools", 1]],
    reply: `Besides custom work, we build our own products:\n${list(PRODUCTS.map((p) => `${p.name} (${p.tag}): ${p.text}`))}`,
    actions: [{ label: "See products", href: "/products" }, ENQUIRY],
  },
  ...PRODUCTS.map((p) => {
    const keys: Record<string, (string | [string, number])[]> = {
      "Garage Bill": [["garage bill", 5], ["garage", 4], ["workshop", 3], ["mechanic", 3], ["service centre", 3], ["service center", 3], ["billing", 2], ["invoice", 2], ["invoicing", 2], ["vehicle", 2], ["car", 1], ["bike", 1]],
      HRMS: [["hrms", 5], ["payroll", 4], ["attendance", 3], ["leave", 2], ["recruitment", 3], ["employee management", 3], ["hr", 3], ["performance", 1]],
      Coolie: [["coolie", 5], ["coming soon", 2], ["new product", 2], ["upcoming", 2]],
    };
    return {
      id: `product:${p.name}`,
      keys: keys[p.name] ?? [[p.name.toLowerCase(), 5]],
      reply: `${p.name} — ${p.line}\n${p.text}\nStatus: ${p.tag}.${p.live ? " We'd be happy to show you a demo." : ""}`,
      actions: [{ label: `About ${p.name}`, href: "/products" }, p.live ? { label: "Request a demo", href: "/contact" } : ENQUIRY],
    } as Topic;
  }),
  {
    id: "contact",
    keys: [["contact", 4], ["email", 3], ["mail", 2], ["phone", 3], ["call", 2], ["number", 2], ["whatsapp", 4], ["reach", 2], ["support team", 2], ["mobile number", 3]],
    reply: `You can reach our team any of these ways:\n- Email: ${SITE.email}\n- Phone: ${SITE.phones.join(" / ")}\n- WhatsApp: +91 83008 89729\n- Or send the enquiry form and we'll reply within 24 hours.`,
    actions: [WHATSAPP, CALL, EMAIL, ENQUIRY],
  },
  {
    id: "offices",
    keys: [["office", 4], ["offices", 4], ["address", 4], ["location", 4], ["located", 4], ["where", 2], ["based", 2], ["puducherry", 4], ["dubai", 4], ["uae", 3], ["visit", 2], ["headquarters", 4], ["hq", 3], ["india", 2]],
    reply: `Our offices:\n${list(SITE.offices.map((o) => `${o.country}: ${o.address}`))}`,
    actions: [{ label: "Contact & directions", href: "/contact" }, CALL],
  },
  {
    id: "countries",
    keys: [["countries", 4], ["country", 3], ["global", 2], ["international", 3], ["abroad", 2], ["usa", 3], ["singapore", 3], ["malaysia", 3], ["australia", 3], ["outside india", 3], ["overseas", 3]],
    reply: `We work with clients across ${COUNTRIES.length} countries: ${COUNTRIES.join(", ")}. Our team collaborates remotely across time zones.`,
    actions: [{ label: "About us", href: "/about" }, ENQUIRY],
  },
  {
    id: "start",
    keys: [["start a project", 5], ["start", 2], ["project", 2], ["hire", 3], ["quote", 4], ["quotation", 4], ["proposal", 3], ["work with you", 4], ["outsource", 3], ["requirement", 3], ["develop my", 3], ["build my", 3], ["build an", 2], ["build a", 2], ["engage", 2], ["onboard", 2], ["get started", 4]],
    reply: "Starting is simple:\n1. Share your idea or requirement through the enquiry form or WhatsApp.\n2. We set up a free discovery call to understand your goals.\n3. You receive a clear proposal with scope, approach and plan.\n4. We design, build and launch, with regular updates along the way.",
    actions: [{ label: "Start a project", href: "/contact" }, WHATSAPP],
  },
  {
    id: "pricing",
    keys: [["price", 4], ["pricing", 4], ["cost", 4], ["budget", 3], ["charge", 3], ["rate", 2], ["fees", 3], ["fee", 3], ["cheap", 2], ["affordable", 2], ["expensive", 2], ["package", 2]],
    reply: "Pricing depends on your scope: features, platforms, integrations and timeline. We don't use one-size-fits-all packages, so you only pay for what you need. Share your requirement and we'll send a clear estimate, usually within a couple of working days.",
    actions: [{ label: "Get a quote", href: "/contact" }, WHATSAPP],
  },
  {
    id: "timeline",
    keys: [["timeline", 4], ["duration", 3], ["deadline", 3], ["how many weeks", 4], ["how many days", 4], ["delivery time", 4], ["turnaround", 3], ["fast", 1], ["urgent", 2], ["quickly", 1]],
    reply: "Timelines depend on the size of the project. After a short discovery call we give you a realistic plan with milestones, so you always know what's delivered when.",
    actions: [{ label: "Discuss your timeline", href: "/contact" }, WHATSAPP],
  },
  {
    id: "about",
    keys: [["about you", 3], ["about your company", 4], ["about netkathir", 4], ["your company", 2], ["company", 1], ["who are", 2], ["founded", 3], ["since", 2], ["experience", 3], ["years", 2], ["team size", 4], ["employees", 3], ["engineers", 3], ["how many people", 4], ["history", 2], ["background", 2]],
    reply: `${SITE.name} is an AI-first software company building since 2015. We're an ISO 27001 certified team of 50+ engineers, delivering AI, enterprise software, cloud and digital-transformation projects for clients in ${COUNTRIES.length} countries.`,
    actions: [{ label: "About us", href: "/about" }, { label: "Our projects", href: "/projects" }],
  },
  {
    id: "security",
    keys: [["iso", 4], ["27001", 5], ["security", 3], ["secure", 2], ["certified", 3], ["certification", 3], ["nda", 4], ["confidential", 3], ["data protection", 4], ["privacy", 2], ["safe", 1]],
    reply: "Yes, security is built in. Netkathir is ISO 27001 certified, and we're happy to sign an NDA before discussing your idea.",
    actions: [{ label: "About us", href: "/about" }, ENQUIRY],
  },
  {
    id: "support",
    keys: [["support", 3], ["maintenance", 4], ["maintain", 3], ["after launch", 4], ["bug", 2], ["fix", 1], ["update", 1], ["monitoring", 3], ["24/7", 3], ["amc", 3]],
    reply: "We don't disappear after launch. Our team provides monitoring, maintenance, fixes and improvements to keep your product running smoothly.",
    actions: [{ label: "Talk to support", href: "/contact" }, WHATSAPP],
  },
  {
    id: "tech",
    keys: [["technology", 3], ["technologies", 3], ["tech stack", 4], ["stack", 2], ["language", 2], ["framework", 3], ["python", 2], ["node", 2], ["java", 2], ["php", 2], ["tools you use", 3]],
    reply: "We pick the right tools for each project. Our teams work with React, Angular and .NET for web, Flutter for mobile, leading cloud platforms with DevOps and CI/CD, and modern AI stacks (LLMs, RAG, AI agents).",
    actions: [{ label: "See services", href: "/services" }, ENQUIRY],
  },
  {
    id: "careers",
    keys: [["job", 4], ["jobs", 4], ["career", 4], ["careers", 4], ["hiring", 3], ["vacancy", 4], ["opening", 2], ["internship", 4], ["intern", 4], ["fresher", 4], ["resume", 4], ["cv", 3], ["apply", 3], ["work for", 3], ["join your team", 4]],
    reply: `Thanks for your interest in joining us! Please email your CV to ${SITE.email} with the role you're interested in, and our team will get back to you.`,
    actions: [EMAIL, { label: "About us", href: "/about" }],
  },
  {
    id: "projects",
    keys: [["portfolio", 4], ["case study", 4], ["case studies", 4], ["previous work", 4], ["past work", 4], ["projects", 3], ["clients", 3], ["examples", 2], ["samples", 2]],
    reply: "You can explore some of the work we've delivered across industries on our Projects page.",
    actions: [{ label: "See projects", href: "/projects" }, ENQUIRY],
  },
  {
    id: "blog",
    keys: [["blog", 4], ["blogs", 4], ["article", 3], ["articles", 3], ["insights", 3], ["read", 1]],
    reply: "Our engineers write practical articles on AI, cloud, DevOps and business software. Have a look:",
    actions: [{ label: "Read the blog", href: "/blogs" }],
  },
];

/* ------------------------------------------------------------------ scoring */

function scoreKeys(text: string, toks: string[], keys: Topic["keys"]) {
  let score = 0;
  const stems = toks.map(stem);
  for (const k of keys) {
    const [key, w] = typeof k === "string" ? [k, 1] : k;
    const nk = normalize(key);
    if (nk.includes(" ")) {
      if (` ${text} `.includes(` ${nk} `)) score += w;
    } else {
      const sk = stem(nk);
      if (stems.includes(sk)) score += w;
      else if (sk.length >= 5 && stems.some((t) => t.length >= 4 && near(t, sk))) score += w * 0.7; // typo
    }
  }
  return score;
}

// words too general to say what an article is about
const BLOG_STOP = new Set(
  "today now new best top guide simple use using make way ways help helps why matter matters daily business software company work works time good great also year years basic basics beginner step steps tips weather".split(" ")
);

function searchPosts(toks: string[], posts: FaqPost[]) {
  const q = toks.filter((t) => t.length > 2 && !STOP.has(t) && !BLOG_STOP.has(t)).map(stem);
  if (!q.length) return [];
  return posts
    .map((p) => {
      const title = words(p.title).map(stem);
      const tags = p.tags.flatMap((t) => words(t)).map(stem);
      let s = 0;
      for (const t of new Set(q)) {
        if (title.includes(t)) s += 2;
        else if (tags.includes(t)) s += 1.5;
      }
      return { p, s: s / Math.max(2, Math.min(q.length, 4)) };
    })
    .filter((x) => x.s >= 0.75)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.p);
}

const FALLBACK: FaqReply = {
  topic: "fallback",
  reply:
    "I'm not sure I have the right answer for that yet. Our team can help you directly. Reach us on WhatsApp, call, or send a quick enquiry and we'll reply within 24 hours.",
  actions: [WHATSAPP, CALL, ENQUIRY],
};

export function answer(question: string, posts: FaqPost[] = []): FaqReply {
  const text = normalize(question);
  const toks = text.split(" ").filter(Boolean);
  if (!toks.length) return FALLBACK;

  const ranked = TOPICS.map((t) => ({ t, s: scoreKeys(text, toks, t.keys) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  // a bare greeting/thanks wins only when the message is short; otherwise the real question wins
  let best = ranked[0];
  if (best && ["greeting", "thanks"].includes(best.t.id) && toks.length > 4 && ranked[1] && ranked[1].s >= 2) best = ranked[1];

  const articles = searchPosts(toks, posts);
  const articleActions = articles.map((p) => ({ label: `Read: ${p.title.length > 42 ? p.title.slice(0, 40) + "…" : p.title}`, href: `/blogs/${p.slug}` }));

  if (best && best.s >= 2) {
    const actions = [...best.t.actions];
    // related articles ride along with service / tech answers
    const specific = /^(service|product):/.test(best.t.id) || ["tech", "security", "support"].includes(best.t.id);
    if (articleActions.length && specific) actions.splice(1, 0, ...articleActions.slice(0, 1));
    return { topic: best.t.id, reply: best.t.reply, actions: actions.slice(0, 4) };
  }
  if (articleActions.length)
    return {
      topic: "articles",
      reply: "We've written about that on our blog. These articles should help, and our team is happy to go deeper on a call.",
      actions: [...articleActions, ENQUIRY].slice(0, 4),
    };
  if (best && best.s >= 1) return { topic: best.t.id, reply: best.t.reply, actions: best.t.actions.slice(0, 4) };
  return FALLBACK;
}
