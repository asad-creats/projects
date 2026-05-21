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
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e5e7eb" }}>
      
      {/* Intro Section */}
      <section
        style={{
          height: "32vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem"
        }}
      >
        <img
          src="/ChatGPT Image Dec 24, 2025, 03_10_52 AM.png"
          alt="Profile"
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            border: "3px solid #38bdf8",
            objectFit: "cover"
          }}
        />

        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 600 }}>
            Hi, I'm Asad — Full-Stack Developer
          </h1>
          <p style={{ marginTop: 8, opacity: 0.9 }}>
            I build real products — AI pipelines, mobile apps, and full-stack platforms.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section style={{ textAlign: "center", padding: "0 3rem", marginBottom: "2rem" }}>
        <div style={{ position: "relative", maxWidth: "400px", margin: "0 auto" }}>
          <FaSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#666", fontSize: "1.2rem" }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 45px",
              border: "none",
              borderRadius: "25px",
              fontSize: "1rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              outline: "none",
              background: "#1e293b",
              color: "#e5e7eb"
            }}
          />
        </div>
      </section>

      {/* Projects Section */}
      <section style={{ padding: "0 3rem" }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredProjects.map((p, i) => (
            <div
              key={p.title + i}
              style={{
                background: "#020617",
                padding: "1.5rem",
                borderRadius: "14px",
                border: "1px solid #1e293b",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                transition: "transform 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              onClick={() => p.link ? navigate(p.link) : p.externalLink && window.open(p.externalLink, '_blank')}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#38bdf8" }}>
                {p.icon}
              </div>
              <h3 style={{ marginBottom: 6, fontSize: "1.15rem" }}>{p.title}</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem", lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(p.tech || []).map((t) => (
                  <span key={t} style={{
                    background: "#1e293b",
                    color: "#38bdf8",
                    padding: "2px 10px",
                    borderRadius: "10px",
                    fontSize: "0.7rem",
                  }}>
                    {t}
                  </span>
                ))}
              </div>
              <span style={{
                display: "inline-block",
                background: "#0f172a",
                color: "#94a3b8",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "0.65rem",
                marginTop: "0.5rem",
              }}>
                {p.category}
              </span>
            </div>
          ))}
        </div>
      </section>

      {filteredProjects.length === 0 && (
        <div style={{ textAlign: "center", color: "#e5e7eb", fontSize: "1.2rem", marginTop: "2rem" }}>
          No projects found matching "{searchTerm}"
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: "2rem", padding: "1rem", opacity: 0.7 }}>
        <p>Built with patience, practice, and curiosity. Total Projects: {projects.length}</p>
      </footer>
    </div>
  );
}

export default Home;