import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TacticalGame from './components/games/TacticalGame';
import SnakeGame from './components/games/SnakeGame';

// =========================================
// RETRO / TERMINAL COMPONENTS
// =========================================

const Typewriter = ({ text, delay = 0, speed = 40, randomBlink = false }) => {
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

  // NEW: If randomBlink is true, render each letter with its own chaotic timer!
  if (randomBlink) {
    return (
      <span>
        {displayText.split('').map((char, index) => {
          // Math trick to create varied but stable timers for each letter
          const blinkDelay = (index * 0.3) % 2;
          const blinkDuration = 0.5 + ((index * 0.7) % 2);
          return (
            <span
              key={index}
              className="glitch-letter"
              style={{
                animationDelay: `${blinkDelay}s`,
                animationDuration: `${blinkDuration}s`
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    );
  }

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

const DetectiveBoard = () => {
  const allProjects = [
    {
      id: 1, title: "Nihongo Quest", type: "EXE // Mobile",
      x: 30, y: 40,
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

  const [availableProjects, setAvailableProjects] = useState(allProjects);
  const [pinnedProjects, setPinnedProjects] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const boardRef = React.useRef(null);

  const pinToBoard = (project) => {
    setAvailableProjects(prev => prev.filter(p => p.id !== project.id));
    setPinnedProjects(prev => [...prev, project]);
  };

  const toggleTechStack = (projectId) => {
    setExpandedNodes(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleMouseMove = (e) => {
    if (!draggingId || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    let newX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
    let newY = ((e.clientY - boardRect.top) / boardRect.height) * 100;
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));
    setPinnedProjects(prev => prev.map(p =>
      p.id === draggingId ? { ...p, x: newX, y: newY } : p
    ));
  };

  const stopDragging = () => setDraggingId(null);

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
      <div
        className="detective-board"
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
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

        {pinnedProjects.map((project) => (
          <React.Fragment key={`group-${project.id}`}>
            <div
              className={`case-node ${expandedNodes.includes(project.id) ? 'expanded' : ''}`}
              style={{
                left: `${project.x}%`,
                top: `${project.y}%`,
                cursor: draggingId === project.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={() => setDraggingId(project.id)}
              onClick={() => toggleTechStack(project.id)}
            >
              <div className="case-title">{project.title}</div>
              <div className="case-type">{project.type}</div>
            </div>

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

const ArcadeMenu = ({ setCurrentView }) => {
  return (
    <div className="arcade-menu">

      {/* 👇 Changed class to os-title and updated the text 👇 */}
      <div className="os-title" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <Typewriter text="ENTERTAINMENT_SYSTEM // UNDER CONSTRUCTION" speed={50} />
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
  const [activeRoom, setActiveRoom] = useState(null);

  // --- 📡 MULTIPLAYER WEBSOCKET ENGINE ---
  const ws = useRef(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let reconnectTimer;
    let isComponentMounted = true; // Prevents memory leaks if you leave the page

    const connectToGameServer = () => {
      // ONLY connect if they opened the game AND they have a room code
      if (currentView === 'GAME_TACTICAL' && activeRoom) {

        ws.current = new WebSocket(`wss://tactical-multiplayer-server.onrender.com/ws/match/${activeRoom}`);

        ws.current.onopen = () => {
          if (!isComponentMounted) return;
          console.log(`SYS: Connected to Secure Room: ${activeRoom}`);
          setIsOnline(true);
        };

        ws.current.onmessage = (event) => {
          if (!isComponentMounted) return;
          const incomingData = JSON.parse(event.data);
          // console.log("SATELLITE INTERCEPT:", incomingData); // Optional: keep commented out to reduce console spam

          window.dispatchEvent(new MessageEvent("tactical_server_msg", { data: event.data }));
        };

        ws.current.onclose = () => {
          if (!isComponentMounted) return;
          console.log("SYS: Connection Lost. Attempting to re-establish datalink in 3 seconds...");
          setIsOnline(false);

          // --- THE AUTO-RECONNECT ENGINE ---
          reconnectTimer = setTimeout(connectToGameServer, 3000);
        };

        ws.current.onerror = (err) => {
          if (!isComponentMounted) return;
          console.error("SYS: WebSocket error detected.", err);
          ws.current.close(); // Force the socket to close so the auto-reconnect triggers!
        };
      }
    };

    // Kick off the initial connection
    connectToGameServer();

    // Cleanup: disconnect and kill timers when leaving the game screen
    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [currentView, activeRoom]);

  // Transmission function to send moves to the Python server
  // --- UNIVERSAL TRANSMISSION ENGINE ---
  const transmitData = (payloadData) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payloadData));
      console.log("Transmitted Payload:", payloadData.action);
    } else {
      console.log("ERROR: No server connection!");
    }
  };
  // ----------------------------------------

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
              {/* Fixed the typo and turned on the random blink effect! */}
              <Typewriter text="UNDER CONSTRUCTION" delay={500} speed={150} randomBlink={true} />
            </div>
          </>
        )}
        {currentView === 'NEWS' && <TechNews />}

        {currentView === 'ARCADE' && <ArcadeMenu setCurrentView={setCurrentView} />}

        {currentView === 'GAME_TACTICAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            {/* NETWORK STATUS BAR */}
            <div style={{ padding: '10px', background: '#111', borderBottom: '1px solid #33ff00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                SERVER STATUS: {isOnline ? <span style={{ color: '#33ff00' }}>ONLINE</span> : <span style={{ color: 'red' }}>OFFLINE</span>}
              </span>

              {/* This will permanently display the room code to the Host! */}
              {activeRoom && (
                <span style={{ background: '#000', color: '#00eeff', padding: '5px 15px', border: '1px dashed #00eeff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                  OP-CODE: {activeRoom}
                </span>
              )}
            </div>

            {/* THE ACTUAL GAME COMPONENT (DO NOT DELETE THIS!) */}
            <TacticalGame
              setCurrentView={setCurrentView}
              transmitData={transmitData}
              isOnline={isOnline}
              activeRoom={activeRoom}
              setActiveRoom={setActiveRoom}
            />
          </div>
        )}

        {currentView === 'GAME_CONQUEST' && <SnakeGame setCurrentView={setCurrentView} />}
      </main>
    </div>
  );
}

export default App;