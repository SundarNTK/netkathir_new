export const IMAGES = {
  logo: "/images/brand/netkathir-logo.png",
  iso: "/images/brand/iso-27001-badge.webp",
  heroes: {
    home: "/images/hero/hero-bg.webp",
    services: "/images/hero/services-hero-bg.webp",
    products: "/images/hero/products-hero-bg.webp",
    projects: "/images/hero/project-hero-bg.webp",
    about: "/images/hero/aboutus-hero-bg.webp",
    blogs: "/images/hero/blogs-hero-bg.webp",
    contact: "/images/hero/contact-hero-bg.webp",
    garage: "/images/hero/garage-bill-hero-bg.webp",
  },
  garage: {
    icon: "/images/garage-bill/app-icon.webp",
    invoicing: "/images/garage-bill/digital-invoicing.jpg",
    owners: "/images/garage-bill/garage-owners.jpg",
    mechanics: "/images/garage-bill/mechanics.jpg",
  },
};

export const SITE = {
  name: "Netkathir Technologies",
  logo: IMAGES.logo,
  email: "admin@netkathir.com",
  phones: ["0413 2981038", "+91 83008 89729"],
  whatsapp: "https://wa.me/918300889729",
  social: {
    Facebook: "https://www.facebook.com/profile.php?id=61568604344718",
    Instagram: "https://www.instagram.com/netkathir_technologies/",
    LinkedIn: "https://www.linkedin.com/company/14452775/",
  },
  offices: [
    {
      country: "India · HQ",
      address: "No.3, Jayanagar, 3rd Cross, Reddiyarpalayam, Puducherry 605010, India",
    },
    {
      country: "UAE",
      address:
        "Meydan Grandstand, Shared Desk, 6th Floor, Meydan Road, Nad Al Sheba, Dubai, United Arab Emirates",
    },
  ],
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/projects", label: "Projects" },
  { href: "/blogs", label: "Blogs" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export const PILLARS = [
  {
    title: "AI & Generative AI Solutions",
    text: "Machine learning, chatbots, RAG, LLM integration and AI agents wired into real business workflows.",
    image: IMAGES.heroes.services,
  },
  {
    title: "Enterprise Software Solutions",
    text: "SaaS, ERP/CRM, web and mobile applications engineered to scale with your business.",
    image: IMAGES.heroes.products,
  },
  {
    title: "Cloud & DevOps Solutions",
    text: "Cloud migration, CI/CD and infrastructure that ships reliably and securely.",
    image: IMAGES.heroes.projects,
  },
  {
    title: "Digital Transformation & Consulting",
    text: "Strategy, architecture and legacy modernization that turn technology into advantage.",
    image: IMAGES.heroes.about,
  },
];

export const SERVICE_GROUPS = [
  {
    name: "AI & GenAI",
    blurb: "Intelligence that connects to real workflows — not demos.",
    items: [
      "AI & Machine Learning Solutions",
      "Enterprise AI Chatbots & Virtual Assistants",
      "Retrieval-Augmented Generation (RAG) Solutions",
      "LLM Integration & Fine-Tuning",
      "AI Workflow & Process Automation",
      "Intelligent Business Analytics with AI",
      "AI Agent Development",
    ],
  },
  {
    name: "Enterprise Software",
    blurb: "Products and platforms built to carry your operations.",
    items: [
      "SaaS Product Development",
      "Enterprise Application Development",
      "Web Application Development (React, Angular, .NET)",
      "Mobile App Development (Flutter)",
      "ERP & CRM Development / Integration",
      "IoT Solutions",
    ],
  },
  {
    name: "Cloud & DevOps",
    blurb: "Infrastructure and pipelines that never slow you down.",
    items: ["Cloud Solutions & Migration", "DevOps & CI/CD"],
  },
  {
    name: "Digital Transformation",
    blurb: "Strategy and architecture for the next decade of your business.",
    items: [
      "IT Consulting & Digital Transformation",
      "Enterprise Architecture Consulting",
      "Legacy Application Modernization",
      "Technology Strategy Consulting",
    ],
  },
];

export const PRODUCTS = [
  {
    name: "Garage Bill",
    tag: "Available Now",
    line: "Wrenches to Wallets.",
    text: "Billing and workshop management built for garages and service centres.",
    live: true,
    image: IMAGES.garage.invoicing,
    icon: IMAGES.garage.icon,
    shots: [IMAGES.garage.owners, IMAGES.garage.mechanics],
  },
  {
    name: "HRMS",
    tag: "Available Now",
    line: "People operations, simplified.",
    text: "Payroll, leave, attendance, recruitment and performance in one platform.",
    live: true,
    image: IMAGES.heroes.products,
    icon: "",
    shots: [] as string[],
  },
  {
    name: "Coolie",
    tag: "Coming Soon",
    line: "Something new is on its way.",
    text: "Our next product is in the works. Stay tuned.",
    live: false,
    image: IMAGES.heroes.garage,
    icon: "",
    shots: [] as string[],
  },
];

export const CLIENTS = [
  { name: "MedConnect AI", logo: "/images/clients/medconnect-ai.png" },
  { name: "Nurtem", logo: "/images/clients/nurtem.png" },
  { name: "HEB", logo: "/images/clients/heb.png" },
  { name: "Golden Marine", logo: "/images/clients/golden-marine.png" },
  { name: "HH Services", logo: "/images/clients/hh-services.png" },
  { name: "Auroville Learning", logo: "/images/clients/auroville-learning.png" },
  { name: "WhyScience", logo: "/images/clients/why-science.png" },
  { name: "Meena Fiberglas Industries", logo: "/images/clients/meena-fiberglas.png" },
  { name: "APPGM", logo: "/images/clients/appgm.webp" },
];

export const TESTIMONIALS = [
  {
    org: "Buvna · APPGM",
    text: "A web-based project management app for Malaysia's social-impact programmes, delivered end to end.",
    who: "Buvna, APPGM",
  },
  {
    org: "HEB",
    text: "A firewalking booking system that handled 1,000+ concurrent bookings without a hitch.",
    who: "Tirupura Sundaram Shanmugam, HEB",
  },
  {
    org: "WhyScience",
    text: "An online education platform built to inspire curious learners worldwide.",
    who: "Yvonne Kielhorn, Ph.D., WhyScience",
  },
];

const JPG_POSTS = new Set([
  "mobile-app-design-modern-commerce",
  "wordpress-seo-migration",
]);

export const BLOGS = [
  ["Nov 20, 2026", "How ERP Software Simplifies Business Operations", "how-erp-software-simplifies-business-operations"],
  ["Nov 13, 2026", "AI-Powered Chatbots for Customer Support", "ai-powered-chatbots-customer-support"],
  ["Nov 3, 2026", "Docker Fundamentals: A Beginner's Guide", "docker-fundamentals-beginners-guide"],
  ["Oct 22, 2026", "Custom Software vs Ready-Made Software", "custom-software-vs-ready-made-software"],
  ["Oct 8, 2026", "MergeWatcher: Detect Git Conflicts Before Merge", "mergewatcher-detect-git-conflicts-before-merge"],
  ["Sep 23, 2026", "Jenkins Fundamentals: CI/CD Pipeline Automation", "jenkins-fundamentals-ci-cd-pipeline-automation"],
  ["Sep 4, 2026", "Unit Testing Basics: How to Write Unit Tests", "unit-testing-basics-how-to-write-unit-tests"],
  ["Aug 19, 2026", "AI Unit Testing & Code Validation", "ai-unit-testing-code-validation"],
  ["Aug 11, 2026", "AWS IAM and S3 Guide", "aws-iam-and-s3-guide"],
  ["Aug 4, 2026", "AI Agents: How They Work", "blog-ai-agents-how-they-work"],
  ["Jul 28, 2026", "How to Reduce Manual Work in Your Business Using AI", "how-to-reduce-manual-work-in-your-business-using-ai"],
  ["Jul 24, 2026", "Claude AI for Software Development", "claude-ai-for-software-development"],
  ["Nov 13, 2025", "Mobile App Design for Modern Commerce", "mobile-app-design-modern-commerce"],
  ["Nov 4, 2025", "WordPress SEO Migration", "wordpress-seo-migration"],
  ["Oct 28, 2025", "URL Slugs & Search Generative Experience 2025", "3-url-slug-search-generative-experience-2025"],
  ["Oct 8, 2025", "Cross-Platform vs Native Apps: iOS & Android", "cross-platform-vs-native-apps-ios-android"],
].map(([date, title, slug], i) => ({
  date,
  title,
  slug,
  n: String(i + 1).padStart(2, "0"),
  url: `https://netkathir.com/blogs/${slug}`,
  image: `/images/blog/${slug}.${JPG_POSTS.has(slug) ? "jpg" : "webp"}`,
}));

export const COUNTRIES = ["India (HQ)", "USA", "Dubai", "Singapore", "Malaysia", "Australia"];

export const VALUES = [
  ["Innovation", "We explore what's next and ship what works."],
  ["Collaboration", "We build with clients, not just for them."],
  ["Technology", "Right tools, modern engineering, no hype."],
  ["Growth", "Our growth is measured by yours."],
];

export const CONTACT_SERVICES = [
  ...SERVICE_GROUPS.flatMap((g) => g.items),
  "Other",
];
