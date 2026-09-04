# Stamiox | Web-Based Rubber Stamp Designing Software & Vector Studio

> A clean, modern, and intuitive web-based rubber stamp design software that is significantly easier, simpler, and more user-friendly than CorelDRAW, featuring a 3-month free trial subscription model, pre-built templates, and a full CorelDRAW-like precision vector canvas editor.

---

## 🌟 Key Features

### 1. Subscription & 3-Month Free Trial System
- **Automatic 3-Month Free Trial**: Every newly registered user gets 90 days of complete unrestricted access to all templates, canvas studio tools, and high-resolution exports.
- **Trial Tracker**: Real-time counter showing remaining days of the free trial with quick upgrade CTA.
- **Subscription Tiers**:
  - `Free Trial`: 90 days unrestricted access ($0)
  - `Pro Monthly`: $9.99/month for small businesses, notaries, and offices.
  - `Pro Annual`: $89.00/year (25% discount) for stamp makers and print shops.
  - `Enterprise`: $199.00/year for commercial stamp manufacturers.

### 2. Pre-Built Rubber Stamp Templates (Quick Mode)
- Browse 50+ templates across categories:
  - **Company & Corporate Round Seals** (Colop R40, Trodat 46040)
  - **Notary Public Official Seals** (Serrated starburst edge, scales of justice)
  - **Medical & Doctor Clinic Stamps** (Caduceus symbol, license registration)
  - **Return Address Stamps** (Trodat 4913 rectangular 4-line format)
  - **Dater & Document Verification** (Rotary date band integration)
  - **Office Stamps** (PAID, RECEIVED, APPROVED, CONFIDENTIAL)
  - **Victorian Monogram & Wedding Seals**
- **Instant 30-Second Form Customizer**: Type company name, date, registration, or tagline with live synchronous vector SVG preview.
- **1-Click Bridge**: Seamlessly transfer any personalized template into the Full Studio Canvas Editor for manual adjustments.

### 3. Full Studio Vector Canvas (CorelDRAW-like, Simplified)
- **Millimeter Physical Accuracy & Real-World Mount Presets**:
  - Colop Printer R40 (Ø40mm), R50 (Ø50mm), R30 (Ø30mm)
  - Trodat Printy 46040 (Ø40mm), 46045 (Ø45mm), 46025 (Ø25mm)
  - Trodat Printy 4913 (58×22mm), 4912 (47×18mm), 4911 (38×14mm), 4915 (70×25mm)
  - Colop Oval 44 (44×30mm), Colop Oval 55 (55×35mm), Colop Q30 (30×30mm)
  - Custom width & height in millimeters.
- **Curved & Circular Text Engine**:
  - Top Arc Text and Bottom Arc Text with adjustable radius, start angle, sweep angle, font size (mm), and reverse upright orientation.
- **Borders, Rings & Serrated Starburst Seals**:
  - Concentric solid, dashed, and dotted rings.
  - Notary serrated starburst edge with adjustable teeth and outer/inner radius.
- **Vector Clipart Library & QR Codes**:
  - 5-point stars, triple star motifs, scales of justice, medical caduceus, security shields, laurel wreaths, approved badges, and live QR code generator.
- **Precision Alignment & Transform (CorelDRAW simplified)**:
  - Center to Canvas (Horizontal & Vertical), Align Left, Center-H, Right, Top, Center-V, Bottom.
  - Layer Manager with Drag-to-reorder, Bring Forward, Send Backward, Bring to Front, Send to Back, Lock, and Hide.
  - Fine Nudge with Keyboard Arrows (0.5mm precision) and Shift+Arrows (2.0mm precision).
  - Undo (Ctrl+Z), Redo (Ctrl+Y), Duplicate (Ctrl+D), and Delete.
- **Laser Engraving & Manufacturing Output**:
  - **Laser Invert (Negative Mode)**: White relief text on black rubber background for CO2 laser burning.
  - **Laser Mirror (Horizontal Flip)**: Required for physical stamp plate manufacturing.
  - **Realistic Rubber Ink Distress Simulation**: Stamped texture preview toggle.
  - **Vector SVG Export**: 100% scalable vector curves for laser engraving machines (Trotec, Epilog, Chinese lasers) and flash stamp systems.
  - **Vector PDF Export**: Exact physical millimeter scale.
  - **High-Res PNG Export**: 300 / 600 DPI transparent raster.

---

## 🏗️ Architecture & Project Structure

```
c:/clixdot/websites/stamiox/
├── backend/
│   ├── src/
│   │   ├── config/index.ts            # Configuration & environment variables
│   │   ├── controllers/               # Auth, Subscription, Template, Project, Clipart, Export
│   │   ├── data/                      # Pre-built stamp templates & clipart seed datasets
│   │   ├── middleware/                # JWT verification & trial entitlement checks
│   │   ├── routes/index.ts            # Express REST API routes
│   │   ├── services/db.service.ts     # Database service with PostgreSQL & fallback store
│   │   └── index.ts                   # Express server entry point
│   ├── prisma/schema.prisma           # PostgreSQL models (User, Subscription, StampProject, StampTemplate)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js App Router (Landing, Templates, Editor, Pricing, Dashboard, Login)
│   │   ├── components/
│   │   │   ├── editor/                # Canvas, Toolbar, PropertiesPanel, LayersPanel, ExportModal, ClipartModal
│   │   │   ├── templates/             # TemplateCard, QuickCustomizerModal
│   │   │   └── layout/                # Header, Footer, TrialBanner, SubscriptionModal
│   │   ├── context/                   # AuthContext, SubscriptionContext, EditorContext
│   │   ├── lib/                       # ArcText math engine, SVG generator, Units (mm/in/px), API client
│   │   └── types/stamp.ts             # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
└── README.md
```

---

## 🚀 Getting Started

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run dev
```
The backend server will start on `http://localhost:5000` with the health check available at `http://localhost:5000/health`.

### 2. Start the Frontend Next.js Application
```bash
cd frontend
npm install
npm run dev
```
The Next.js application will start on `http://localhost:3000`.

### 3. One-Click Demo Access
- Click **"Demo Login"** or **"Instant 1-Click Demo Login"** on the header / login page to instantly explore all features with an active 90-day free trial account.
