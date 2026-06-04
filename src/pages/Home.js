import React, { useState } from 'react';
import { FaSearch, FaLaptopCode, FaQuran } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

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

// Display order of the category groups; "Real Estate" leads.
const GROUP_ORDER = ["Real Estate", "AI & Productivity", "Mobile & Web"];

function Home() {
  const navigate = useNavigate();

  const projects = [
    {
      title: "Realtor Doc Processor",
      description: "AI pipeline that classifies, splits, and organizes messy real estate PDF packets into named documents with a transaction summary. Runs a text model (NVIDIA Nemotron Super) and a vision model together, reconciling both readings for accuracy, plus OCR.",
      link: null,
      externalLink: "https://realtor-doc-processor.vercel.app/",
      logo: <DocProcessorLogo />,
      group: "Real Estate",
      category: "AI / Python",
      level: "Full-Stack",
      tech: ["Python", "FastAPI", "Nemotron", "Vision LLM", "OCR"],
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
    (project.level || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bucket the (filtered) projects into category groups, preserving GROUP_ORDER
  // and appending any unexpected group at the end.
  const groupNames = [
    ...GROUP_ORDER.filter(g => filteredProjects.some(p => p.group === g)),
    ...[...new Set(filteredProjects.map(p => p.group))].filter(g => !GROUP_ORDER.includes(g)),
  ];

  const renderCard = (p, i) => (
    <div
      key={p.title + i}
      className="proj-card"
      onClick={() => p.link ? navigate(p.link) : p.externalLink && window.open(p.externalLink, '_blank')}
    >
      <div className={`proj-icon${p.logo ? ' proj-logo' : ''}`}>{p.logo || p.icon}</div>
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <div className="proj-tech">
        {(p.tech || []).map((t) => <span key={t}>{t}</span>)}
      </div>
      <div><span className="proj-cat">{p.category}</span></div>
    </div>
  );

  return (
    <div className="home-wrap">
      {/* Intro */}
      <section className="home-hero">
        <img
          src="/ChatGPT Image Dec 24, 2025, 03_10_52 AM.png"
          alt="Profile"
          className="home-avatar"
        />
        <div>
          <h1>Hi, I'm Asad — Full-Stack Developer</h1>
          <p>I build real products — AI pipelines, mobile apps, and full-stack platforms.</p>
        </div>
      </section>

      {/* Search */}
      <div className="home-search-wrap">
        <FaSearch style={{ position: "absolute", left: "39px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", fontSize: "1rem" }} />
        <input
          type="text"
          className="home-search"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects grouped by category */}
      {groupNames.map((group) => (
        <section key={group} className="home-group">
          <h2 className="home-group-title">
            {group}
            <span className="home-group-count">
              {filteredProjects.filter(p => p.group === group).length}
            </span>
          </h2>
          <div className="home-grid">
            {filteredProjects.filter(p => p.group === group).map(renderCard)}
          </div>
        </section>
      ))}

      {filteredProjects.length === 0 && (
        <div className="home-empty">No projects found matching "{searchTerm}"</div>
      )}

      <footer className="home-foot">
        Built with patience, practice, and curiosity. Total Projects: {projects.length}
      </footer>
    </div>
  );
}

export default Home;
