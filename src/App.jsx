import React, { useState, useEffect } from 'react';
import './App.css';
import TacticalGame from './components/games/TacticalGame';
import SnakeGame from './components/games/SnakeGame';

// =========================================
// RETRO / TERMINAL COMPONENTS
// =========================================

const Typewriter = ({ text, delay = 0, speed = 40 }) => {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    let timeout;
    let i = 0;
    setDisplayText('');
    const startTyping = () => {
      timeout = setInterval(() => {
        if (i < text.length) {
          setDisplayText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(timeout);
        }
      }, speed);
    };
    const initialDelay = setTimeout(startTyping, delay);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(timeout);
    };
  }, [text, delay, speed]);
  return <span>{displayText}</span>;
};

const TechNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('https://dev.to/api/articles?per_page=5&tag=programming')
      .then(response => response.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(error => setLoading(false));
  }, []);

  if (loading) return <h2><Typewriter text="CONNECTING TO SECURE DATALINK..." speed={30} /></h2>;

  return (
    <div className="news-container">
      <h2><Typewriter text="SYS.LOG // LATEST_TECH_NEWS" speed={30} /></h2>
      <ul className="news-list">
        {articles.map((article, index) => (
          <li key={article.id}>
            <a href={article.url} target="_blank" rel="noreferrer" className="news-link">
              <Typewriter text={`> ${article.title}`} delay={index * 300} speed={20} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

// =========================================
// MODERN COMPONENTS (THE MATRIX SHIFT)
// =========================================

const PortfolioBento = () => {
  return (
    <div className="bento-grid">
      <div className="bento-card bento-info">
        <h2>Hello. I'm Kirill.</h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#555' }}>
          I am a full-stack and mobile developer specializing in building robust applications and automating complex workflows.
        </p>
      </div>
      <div className="bento-card bento-stack">
        <h2>Core Stack</h2>
        <div>
          <span className="tech-tag">Python</span>
          <span className="tech-tag">Kotlin</span>
          <span className="tech-tag">React</span>
          <span className="tech-tag">Django</span>
        </div>
      </div>
      <div className="bento-card bento-contacts">
        <h2>Comm-Link</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="#" style={{ color: '#0077b5', textDecoration: 'none', fontWeight: 'bold' }}>LinkedIn ↗</a>
          <a href="#" style={{ color: '#333', textDecoration: 'none', fontWeight: 'bold' }}>GitHub ↗</a>
        </div>
      </div>
    </div>
  );
};

const CurrentProjects = () => {
  const projectList = [
    { name: "CHAOS_ORGANIZER // WebSocket_Core", animation: "float1 18s linear infinite" },
    { name: "NIHONGO_QUEST // Offline_First_Kotlin", animation: "float2 22s ease-in-out infinite" },
    { name: "BOSA_NOGA // eComm_Infrastructure", animation: "float3 15s linear infinite" }
  ];

  return (
    <div className="projects-screen">
      <h1 className="projects-title">Active Directives // Core_Initiatives</h1>
      {projectList.map((project, index) => {
        const startTop = 300 + (index * 150);
        const startLeft = 200 + (index * 250);
        return (
          <div
            key={index}
            className="project-bubble"
            style={{
              animation: project.animation,
              top: `${startTop}px`,
              left: `${startLeft}px`,
              width: `${200 + index * 30}px`,
              height: `${200 + index * 30}px`,
            }}
          >
            {project.name}
          </div>
        );
      })}
    </div>
  );
};

// --- C. Detective Board Component (Draggable AND Spawning) ---
const DetectiveBoard = () => {
  // All raw project data
  const allProjects = [
    {
      id: 1, title: "Nihongo Quest", type: "EXE // Mobile",
      x: 30, y: 40, // Base coordinates when first pinned
      stack: ["Kotlin", "Offline-First", "Mobile UI"]
    },
    {
      id: 2, title: "Chaos Organizer", type: "SYS // Full-Stack",
      x: 70, y: 50,
      stack: ["React", "WebSockets", "Django API"]
    },
    {
      id: 3, title: "Bosa Noga Store", type: "DAT // Backend",
      x: 40, y: 75,
      stack: ["React", "eCommerce", "Database"]
    }
  ];

  // --- MERGED STATE ---
  const [availableProjects, setAvailableProjects] = useState(allProjects); // In locker
  const [pinnedProjects, setPinnedProjects] = useState([]);                // On board
  const [expandedNodes, setExpandedNodes] = useState([]);                  // Showing tech stack
  const [draggingId, setDraggingId] = useState(null);                      // Currently being dragged
  const boardRef = React.useRef(null);

  // --- ACTIONS ---
  // 1. Move from locker to board
  const pinToBoard = (project) => {
    setAvailableProjects(prev => prev.filter(p => p.id !== project.id));
    setPinnedProjects(prev => [...prev, project]);
  };

  // 2. Toggle the tech stack spawn
  const toggleTechStack = (projectId) => {
    setExpandedNodes(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  // 3. Dragging logic (Updates the position of PINNED projects)
  const handleMouseMove = (e) => {
    if (!draggingId || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    let newX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
    let newY = ((e.clientY - boardRect.top) / boardRect.height) * 100;

    // Keep inside boundaries
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));

    setPinnedProjects(prev => prev.map(p =>
      p.id === draggingId ? { ...p, x: newX, y: newY } : p
    ));
  };

  const stopDragging = () => setDraggingId(null);

  // Helper to place tech nodes in a circle
  const getTechNodePosition = (baseX, baseY, index, total) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 18;
    return {
      x: baseX + Math.cos(angle) * radius,
      y: baseY + Math.sin(angle) * radius
    };
  };

  return (
    <div className="board-wrapper">
      <h1 className="projects-title">Archive // Solved_Cases</h1>

      {/* THE BOARD */}
      <div
        className="detective-board"
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >

        {/* Step 1: Draw the evidence strings for expanded tech stacks */}
        <svg className="evidence-strings">
          {pinnedProjects.map((project) => {
            if (!expandedNodes.includes(project.id)) return null;

            return project.stack.map((tech, index) => {
              const pos = getTechNodePosition(project.x, project.y, index, project.stack.length);
              return (
                <line
                  key={`line-${project.id}-${index}`}
                  x1={`${project.x}%`} y1={`${project.y}%`}
                  x2={`${pos.x}%`} y2={`${pos.y}%`}
                  stroke="#33ff00" strokeWidth="2" strokeDasharray="4,4"
                />
              );
            });
          })}
        </svg>

        {/* Step 2: Render Pinned Projects & Their Tech Stacks */}
        {pinnedProjects.map((project) => (
          <React.Fragment key={`group-${project.id}`}>

            {/* The Main Project Node */}
            <div
              className={`case-node ${expandedNodes.includes(project.id) ? 'expanded' : ''}`}
              style={{
                left: `${project.x}%`,
                top: `${project.y}%`,
                cursor: draggingId === project.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={() => setDraggingId(project.id)} // Starts Drag
              onClick={() => toggleTechStack(project.id)}   // Spawns Tech Stack
            >
              <div className="case-title">{project.title}</div>
              <div className="case-type">{project.type}</div>
            </div>

            {/* The Spawning Tech Nodes */}
            {expandedNodes.includes(project.id) && project.stack.map((tech, index) => {
              const pos = getTechNodePosition(project.x, project.y, index, project.stack.length);
              return (
                <div
                  key={`tech-${project.id}-${index}`}
                  className="tech-node"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {tech}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* THE EVIDENCE LOCKER */}
      <div className="evidence-locker">
        {availableProjects.length === 0 ? (
          <span style={{ color: '#888', fontStyle: 'italic', alignSelf: 'center' }}>
            All case files have been pinned to the board.
          </span>
        ) : (
          availableProjects.map((project) => (
            <button
              key={project.id}
              className="locker-file"
              onClick={() => pinToBoard(project)}
            >
              &#128193; {project.title}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// =========================================
// ARCADE GAMES
// =========================================

// --- 0. The Main Arcade Hub ---
const ArcadeMenu = ({ setCurrentView }) => {
  return (
    <div className="arcade-menu">
      <div className="game-title">
        <Typewriter text="KIRILL_OS // ENTERTAINMENT_SYSTEM" speed={50} />
      </div>

      <button className="menu-button" style={{ fontSize: '2rem' }} onClick={() => setCurrentView('GAME_TACTICAL')}>
        <Typewriter text="[01] TACTICAL_STRIKE (Turn-Based)" delay={500} />
      </button>

      <button className="menu-button" style={{ fontSize: '2rem' }} onClick={() => setCurrentView('GAME_CONQUEST')}>
        <Typewriter text="[02] SECTOR_CONQUEST (Auto-Sim)" delay={1000} />
      </button>

      <button className="menu-button" style={{ fontSize: '2rem', color: '#555', borderColor: '#555', cursor: 'not-allowed' }}>
        <Typewriter text="[03] CYBER_PONG (In Development)" delay={1500} />
      </button>
    </div>
  );
};


// =========================================
// MAIN APP COMPONENT
// =========================================

function App() {
  const [currentView, setCurrentView] = useState('HOME');

  if (currentView === 'PORTFOLIO' || currentView === 'CURRENT_PROJECTS' || currentView === 'FINISHED_PROJECTS') {
    return (
      <div className="modern-layout">
        <button className="return-button" onClick={() => setCurrentView('HOME')}>
          {'< RETURN TO KIRILL_OS'}
        </button>

        {currentView === 'PORTFOLIO' && <PortfolioBento />}
        {currentView === 'CURRENT_PROJECTS' && <CurrentProjects />}
        {currentView === 'FINISHED_PROJECTS' && <DetectiveBoard />}
      </div>
    );
  }

  return (
    <div className="retro-layout">
      <nav className="sidebar">
        <h1 style={{ cursor: 'pointer' }} onClick={() => setCurrentView('HOME')}>
          <Typewriter text="SYS_MENU" delay={0} />
        </h1>
        <button className="menu-button" onClick={() => setCurrentView('PORTFOLIO')}>
          <Typewriter text="> MY PORTFOLIO" delay={500} />
        </button>
        <button className="menu-button" onClick={() => setCurrentView('NEWS')}>
          <Typewriter text="> TECH NEWS" delay={1000} />
        </button>
        <button className="menu-button" onClick={() => setCurrentView('CURRENT_PROJECTS')}>
          <Typewriter text="> CURRENT PROJECTS" delay={1500} />
        </button>
        <button className="menu-button" onClick={() => setCurrentView('FINISHED_PROJECTS')}>
          <Typewriter text="> FINISHED PROJECTS" delay={2000} />
        </button>
        <button className="menu-button" onClick={() => setCurrentView('ARCADE')}>
          <Typewriter text="> ARCADE (GAMES)" delay={2500} />
        </button>
      </nav>

      <main className="main-content">
        {currentView === 'HOME' && (
          <>
            <div className="image-placeholder" style={{ height: '200px' }}></div>
            <div className="os-title">
              <Typewriter text="KIRILL_OS" delay={500} speed={150} />
            </div>
          </>
        )}
        {currentView === 'NEWS' && <TechNews />}

        {currentView === 'ARCADE' && <ArcadeMenu setCurrentView={setCurrentView} />}
        {currentView === 'GAME_TACTICAL' && <TacticalGame setCurrentView={setCurrentView} />}

        {/* FIXED: Changed ConquestGame to SnakeGame! */}
        {currentView === 'GAME_CONQUEST' && <SnakeGame setCurrentView={setCurrentView} />}
      </main>
    </div>
  );
}

export default App;

