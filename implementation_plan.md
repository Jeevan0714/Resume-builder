# Phased Implementation Plan — AI-Powered Career Acceleration Platform

> A living interactive web application. Not a static page. Every pixel breathes.

---

## 🔬 Deep-Dive Research Findings

### 🎨 Color Theme: "Cosmic Velocity"
After researching 2025 AI SaaS design trends, the recommended palette for a career acceleration platform is the **"Cosmic Velocity"** theme — a high-contrast dark mode with warm violet-to-indigo primary gradients punctuated by electric cyan as the action color. This hits all 2025 benchmarks:

| Token              | Value                        | Purpose                                      |
|--------------------|------------------------------|----------------------------------------------|
| `--bg-base`        | `hsl(226, 30%, 6%)`          | Deep space background — focuses attention    |
| `--bg-surface`     | `hsla(226, 30%, 10%, 0.7)`   | Glassmorphic card surfaces                   |
| `--bg-elevated`    | `hsl(226, 25%, 14%)`         | Elevated panels, modals                      |
| `--primary`        | `hsl(258, 89%, 66%)`         | Electric violet — energy, intelligence       |
| `--primary-glow`   | `hsla(258, 89%, 66%, 0.25)`  | Glow shadows for cards and buttons           |
| `--accent`         | `hsl(187, 96%, 55%)`         | Cyan — action items, progress bars, links    |
| `--accent-warm`    | `hsl(326, 85%, 65%)`         | Hot pink — notifications, interview coach    |
| `--success`        | `hsl(142, 71%, 50%)`         | Match score high, ATS compliance ✓           |
| `--warning`        | `hsl(38, 92%, 60%)`          | Match score medium — needs improvement       |
| `--text-primary`   | `hsl(220, 20%, 96%)`         | Near-white readable text                     |
| `--text-muted`     | `hsl(220, 15%, 55%)`         | Subtitles, timestamps                        |
| `--border`         | `hsla(258, 50%, 60%, 0.15)`  | Subtle glowing borders                       |

