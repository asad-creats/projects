import React, { useState } from 'react';
import { FaSearch, FaLaptopCode, FaFileAlt, FaQuran, FaRobot } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const projects = [
    {
      title: "Realtor Doc Processor",
      description: "AI pipeline that classifies, splits, and organizes messy real estate PDF packets into named documents with a transaction summary. Uses Ollama vision models + OCR.",
      link: null,
      icon: <FaFileAlt />,
      category: "AI / Python",
      level: "Full-Stack",
      tech: ["Python", "Ollama", "OCR", "pdfplumber", "reportlab"],
    },
    {
      title: "TC Command Center",
      description: "Full-stack dashboard for real estate transaction coordinators. React frontend on Vercel, FastAPI backend on Docker, Firebase auth.",
      link: null,
      externalLink: "https://commandcenter-indol-zeta.vercel.app/",
      icon: <FaLaptopCode />,
      category: "Full-Stack",
      level: "Full-Stack",
      tech: ["React", "Vite", "FastAPI", "Firebase", "TanStack Query"],
    },
    {
      title: "Tilawah Together",
      description: "Cross-platform app for collaborative Quran reading tracking. Native Android via Capacitor, real-time sync with Firebase.",
      link: null,
      icon: <FaQuran />,
      category: "Mobile / Web",
      level: "Full-Stack",
      tech: ["Capacitor", "Firebase", "Android", "JavaScript"],
    },
    {
      title: "AI Task Manager",
      description: "Smart to-do app with Supabase backend, local AI via Ollama, Gemini integration, and an AI agent that can manage your tasks through chat.",
      link: "/todo",
      icon: <FaRobot />,
      category: "AI / Productivity",
      level: "Full-Stack",
      tech: ["React", "Supabase", "Ollama", "Gemini API"],
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.level || '').toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Projects */}
      <section className="home-grid">
        {filteredProjects.map((p, i) => (
          <div
            key={p.title + i}
            className="proj-card"
            onClick={() => p.link ? navigate(p.link) : p.externalLink && window.open(p.externalLink, '_blank')}
          >
            <div className="proj-icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <div className="proj-tech">
              {(p.tech || []).map((t) => <span key={t}>{t}</span>)}
            </div>
            <div><span className="proj-cat">{p.category}</span></div>
          </div>
        ))}
      </section>

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
