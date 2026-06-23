import React, { useEffect, useRef, useState } from 'react';

const getTeamColor = (team, isFaint = false) => {
    if (team === 'CYAN') return isFaint ? 'rgba(0, 238, 255, 0.2)' : '#00eeff';
    if (team === 'RED') return isFaint ? 'rgba(255, 0, 85, 0.2)' : '#ff0055';
    if (team === 'YELLOW') return isFaint ? 'rgba(255, 238, 0, 0.2)' : '#ffee00';
    if (team === 'GREEN') return isFaint ? 'rgba(0, 255, 136, 0.2)' : '#00ff88';
    return '#ffffff';
};

const AiRtsBattle = () => {
    const canvasRef = useRef(null);
    const socketRef = useRef(null);
    const [status, setStatus] = useState('OFFLINE');
    const [entitiesCount, setEntitiesCount] = useState(0);
    const [scores, setScores] = useState({ CYAN: 0, RED: 0, YELLOW: 0, GREEN: 0 });

    const [banks, setBanks] = useState({
        CYAN: { food: 0, energy: 0 },
        RED: { food: 0, energy: 0 },
        YELLOW: { food: 0, energy: 0 },
        GREEN: { food: 0, energy: 0 }
    });

    useEffect(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // 2. Point to the correct server based on the location
        const wsUrl = isLocal
            ? 'ws://localhost:8000/ws/rts-game'
            : 'wss://tactical-multiplayer-server.onrender.com/ws/rts-game';

        // Initialize connection
        socketRef.current = new WebSocket(wsUrl);

        // Map status changes
        socketRef.current.onopen = () => setStatus('ONLINE');
        socketRef.current.onclose = () => setStatus('OFFLINE');

        // Capture incoming server data ticks properly inside the event handler
        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'TICK') {
                setEntitiesCount(data.entities.length);
                if (data.scores) setScores(data.scores);
                if (data.banks) setBanks(data.banks);
                drawSimulation(data.entities, data.map, data.resources, data.regions);
            }
        };

        // Clean up connection on unmount
        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    const sendCommand = (cmd) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ command: cmd }));
            console.log(`[SYS_CMD] Transmitted: ${cmd}`);
        }
    };

    const drawSimulation = (entities, mapInfo, resources = [], regions = {}) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- LAYER 1: REGIONS (32-Grid Layout) ---
        const cols = 8;
        const rows = 4;
        const regW = canvas.width / cols;
        const regH = canvas.height / rows;

        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const key = `${x},${y}`;
                const region = regions[key];

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * regW, y * regH, regW, regH);

                if (region && region.owner) {
                    ctx.fillStyle = getTeamColor(region.owner, true).replace('0.2', '0.04');
                    ctx.fillRect(x * regW, y * regH, regW, regH);
                }
            }
        }

        // --- LAYER 2: RESOURCES (MINI-BASES) ---
        if (resources) {
            resources.forEach((res) => {
                ctx.beginPath();
                if (res.owner) {
                    const teamColor = getTeamColor(res.owner);
                    ctx.fillStyle = getTeamColor(res.owner, true);
                    ctx.fillRect(res.x - 8, res.y - 8, 16, 16);
                    ctx.strokeStyle = teamColor;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(res.x - 8, res.y - 8, 16, 16);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(res.type === 'Food Node' ? 'F' : 'E', res.x, res.y + 3);
                } else {
                    if (res.type === 'Food Node') {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.fillRect(res.x - 3, res.y - 3, 6, 6);
                    } else {
                        ctx.fillStyle = '#00eeff';
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = '#00eeff';
                        ctx.arc(res.x, res.y, 3, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            });
        }

        // --- LAYER 3: ENTITIES (Tech Tree & Health Bars) ---
        entities.forEach((entity) => {
            const teamColor = getTeamColor(entity.team);

            // Draw Health Bar
            if (entity.hp !== undefined && entity.max_hp) {
                const hpPercent = Math.max(0, entity.hp / entity.max_hp);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillRect(entity.x - 8, entity.y - 12, 16, 3);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(entity.x - 8, entity.y - 12, 16 * hpPercent, 3);
            }

            ctx.beginPath();

            if (entity.type === 'Tank') {
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = teamColor;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = teamColor;
                ctx.strokeRect(entity.x - 8, entity.y - 8, 16, 16);
                ctx.fillRect(entity.x - 8, entity.y - 8, 16, 16);
                ctx.shadowBlur = 0;
                ctx.fillStyle = teamColor;
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('T', entity.x, entity.y + 3);

            } else if (entity.type === 'Artillery') {
                ctx.fillStyle = teamColor;
                ctx.shadowBlur = 15;
                ctx.shadowColor = teamColor;
                ctx.moveTo(entity.x, entity.y - 10);
                ctx.lineTo(entity.x - 8, entity.y + 8);
                ctx.lineTo(entity.x + 8, entity.y + 8);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.strokeStyle = getTeamColor(entity.team, true);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(entity.x, entity.y, 100, 0, 2 * Math.PI);
                ctx.stroke();

            } else if (entity.type === 'Hunter') {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = teamColor;
                ctx.fillRect(entity.x - 5, entity.y - 5, 10, 10);
                ctx.shadowBlur = 0;

            } else { // Gatherer / Default
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 12;
                ctx.shadowColor = teamColor;
                ctx.arc(entity.x, entity.y, 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    };

    const btnStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#00eeff', border: '1px solid #00eeff',
        padding: '8px 15px', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer',
        textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s ease',
        boxShadow: '0 0 5px rgba(0, 238, 255, 0.2)'
    };

    return (
        // 1. The grand wrapper that puts items side-by-side
        <div className="simulation-workspace">

            {/* 2. LEFT SIDE: Your existing game board and controls */}
            <div className="laboratory-wrapper">
                <div className="glass-panel">
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', letterSpacing: '1px' }}>AI RTS Battle Engine</h2>
                            <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>Real-time domination & economy</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: status === 'ONLINE' ? '#00eeff' : '#ff0055' }}>
                                ● {status}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                ENTITIES: {entitiesCount}
                            </div>
                        </div>
                    </div>

                    <div className="canvas-container">
                        <canvas ref={canvasRef} width={500} height={500} style={{ display: 'block', backgroundColor: '#000000' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '15px' }}>
                        {['CYAN', 'RED', 'YELLOW', 'GREEN'].map(team => (
                            <div key={team} style={{
                                padding: '8px', backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                border: `1px solid ${getTeamColor(team, true)}`, borderTop: `3px solid ${getTeamColor(team)}`,
                                color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem'
                            }}>
                                <div style={{ color: getTeamColor(team), fontWeight: 'bold', marginBottom: '5px' }}>
                                    {team} (W: {scores[team]})
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.7 }}>FOOD:</span>
                                    <span>{banks[team]?.food || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.7 }}>ENERGY:</span>
                                    <span>{banks[team]?.energy || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button onClick={() => sendCommand('PLAY')} style={btnStyle}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 238, 255, 0.2)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}>▶ PLAY</button>
                        <button onClick={() => sendCommand('PAUSE')} style={btnStyle}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0, 238, 255, 0.2)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}>⏸ PAUSE</button>
                        <button onClick={() => sendCommand('SPEED_2X')}
                            style={{ ...btnStyle, color: '#ffee00', borderColor: '#ffee00', boxShadow: '0 0 5px rgba(255, 238, 0, 0.2)' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 238, 0, 0.2)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}>⏩ 2X SPEED</button>
                        <button onClick={() => sendCommand('RESET')}
                            style={{ ...btnStyle, color: '#ff0055', borderColor: '#ff0055', boxShadow: '0 0 5px rgba(255, 0, 85, 0.2)' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 0, 85, 0.2)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}>♻ RESET</button>
                    </div>
                </div>
            </div>

            {/* 3. RIGHT SIDE: The Tactical Intelligence Box */}
            <div className="tactical-intel-panel">
                <h3 className="panel-title">TACTICAL BRIEF</h3>

                <div className="faction-intel-list">
                    <div className="intel-item red-faction">
                        <h4>🔴 RED (SWARM)</h4>
                        <p>Overwhelms enemies with a massive quantity of cheap, fast units.</p>
                    </div>

                    <div className="intel-item yellow-faction">
                        <h4>🟡 YELLOW (SIEGE)</h4>
                        <p>Hoards energy to deploy devastating, long-range Artillery strikes.</p>
                    </div>

                    <div className="intel-item terran-faction cyan-color">
                        <h4>🔵 CYAN (HEAVY ARMOR)</h4>
                        <p>Builds highly durable Juggernaut Tanks to form an unbreakable wall.</p>
                    </div>

                    <div className="intel-item terran-faction green-color">
                        <h4>🟢 GREEN (SIEGE)</h4>
                        <p>Mirrors Yellow's siege tactics with heavy reliance on Artillery.</p>
                    </div>
                </div>
            </div>

        </div> // End of simulation-workspace
    );
};

export default AiRtsBattle;