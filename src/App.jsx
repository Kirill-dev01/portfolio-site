import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TacticalGame from './components/games/TacticalGame';

// =========================================
// RETRO / TERMINAL COMPONENTS
// =========================================

const Typewriter = ({ text, delay = 0, speed = 40, randomBlink = false }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let timeout;
    let currentIndex = 0;
    setDisplayText('');

    const startTyping = () => {
      timeout = setInterval(() => {
        currentIndex++;
        setDisplayText(text.slice(0, currentIndex));

        if (currentIndex >= text.length) {
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

  // --- THE RECALIBRATED RETRO BLINKING ENGINE ---
  if (randomBlink) {
    return (
      <span>
        {displayText.split('').map((char, index) => {
          // Paced out the delays so letters don't all pop off at the exact same moment
          const blinkDelay = (index * 0.45) % 3.0;
          const blinkDuration = 2.0 + ((index * 0.73) % 2.5);

          return (
            <span
              key={index}
              className="glitch-letter"
              style={{
                animationDelay: `${blinkDelay}s`,
                animationDuration: `${blinkDuration}s`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
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

const GitHubActivity = () => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/users/Kirill-dev01/events/public')
      .then(res => res.json())
      .then(data => {
        const relevantEvents = data.filter(event =>
          event.type === 'PushEvent' ||
          event.type === 'PullRequestEvent' ||
          event.type === 'IssuesEvent'
        );

        const recentCommits = relevantEvents.slice(0, 4).map(event => {
          let message = 'System update recorded.';

          if (event.type === 'PushEvent') {
            message = `Push: ${event.payload.commits?.[0]?.message || 'Code update'}`;
          } else if (event.type === 'PullRequestEvent') {
            message = `PR ${event.payload.action}: ${event.payload.pull_request.title}`;
          } else if (event.type === 'IssuesEvent') {
            message = `Issue ${event.payload.action}: ${event.payload.issue.title}`;
          }

          return {
            id: event.id,
            repo: event.repo.name.split('/')[1],
            message: message,
            date: new Date(event.created_at).toLocaleDateString()
          };
        });

        setCommits(recentCommits);
        setLoading(false);
      })
      .catch(err => {
        console.error("SYS ERROR: Could not establish GitHub uplink", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2><Typewriter text="ESTABLISHING GITHUB UPLINK..." speed={30} /></h2>;

  return (
    <div className="activity-container">
      <h2><Typewriter text="SYS.LOG // KIRILL_ACTIVITY" speed={30} /></h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', marginTop: '20px' }}>

        { }
        {commits.length === 0 ? (
          <div style={{ color: '#ffcc00', fontFamily: 'monospace', fontSize: '1.2rem', marginTop: '10px' }}>
            <Typewriter text="> WARNING: No recent public transmissions found." delay={500} speed={30} /><br />
            <Typewriter text="> (Note: Private repository commits are classified and hidden by GitHub API)." delay={1500} speed={30} />
          </div>
        ) : (
          commits.map((commit) => (
            <div key={commit.id} style={{ borderBottom: '1px dashed #33ff00', padding: '15px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '1.2rem' }}>

                <a
                  href={`https://github.com/Kirill-dev01/${commit.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="repo-link"
                >
                  {`> [ ${commit.repo} ]`}
                </a>

                <span style={{ color: '#00eeff' }}>{commit.date}</span>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

// =======================
// MODERN COMPONENTS 
// =======================

const PortfolioBento = ({ language = 'en' }) => {
  // --- FLIP ANIMATION STATE ---
  const [flipped, setFlipped] = useState({
    info: false,
    contacts: false,
    stack: false
  });

  const toggleFlip = (cardName) => {
    setFlipped(prev => ({ ...prev, [cardName]: !prev[cardName] }));
  };

  // --- TRANSLATION DICTIONARY ---
  const t = {
    en: {
      greeting: "Hello. I'm Kirill.",
      bio: "I am a full-stack Python and mobile (Android) developer specializing in building robust applications and automating complex workflows. Currently, I am building my own projects and teaching myself Unity."
    },
    ja: {
      greeting: "こんにちは、キリルです。",
      bio: "私は堅牢なアプリケーションの構築と複雑なワークフローの自動化を専門とする、フルスタックPythonおよびモバイル（Android）開発者です。現在は自身のプロジェクトを開発しながら、Unityを独学で学んでいます。"
    }
  };
  return (
    <div className="bento-grid">

      {/* --- Intro Card --- */}
      <div className="bento-wrapper bento-info" onClick={() => toggleFlip('info')}>
        <div className={`bento-inner ${flipped.info ? 'is-flipped' : ''}`}>
          {/* FRONT */}
          <div className="bento-front">
            <h2>[ INTRODUCTION ]</h2>
            <div className="click-hint">ACCESS NODE</div>
          </div>
          {/* BACK (Now with Translation Matrix active) */}
          <div className="bento-back">
            {/* Text swapped for dynamic translation variables */}
            <h2>{t[language].greeting}</h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#555' }}>
              {t[language].bio}
            </p>
          </div>
        </div>
      </div>

      {/* --- Expanded Tech Stack Card --- */}
      <div className="bento-wrapper bento-stack" onClick={() => toggleFlip('stack')}>
        <div className={`bento-inner ${flipped.stack ? 'is-flipped' : ''}`}>
          {/* FRONT */}
          <div className="bento-front">
            <h2>[ CORE STACK ]</h2>
            <div className="click-hint">ACCESS NODE</div>
          </div>
          <div className="bento-back" style={{ overflowY: 'auto' }}>
            <h2>Core Stack</h2>

            <div className="stack-category">
              <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '5px' }}>Mobile Development</h3>
              <div className="tech-tags">
                <span className="tech-tag">Android</span>
                <span className="tech-tag">Kotlin</span>
                <span className="tech-tag">Java</span>
                <span className="tech-tag">SQLite & Room</span>
              </div>
            </div>

            <div className="stack-category">
              <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '5px', marginTop: '15px' }}>Backend & Database</h3>
              <div className="tech-tags">
                <span className="tech-tag">Python</span>
                <span className="tech-tag">Django</span>
                <span className="tech-tag">Flask</span>
                <span className="tech-tag">Node.js</span>
                <span className="tech-tag">PostgreSQL</span>
              </div>
            </div>

            <div className="stack-category">
              <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '5px', marginTop: '15px' }}>Frontend</h3>
              <div className="tech-tags">
                <span className="tech-tag">JavaScript</span>
                <span className="tech-tag">React</span>
                <span className="tech-tag">Redux</span>
                <span className="tech-tag">HTML5 & CSS3</span>
              </div>
            </div>

            <div className="stack-category">
              <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '5px', marginTop: '15px' }}>Tools</h3>
              <div className="tech-tags">
                <span className="tech-tag">Git</span>
                <span className="tech-tag">Docker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Contacts Card --- */}
      <div className="bento-wrapper bento-contacts" onClick={() => toggleFlip('contacts')}>
        <div className={`bento-inner ${flipped.contacts ? 'is-flipped' : ''}`}>
          {/* FRONT */}
          <div className="bento-front">
            <h2>[ COMM-LINK ]</h2>
            <div className="click-hint">ACCESS NODE</div>
          </div>
          <div className="bento-back">
            <h2>Comm-Link</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

              <a
                href="https://www.linkedin.com/in/kirill-nikitenko-8b600a375/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                onClick={e => e.stopPropagation()}
              >
                LinkedIn ↗
              </a>

              <a
                href="https://github.com/Kirill-dev01"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                onClick={e => e.stopPropagation()}
              >
                GitHub ↗
              </a>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const CurrentProjects = () => {
  const [flipped, setFlipped] = useState({});
  // Track which page of the notebook we are on
  const [currentPage, setCurrentPage] = useState(0);
  // Track the animation state
  const [isTurning, setIsTurning] = useState(false);

  const toggleFlip = (id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePageTurn = (direction) => {
    if (isTurning) return; // Prevent spam-clicking
    setIsTurning(true);

    // Wait for the CSS fade-out animation to finish, then swap the data
    setTimeout(() => {
      setCurrentPage(prev => direction === 'next' ? prev + 1 : prev - 1);
      setIsTurning(false);
      setFlipped({}); // Reset all flipped notes when turning the page
    }, 300);
  };

  const notebookPages = [
    // --- PAGE 1: Active Directives ---
    [
      {
        id: 1, name: "KIRILL_PORTFOLIO", tech: "React_Frontend", color: "#fef08a",
        rotate: "-3deg", top: "8%", left: "5%",
        desc: "Interactive, retro-themed developer portfolio featuring live GitHub data feeds.",
        stack: ["React & JavaScript", "CSS3 / Flexbox", "REST API (GitHub)", "Vercel & Render"]
      },
      {
        id: 2, name: "NIHONGO_QUEST", tech: "Android Native", color: "#fecaca",
        rotate: "2deg", top: "18%", left: "65%",
        desc: "Comprehensive Japanese study guide application (N5-N1).",
        stack: ["Kotlin 2.0 & Android SDK", "XML & Material Design", "Native SQLite (Offline)", "Text-to-Speech API"],
        url: "https://play.google.com/store/apps/details?id=com.nkdevworks.japanesestudyapp&hl=en"
      },
      {
        id: 3, name: "MY_MONEY_TRACKER", tech: "Android MVVM", color: "#bbf7d0",
        rotate: "1.5deg", top: "52%", left: "10%",
        desc: "Personal finance and subscription tracking application.",
        stack: ["Kotlin & Java 21", "Room Database (ORM)", "MVVM Architecture", "Fragments & XML"]
      }
    ],
    // --- PAGE 2: Past Initiatives ---
    [
      {
        id: 4, name: "SAMUI_HOTEL_PROJECT", tech: "Python / Django", color: "#bfdbfe",
        rotate: "-2deg", top: "25%", left: "8%",
        desc: "Full-stack boutique hotel booking system with dynamic database rendering.",
        stack: ["Python 3 & Django", "Django Templates (HTML/CSS)", "SQLite Database", "MVC Architecture"]
      }
    ]
  ];

  return (
    <div className="projects-screen">
      <h1 style={{ textAlign: 'center', color: '#111', marginBottom: '30px' }}>
        Active Directives // Core_Initiatives
      </h1>

      <div className="notebook-spread">
        <div className="notebook-binding"></div>

        {/* The Page Content Wrapper (handles the animation) */}
        <div className={`notebook-page-content ${isTurning ? 'page-turning' : ''}`}>
          {notebookPages[currentPage].map((proj) => (
            <div
              key={proj.id}
              className="memo-container"
              style={{ top: proj.top, left: proj.left, transform: `rotate(${proj.rotate})` }}
              onClick={() => toggleFlip(proj.id)}
            >
              <div className={`memo-inner ${flipped[proj.id] ? 'is-flipped' : ''}`}>

                {/* FRONT OF CARD */}
                <div className="memo-front" style={{ backgroundColor: proj.color }}>
                  <div className="memo-tape"></div>
                  <h3>{proj.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold' }}>[{proj.tech}]</span>
                  <p>{proj.desc}</p>

                  {proj.url && (
                    <div
                      style={{ marginTop: '10px', fontSize: '0.9rem', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation(); // Stops the card from flipping when you click the link
                        window.open(proj.url, '_blank', 'noopener noreferrer');
                      }}
                    >
                      Play Store ↗
                    </div>
                  )}
                </div>

                {/* BACK OF CARD */}
                <div className="memo-back" style={{ backgroundColor: proj.color }}>
                  <div className="memo-tape"></div>
                  <h3>{proj.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold' }}>[Tech Stack]</span>
                  <ul className="memo-stack-list">
                    {proj.stack.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Notebook Navigation Buttons */}
        {currentPage > 0 && (
          <button className="notebook-nav nav-prev" onClick={() => handlePageTurn('prev')}>
            &lt;&lt; Previous Page
          </button>
        )}

        {currentPage < notebookPages.length - 1 && (
          <button className="notebook-nav nav-next" onClick={() => handlePageTurn('next')}>
            Next Page &gt;&gt;
          </button>
        )}

      </div>
    </div>
  );
};

const FinishedProjects = () => {
  const [activeCartridge, setActiveCartridge] = useState(null);
  const [isPowerOn, setIsPowerOn] = useState(false);

  // The Data for the Cartridges
  const cartridges = [
    {
      id: "cart-1",
      title: "REACT_SHOES_SHOP",
      stack: "React / Redux",
      desc: "Bosa Noga: Full-scale e-commerce frontend storefront.",
      link: "https://github.com/Kirill-dev01/react-shoes-shop",
      color: "#bfdbfe"
    },
    {
      id: "cart-2",
      title: "JS_ADVANCED",
      stack: "Vanilla JavaScript",
      desc: "Retro Game: 2D turn-based fantasy strategy with custom OOP logic and AI.",
      link: "https://github.com/Kirill-dev01/js-advanced-diploma",
      color: "#fef08a"
    },
    {
      id: "cart-3",
      title: "NOEMI_PROJECT",
      stack: "HTML5 / CSS3",
      desc: "Pixel-perfect, responsive web design and layout architecture.",
      link: "https://github.com/Kirill-dev01/noemi-project",
      color: "#fecaca"
    }
  ];
  // Drag and Drop Handlers
  const handleDragStart = (e, cart) => {
    e.dataTransfer.setData("cart_id", cart.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("cart_id");
    const selected = cartridges.find(c => c.id === draggedId);

    if (selected) {
      setActiveCartridge(selected);
      setIsPowerOn(true);
    }
  };

  const ejectCartridge = () => {
    setActiveCartridge(null);
    setIsPowerOn(false);
  };

  return (
    <div className="finished-projects-screen">
      <h1 style={{ textAlign: 'center', color: '#33ff00', marginBottom: '40px', fontFamily: 'monospace' }}>
        SYS_ARCHIVE // FINISHED_PROJECTS
      </h1>

      <div className="arcade-setup">

        {/* LEFT SIDE: The Stack of Cartridges */}
        <div className="cartridge-stack">
          <h3 style={{ color: '#aaa', fontFamily: 'monospace' }}>&gt; AVAILABLE_CARTRIDGES</h3>
          {cartridges.map(cart => (
            <div
              key={cart.id}
              className={`cartridge ${activeCartridge?.id === cart.id ? 'hidden' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, cart)}
            >
              <div className="cart-top-ridges"></div>
              <div className="cart-label" style={{ borderTopColor: cart.color }}>
                <h4>{cart.title}</h4>
                <span>{cart.stack}</span>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT SIDE: The Console and Screen */}
        <div className="console-station">

          {/* The TV Screen */}
          <div className={`console-screen ${isPowerOn ? 'power-on' : ''}`}>
            {!isPowerOn ? (
              <div className="static-noise">NO SIGNAL... INSERT CARTRIDGE</div>
            ) : (
              <div className="game-data">
                <h2 style={{ color: activeCartridge.color }}>{activeCartridge.title}</h2>
                <p className="tech-stack">[{activeCartridge.stack}]</p>
                <p className="desc">&gt; {activeCartridge.desc}</p>
                <a href={activeCartridge.link} target="_blank" rel="noreferrer" className="play-button">
                  [ INIT_SOURCE_CODE ]
                </a>
              </div>
            )}
          </div>

          {/* The Console Deck */}
          <div className="console-deck">
            <div
              className={`cartridge-slot ${activeCartridge ? 'filled' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {activeCartridge ? (
                <div className="inserted-cart">
                  <span className="eject-btn" onClick={ejectCartridge}>⏏ EJECT</span>
                  {activeCartridge.title}
                </div>
              ) : (
                <span className="slot-text">DROP CARTRIDGE HERE</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// =================
// ARCADE GAMES
// =================

const ArcadeMenu = ({ setCurrentView }) => {
  return (
    // This wrapper uses flexbox to perfectly center everything in the middle of the screen
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', width: '100%' }}>

      <div className="os-title" style={{ marginBottom: '60px', textAlign: 'center' }}>
        <Typewriter text="ENTERTAINMENT_SYSTEM // ONLINE" speed={50} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>

        {/* --- GAME 01 --- */}
        <button className="arcade-button" onClick={() => setCurrentView('GAME_TACTICAL')}>
          <Typewriter text="[01] TACTICAL_STRIKE (Turn-Based)" delay={200} />
        </button>

        {/* --- GAME 02 (IN DEV) --- */}
        <button className="arcade-button locked" disabled>
          <Typewriter text="[02] NEW GAME (In Development)" delay={800} />
        </button>

      </div>

    </div>
  );
};

// =========================================
// MAIN APP COMPONENT
// =========================================

function App() {
  const [currentView, setCurrentView] = useState('HOME');
  const [activeRoom, setActiveRoom] = useState(null);
  const [language, setLanguage] = useState('en');

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

        {/* GLOBAL LANGUAGE TOGGLE */}
        <button
          className="lang-toggle-btn"
          onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
        >
          [ {language === 'en' ? 'ENG / 日本語' : '日本語 / ENG'} ]
        </button>

        <button className="return-button" onClick={() => setCurrentView('HOME')}>
          {'< RETURN TO KIRILL_OS'}
        </button>

        {currentView === 'PORTFOLIO' && <PortfolioBento language={language} />}
        {currentView === 'CURRENT_PROJECTS' && <CurrentProjects />}
        {currentView === 'FINISHED_PROJECTS' && <FinishedProjects />}


      </div>
    );
  }

  return (
    <div className="retro-layout">

      {/* GLOBAL LANGUAGE TOGGLE */}
      <button
        className="lang-toggle-btn"
        onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
      >
        [ {language === 'en' ? 'ENG / 日本語' : '日本語 / ENG'} ]
      </button>

      <nav className="sidebar">
        <h1 style={{ cursor: 'pointer', color: '#ffcc00' }} onClick={() => setCurrentView('HOME')}>
          <Typewriter text="SYS_MENU" delay={0} />
        </h1>

        <button className="menu-button" onClick={() => setCurrentView('PORTFOLIO')}>
          <Typewriter text="> MY PORTFOLIO" delay={500} />
        </button>
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
          <Typewriter text="> PROJECT ARCHIVE" delay={2000} />
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
              <Typewriter text="UNDER CONSTRUCTION" delay={500} speed={150} randomBlink={true} />
            </div>
          </>
        )}

        {currentView === 'NEWS' && (
          <div className="dual-panel-layout">
            <TechNews />
            <GitHubActivity />
          </div>
        )}

        {currentView === 'ARCADE' && <ArcadeMenu setCurrentView={setCurrentView} />}

        {currentView === 'GAME_TACTICAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* NETWORK STATUS BAR */}
            <div style={{ padding: '10px', background: '#111', borderBottom: '1px solid #33ff00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                SERVER STATUS: {isOnline ? <span style={{ color: '#33ff00' }}>ONLINE</span> : <span style={{ color: 'red' }}>OFFLINE</span>}
              </span>

              {activeRoom && (
                <span style={{ background: '#000', color: '#00eeff', padding: '5px 15px', border: '1px dashed #00eeff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                  OP-CODE: {activeRoom}
                </span>
              )}
            </div>

            <TacticalGame
              setCurrentView={setCurrentView}
              transmitData={transmitData}
              isOnline={isOnline}
              activeRoom={activeRoom}
              setActiveRoom={setActiveRoom}
            />
          </div>
        )}

      </main>

      {/* --- SYSTEM FOOTER --- */}
      <footer className="os-footer">
        <span className="footer-text">SYS_ADMIN: KIRILL //</span>

        <a href="mailto:kirillnam2201@gmail.com" className="footer-link">
          kirillnam2201@gmail.com
        </a>

        <span className="footer-text">|</span>

        <a href="https://github.com/Kirill-dev01" target="_blank" rel="noopener noreferrer" className="footer-link">
          GitHub ↗
        </a>
      </footer>

    </div>
  );
}

export default App;
