import React, { useState, useEffect } from 'react';
import './TacticalGame.css';

const TacticalGame = ({ setCurrentView }) => {
    const GRID_SIZE = 15;

    const UPGRADE_COSTS = { 1: 300, 2: 500, 3: 800, 4: "MAX" };
    const INCOME_RATES = { 1: 100, 2: 150, 3: 200, 4: 300 };
    const UNIT_COSTS = { 'INF': 100, 'TNK': 250, 'AIR': 400 };
    const BUILD_TIMES = { 'INF': 1, 'TNK': 2, 'AIR': 3 };

    // NEW: Terrain Modifiers (mpCost, Defense Bonus, Attack Bonus)
    const TERRAIN_STATS = {
        'plain': { mpCost: 1, def: 0, atk: 0 },
        'swamp': { mpCost: 2, def: 0.2, atk: 0 }, // +20% defense, slow
        'mid_mtn': { mpCost: 1, def: 0.1, atk: 0.1 }, // +10% def/atk
        'high_mtn': { mpCost: 2, def: 0.2, atk: 0.2 } // +20% def/atk, slow
    };

    const UNIT_STATS = {
        // 2 MP: Can walk 2 Field tiles, OR exactly 1 Mountain/Swamp tile per turn!
        'INF': { maxHp: 100, atk: 25, mp: 2 },

        // 4 MP: Fast on Fields, but a Swamp will eat half of its movement.
        'TNK': { maxHp: 200, atk: 50, mp: 4 },

        // 5 MP: Flies over everything super fast!
        'AIR': { maxHp: 150, atk: 75, mp: 5 }
    };

    const FACTIONS = {
        'P1': { name: 'RED_SWARM', color: '#ff0055', hq: { x: 0, y: 0 } },
        'P2': { name: 'CYAN_NET', color: '#00eeff', hq: { x: 14, y: 14 } },
        'P3': { name: 'GREEN_OPS', color: '#33ff00', hq: { x: 14, y: 0 } },
        'P4': { name: 'YELLOW_SUN', color: '#ffcc00', hq: { x: 0, y: 14 } }
    };

    const [gameState, setGameState] = useState('SETUP');
    const [setupConfig, setSetupConfig] = useState({ totalPlayers: 2, humans: 1, difficulty: 'NORMAL' });

    const [activeFactions, setActiveFactions] = useState([]);
    const [players, setPlayers] = useState({});
    const [units, setUnits] = useState([]);
    const [oils, setOils] = useState([]);
    const [bases, setBases] = useState([]); // NEW: Dynamic capturable bases
    const [mapData, setMapData] = useState({});
    const [currentTurn, setCurrentTurn] = useState('');

    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [hqMenuOpen, setHqMenuOpen] = useState(false);
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 5));
    const getDistance = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    // NEW: Combat Math Calculator
    const getDamage = (attacker, defender, currentMap) => {
        let baseDmg = UNIT_STATS[attacker.type].atk;
        let atkTerrain = currentMap[`${attacker.x}-${attacker.y}`] || 'plain';
        let defTerrain = currentMap[`${defender.x}-${defender.y}`] || 'plain';

        // Airforce flies over terrain, so they get no bonuses from it
        let atkBonus = attacker.type === 'AIR' ? 0 : TERRAIN_STATS[atkTerrain].atk;
        let defBonus = defender.type === 'AIR' ? 0 : TERRAIN_STATS[defTerrain].def;

        return Math.max(1, Math.floor(baseDmg * (1 + atkBonus - defBonus)));
    };

    // NEW: Pathfinding Algorithm for Swamp/Mountain Movement Points
    const getValidMoves = (unit, currentUnits, currentMap) => {
        if (!unit || unit.ap === 0) return {};
        let reachable = { [`${unit.x}-${unit.y}`]: 0 };
        let queue = [{ x: unit.x, y: unit.y, mp: 0 }];

        while (queue.length > 0) {
            let curr = queue.shift();
            const adjs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

            for (let offset of adjs) {
                let nx = curr.x + offset[0]; let ny = curr.y + offset[1];

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    let occupant = currentUnits.find(u => u.x === nx && u.y === ny);
                    if (occupant && occupant.faction !== unit.faction) continue; // Blocked by enemy

                    let terrain = currentMap[`${nx}-${ny}`] || 'plain';
                    let cost = unit.type === 'AIR' ? 1 : TERRAIN_STATS[terrain].mpCost;
                    let newMp = curr.mp + cost;

                    if (newMp <= unit.mp) {
                        if (reachable[`${nx}-${ny}`] === undefined || newMp < reachable[`${nx}-${ny}`]) {
                            reachable[`${nx}-${ny}`] = newMp;
                            queue.push({ x: nx, y: ny, mp: newMp });
                        }
                    }
                }
            }
        }
        return reachable;
    };

    const getSpawnLoc = (hqX, hqY, currentUnitsList) => {
        const adjs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
        for (let offset of adjs) {
            let sx = hqX + offset[0]; let sy = hqY + offset[1];
            if (sx >= 0 && sx < GRID_SIZE && sy >= 0 && sy < GRID_SIZE) {
                if (!currentUnitsList.find(u => u.x === sx && u.y === sy)) return { x: sx, y: sy };
            }
        }
        return null;
    };

    const startGame = () => {
        let active = ['P1', 'P2'];
        if (setupConfig.totalPlayers >= 3) active.push('P3');
        if (setupConfig.totalPlayers === 4) active.push('P4');
        setActiveFactions(active);

        let initPlayers = {};
        let initUnits = [];
        let initBases = [];

        active.forEach((f, index) => {
            initPlayers[f] = { money: 200, level: 1, queue: [], isHuman: index < setupConfig.humans, color: FACTIONS[f].color, name: FACTIONS[f].name };

            // Initialize Bases
            initBases.push({ id: `base-${f}`, x: FACTIONS[f].hq.x, y: FACTIONS[f].hq.y, owner: f, captureProgress: 3 });

            let spawn = getSpawnLoc(FACTIONS[f].hq.x, FACTIONS[f].hq.y, initUnits);
            if (spawn) {
                let stats = UNIT_STATS['INF'];
                initUnits.push({ id: `${f}-1`, x: spawn.x, y: spawn.y, faction: f, hp: stats.maxHp, maxHp: stats.maxHp, ap: 1, mp: stats.mp, type: 'INF' });
            }
        });

        let newMap = {};
        let allOils = [];
        const centerStart = 5;
        const centerEnd = 9;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                newMap[`${x}-${y}`] = 'plain';
                if (x >= centerStart && x <= centerEnd && y >= centerStart && y <= centerEnd) {
                    const randomTerrain = ['plain', 'plain', 'swamp', 'mid_mtn', 'high_mtn'];
                    newMap[`${x}-${y}`] = randomTerrain[Math.floor(Math.random() * randomTerrain.length)];
                    if (Math.random() < 0.1) allOils.push({ x, y });
                }
            }
        }

        const placeSymmetric = (x, y, type, isOil = false) => {
            if (active.includes('P1')) { newMap[`${x}-${y}`] = type; if (isOil) allOils.push({ x, y }); }
            if (active.includes('P2')) { newMap[`${14 - x}-${14 - y}`] = type; if (isOil) allOils.push({ x: 14 - x, y: 14 - y }); }
            if (active.includes('P3')) { newMap[`${14 - x}-${y}`] = type; if (isOil) allOils.push({ x: 14 - x, y }); }
            if (active.includes('P4')) { newMap[`${x}-${14 - y}`] = type; if (isOil) allOils.push({ x, y: 14 - y }); }
        };

        placeSymmetric(2, 2, 'mid_mtn'); placeSymmetric(3, 2, 'high_mtn'); placeSymmetric(2, 3, 'high_mtn');
        placeSymmetric(4, 1, 'swamp'); placeSymmetric(1, 4, 'swamp');
        placeSymmetric(3, 4, 'plain', true); placeSymmetric(4, 3, 'plain', true);

        setMapData(newMap); setPlayers(initPlayers); setUnits(initUnits); setBases(initBases); setOils(allOils);
        setCurrentTurn('P1'); setGameState('PLAYING');
        setLog(["SYS.LOG: Map initialized.", `BATTLE START: ${setupConfig.humans} Human(s) vs ${setupConfig.totalPlayers - setupConfig.humans} AI.`]);
    };

    const processTurnTransition = (currentFaction, currentUnits, currentPlayers, currentBases) => {
        let idx = activeFactions.indexOf(currentFaction);
        let nextFaction = activeFactions[(idx + 1) % activeFactions.length];
        let nextPlayer = { ...currentPlayers[nextFaction] };
        let newLogs = [`--- ${FACTIONS[nextFaction].name} TURN ---`];
        let nextBases = [...currentBases];

        // NEW: Capture Base Logic!
        nextBases.forEach(base => {
            let occupant = currentUnits.find(u => u.x === base.x && u.y === base.y);
            if (occupant && occupant.type === 'INF' && occupant.faction !== base.owner) {
                if (occupant.faction === currentFaction) { // Progress happens at end of turn
                    base.captureProgress -= 1;
                    newLogs.push(`${occupant.faction} hacking Base! (${base.captureProgress} T-Cycles left)`);
                    if (base.captureProgress <= 0) {
                        base.owner = occupant.faction;
                        base.captureProgress = 3;
                        newLogs.push(`>> BASE CAPTURED BY ${occupant.faction} <<`);
                    }
                }
            } else {
                base.captureProgress = 3; // Reset if they walk off
            }
        });

        let oilCount = 0;
        oils.forEach(oil => { if (currentUnits.find(u => u.x === oil.x && u.y === oil.y && u.faction === nextFaction)) oilCount++; });
        const income = (oilCount * INCOME_RATES[nextPlayer.level]) + (nextBases.filter(b => b.owner === nextFaction).length * 50); // Extra $50 per base!
        nextPlayer.money += income;
        if (nextPlayer.isHuman) newLogs.push(`Income: +$${income}`);

        let nextUnits = currentUnits.map(u => u.faction === nextFaction ? { ...u, ap: 1 } : u);
        let updatedQueue = [];
        nextPlayer.queue.forEach(item => {
            if (item.turnsLeft > 1) {
                updatedQueue.push({ ...item, turnsLeft: item.turnsLeft - 1 });
            } else {
                // NEW: Spawns check ALL owned bases!
                let ownedBases = nextBases.filter(b => b.owner === nextFaction);
                let spawn = null;
                for (let b of ownedBases) { spawn = getSpawnLoc(b.x, b.y, nextUnits); if (spawn) break; }

                if (spawn) {
                    let stats = UNIT_STATS[item.type];
                    nextUnits.push({ id: `${nextFaction}-${Date.now()}-${Math.random()}`, x: spawn.x, y: spawn.y, faction: nextFaction, hp: stats.maxHp, maxHp: stats.maxHp, ap: 1, mp: stats.mp, type: item.type });
                    newLogs.push(`${item.type} deployed!`);
                } else {
                    updatedQueue.push({ ...item, turnsLeft: 0 }); // Wait for empty space
                }
            }
        });
        nextPlayer.queue = updatedQueue;

        setBases(nextBases);
        setPlayers(prev => ({ ...prev, [nextFaction]: nextPlayer }));
        setUnits(nextUnits);
        setCurrentTurn(nextFaction);
        newLogs.reverse().forEach(addLog);
    };

    useEffect(() => {
        if (gameState !== 'PLAYING' || !currentTurn) return;
        if (players[currentTurn].isHuman) return;

        const timer = setTimeout(() => {
            let nextUnits = [...units];
            let aiPlayer = { ...players[currentTurn] };
            let newLogs = [];

            if (setupConfig.difficulty === 'HARD') aiPlayer.money += 50;
            if (UPGRADE_COSTS[aiPlayer.level] !== "MAX" && aiPlayer.money >= UPGRADE_COSTS[aiPlayer.level] + 100) {
                aiPlayer.money -= UPGRADE_COSTS[aiPlayer.level]; aiPlayer.level++; newLogs.push(`HQ upgraded to Lvl ${aiPlayer.level}.`);
            }
            if (aiPlayer.money >= UNIT_COSTS['AIR'] && setupConfig.difficulty !== 'EASY') {
                aiPlayer.money -= UNIT_COSTS['AIR']; aiPlayer.queue.push({ type: 'AIR', turnsLeft: BUILD_TIMES['AIR'] });
            } else if (aiPlayer.money >= UNIT_COSTS['TNK']) {
                aiPlayer.money -= UNIT_COSTS['TNK']; aiPlayer.queue.push({ type: 'TNK', turnsLeft: BUILD_TIMES['TNK'] });
            } else if (aiPlayer.money >= UNIT_COSTS['INF']) {
                aiPlayer.money -= UNIT_COSTS['INF']; aiPlayer.queue.push({ type: 'INF', turnsLeft: BUILD_TIMES['INF'] });
            }

            let aiUnits = nextUnits.filter(u => u.faction === currentTurn && u.ap > 0);
            aiUnits.forEach(unit => {
                let enemies = nextUnits.filter(u => u.faction !== currentTurn);
                let targetEnemy = enemies.find(e => getDistance(unit.x, unit.y, e.x, e.y) === 1);

                if (targetEnemy) {
                    // NEW AI COMBAT
                    let dmg = getDamage(unit, targetEnemy, mapData);
                    if (setupConfig.difficulty === 'EASY') dmg = Math.floor(dmg * 0.8);

                    targetEnemy.hp -= dmg; unit.ap = 0;
                    newLogs.push(`${unit.type} attacked for ${dmg} DMG.`);
                    if (targetEnemy.hp <= 0) nextUnits = nextUnits.filter(u => u.id !== targetEnemy.id);
                } else {
                    // NEW AI MOVEMENT 
                    let unownedOils = oils.filter(o => !nextUnits.find(u => u.x === o.x && u.y === o.y && u.faction === currentTurn));
                    let enemyBases = bases.filter(b => b.owner !== currentTurn);

                    let target = (enemyBases.length > 0) ? enemyBases[0] : null;
                    if (unownedOils.length > 0 && setupConfig.difficulty !== 'HARD') target = unownedOils[0];
                    if (setupConfig.difficulty === 'HARD' && enemies.length > 0) target = enemies[0];
                    if (!target) return; // Nothing to do

                    let validMoves = getValidMoves(unit, nextUnits, mapData);
                    let bestMove = { x: unit.x, y: unit.y };
                    let minDist = getDistance(unit.x, unit.y, target.x, target.y);

                    // AI uses Pathfinding to get as close to target as possible!
                    for (let coords in validMoves) {
                        let [vx, vy] = coords.split('-').map(Number);
                        let d = getDistance(vx, vy, target.x, target.y);
                        if (d < minDist) { minDist = d; bestMove = { x: vx, y: vy }; }
                    }

                    unit.x = bestMove.x; unit.y = bestMove.y; unit.ap = 0;
                }
            });

            newLogs.reverse().forEach(addLog);
            let updatedPlayers = { ...players, [currentTurn]: aiPlayer };
            processTurnTransition(currentTurn, nextUnits, updatedPlayers, bases);

        }, 1200);

        return () => clearTimeout(timer);
    }, [currentTurn, units, players, oils, bases, mapData, gameState, setupConfig.difficulty, activeFactions]);

    const handleCellClick = (x, y) => {
        if (gameState !== 'PLAYING' || !players[currentTurn].isHuman) return;
        setHqMenuOpen(false);

        const clickedUnit = units.find(u => u.x === x && u.y === y);
        const selectedUnit = units.find(u => u.id === selectedUnitId);

        if (clickedUnit && clickedUnit.faction === currentTurn) {
            if (clickedUnit.ap > 0) setSelectedUnitId(clickedUnit.id);
            return;
        }

        if (!selectedUnit) return;

        // NEW: Human Movement uses Pathfinding!
        const validMoves = getValidMoves(selectedUnit, units, mapData);

        if (!clickedUnit && validMoves[`${x}-${y}`] !== undefined && selectedUnit.ap > 0) {
            setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, x, y, ap: 0 } : u));
            setSelectedUnitId(null);
            if (oils.find(o => o.x === x && o.y === y)) addLog(`Oil rig secured.`);

            let base = bases.find(b => b.x === x && b.y === y && b.owner !== currentTurn);
            if (base && selectedUnit.type === 'INF') addLog(`Initiating Base Hack...`);
            return;
        }

        if (clickedUnit && clickedUnit.faction !== currentTurn && getDistance(selectedUnit.x, selectedUnit.y, x, y) === 1 && selectedUnit.ap > 0) {
            // NEW Human Combat Calculation
            const damage = getDamage(selectedUnit, clickedUnit, mapData);
            const newHp = clickedUnit.hp - damage;

            let newUnits = units.map(u => {
                if (u.id === selectedUnit.id) return { ...u, ap: 0 };
                if (u.id === clickedUnit.id) return { ...u, hp: newHp };
                return u;
            });

            if (newHp <= 0) {
                newUnits = newUnits.filter(u => u.id !== clickedUnit.id);
                addLog(`Enemy destroyed!`);
            } else {
                addLog(`Hit for ${damage} DMG.`);
            }
            setUnits(newUnits);
            setSelectedUnitId(null);
        }
    };

    const buyUnit = (type) => {
        const cost = UNIT_COSTS[type];
        if (players[currentTurn].money < cost) { addLog("INSUFFICIENT FUNDS."); return; }

        setPlayers(prev => ({
            ...prev, [currentTurn]: {
                ...prev[currentTurn], money: prev[currentTurn].money - cost, queue: [...prev[currentTurn].queue, { type, turnsLeft: BUILD_TIMES[type] }]
            }
        }));
        addLog(`Construction started: ${type}.`);
    };

    const upgradeHq = () => {
        const cost = UPGRADE_COSTS[players[currentTurn].level];
        if (cost === "MAX" || players[currentTurn].money < cost) return;
        setPlayers(prev => ({ ...prev, [currentTurn]: { ...prev[currentTurn], money: prev[currentTurn].money - cost, level: prev[currentTurn].level + 1 } }));
        addLog(`HQ Upgraded!`); setHqMenuOpen(false);
    };

    if (gameState === 'SETUP') {
        return (
            <div className="conquest-container" style={{ alignItems: 'center' }}>
                <h2>SYS_INIT // SKIRMISH CONFIG</h2>
                <div style={{ background: '#111', border: '1px solid #33ff00', padding: '20px', width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div><label style={{ color: '#aaa', display: 'block' }}>TOTAL FACTIONS:</label><select value={setupConfig.totalPlayers} onChange={(e) => setSetupConfig({ ...setupConfig, totalPlayers: parseInt(e.target.value), humans: Math.min(setupConfig.humans, parseInt(e.target.value)) })} className="game-btn" style={{ width: '100%' }}><option value={2}>2 PLAYERS</option><option value={3}>3 PLAYERS</option><option value={4}>4 PLAYERS</option></select></div>
                    <div><label style={{ color: '#aaa', display: 'block' }}>HUMAN CONTROLLERS:</label><select value={setupConfig.humans} onChange={(e) => setSetupConfig({ ...setupConfig, humans: parseInt(e.target.value) })} className="game-btn" style={{ width: '100%' }}>{[...Array(setupConfig.totalPlayers)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} HUMAN(S)</option>))}</select></div>
                    <div><label style={{ color: '#aaa', display: 'block' }}>AI DIFFICULTY:</label><select value={setupConfig.difficulty} onChange={(e) => setSetupConfig({ ...setupConfig, difficulty: e.target.value })} className="game-btn" style={{ width: '100%', borderColor: setupConfig.difficulty === 'HARD' ? '#ff0055' : '' }}><option value="EASY">EASY</option><option value="NORMAL">NORMAL</option><option value="HARD">HARD</option></select></div>
                    <button className="game-btn" style={{ borderColor: '#00eeff', color: '#00eeff', marginTop: '10px' }} onClick={startGame}>[ INITIATE BATTLE ]</button>
                    <button className="game-btn" style={{ borderColor: '#555', color: '#555' }} onClick={() => setCurrentView('ARCADE')}>CANCEL</button>
                </div>
            </div>
        );
    }

    // Pre-calculate valid moves for the selected unit to show outlines
    const selectedUnit = units.find(u => u.id === selectedUnitId);
    const validMoves = getValidMoves(selectedUnit, units, mapData);

    let cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const unit = units.find(u => u.x === x && u.y === y);
            const isOil = oils.find(o => o.x === x && o.y === y);

            // NEW: Draw Capturable Bases
            const base = bases.find(b => b.x === x && b.y === y);

            const terrainType = mapData[`${x}-${y}`] || 'plain';
            const canMoveHere = validMoves[`${x}-${y}`] !== undefined;

            cells.push(
                <div key={`${x}-${y}`} className={`tac-cell ${terrainType}`} style={{ border: canMoveHere ? '1px dashed #fff' : 'none' }} onClick={() => handleCellClick(x, y)}>

                    {base && (
                        <div className="city" style={{ color: FACTIONS[base.owner].color, border: `1px dashed ${FACTIONS[base.owner].color}` }}>
                            {base.captureProgress < 3 ? `[${base.captureProgress}]` : '[HQ]'}
                        </div>
                    )}

                    {isOil && <div className="oil-rig" style={{ position: 'absolute', opacity: unit ? 0.3 : 1 }}>$</div>}

                    {unit && (
                        <div className={`unit ${selectedUnitId === unit.id ? 'selected' : ''} ${unit.ap === 0 ? 'exhausted' : ''}`}
                            style={{ position: 'absolute', zIndex: 1, border: `2px solid ${FACTIONS[unit.faction].color}`, color: FACTIONS[unit.faction].color, background: '#000' }}>
                            {unit.type}
                            <div className="hp-bar"><div className="hp-fill" style={{ width: `${(unit.hp / unit.maxHp) * 100}%`, background: unit.hp < (unit.maxHp / 2) ? 'red' : '#33ff00' }}></div></div>
                        </div>
                    )}
                </div>
            );
        }
    }

    const currentPlayer = players[currentTurn];

    return (
        <div className="conquest-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', background: '#111', padding: '10px', border: `1px solid ${currentPlayer?.color || '#555'}` }}>
                {activeFactions.map(f => (
                    <div key={f} style={{ color: FACTIONS[f].color, textAlign: 'center', opacity: currentTurn === f ? 1 : 0.4 }}>
                        <strong>{FACTIONS[f].name}</strong><br />
                        ${players[f].money} | L{players[f].level}
                    </div>
                ))}
            </div>

            <div className="turn-indicator" style={{ color: currentPlayer?.color, textAlign: 'center', margin: '10px 0' }}>
                <h3>{currentPlayer?.isHuman ? `>> YOUR COMMAND (${FACTIONS[currentTurn].name}) <<` : `>> ${FACTIONS[currentTurn].name} THINKING... <<`}</h3>
            </div>

            {/* --- 1. THE GAME BOARD --- */}
            <div className="tactical-board" style={{ opacity: currentPlayer?.isHuman ? 1 : 0.8 }}>
                {cells}
            </div>

            {/* --- 2. THE TERRAIN LEGEND --- */}
            <div style={{ width: '100%', maxWidth: '600px', background: '#050505', border: '1px dashed #555', padding: '10px', marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', textAlign: 'center', fontSize: '0.85rem', color: '#aaa', fontFamily: "'VT323', monospace" }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div className="tac-cell plain" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div>
                    <div>FIELD<br />1 MP</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div className="tac-cell swamp" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div>
                    <div>SWAMP<br />2 MP | +20% DEF</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div className="tac-cell mid_mtn" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div>
                    <div>HILLS<br />1 MP | +10% ALL</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div className="tac-cell high_mtn" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div>
                    <div>MOUNTAIN<br />2 MP | +20% ALL</div>
                </div>
            </div>

            {/* --- 3. HQ CONTROLS --- */}
            {currentPlayer?.isHuman && (
                hqMenuOpen ? (
                    <div className="hq-menu" style={{ maxWidth: '600px' }}>
                        <h3 style={{ margin: 0, color: currentPlayer.color }}>-- HQ COMMAND --</h3>
                        <p style={{ margin: '5px 0' }}>Funds: ${currentPlayer.money}</p>
                        {currentPlayer.queue.length > 0 && (<div style={{ color: '#ffcc00', margin: '5px 0' }}>BUILDING: {currentPlayer.queue.map(q => `${q.type}(${q.turnsLeft}T)`).join(', ')}</div>)}
                        <div className="hq-menu-buttons">
                            <button className="game-btn" onClick={() => buyUnit('INF')}>INF ($100)</button>
                            <button className="game-btn" onClick={() => buyUnit('TNK')}>TNK ($250)</button>
                            <button className="game-btn" onClick={() => buyUnit('AIR')}>AIR ($400)</button>
                            <button className="game-btn" onClick={upgradeHq}>UPG Lvl {currentPlayer.level + 1}</button>
                            <button className="game-btn" onClick={() => setHqMenuOpen(false)}>CLOSE</button>
                        </div>
                    </div>
                ) : (
                    <div className="game-controls" style={{ marginTop: '20px' }}>
                        <button className="game-btn" onClick={() => setHqMenuOpen(true)}>[ HQ MENU ]</button>
                        <button className="game-btn" style={{ borderColor: currentPlayer.color, color: currentPlayer.color }} onClick={() => processTurnTransition(currentTurn, units, players, bases)}>[ END TURN ]</button>
                    </div>
                )
            )}

            {/* --- 4. COMBAT LOG --- */}
            <div style={{ marginTop: '20px', width: '100%', maxWidth: '600px', border: '1px dashed #33ff00', padding: '10px', background: '#000' }}>
                {log.map((msg, i) => <div key={i} style={{ color: i === 0 ? '#33ff00' : '#555', fontFamily: 'VT323', fontSize: '1rem' }}>{msg}</div>)}
            </div>
        </div>
    );
};

export default TacticalGame;