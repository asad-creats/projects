import React, { useState } from 'react';
import {
  FaSearch, FaLaptopCode, FaQuran, FaUserCheck, FaGithub, FaArrowRight,
  FaExternalLinkAlt, FaEnvelope, FaRobot, FaHome, FaLayerGroup,
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import './Home.css';

// Brand logos (inline SVG) for the flagship projects.
const TallyLogo = () => (
  <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="tally-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f5d142" />
        <stop offset="1" stopColor="#e0922f" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#tally-g)" />
    <path d="M11 20.5l5.5 5.5L29 13" fill="none" stroke="#1a1712" strokeWidth="4"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const QuorumLogo = () => (
  <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="quorum-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5b63ff" />
        <stop offset="1" stopColor="#3b45d6" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#quorum-g)" />
    <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12.7" y="10.7" width="9" height="7" rx="3.5" transform="rotate(45 17.2 14.2)" />
      <rect x="18.3" y="22.3" width="9" height="7" rx="3.5" transform="rotate(45 22.8 25.8)" />
    </g>
  </svg>
);

const DocProcessorLogo = () => (
  <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="doc-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5eead4" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#doc-g)" />
    <g fill="none" stroke="#0b1220" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 10h7l5 5v15a1 1 0 0 1-1 1H16a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z" />
      <path d="M23 10v5h5" />
      <path d="M18.5 22h7M18.5 26h4.5" />
    </g>
  </svg>
);

const LeadRadarLogo = () => (
  <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
    <defs>
      <linearGradient id="leadradar-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fb7185" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#leadradar-g)" />
    <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="20" cy="20" r="10" opacity="0.55" />
      <circle cx="20" cy="20" r="5" />
      <path d="M20 20l7-7" />
    </g>
    <circle cx="26.5" cy="24.5" r="2" fill="#fff" />
  </svg>
);

// Display order of the category groups; "Real Estate" leads.
const GROUP_ORDER = ["Real Estate", "AI & Productivity", "Mobile & Web"];

// Personal details shown in the hero, About and Contact sections.
// Edit these to change what the page says about you.
const PROFILE = {
  name: "Asad",
  headline: "I build AI tools and full-stack apps.",
  status: "Full-stack developer · open to work",
  tagline: "From AI document pipelines for realtors to team apps with real-time sync — I ship working products you can click through today, not just mockups.",
  aboutHeading: "I turn messy, real-world work into simple, AI-powered software.",
  bio: [
    "After five years as a transaction coordinator and virtual assistant for US real estate teams, and with daily hands-on work in real estate CRMs, I know the problems agents and coordinators face because I’ve faced them myself. That inside view shapes everything I build.",
    "I create full-stack web apps, agentic AI workflows, and business automations that take repetitive work off people’s plates, from processing documents to managing leads and generating reports. I use AI where it saves real time, never just for show.",
    "I learn by building, and every project sharpens the next. If your team is buried in manual work, I can help you automate it.",
  ],
  github: "https://github.com/asad-creats",
  email: "asadssubhani@gmail.com",
  contactNote: "I'm open to freelance projects and full-time roles, especially in real estate tech and AI tooling. Reach out and I'll get back to you quickly.",
};

const NAV = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

const FOCUS = [
  { icon: <FaRobot />, title: "Practical AI", text: "Document classification, OCR, lead scoring and chat agents that call real tools." },
  { icon: <FaHome />, title: "Real estate tech", text: "Software for agents and transaction coordinators: deals, documents, follow-ups." },
  { icon: <FaLayerGroup />, title: "Full-stack products", text: "Auth, databases, row-level security, deploys — end to end, not just the UI." },
];

const PRINCIPLES = [
  { title: "Ship something real", text: "Every project has a working build. Most have a live demo you can try without signing up." },
  { title: "Explain it plainly", text: "Scores come with a reason, AI output gets a review step, and docs are written for people." },
  { title: "Keep costs sane", text: "Free tiers and local models by default, with paid AI as an opt-in upgrade." },
];

const SKILLS = [
  { group: "Frontend", items: ["React", "JavaScript", "Vite", "TanStack Query", "HTML & CSS"] },
  { group: "Backend", items: ["Python", "FastAPI", "REST APIs", "Docker"] },
  { group: "AI & Vision", items: ["Gemini API", "Claude API", "Ollama", "OCR", "OpenCV", "ONNX"] },
  { group: "Data & Cloud", items: ["Supabase", "Postgres + RLS", "Firebase", "SQLite", "Vercel"] },
  { group: "Mobile & Desktop", items: ["Capacitor", "Android", "Tkinter"] },
];

function Home() {
  const navigate = useNavigate();

  const projects = [
    {
      title: "Realtor Doc Processor",
      description: "AI pipeline that classifies, splits, and organizes messy real estate PDF packets into named documents with a transaction summary. Uses Google Gemini (multimodal) to read both document text and page images, with OCR for scanned pages.",
      link: null,
      externalLink: "https://realtor-doc-processor.vercel.app/",
      logo: <DocProcessorLogo />,
      group: "Real Estate",
      category: "AI / Python",
      level: "Full-Stack",
      tech: ["Python", "FastAPI", "Gemini", "Vision", "OCR"],
    },
    {
      title: "TC Command Center",
      description: "Full-stack dashboard for real estate transaction coordinators. React frontend on Vercel, FastAPI backend on Docker, Firebase auth.",
      link: null,
      externalLink: "https://commandcenter-indol-zeta.vercel.app/",
      icon: <FaLaptopCode />,
      group: "Real Estate",
      category: "Full-Stack",
      level: "Full-Stack",
      tech: ["React", "Vite", "FastAPI", "Firebase", "TanStack Query"],
    },
    {
      title: "LeadRadar",
      description: "Lead-scoring dashboard for Follow Up Boss CRM. Syncs leads, calls, texts and deals, ranks every lead Hot/Warm/Cold with a plain-English reason, and builds a daily call list and HTML reports with charts. Live demo runs on realistic sample data.",
      link: null,
      externalLink: "https://followupboss-psi.vercel.app/",
      logo: <LeadRadarLogo />,
      group: "Real Estate",
      category: "Data / Python",
      level: "Full-Stack",
      tech: ["Python", "FastAPI", "SQLite", "Follow Up Boss API", "Charts"],
    },
    {
      title: "Tally",
      description: "Smart to-do app with Supabase backend, local AI via Ollama, Gemini integration, and an AI agent that can manage your tasks through chat.",
      link: "/todo",
      logo: <TallyLogo />,
      group: "AI & Productivity",
      category: "AI / Productivity",
      level: "Full-Stack",
      tech: ["React", "Supabase", "Ollama", "Gemini API"],
    },
    {
      title: "Quorum",
      description: "Multi-user workforce app: HR adds employees and sets passwords, everyone logs in separately, and all tasks/timers/status persist to a database. Availability is computed from committed hours; task times are agreed by team consensus and sealed to a blockchain ledger.",
      link: "/quorum",
      logo: <QuorumLogo />,
      group: "AI & Productivity",
      category: "Full-Stack",
      level: "Full-Stack",
      tech: ["React", "Supabase", "Postgres RLS", "Edge Functions"],
    },
    {
      title: "Face Recognition Attendance",
      description: "Desktop app that marks attendance from a webcam. Recognized faces are logged to Excel with time-in once per day; unknown faces get a provisional ID and can be named in one click. Runs fully offline with OpenCV's YuNet detector and SFace recognizer.",
      link: null,
      icon: <FaUserCheck />,
      group: "AI & Productivity",
      category: "AI / Computer Vision",
      level: "Desktop",
      tech: ["Python", "OpenCV", "ONNX", "Tkinter", "Excel"],
    },
    {
      title: "Tilawah Together",
      description: "Cross-platform app for collaborative Quran reading tracking. Native Android via Capacitor, real-time sync with Firebase.",
      link: null,
      icon: <FaQuran />,
      group: "Mobile & Web",
      category: "Mobile / Web",
      level: "Full-Stack",
      tech: ["Capacitor", "Firebase", "Android", "JavaScript"],
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.level || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.tech || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Bucket the (filtered) projects into category groups, preserving GROUP_ORDER
  // and appending any unexpected group at the end.
  const groupNames = [
    ...GROUP_ORDER.filter(g => filteredProjects.some(p => p.group === g)),
    ...[...new Set(filteredProjects.map(p => p.group))].filter(g => !GROUP_ORDER.includes(g)),
  ];

  const openProject = (p) => {
    if (p.link) navigate(p.link);
    else if (p.externalLink) window.open(p.externalLink, '_blank', 'noopener');
  };

  const renderCard = (p, i) => {
    const clickable = Boolean(p.link || p.externalLink);
    return (
      <div
        key={p.title + i}
        className={`proj-card${clickable ? '' : ' is-static'}`}
        onClick={() => openProject(p)}
        onKeyDown={(e) => clickable && (e.key === 'Enter' || e.key === ' ') && openProject(p)}
        role={clickable ? 'link' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        <div className="proj-top">
          <div className={`proj-icon${p.logo ? ' proj-logo' : ''}`}>{p.logo || p.icon}</div>
          <span className="proj-cat">{p.category}</span>
        </div>
        <h3>{p.title}</h3>
        <p>{p.description}</p>
        <div className="proj-tech">
          {(p.tech || []).map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="proj-cta">
          {p.link && <>Open the app <FaArrowRight /></>}
          {!p.link && p.externalLink && <>Live demo <FaExternalLinkAlt /></>}
          {!clickable && <span className="proj-cta-muted">{p.level} app · demo on request</span>}
        </div>
      </div>
    );
  };

  const liveCount = projects.filter(p => p.link || p.externalLink).length;
  const skillCount = SKILLS.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="home-wrap">
      {/* Top navigation */}
      <header className="home-nav">
        <a href="#top" className="home-brand">
          <span className="home-brand-mark">{PROFILE.name[0]}</span>
          <span>{PROFILE.name}</span>
        </a>
        <nav className="home-nav-links">
          {NAV.map(n => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
        </nav>
        <a className="home-nav-cta" href={PROFILE.github} target="_blank" rel="noreferrer">
          <FaGithub /> <span>GitHub</span>
        </a>
      </header>

      {/* Hero */}
      <section className="home-hero" id="top">
        <div className="home-hero-text">
          <div className="home-eyebrow"><span className="home-pulse" /> {PROFILE.status}</div>
          <h1>
            Hi, I'm {PROFILE.name}.<br />
            <span className="home-hero-accent">{PROFILE.headline}</span>
          </h1>
          <p>{PROFILE.tagline}</p>
          <div className="home-hero-actions">
            <a href="#work" className="home-btn primary">See my work <FaArrowRight /></a>
            <a href="#about" className="home-btn">About me</a>
          </div>
        </div>
        <div className="home-hero-photo">
          <img src="/profile.png" alt={PROFILE.name} className="home-avatar" />
        </div>
      </section>

      <div className="home-stats">
        <div><b>{projects.length}</b><span>projects built</span></div>
        <div><b>{liveCount}</b><span>live demos to try</span></div>
        <div><b>{projects.filter(p => p.group === 'Real Estate').length}</b><span>real estate tools</span></div>
        <div><b>{skillCount}+</b><span>tools &amp; technologies</span></div>
      </div>

      {/* Work */}
      <section className="home-section" id="work">
        <div className="home-section-head">
          <div>
            <div className="home-kicker">Selected work</div>
            <h2>Things I've built</h2>
          </div>
          <div className="home-search-wrap">
            <FaSearch className="home-search-icon" />
            <input
              type="text"
              className="home-search"
              placeholder="Search by name or tech…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {groupNames.map((group) => (
          <div key={group} className="home-group">
            <h3 className="home-group-title">
              {group}
              <span className="home-group-count">
                {filteredProjects.filter(p => p.group === group).length}
              </span>
            </h3>
            <div className="home-grid">
              {filteredProjects.filter(p => p.group === group).map(renderCard)}
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="home-empty">No projects found matching "{searchTerm}"</div>
        )}
      </section>

      {/* About */}
      <section className="home-section" id="about">
        <div className="home-about">
          <div>
            <div className="home-kicker">About me</div>
            <h2>{PROFILE.aboutHeading}</h2>
            {PROFILE.bio.map((para, i) => <p key={i} className="home-about-p">{para}</p>)}
          </div>
          <div className="home-focus">
            {FOCUS.map(f => (
              <div key={f.title} className="home-focus-card">
                <div className="home-focus-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="home-principles">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className="home-principle">
              <span className="home-principle-num">0{i + 1}</span>
              <h4>{p.title}</h4>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="home-section" id="skills">
        <div className="home-kicker">Toolbox</div>
        <h2>Skills &amp; technologies</h2>
        <div className="home-skills">
          {SKILLS.map(s => (
            <div key={s.group} className="home-skill-group">
              <h4>{s.group}</h4>
              <div className="home-chips">
                {s.items.map(item => <span key={item}>{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="home-section" id="contact">
        <div className="home-contact">
          <div>
            <div className="home-kicker">Contact</div>
            <h2>Have a project or a role in mind?</h2>
            <p>{PROFILE.contactNote}</p>
          </div>
          <div className="home-contact-links">
            {PROFILE.email && (
              <a href={`mailto:${PROFILE.email}`} className="home-btn primary"><FaEnvelope /> Email me</a>
            )}
            <a href={PROFILE.github} target="_blank" rel="noreferrer"
              className={`home-btn${PROFILE.email ? '' : ' primary'}`}>
              <FaGithub /> GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="home-foot">
        <span>© {new Date().getFullYear()} {PROFILE.name}</span>
        <span>Built with patience, practice, and curiosity.</span>
      </footer>
    </div>
  );
}

export default Home;