**Why this palette works:**
- Electric violet = trust + AI intelligence (outperforms "commodity blue")
- Cyan accent = action, speed (reinforces Groq's fast inference branding)
- 80% dark neutrals / 20% vibrant accents = no visual fatigue
- Passes WCAG 2.2 contrast ratios on all text/background pairings

---

### ⚡ Animation & Interactivity Stack

| Library              | Role                                              | Rationale                                      |
|----------------------|---------------------------------------------------|------------------------------------------------|
| **Framer Motion**    | Component transitions, page routing animations    | React-native, state-driven, zero boilerplate   |
| **GSAP + ScrollTrigger** | Hero scroll choreography, pinned sections    | Best-in-class scroll storytelling              |
| **tsparticles**      | Interactive particle canvas (hero background)     | Mouse-reactive, GPU-accelerated, lightweight   |
| **React Three Fiber**| 3D floating resume/document mesh in hero          | Declarative Three.js inside React components   |
| **Drei**             | FloatAnimation, Environment lighting, Sparkles    | Helper primitives for R3F                      |

**The "No Boring Page" Rule — applied to every screen:**
- Every card has hover lift + glow shadow (CSS transform + box-shadow)
- Every button has ripple press + scale-down micro-animation (Framer Motion)
- Every data transition uses spring physics (stiffness 300, damping 25)
- Navigation transitions use slide + fade choreography
- Loading states use pulsing skeleton screens (not spinners)
- Numbers count up when they enter the viewport (GSAP ScrollTrigger)

---

## 🗂️ Project Directory Structure

```
Resume-builder/
├── client/                          # React (Vite) frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx          # Animated collapsible nav
│   │   │   │   └── AppShell.jsx         # Main layout wrapper
│   │   │   ├── ui/
│   │   │   │   ├── GlassCard.jsx        # Glassmorphic card primitive
│   │   │   │   ├── AnimatedButton.jsx   # Ripple + spring button
│   │   │   │   ├── MatchScore.jsx       # Circular progress ring
│   │   │   │   └── SkeletonLoader.jsx   # Pulse loading states
│   │   │   ├── three/
│   │   │   │   ├── HeroScene.jsx        # R3F 3D floating document mesh
│   │   │   │   └── ParticleField.jsx    # tsparticles background
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardHome.jsx    # Animated stats + quick actions
│   │   │   ├── jobs/
│   │   │   │   └── JobIntelligence.jsx  # Job cards + match scores
│   │   │   ├── tailor/
│   │   │   │   └── ResumeTailor.jsx     # Side-by-side diff view
│   │   │   └── coach/
│   │   │       └── InterviewCoach.jsx   # Chat UI + scoring gauges
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Firebase auth state
│   │   ├── hooks/
│   │   │   └── useCountUp.js            # GSAP number counter hook
│   │   ├── lib/
│   │   │   └── firebase.js              # Firebase client init
│   │   ├── index.css                    # Design tokens + global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── server/                          # Node.js / Express backend
    ├── src/
    │   ├── config/
    │   │   ├── firebase.js              # Admin SDK init
    │   │   └── groq.js                  # Groq client init
    │   ├── middleware/
    │   │   └── authMiddleware.js        # JWT token verification
    │   ├── controllers/
    │   │   ├── resumeController.js      # Upload + parse PDF
    │   │   ├── tailorController.js      # Groq LLM resume rewriting
    │   │   ├── scrapeController.js      # Simulated job aggregator
    │   │   └── coachController.js       # RAG interview sessions
    │   └── index.js                     # Express app entry
    ├── .env
    └── package.json
```

---

## 🚀 Phases of Implementation

---

### Phase 1 — Foundation: Environment + Design System + Auth
**Goal:** Monorepo up, Firebase Auth working, design tokens locked in, stunning auth pages live.

**Steps:**
- **1.1** Initialize Vite React app in `client/` and Express server in `server/`
- **1.2** Configure `.env` files — Firebase public config for client, Admin SDK service account for server
- **1.3** Define complete CSS design token system in `index.css` (all color, spacing, typography, blur tokens)
- **1.4** Import `Outfit` font (Google Fonts), set base font sizes and line heights
- **1.5** Build `LoginPage.jsx` — full-screen split layout: left side has animated 3D scene (React Three Fiber floating particles + text mesh), right side has glassmorphic form card
- **1.6** Build `RegisterPage.jsx` — Google Sign-In button + Email/Password fields with real-time inline validation animations (Framer Motion)
- **1.7** Create `AuthContext.jsx` — wraps app with `onAuthStateChanged`, exposes `user`, `login`, `logout`, `register`
- **1.8** Implement `authMiddleware.js` on server — extracts Bearer token, calls `admin.auth().verifyIdToken()`
- **1.9** Add animated route transitions between Login ↔ Register ↔ Dashboard using Framer Motion `AnimatePresence`

**Deliverable:** Working auth flow with stunning animated login screens.

---

### Phase 2 — Master Resume Upload & Parsing Engine
**Goal:** User uploads PDF, sees live parsing progress animation, profile saved to Firestore.

**Steps:**
- **2.1** Build `AppShell.jsx` — animated collapsible sidebar (GSAP slide + width tween), main content area
- **2.2** Build `Sidebar.jsx` — glowing active state nav items with icon + label, Framer Motion hover lift
- **2.3** Build `DashboardHome.jsx` — animated welcome stats (GSAP count-up numbers), quick-action floating cards
- **2.4** Build drag-and-drop PDF upload zone with `react-dropzone` — animated dashed border pulse, accept/reject state animations
- **2.5** Server: `/api/resume/upload` endpoint — `multer` memory storage → `pdf-parse` buffer extraction
- **2.6** Display extraction result: animated character-by-character "scanning" reveal of extracted text preview
- **2.7** Save parsed text + metadata to Firestore `users/{uid}/master_profiles/latest`
- **2.8** Build `GlassCard.jsx` primitive — `backdrop-filter: blur(16px)`, border gradient, hover glow effect
- **2.9** Build `SkeletonLoader.jsx` — shimmering placeholders for all async states

**Deliverable:** Premium PDF upload and profile parsing experience.

---

### Phase 3 — Simulated Job Intelligence & Match Engine
**Goal:** Curated job cards appear, each scored and ranked against user profile.

**Steps:**
- **3.1** Populate Firestore `jobs/` collection with 20–30 rich mock job listings (realistic descriptions, required skills, salaries)
- **3.2** Server: `/api/jobs/feed` — returns paginated jobs, filtered/sorted by match score
- **3.3** Build keyword extraction scoring function — counts overlapping skills/keywords between job description and master resume text, returns 0–100% score
- **3.4** Build `JobIntelligence.jsx` — masonry card grid with Framer Motion staggered entry animation (cards cascade in with spring physics)
- **3.5** Build `MatchScore.jsx` — SVG circular progress ring, animated stroke-dashoffset, color-coded (green >75%, yellow 50–75%, red <50%)
- **3.6** Build filter bar — animated pill tabs (role type, location, remote, score threshold)
- **3.7** Job card hover — 3D tilt effect using mouse position tracking (CSS perspective transform)
- **3.8** "Apply" action triggers confetti burst (canvas-confetti) for positive reinforcement

**Deliverable:** Live, animated job intelligence board with real match scoring.

---

### Phase 4 — Groq-Powered Smart Resume Tailor
**Goal:** User selects a job, AI rewrites resume bullets to maximize ATS compatibility.

**Steps:**
- **4.1** Install `groq-sdk` on server, configure in `server/src/config/groq.js`
- **4.2** Server: `/api/resume/tailor` — structured prompt sent to `llama-3.3-70b-versatile` containing:
  - System: ATS expert rewriter persona
  - User: [Job Description] + [Current Bullets]
  - Returns: JSON array of rewritten bullets + keywords injected + match score delta
- **4.3** Build `ResumeTailor.jsx` — left panel: original bullets (dimmed), right panel: AI-generated bullets (highlighted in accent color with typing typewriter animation)
- **4.4** Keyword pills: each injected keyword animates in as a pill tag (Framer Motion scale-in)
- **4.5** "Accept" button on each bullet — accepted bullets merge into a "Tailored Resume" section with animated reorder
- **4.6** "Copy to Clipboard" and "Download as PDF" actions on completed tailored resume
- **4.7** Display ATS compatibility score — animated circular gauge + before/after delta indicator

**Deliverable:** Side-by-side AI resume rewriter with live animations.

---

### Phase 5 — RAG Interview Coach
**Goal:** AI coach reads tailored resume + job description, generates interview Q&A, grades responses.

**Steps:**
- **5.1** Server: `/api/coach/session` — initializes session context with resume + job text, stores in memory per uid
- **5.2** Server: `/api/coach/respond` — sends user's answer back, uses `gemma2-9b-it` (fast model) to analyze STAR method compliance, returns score + feedback
- **5.3** Build `InterviewCoach.jsx` — split-panel: top half shows current question in large animated text, bottom half is user response text area + mic icon (future: voice)
- **5.4** AI message bubbles animate in with slide-up + fade (Framer Motion)
- **5.5** Score display: animated radar chart (Chart.js) showing dimensions — Clarity, Specificity, Impact, Relevance
- **5.6** "Next Question" button triggers particle burst + new question fade-in transition
- **5.7** Session summary screen: overall performance card with confetti on high scores

**Deliverable:** Fully interactive, animated interview simulation coach.

---

### Phase 6 — Polish, 3D Hero & Deploy
**Goal:** Landing page with 3D scene, final polish, responsive, deployed.

**Steps:**
- **6.1** Build 3D hero section: React Three Fiber scene with floating resume document mesh, `<Sparkles>` from Drei, `<Float>` animation, `<Environment>` preset lighting
- **6.2** tsparticles hero background — mouse-reactive neural-network particle field
- **6.3** GSAP ScrollTrigger hero text reveal — words cascade in as user scrolls to the dashboard
- **6.4** Responsive layout audit: sidebar collapses to bottom nav on mobile, card grids reflow to single column
- **6.5** Respect `prefers-reduced-motion` — disable non-essential animations for accessibility
- **6.6** Deploy server to **Render** (free tier, persistent), client to **Vercel** (zero-config Vite deploy)
- **6.7** Final pass: all loading states, error boundaries, and empty states have friendly illustrated micro-states

**Deliverable:** Live, deployed, fully animated AI career acceleration platform.

---

## 📦 Complete npm Package List

### Client (`client/package.json`)
```json
{
  "framer-motion": "^11.x",
  "@tsparticles/react": "^3.x",
  "@tsparticles/slim": "^3.x",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "three": "^0.165.x",
  "gsap": "^3.12.x",
  "react-dropzone": "^14.x",
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x",
  "canvas-confetti": "^1.x",
  "firebase": "^10.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

### Server (`server/package.json`)
```json
{
  "express": "^4.x",
  "firebase-admin": "^12.x",
  "groq-sdk": "^0.9.x",
  "multer": "^1.x",
  "pdf-parse": "^1.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "helmet": "^7.x"
}
```

---

## ✅ Verification Plan

### Automated Checks
```bash
# Auth middleware test
curl -X GET http://localhost:5000/api/jobs/feed -H "Authorization: Bearer <JWT>"

# PDF parsing test
curl -X POST http://localhost:5000/api/resume/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "pdfFile=@sample_resume.pdf"

# Tailor endpoint test
curl -X POST http://localhost:5000/api/resume/tailor \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"jobDescription":"...", "bullets":["..."]}'
```

### Manual Visual Checks
1. All Framer Motion transitions run at 60fps (check Chrome DevTools Performance tab)
2. 3D hero scene loads without frame drops on mid-range hardware
3. tsparticles responds to mouse movement in real time
4. GSAP ScrollTrigger fires correctly on scroll
5. Match score rings animate correctly on all score ranges
6. Chat bubbles in Interview Coach slide in smoothly
7. Full responsive test: 375px (iPhone SE), 768px (iPad), 1440px (desktop)
