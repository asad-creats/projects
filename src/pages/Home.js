import React, { useState } from 'react';
import { FaTasks, FaCloudSun, FaStickyNote, FaCalculator, FaGamepad, FaClock, FaSearch, FaServer, FaLaptopCode, FaNetworkWired } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  // Suggested level names: Beginner, Intermediate, Full-Stack, Enterprise-Scale
  const projects = [
    // Beginner / Entry-level projects (existing)
    {
      title: "To-Do App",
      description: "Task manager with add, complete, and delete features.",
      link: "/todo",
      icon: <FaTasks />,
      category: "Productivity",
      level: "Beginner",
    },
    {
      title: "Weather App",
      description: "Check weather details for any city.",
      link: "/weather",
      icon: <FaCloudSun />,
      category: "Utility",
      level: "Beginner",
    },
    {
      title: "Notes App",
      description: "Create and search notes locally.",
      link: "/notes",
      icon: <FaStickyNote />,
      category: "Productivity",
      level: "Beginner",
    },
    {
      title: "Calculator",
      description: "A simple calculator for basic arithmetic operations.",
      link: "/calculator",
      icon: <FaCalculator />,
      category: "Utility",
      level: "Beginner",
    },
    {
      title: "Tic-Tac-Toe",
      description: "Classic tic-tac-toe game with AI opponent.",
      link: "/tictactoe",
      icon: <FaGamepad />,
      category: "Games",
      level: "Beginner",
    },
    {
      title: "Pomodoro Timer",
      description: "Focus timer using the Pomodoro technique.",
      link: "/pomodoro",
      icon: <FaClock />,
      category: "Productivity",
      level: "Beginner",
    },

    // Intermediate (suggested)
    {
      title: "Notes with Sync",
      description: "Notes app with offline storage and optional cloud sync.",
      link: "/notes",
      icon: <FaStickyNote />,
      category: "Productivity",
      level: "Intermediate",
    },

    // Full-Stack examples
    {
      title: "E-commerce Platform (Full-Stack)",
      description: "Product catalog, cart, checkout, and admin dashboard with backend and DB.",
      link: "/ecommerce",
      icon: <FaLaptopCode />,
      category: "Full-Stack",
      level: "Full-Stack",
    },
    {
      title: "Real-time Chat App (Full-Stack)",
      description: "Websockets-based chat with auth, groups, and message persistence.",
      link: "/chat",
      icon: <FaNetworkWired />,
      category: "Full-Stack",
      level: "Full-Stack",
    },

    // Enterprise / Large-scale ideas
    {
      title: "Scalable Messaging System",
      description: "Design and implement a horizontally scalable messaging service.",
      link: "/scalable-messaging",
      icon: <FaServer />,
      category: "Architecture",
      level: "Enterprise-Scale",
    },
    {
      title: "Analytics Pipeline (Large-Scale)",
      description: "Batch + streaming pipeline for processing large event volumes.",
      link: "/analytics-pipeline",
      icon: <FaServer />,
      category: "Data",
      level: "Enterprise-Scale",
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
            Hi, I'm Asad — Frontend Developer (React & JavaScript)
          </h1>
          <p style={{ marginTop: 8, opacity: 0.9 }}>
            I love building clean, beginner-friendly apps and improving a little every day.
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

      {/* Projects Section grouped by level */}
      <section style={{ padding: "0 3rem" }}>
        {['Beginner', 'Intermediate', 'Full-Stack', 'Enterprise-Scale'].map((level) => {
          const group = filteredProjects.filter(p => p.level === level);
          if (group.length === 0) return null;
          return (
            <div key={level} style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.9rem', opacity: 0.9 }}>{level} Projects ({group.length})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {group.map((p, i) => (
                  <div
                    key={p.title + i}
                    style={{
                      background: "#020617",
                      padding: "1.2rem",
                      borderRadius: "14px",
                      border: "1px solid #1e293b",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                      transition: "transform 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    onClick={() => navigate(p.link)}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      {p.icon}
                    </div>
                    <h3 style={{ marginBottom: 6, fontSize: "1.1rem" }}>{p.title}</h3>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem" }}>{p.description}</p>
                    <span style={{
                      display: "inline-block",
                      background: "#1e293b",
                      color: "#38bdf8",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "0.7rem",
                      marginTop: "0.5rem"
                    }}>
                      {p.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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