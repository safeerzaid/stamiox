export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface BlogSection {
  id: string;
  title: string;
  paragraphs: string[];
  callout?: {
    type: 'tip' | 'info' | 'warning';
    title: string;
    text: string;
  };
  steps?: {
    num: number;
    title: string;
    desc: string;
  }[];
  specs?: {
    label: string;
    value: string;
    recommendation: string;
  }[];
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: 'Design' | 'Laser & Engraving' | 'Branding' | 'Materials' | 'Automation' | 'Inspiration';
  categoryColor: string;
  readTime: string;
  publishedAt: string;
  author: BlogAuthor;
  iconName: string;
  gradient: string;
  badge: string;
  keyTakeaways: string[];
  sections: BlogSection[];
  tags: string[];
  relatedSlugs: string[];
  recommendedTemplate?: {
    name: string;
    shape: string;
    link: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'design-perfect-stamp',
    title: 'Designing the Perfect Stamp: The Ultimate Vector & Typography Guide',
    subtitle: 'From micron-level line weights to dynamic circular typography: master the physics and aesthetics of crisp rubber stamp creation.',
    excerpt: 'Explore the art and science behind crafting a flawless stamp design, from concept to production.',
    category: 'Design',
    categoryColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    readTime: '6 min read',
    publishedAt: 'September 2, 2026',
    author: {
      name: 'Marcus Vance',
      role: 'Lead Seal & Typography Architect',
      avatar: 'MV',
      bio: 'Marcus has engineered over 12,000 corporate and legal seal matrices, specializing in high-contrast vector geometry and micro-text legibility.',
    },
    iconName: 'Compass',
    gradient: 'from-blue-600 via-indigo-600 to-sky-500',
    badge: 'Vector Geometry',
    keyTakeaways: [
      'Maintain a minimum line thickness of 0.25mm (0.7pt) to prevent rubber ridge collapse under pressure.',
      'Circular text requires inverse kerning adjustments in the bottom arc to compensate for baseline curvature distortion.',
      'Always invert your stamp vector artwork to 100% pure K (monochrome black) without anti-aliasing artifacts before laser rastering.',
      'Account for 10-15% ink spread (dot gain) on porous 80gsm paper stocks.',
    ],
    sections: [
      {
        id: 'the-physics-of-ink-transfer',
        title: '1. The Physics of Rubber & Ink Transfer',
        paragraphs: [
          'A rubber stamp is fundamentally a micro-relief printing press. When physical pressure is applied, ink held on the raised elastomer ridges is transferred to fibrous paper surfaces under hydraulic compression.',
          'Unlike offset or digital printing where dots are deposited via microscopic nozzles, stamp impressions compress under manual or spring-loaded mechanical pressure. This causes mechanical dot gain—where lines expand horizontally by approximately 0.08mm to 0.15mm upon contact.',
          'Understanding this physical reality dictates every design decision in vector space: negative spaces must be widened, micro-serifs must be reinforced, and tight inner corners need subtle fillets.',
        ],
        callout: {
          type: 'tip',
          title: 'Rule of Thumb for Line Weights',
          text: 'Never use hairline strokes (<0.1mm). In Stamiox Studio, keep perimeter outer rings at 0.75mm to 1.2mm, and inner decorative concentric borders between 0.35mm and 0.5mm.',
        },
      },
      {
        id: 'circular-typography-and-arc-math',
        title: '2. Perfecting Circular Typography & Arc Math',
        paragraphs: [
          'The biggest giveaway of amateur stamp design is warped, improperly spaced circular text. When text follows a 360-degree circle or circular arc, the top arc contracts at the ascender tips while expanding at the baseline.',
          'Conversely, the bottom inverted arc (frequently used for city names, registration numbers, or state jurisdictions) pulls letterheads apart while squeezing base serifs tightly together.',
          'In Stamiox Studio, the Arc Engine automatically applies differential optical kerning along Bezier radii to keep every character evenly weighted whether positioned on the zenith or nadir.',
        ],
        steps: [
          {
            num: 1,
            title: 'Set Radius & Center Point',
            desc: 'Calculate the inner ring diameter minus 3.5mm safety margin to ensure letters never touch concentric borders.',
          },
          {
            num: 2,
            title: 'Apply Optical Tracking',
            desc: 'Increase character tracking by +8% on bottom arcs to counteract inverted compression.',
          },
          {
            num: 3,
            title: 'Select High-Legibility Typefaces',
            desc: 'Use robust geometric grotesques (e.g. Montserrat, Inter, Cinzel) over delicate high-contrast Didones.',
          },
        ],
      },
      {
        id: 'vector-technical-specifications',
        title: '3. Technical Specs for Laser Engraving & Pre-Inked Flashes',
        paragraphs: [
          'Whether you are burning vulcanized natural rubber with a CO2 laser or exposing microporous foam on a flash stamp machine, precision export tolerances are mandatory.',
        ],
        specs: [
          {
            label: 'Minimum Stroke Width',
            value: '0.25 mm (0.71 pt)',
            recommendation: 'Guarantees structural wall integrity under heavy stamping pressure.',
          },
          {
            label: 'Minimum Negative Clearance',
            value: '0.30 mm (0.85 pt)',
            recommendation: 'Prevents ink bridging between adjacent glyphs.',
          },
          {
            label: 'Raster Resolution',
            value: '1200 DPI Vector PDF / SVG',
            recommendation: 'Produces razor-sharp bevel shoulders without stairstepping.',
          },
          {
            label: 'Vector Kerf Offset',
            value: '+0.06 mm',
            recommendation: 'Compensates for laser beam spot vaporization width.',
          },
        ],
      },
      {
        id: 'summary-best-practices',
        title: '4. Summary Checklist Before Production',
        paragraphs: [
          'Before sending your stamp design to the laser cutter or polymer wash unit, run the 1:1 real-size physical preview in Stamiox Studio.',
          'Print your proof at 100% scale on ordinary paper and view it from 30cm away. If numbers or dates like "VALID THRU 2029" blur together on paper, increase character spacing and step up font size by 0.5pt.',
        ],
      },
    ],
    tags: ['Vector Design', 'Typography', 'Stamp Physics', 'Production Tips'],
    relatedSlugs: ['laser-engraving-tips', 'branding-with-stamps', 'new-stamping-materials'],
    recommendedTemplate: {
      name: 'Corporate Official Seal',
      shape: 'ROUND',
      link: '/editor?shape=ROUND&template=corporate-seal',
    },
  },
  {
    slug: 'laser-engraving-tips',
    title: 'Laser Engraving Tips: Crisp Rubber & Polymer Production',
    subtitle: 'Master power, speed, PPI frequencies, and shoulder ramp geometry for flawless CO2 laser engraved stamp dies.',
    excerpt: 'Learn essential techniques to get crisp, clean laser engravings every time.',
    category: 'Laser & Engraving',
    categoryColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    readTime: '8 min read',
    publishedAt: 'August 28, 2026',
    author: {
      name: 'Elena Rostova',
      role: 'Head of Laser Fabrication & CNC Systems',
      avatar: 'ER',
      bio: 'Elena is a precision fabrication engineer with 15+ years configuring CO2, Fiber, and UV laser systems for industrial marking and stamp dies.',
    },
    iconName: 'Cpu',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    badge: 'Fabrication Masterclass',
    keyTakeaways: [
      'Enable conical shoulder ramps (15° to 25°) to reinforce tiny isolated glyphs and dots from flexing.',
      'Set PPI (Pulses Per Inch) between 1000 and 1200 to eliminate horizontal raster banding in the background floor.',
      'Always utilize bottom-to-top raster sweeps to prevent smoke particulate from settling on freshly engraved contours.',
      'Clean rubber dies in ultrasonic warm soapy water baths rather than harsh chemical acetone solvents.',
    ],
    sections: [
      {
        id: 'shoulder-profile-geometry',
        title: '1. Why Shoulder Profile Ramp Geometry Matters',
        paragraphs: [
          'When engraving tiny punctuation marks, stars, or 6pt micro-text into rubber sheets, the vertical cross-section profile determines whether the rubber stands rigid or flops sideways when stamped.',
          'Standard rectangular rastering cuts vertical 90-degree walls, leaving delicate pillars unsupported. Advanced stamp drivers use a "Shoulder" or "Ramp" setting, which creates a pyramid-like trapezoidal base.',
          'In Stamiox, exported vectors are optimized with gradient density ramps that translate directly into smooth trapezoidal shoulder profiles in laser software such as Trotec JobControl, Epilog Dashboard, and LightBurn.',
        ],
        callout: {
          type: 'warning',
          title: 'Avoid Over-Melting',
          text: 'Too steep of a shoulder (>35°) causes the base of closely spaced characters to merge, trapping ink. Maintain a 20° slope for ideal balance.',
        },
      },
      {
        id: 'frequency-and-exhaust-tuning',
        title: '2. Tuning Speed, Power & PPI Frequencies',
        paragraphs: [
          'Low-odor vulcanized laser rubber typically requires 60W to 80W of CO2 laser tube power at 100% power and 12-18% speed for a single-pass 1.2mm depth of relief.',
          'If your laser power is lower (30W-40W), opt for two passes: an initial high-speed roughing pass followed by a second low-power smoothing pass to vaporize residue ash.',
        ],
        specs: [
          {
            label: 'Engraving Depth Target',
            value: '1.1 mm to 1.3 mm',
            recommendation: 'Prevents non-image background floor from picking up ink.',
          },
          {
            label: 'Exhaust Air Velocity',
            value: '450+ m³/h minimum',
            recommendation: 'Critical for removing heavy rubber vapor and eliminating lens haze.',
          },
          {
            label: 'Air Assist Pressure',
            value: '0.8 to 1.2 bar (Gentle Flow)',
            recommendation: 'Suppresses flame without cooling the vaporization zone excessively.',
          },
        ],
      },
      {
        id: 'post-engraving-cleaning',
        title: '3. Post-Process Ultrasonic Cleaning Protocol',
        paragraphs: [
          'Laser vaporized rubber leaves a fine dust layer of carbon soot in the microscopic valleys. If not removed, this carbon mixes with stamp ink and causes muddy, smeared impressions.',
        ],
        steps: [
          {
            num: 1,
            title: 'Dry Air Blow',
            desc: 'Use compressed air at 45° angle to dislodge loose carbon powder inside the laser cabinet exhaust zone.',
          },
          {
            num: 2,
            title: 'Ultrasonic Bath',
            desc: 'Submerge cut dies in an ultrasonic tank with mild citrus degreaser solution at 40°C for 3 minutes.',
          },
          {
            num: 3,
            title: 'Adhesive Backing Mounting',
            desc: 'Dry thoroughly before peeling 3M double-sided foam adhesive to prevent moisture delamination.',
          },
        ],
      },
    ],
    tags: ['Laser Engraving', 'CO2 Laser', 'LightBurn', 'Rubber Fabrication'],
    relatedSlugs: ['new-stamping-materials', 'design-perfect-stamp', 'workflow-automation'],
    recommendedTemplate: {
      name: 'High-Detail Notary Seal',
      shape: 'ROUND',
      link: '/editor?shape=ROUND&template=notary-seal',
    },
  },
  {
    slug: 'branding-with-stamps',
    title: 'Business Branding with Stamps: Packaging, Identity & ROI',
    subtitle: 'How luxury retail brands and boutique creators leverage bespoke stamps for tactile unboxing experiences.',
    excerpt: 'How custom stamps can elevate your brand identity and streamline operations.',
    category: 'Branding',
    categoryColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    readTime: '5 min read',
    publishedAt: 'August 19, 2026',
    author: {
      name: 'Siddharth Mehta',
      role: 'Brand Identity & Packaging Strategist',
      avatar: 'SM',
      bio: 'Siddharth advises direct-to-consumer and artisanal fashion labels on tactile packaging systems, sustainable print workflows, and sensory branding.',
    },
    iconName: 'Award',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    badge: 'Packaging & Strategy',
    keyTakeaways: [
      'Custom stamped kraft boxes reduce custom-print packaging costs by up to 74% for early-stage and medium businesses.',
      'Archival waterproof archival pigment inks allow stamping on cotton bags, glassine envelopes, and textured linen tags.',
      'Dual-ink stamp sets create unforgettable unboxing rituals that increase organic customer social media shares.',
      'Integrating a crisp micro-QR code directly into the stamp die boosts digital landing page conversions from offline packaging.',
    ],
    sections: [
      {
        id: 'the-tactile-advantage',
        title: '1. The Tactile Advantage in a Digital World',
        paragraphs: [
          'In an era where consumers receive dozens of identical glossy printed mailer boxes every month, the organic, human imperfection of a handcrafted rubber stamp seal creates an instant emotional connection.',
          'Studies in sensory marketing show that consumers perceive hand-stamped craft packaging as 42% more "artisanal" and higher in bespoke value compared to mass pre-printed cardboard.',
          'By combining custom wood-mount handles with archival waterproof inks, brands can personalize unboxing mailers, receipt cards, and thank-you stationery on-demand.',
        ],
        callout: {
          type: 'info',
          title: 'Packaging Cost Comparison',
          text: 'Custom 4-color printed corrugated mailer box minimum order: $1,800 (500 units = $3.60/box). Plain kraft box + Stamiox custom oversized rocker stamp: $0.48/box total cost.',
        },
      },
      {
        id: 'multi-surface-ink-selection',
        title: '2. Selecting Inks for Non-Porous & Specialty Media',
        paragraphs: [
          'Standard water-based office inks only work on absorbent copy paper. For high-end branding, you need chemical-specific ink formulations.',
        ],
        specs: [
          {
            label: 'Oil-Based Pigment Inks',
            value: 'Versafine / Archival',
            recommendation: 'Incredible sharpness on cotton paper, cardstock, and matte business cards.',
          },
          {
            label: 'Solvent / Quick-Dry Inks',
            value: 'StāzOn / Industrial Alcohol',
            recommendation: 'Permanent bonding on glossy plastics, metal tins, glassine, and cellophane.',
          },
          {
            label: 'Fabric & Textile Inks',
            value: 'Heat-Set Polymer Inks',
            recommendation: 'Washable stamping on canvas tote bags, linen apparel tags, and denim.',
          },
        ],
      },
      {
        id: 'interactive-qr-stamps',
        title: '3. Bridging Physical Impressions to Digital Funnels',
        paragraphs: [
          'With Stamiox Studio’s built-in QR Code Stamp Generator, you can embed error-correcting (Level H) QR codes directly inside your brand seal.',
          'Customers scan the stamped impression on their mailer box to trigger exclusive discount codes, warranty activations, or Instagram unboxing filters.',
        ],
      },
    ],
    tags: ['Brand Identity', 'Packaging Design', 'D2C Strategy', 'QR Code Stamps'],
    relatedSlugs: ['creative-inspiration', 'design-perfect-stamp', 'workflow-automation'],
    recommendedTemplate: {
      name: 'Square QR & Monogram Seal',
      shape: 'SQUARE',
      link: '/editor?shape=SQUARE&template=qr-brand-stamp',
    },
  },
  {
    slug: 'new-stamping-materials',
    title: 'New Materials for Stamping: Eco-Polymers, Flash Foams & Hybrid Inks',
    subtitle: 'An in-depth chemical and mechanical breakdown of modern green elastomer formulations and microporous matrices.',
    excerpt: 'A deep dive into the latest materials gaining popularity among creators.',
    category: 'Materials',
    categoryColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    readTime: '7 min read',
    publishedAt: 'August 12, 2026',
    author: {
      name: 'Dr. Alistair Finch',
      role: 'Polymer Chemist & Material Sciences Editor',
      avatar: 'AF',
      bio: 'Dr. Finch holds a PhD in Macromolecular Chemistry and specializes in biodegradable synthetic elastomers and UV photopolymer formulations.',
    },
    iconName: 'Shapes',
    gradient: 'from-teal-500 via-emerald-600 to-green-600',
    badge: 'Material Science',
    keyTakeaways: [
      'Odorless synthetic rubber blends have eliminated 95% of volatile sulfur compounds during CO2 laser engraving.',
      'Microporous flash foams deliver over 25,000 impressions without requiring an external ink pad.',
      'Plant-based bio-resins match industrial Shore A 55 hardness ratings while lowering carbon footprint by 60%.',
      'Silicone hybrid micro-reliefs offer extreme chemical resistance against aggressive solvent inks.',
    ],
    sections: [
      {
        id: 'evolution-of-laser-rubber',
        title: '1. The Evolution: From Vulcanized Sulfur to Green Synthetics',
        paragraphs: [
          'For decades, rubber stamp makers endured the pungent, noxious sulfur odors of traditional vulcanized tire-grade rubber. Cutting these materials released sulfur dioxide and sticky tar residue that degraded laser optical mirrors.',
          'Modern odorless eco-elastomers are synthesized with cross-linked polymer chains that vaporize directly into clean, filterable gaseous components without tar build-up.',
          'These new materials maintain Shore A 50-60 hardness, offering the crisp snap needed for fine line reproduction while dramatically extending laser tube and filter lifespans.',
        ],
      },
      {
        id: 'flash-foam-microporous-tech',
        title: '2. Flash Foam: 600 DPI Continuous Tone Impressions',
        paragraphs: [
          'Flash stamp technology works completely differently from relief carving. Instead of cutting away valleys, a xenon flash lamp produces intense thermal radiation that fuses and seals microscopic pores in a light-sensitive polymer foam.',
          'Areas shielded by dense black toner remain open. When filled with ink from the internal reservoir, ink bleeds exclusively through the open pores, functioning like a high-resolution micro-stencil.',
        ],
        specs: [
          {
            label: 'Flash Resolution Capacity',
            value: 'Up to 1200 DPI',
            recommendation: 'Capable of printing ultra-fine halftone photos and micro-fingerprint crests.',
          },
          {
            label: 'Impression Lifespan',
            value: '20,000 - 30,000 cycles',
            recommendation: 'Can be re-inked indefinitely through the handle cartridge.',
          },
          {
            label: 'Drying Time on Paper',
            value: '< 2 seconds',
            recommendation: 'Instant-dry oil formulation prevents smudging in banking/notary use.',
          },
        ],
      },
    ],
    tags: ['Material Science', 'Polymer Foam', 'Eco Rubber', 'Flash Stamps'],
    relatedSlugs: ['laser-engraving-tips', 'design-perfect-stamp', 'branding-with-stamps'],
    recommendedTemplate: {
      name: 'Address & Signatory Stamp',
      shape: 'RECTANGULAR',
      link: '/editor?shape=RECTANGULAR&template=pocket-address',
    },
  },
  {
    slug: 'workflow-automation',
    title: 'Workflow Automation: Batch Generating 5,000 Custom Stamps with APIs',
    subtitle: 'How notary portals, logistics giants, and print shops use the Stamiox Headless Render Engine to automate stamp SVG & PDF production.',
    excerpt: 'Integrate your stamp designs into automated workflows for faster turnaround.',
    category: 'Automation',
    categoryColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    readTime: '6 min read',
    publishedAt: 'August 05, 2026',
    author: {
      name: 'Tanya Chen',
      role: 'Staff Solutions Architect',
      avatar: 'TC',
      bio: 'Tanya specializes in automated document pipeline architecture, headless graphics rendering, and enterprise cloud print infrastructure.',
    },
    iconName: 'Layers',
    gradient: 'from-purple-600 via-indigo-600 to-violet-500',
    badge: 'Developer & Ops',
    keyTakeaways: [
      'Stamiox Headless Engine generates production-ready 1:1 vector SVGs and PDF/X-1a files in under 45 milliseconds per stamp.',
      'Dynamic variable replacement supports notary commission numbers, expiration dates, sequential serial numbers, and employee names.',
      'REST APIs allow direct integration with ERP systems like SAP, Shopify webhooks, and laser CNC queue managers.',
    ],
    sections: [
      {
        id: 'the-manual-bottleneck',
        title: '1. The Problem: Manual Graphic Setup Bottlenecks',
        paragraphs: [
          'Commercial stamp manufacturing companies receive hundreds of orders daily with varying names, bar numbers, dates, and addresses.',
          'Having human graphic designers manually set up concentric rings and curved text in Illustrator or CorelDraw introduces human spelling errors and takes 8-12 minutes per order.',
          'With Stamiox Automation API, incoming JSON payloads from webstores instantly compile into verified vector files with exact kerf compensation and alignment geometry.',
        ],
        callout: {
          type: 'info',
          title: 'API Throughput',
          text: 'A single Stamiox cluster node processes over 150 stamp renderings per second with zero drift or text clipping.',
        },
      },
      {
        id: 'sample-api-integration',
        title: '2. Programmatic Dynamic Variable Injection',
        paragraphs: [
          'By defining dynamic template placeholders such as `{{notary_name}}`, `{{commission_no}}`, and `{{exp_date}}`, your application can request high-resolution SVG or vector PDF deliverables on the fly.',
        ],
        steps: [
          {
            num: 1,
            title: 'Design Master Template in Stamiox Studio',
            desc: 'Save your master seal with dynamic tags attached to specific arc layers.',
          },
          {
            num: 2,
            title: 'Trigger Webhook on Order Checkout',
            desc: 'Post the customer customization parameters to the Stamiox Render Endpoint.',
          },
          {
            num: 3,
            title: 'Auto-Send to Laser Bed Queue',
            desc: 'The compiled vector file drops directly into the CNC hot folder for automated nesting.',
          },
        ],
      },
    ],
    tags: ['Automation', 'APIs', 'Batch Processing', 'Laser Workflows'],
    relatedSlugs: ['design-perfect-stamp', 'laser-engraving-tips', 'branding-with-stamps'],
    recommendedTemplate: {
      name: 'Dynamic Notary Template',
      shape: 'ROUND',
      link: '/editor?shape=ROUND&template=automated-notary',
    },
  },
  {
    slug: 'creative-inspiration',
    title: 'Creative Inspiration: 50 Avant-Garde Seal & Monogram Layouts',
    subtitle: 'From Victorian botanical flourishes to Swiss minimalist brutalism: ignite your next stamp collection design.',
    excerpt: 'Sources and ideas to spark your next stamp collection.',
    category: 'Inspiration',
    categoryColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    readTime: '5 min read',
    publishedAt: 'July 29, 2026',
    author: {
      name: 'Camille Dubois',
      role: 'Creative Director & Seal Curator',
      avatar: 'CD',
      bio: 'Camille is a Parisian typographer and visual artist celebrating historic letterpress culture through contemporary digital seals and monograms.',
    },
    iconName: 'Sparkle',
    gradient: 'from-rose-500 via-pink-500 to-orange-400',
    badge: 'Design Showcase',
    keyTakeaways: [
      'Blended geometric frames (hexagonal nested in circular rings) create modern heraldic emblems.',
      'Vintage stippling and micro-dot patterns add authentic aged patina to digital stamp designs.',
      'Asymmetrical balance with off-center monograms breaks traditional bureaucratic monotony.',
      'Pairing bold display serif letterforms with ultra-clean sans-serif subtexts elevates aesthetic hierarchy.',
    ],
    sections: [
      {
        id: 'rediscovering-historic-heraldry',
        title: '1. Reinterpreting Historic Heraldry for Modern Brands',
        paragraphs: [
          'For centuries, personal signet rings and royal heraldic wax seals communicated authenticity, prestige, and lineage through complex symbolic motifs.',
          'Modern stamp design reinterprets these traditions: replacing mythological creatures with minimalist line-art emblems, modern constellations, architectural silhouettes, and abstract monograms.',
          'In Stamiox Studio, the Clipart Library gives you access to over 500 hand-curated vector flourishes, star constellations, botanical laurels, and geometric crests.',
        ],
      },
      {
        id: 'typography-pairing-recipes',
        title: '2. High-Impact Typography Pairing Recipes',
        paragraphs: [
          'The soul of an inspirational stamp layout lies in typographic contrast. Avoid using two similar fonts; instead, aim for high tension between classical serifs and modern sans-serifs.',
        ],
        specs: [
          {
            label: 'The European Classic',
            value: 'Cinzel Serif + Montserrat Grotesk',
            recommendation: 'Perfect for wine labels, bookplates (Ex Libris), and luxury hospitality.',
          },
          {
            label: 'The Modern Brutalist',
            value: 'JetBrains Mono + Space Grotesk',
            recommendation: 'Striking for architecture firms, software collectives, and tech events.',
          },
          {
            label: 'The Artisanal Botanical',
            value: 'Playfair Display + Cormorant Italic',
            recommendation: 'Ideal for wedding stationery, florists, and specialty coffee roasters.',
          },
        ],
      },
    ],
    tags: ['Creative Showcase', 'Monograms', 'Typography Pairings', 'Flourishes'],
    relatedSlugs: ['branding-with-stamps', 'design-perfect-stamp', 'new-stamping-materials'],
    recommendedTemplate: {
      name: 'Oval Vintage Flourish Seal',
      shape: 'OVAL',
      link: '/editor?shape=OVAL&template=vintage-oval-flourish',
    },
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedBlogPosts(currentSlug: string): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return BLOG_POSTS.slice(0, 3);
  return BLOG_POSTS.filter((p) => current.relatedSlugs.includes(p.slug) || p.slug !== currentSlug).slice(0, 3);
}
