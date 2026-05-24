'use strict';
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Team Task Manager — Comprehensive Database Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix: passwords are hashed in parallel BEFORE connecting to MongoDB so the
 * Atlas free-tier connection never idles during bcrypt work (ECONNRESET fix).
 * All documents are inserted with insertMany() — one round-trip per collection.
 *
 * Run:  node scripts/seed.js          (from team-task-manager/backend/)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path    = require('path');
const bcrypt  = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv  = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User    = require('../models/User');
const Project = require('../models/Project');
const Task    = require('../models/Task');

/* ── helpers ─────────────────────────────────────────────────────────────── */
const daysFromNow = (d) => new Date(Date.now() + d * 86_400_000);
const pad         = (s, n) => String(s).padEnd(n);

/* ── raw user definitions (plain-text passwords) ─────────────────────────── */
const RAW_USERS = [
  { name: 'Anurag',    email: 'admin@taskflow.dev',    password: 'Admin@1234',  role: 'admin',  isActive: true  },
  { name: 'Reyan',     email: 'reyan@taskflow.dev',    password: 'Member@1234', role: 'member', isActive: true  },
  { name: 'Harshit',   email: 'harshit@taskflow.dev',  password: 'Member@1234', role: 'member', isActive: true  },
  { name: 'Bhumi',     email: 'bhumi@taskflow.dev',    password: 'Member@1234', role: 'member', isActive: true  },
  { name: 'Suryaveer', email: 'suryaveer@taskflow.dev',password: 'Member@1234', role: 'member', isActive: true  },
  { name: 'Yamini',    email: 'yamini@taskflow.dev',   password: 'Member@1234', role: 'member', isActive: true  },
  { name: 'Harsh',     email: 'harsh@taskflow.dev',    password: 'Member@1234', role: 'member', isActive: false },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
async function seed() {
  /* ── STEP 1: hash all passwords BEFORE opening the DB connection ────────
     bcrypt with 10 rounds × 6 users ≈ 1-2 s total, done in parallel.
     Keeping this outside the DB connection prevents the Atlas free-tier
     socket from idling and triggering ECONNRESET.                          */
  console.log('\n⏳  Hashing passwords …');
  const hashedUsers = await Promise.all(
    RAW_USERS.map(async (u) => ({
      ...u,
      password: await bcrypt.hash(u.password, 10),
    }))
  );
  console.log('🔐  Passwords hashed\n');

  /* ── STEP 2: connect ──────────────────────────────────────────────────── */
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log('✅  Connected to MongoDB');

  /* ── STEP 3: wipe existing data ───────────────────────────────────────── */
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
  ]);
  console.log('🗑️   Cleared: users, projects, tasks\n');

  /* ── STEP 4: insert users (single round-trip, no pre-save hook needed) ── */
  const users = await User.insertMany(hashedUsers, { ordered: true });
  const [admin, reyan, harshit, bhumi, suryaveer, yamini] = users;

  console.log('👥  Users created:');
  users.forEach((u, i) =>
    console.log(
      `     ${u.role === 'admin' ? '👑' : '👤'} ` +
      `${pad(u.name, 16)} ${pad(u.email, 26)} ` +
      `[${u.role}]${u.isActive ? '' : '  ⚠ inactive'}`
    )
  );

  /* ── STEP 5: insert projects (single round-trip) ──────────────────────── */
  const projectDocs = await Project.insertMany([
    {
      name:        'Website Redesign',
      description: 'Full overhaul of the company website — new design system, improved performance, and a mobile-first responsive layout.',
      status:      'active',
      color:       '#6366f1',
      createdBy:   admin._id,
      members:     [reyan._id, harshit._id, bhumi._id],
      deadline:    daysFromNow(45),
    },
    {
      name:        'Mobile App v2.0',
      description: 'Major release with push notifications, dark mode, offline support, and a redesigned onboarding flow.',
      status:      'active',
      color:       '#22c55e',
      createdBy:   admin._id,
      members:     [reyan._id, suryaveer._id],
      deadline:    daysFromNow(60),
    },
    {
      name:        'API Gateway Migration',
      description: 'Migrate all microservices from REST to GraphQL, add rate limiting, and publish comprehensive API docs.',
      status:      'active',
      color:       '#f97316',
      createdBy:   admin._id,
      members:     [harshit._id, bhumi._id, suryaveer._id],
      deadline:    daysFromNow(30),
    },
    {
      name:        'Q1 Marketing Campaign',
      description: 'Plan and execute the Q1 digital campaign: social media, email newsletters, and paid ads.',
      status:      'on-hold',
      color:       '#ec4899',
      createdBy:   admin._id,
      members:     [reyan._id, bhumi._id],
      deadline:    daysFromNow(-5),
    },
    {
      name:        'Internal Dashboard v3',
      description: 'Rebuild the internal analytics dashboard with real-time charts, role-based views, and CSV export.',
      status:      'completed',
      color:       '#14b8a6',
      createdBy:   admin._id,
      members:     [harshit._id, suryaveer._id],
      deadline:    daysFromNow(-20),
    },
  ]);

  const [p1, p2, p3, p4, p5] = projectDocs;

  console.log('\n📁  Projects created:');
  projectDocs.forEach((p) =>
    console.log(
      `     ${p.status === 'completed' ? '✅' : p.status === 'on-hold' ? '⏸️ ' : '🔵'} ` +
      `${pad(p.name, 30)} [${p.status}]`
    )
  );

  /* ── STEP 6: build task documents ────────────────────────────────────────
     completedAt is set manually here (no pre-save hook with insertMany).
     The rule mirrors the Task model: set completedAt when status=completed. */
  const now = new Date();

  const buildTask = (fields) => ({
    ...fields,
    completedAt: fields.status === 'completed' ? now : null,
  });

  const taskDocs = [

    /* ══════════════════════════════════════════════════════════════════════
       PROJECT 1 — Website Redesign  (7 tasks)
       ══════════════════════════════════════════════════════════════════════ */
    buildTask({
      title:       'Audit current website performance',
      description: 'Run Lighthouse audits on all key pages. Document scores for performance, accessibility, SEO, and best practices.',
      status: 'completed', priority: 'high',
      project: p1._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-30), tags: ['audit', 'performance', 'seo'],
    }),
    buildTask({
      title:       'Create new design system in Figma',
      description: 'Define color palette, typography scale, spacing tokens, icon set, and a reusable component library.',
      status: 'completed', priority: 'high',
      project: p1._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-15), tags: ['design', 'figma', 'design-system'],
    }),
    buildTask({
      title:       'Design homepage mockup',
      description: 'Create high-fidelity mockup: hero section, features grid, testimonials carousel, pricing table, and footer CTA.',
      status: 'completed', priority: 'high',
      project: p1._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-10), tags: ['design', 'homepage', 'mockup'],
    }),
    buildTask({
      title:       'Implement responsive navigation bar',
      description: 'Build the new top navigation with mobile hamburger menu, animated dropdowns, and sticky-on-scroll behaviour.',
      status: 'in-progress', priority: 'high',
      project: p1._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(7), tags: ['frontend', 'navigation', 'responsive'],
    }),
    buildTask({
      title:       'Build hero section component',
      description: 'Implement the animated hero with headline, sub-copy, dual CTA buttons, and background SVG illustration.',
      status: 'in-progress', priority: 'medium',
      project: p1._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(10), tags: ['frontend', 'component', 'animation'],
    }),
    buildTask({
      title:       'Write copy for About and Contact pages',
      description: 'Draft and finalise content: company story, mission, team bios, values, and contact form labels.',
      status: 'todo', priority: 'medium',
      project: p1._id, assignedTo: bhumi._id, createdBy: admin._id,
      deadline: daysFromNow(14), tags: ['content', 'copywriting'],
    }),
    buildTask({
      title:       'SEO meta tags and sitemap',
      description: 'Add Open Graph tags, Twitter card meta, canonical URLs, and generate an XML sitemap. Submit to Google Search Console.',
      status: 'todo', priority: 'low',
      project: p1._id, assignedTo: null, createdBy: admin._id,
      deadline: daysFromNow(-3), tags: ['seo', 'meta', 'sitemap'], // overdue + unassigned
    }),

    /* ══════════════════════════════════════════════════════════════════════
       PROJECT 2 — Mobile App v2.0  (8 tasks)
       ══════════════════════════════════════════════════════════════════════ */
    buildTask({
      title:       'Set up push notification service',
      description: 'Integrate Firebase Cloud Messaging for iOS and Android. Implement topic subscriptions and a preferences screen.',
      status: 'in-progress', priority: 'high',
      project: p2._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(12), tags: ['notifications', 'firebase', 'mobile'],
    }),
    buildTask({
      title:       'Implement dark mode',
      description: 'Add system-aware dark/light toggle. All screens, modals, and sheets must respect the theme. Persist in AsyncStorage.',
      status: 'in-progress', priority: 'high',
      project: p2._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(15), tags: ['dark-mode', 'theming', 'ui'],
    }),
    buildTask({
      title:       'Redesign onboarding flow',
      description: 'Create a 4-step onboarding carousel with illustrations, skip option, and a permissions request screen.',
      status: 'completed', priority: 'high',
      project: p2._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-8), tags: ['onboarding', 'ux', 'design'],
    }),
    buildTask({
      title:       'Add offline support with local cache',
      description: 'Use Redux Persist + SQLite to cache the last 50 feed items. Show offline banner and sync on reconnect.',
      status: 'todo', priority: 'high',
      project: p2._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(25), tags: ['offline', 'cache', 'redux'],
    }),
    buildTask({
      title:       'Write unit tests for auth module',
      description: 'Achieve 80%+ coverage on login, signup, token refresh, and logout using Jest and React Native Testing Library.',
      status: 'todo', priority: 'medium',
      project: p2._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(20), tags: ['testing', 'jest', 'auth'],
    }),
    buildTask({
      title:       'Performance profiling and optimisation',
      description: 'Profile with Flipper and React DevTools. Fix re-render bottlenecks, heavy list views, and slow image loading.',
      status: 'completed', priority: 'medium',
      project: p2._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(-5), tags: ['performance', 'profiling'],
    }),
    buildTask({
      title:       'App Store and Play Store screenshots',
      description: 'Create 6 promotional screenshots per platform. Follow Apple and Google guidelines for dimensions and safe zones.',
      status: 'todo', priority: 'low',
      project: p2._id, assignedTo: null, createdBy: admin._id,
      deadline: daysFromNow(40), tags: ['marketing', 'app-store'],
    }),
    buildTask({
      title:       'Beta testing with 20 internal users',
      description: 'Distribute via TestFlight and Firebase App Distribution. Collect feedback via Google Form. Triage all bugs.',
      status: 'todo', priority: 'medium',
      project: p2._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(50), tags: ['beta', 'testing', 'feedback'],
    }),

    /* ══════════════════════════════════════════════════════════════════════
       PROJECT 3 — API Gateway Migration  (8 tasks)
       ══════════════════════════════════════════════════════════════════════ */
    buildTask({
      title:       'Map all existing REST endpoints',
      description: 'Document every endpoint across 12 microservices: method, path, schema, auth requirements, and usage metrics.',
      status: 'completed', priority: 'high',
      project: p3._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(-20), tags: ['documentation', 'rest', 'api'],
    }),
    buildTask({
      title:       'Design GraphQL schema',
      description: 'Define types, queries, mutations, subscriptions, and input validation rules. Review with the backend team.',
      status: 'completed', priority: 'high',
      project: p3._id, assignedTo: bhumi._id, createdBy: admin._id,
      deadline: daysFromNow(-12), tags: ['graphql', 'schema', 'design'],
    }),
    buildTask({
      title:       'Implement resolvers for User service',
      description: 'Write resolvers for all User queries and mutations. Include DataLoader for N+1 prevention and field-level permissions.',
      status: 'in-progress', priority: 'high',
      project: p3._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(8), tags: ['graphql', 'resolvers', 'user-service'],
    }),
    buildTask({
      title:       'Implement resolvers for Product service',
      description: 'Write resolvers for Product queries, mutations, and subscriptions. Add cursor-based pagination and full-text search.',
      status: 'in-progress', priority: 'high',
      project: p3._id, assignedTo: bhumi._id, createdBy: admin._id,
      deadline: daysFromNow(10), tags: ['graphql', 'resolvers', 'product-service'],
    }),
    buildTask({
      title:       'Set up API rate limiting',
      description: 'Configure 100 req/min per IP for public endpoints, 1000 req/min for authenticated users. Return 429 with Retry-After.',
      status: 'todo', priority: 'high',
      project: p3._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(15), tags: ['rate-limiting', 'security', 'gateway'],
    }),
    buildTask({
      title:       'Write API documentation with Swagger',
      description: 'Generate OpenAPI 3.0 docs for all REST endpoints. Add GraphQL Playground with example queries.',
      status: 'todo', priority: 'medium',
      project: p3._id, assignedTo: bhumi._id, createdBy: admin._id,
      deadline: daysFromNow(22), tags: ['documentation', 'swagger', 'openapi'],
    }),
    buildTask({
      title:       'Load testing with k6',
      description: 'Simulate 500 concurrent users. Target: p95 latency < 200ms, 0% error rate at peak load.',
      status: 'todo', priority: 'medium',
      project: p3._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(28), tags: ['load-testing', 'k6', 'performance'],
    }),
    buildTask({
      title:       'Deprecate legacy REST endpoints',
      description: 'Add deprecation headers to migrated endpoints. Notify consumers via email. Set 90-day sunset date.',
      status: 'todo', priority: 'low',
      project: p3._id, assignedTo: null, createdBy: admin._id,
      deadline: daysFromNow(90), tags: ['deprecation', 'migration'],
    }),

    /* ══════════════════════════════════════════════════════════════════════
       PROJECT 4 — Q1 Marketing Campaign  (5 tasks, on-hold)
       ══════════════════════════════════════════════════════════════════════ */
    buildTask({
      title:       'Define campaign goals and KPIs',
      description: 'Set SMART goals: target MQLs, email open rate, social impressions, and paid ad ROAS. Get sign-off from director.',
      status: 'completed', priority: 'high',
      project: p4._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-25), tags: ['strategy', 'kpi', 'planning'],
    }),
    buildTask({
      title:       'Design email newsletter templates',
      description: 'Create 3 responsive HTML email templates in Mailchimp: welcome series, product update, and promotional offer.',
      status: 'in-progress', priority: 'high',
      project: p4._id, assignedTo: bhumi._id, createdBy: admin._id,
      deadline: daysFromNow(-3), tags: ['email', 'mailchimp', 'design'], // overdue
    }),
    buildTask({
      title:       'Create social media content calendar',
      description: 'Plan 30 days of posts across LinkedIn, Twitter, and Instagram with copy, visuals, hashtags, and posting times.',
      status: 'todo', priority: 'medium',
      project: p4._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(-1), tags: ['social-media', 'content', 'calendar'], // overdue
    }),
    buildTask({
      title:       'Set up Google Ads campaign',
      description: 'Create search and display campaigns. Define keyword groups, write 5 ad variations, set bid strategy, configure conversion tracking.',
      status: 'todo', priority: 'high',
      project: p4._id, assignedTo: null, createdBy: admin._id,
      deadline: daysFromNow(5), tags: ['paid-ads', 'google-ads', 'ppc'],
    }),
    buildTask({
      title:       'Weekly campaign performance report',
      description: 'Compile weekly report: impressions, clicks, conversions, and spend. Present to stakeholders every Friday.',
      status: 'todo', priority: 'medium',
      project: p4._id, assignedTo: reyan._id, createdBy: admin._id,
      deadline: daysFromNow(10), tags: ['analytics', 'reporting'],
    }),

    /* ══════════════════════════════════════════════════════════════════════
       PROJECT 5 — Internal Dashboard v3  (7 tasks, all completed)
       ══════════════════════════════════════════════════════════════════════ */
    buildTask({
      title:       'Requirements gathering and wireframes',
      description: 'Interview 8 stakeholders. Produce low-fidelity wireframes for all 6 dashboard views and get approval.',
      status: 'completed', priority: 'high',
      project: p5._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(-60), tags: ['requirements', 'wireframes', 'ux'],
    }),
    buildTask({
      title:       'Set up React + Recharts project scaffold',
      description: 'Initialise with Vite, configure Tailwind CSS, set up ESLint/Prettier, install Recharts, React Query, and Zustand.',
      status: 'completed', priority: 'high',
      project: p5._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(-55), tags: ['setup', 'react', 'recharts'],
    }),
    buildTask({
      title:       'Build real-time KPI cards',
      description: 'Implement KPI cards (revenue, active users, churn, NPS) with live WebSocket updates and sparkline trend indicators.',
      status: 'completed', priority: 'high',
      project: p5._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(-45), tags: ['frontend', 'websocket', 'kpi'],
    }),
    buildTask({
      title:       'Implement role-based dashboard views',
      description: 'Show different charts per role: executives see revenue/growth, ops see system health, marketing sees funnel metrics.',
      status: 'completed', priority: 'medium',
      project: p5._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(-38), tags: ['rbac', 'roles', 'views'],
    }),
    buildTask({
      title:       'Add CSV and PDF export functionality',
      description: 'Export any chart or table as CSV (PapaParse) or PDF (jsPDF + html2canvas). Include date range selection.',
      status: 'completed', priority: 'medium',
      project: p5._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(-30), tags: ['export', 'csv', 'pdf'],
    }),
    buildTask({
      title:       'Write end-to-end tests with Playwright',
      description: 'Cover 5 critical journeys: login, view dashboard, filter by date, export data, switch role view. Run in CI on every PR.',
      status: 'completed', priority: 'medium',
      project: p5._id, assignedTo: harshit._id, createdBy: admin._id,
      deadline: daysFromNow(-25), tags: ['testing', 'playwright', 'e2e'],
    }),
    buildTask({
      title:       'Deploy to production and monitor',
      description: 'Deploy to AWS ECS via GitHub Actions. Configure CloudWatch alarms for error rate and latency.',
      status: 'completed', priority: 'high',
      project: p5._id, assignedTo: suryaveer._id, createdBy: admin._id,
      deadline: daysFromNow(-20), tags: ['deployment', 'aws', 'monitoring'],
    }),
  ];

  /* ── STEP 7: insert all tasks in one round-trip ───────────────────────── */
  const insertedTasks = await Task.insertMany(taskDocs, { ordered: true });

  /* ── STEP 8: print summary ────────────────────────────────────────────── */
  const counts = insertedTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n✅  Tasks created: ${insertedTasks.length} total`);
  console.log(`     ✔  Completed   : ${counts['completed']  || 0}`);
  console.log(`     🔄 In Progress : ${counts['in-progress'] || 0}`);
  console.log(`     📋 To Do       : ${counts['todo']        || 0}`);

  /* ── STEP 9: credentials table ────────────────────────────────────────── */
  const LINE = '─'.repeat(65);
  console.log('\n' + LINE);
  console.log('  DEMO CREDENTIALS');
  console.log(LINE);
  console.log(`  ${pad('Role', 8)} ${pad('Name', 16)} ${pad('Email', 26)} Password`);
  console.log(LINE);
  RAW_USERS.forEach((u) =>
    console.log(
      `  ${pad(u.role, 8)} ${pad(u.name, 16)} ${pad(u.email, 26)} ` +
      `${u.password}${u.isActive ? '' : '  ⚠ inactive'}`
    )
  );
  console.log(LINE);
  console.log('\n🎉  Seed complete!  Open http://localhost:3000 to explore.\n');

  await mongoose.disconnect();
  process.exit(0);
}

/* ── run ──────────────────────────────────────────────────────────────────── */
seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message || err);
  if (err.errors) {
    Object.values(err.errors).forEach((e) => console.error('   •', e.message));
  }
  mongoose.disconnect();
  process.exit(1);
});
