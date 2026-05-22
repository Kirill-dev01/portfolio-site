import React, { useState, useEffect } from 'react';
import './TacticalGame.css';

const TacticalGame = ({ setCurrentView, transmitData, isOnline, activeRoom, setActiveRoom }) => {
    const GRID_SIZE = 15;

    const UPGRADE_COSTS = { 1: 300, 2: 500, 3: 800, 4: "MAX" };
    const INCOME_RATES = { 1: 100, 2: 150, 3: 200, 4: 300 };
    const UNIT_COSTS = { 'INF': 100, 'TNK': 250, 'AIR': 400 };
    const BUILD_TIMES = { 'INF': 1, 'TNK': 2, 'AIR': 3 };

    const TERRAIN_STATS = {
        'plain': { mpCost: 1, def: 0, atk: 0 },
        'swamp': { mpCost: 2, def: 0.2, atk: 0 },
        'mid_mtn': { mpCost: 1, def: 0.1, atk: 0.1 },
        'high_mtn': { mpCost: 2, def: 0.2, atk: 0.2 }
    };

    const UNIT_STATS = {
        'INF': { maxHp: 100, atk: 25, mp: 2 },
        'TNK': { maxHp: 200, atk: 50, mp: 4 },
        'AIR': { maxHp: 150, atk: 75, mp: 5 }
    };

    const FACTIONS = {
        'P1': { name: 'RED_SWARM', color: '#ff0055', hq: { x: 0, y: 0 } },
        'P2': { name: 'CYAN_NET', color: '#00eeff', hq: { x: 14, y: 14 } },
        'P3': { name: 'GREEN_OPS', color: '#33ff00', hq: { x: 14, y: 0 } },
        'P4': { name: 'YELLOW_SUN', color: '#ffcc00', hq: { x: 0, y: 14 } }
    };

    const [gameState, setGameState] = useState('SETUP');
    const [winner, setWinner] = useState(null);
    const [setupConfig, setSetupConfig] = useState({ totalPlayers: 2, humans: 1, difficulty: 'NORMAL' });

    const [activeFactions, setActiveFactions] = useState([]);
    const [players, setPlayers] = useState({});
    const [units, setUnits] = useState([]);
    const [oils, setOils] = useState([]);
    const [bases, setBases] = useState([]);
    const [mapData, setMapData] = useState({});
    const [currentTurn, setCurrentTurn] = useState('');

    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [hqMenuOpen, setHqMenuOpen] = useState(false);
    const [log, setLog] = useState([]);

    // Network Status
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [syncRequests, setSyncRequests] = useState(0);

    // NEW: Identity System - Who is sitting at this keyboard?
    const [localFaction, setLocalFaction] = useState(null);

    const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 5));
    const getDistance = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    // ==========================================
    // --- 1. NETWORK COMMAND FUNCTIONS ---
    // ==========================================
    const createPrivate = () => {
        const newCode = "OP-" + Math.floor(Math.random() * 9000 + 1000);
        setIsHost(true);
        setLocalFaction('P1'); // Host is always Player 1
        setSetupConfig(prev => ({ ...prev, humans: 2 })); // Force 2 Humans for multiplayer
        setActiveRoom(newCode);
    };

    const joinPrivate = () => {
        if (joinCodeInput) {
            setIsHost(false);
            setLocalFaction('P2'); // Joiner is Player 2
            setActiveRoom(joinCodeInput.toUpperCase());
            setGameState('WAITING_FOR_SYNC');
        }
    };

    const searchPublic = () => {
        setIsSearching(true);
        const mmWs = new WebSocket(`wss://tactical-multiplayer-server.onrender.com/ws/matchmake`);

        mmWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "MATCH_FOUND") {
                setIsHost(data.is_host || false);
                setLocalFaction(data.is_host ? 'P1' : 'P2');
                setSetupConfig(prev => ({ ...prev, humans: 2 })); // Force 2 Humans
                setActiveRoom(data.room_id);
                setIsSearching(false);

                if (!data.is_host) {
                    setGameState('WAITING_FOR_SYNC');
                }
            }
        };
    };

    const getDamage = (attacker, defender, currentMap) => {
        let baseDmg = UNIT_STATS[attacker.type].atk;
        let atkTerrain = currentMap[`${attacker.x}-${attacker.y}`] || 'plain';
        let defTerrain = currentMap[`${defender.x}-${defender.y}`] || 'plain';

        let atkBonus = attacker.type === 'AIR' ? 0 : TERRAIN_STATS[atkTerrain].atk;
        let defBonus = defender.type === 'AIR' ? 0 : TERRAIN_STATS[defTerrain].def;

        return Math.max(1, Math.floor(baseDmg * (1 + atkBonus - defBonus)));
    };

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
                    if (occupant && occupant.faction !== unit.faction) continue;

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

    // ==========================================
    // --- 2. MULTIPLAYER RECEIVE ENGINE ---
    // ==========================================
    useEffect(() => {
        const handleServerMessage = (e) => {
            if (typeof e.data !== 'string' || !e.data.includes("action")) return;

            try {
                const data = JSON.parse(e.data);

                // Receive Unit Movements
                if (data.action === "MOVE") {
                    setUnits(prevUnits => prevUnits.map(u =>
                        u.id === data.unit ? { ...u, x: data.x, y: data.y, ap: 0 } : u
                    ));
                    // Check for damage transmission
                    if (data.targetId) {
                        setUnits(prevUnits => {
                            let newU = prevUnits.map(u => u.id === data.targetId ? { ...u, hp: data.newHp } : u);
                            return newU.filter(u => u.hp > 0); // Destroy unit if 0 HP
                        });
                        addLog(`Enemy strike reported!`);
                    }
                }

                // Receive Map and Full Synchronization
                if (data.action === "SYNC_MAP") {
                    setMapData(data.mapData);
                    setOils(data.oils);
                    setPlayers(data.players);
                    setUnits(data.units);
                    setBases(data.bases);
                    setActiveFactions(data.activeFactions);
                    setCurrentTurn(data.currentTurn);

                    setGameState('PLAYING');
                    addLog("SYS.LOG: Map synchronized. BATTLE START.");
                }

                // Handle Turn Changes from other player
                if (data.action === "END_TURN") {
                    setUnits(data.units);
                    setPlayers(data.players);
                    setBases(data.bases);
                    setCurrentTurn(data.currentTurn);
                    addLog(`--- ${data.currentTurn} TURN ---`);

                    // --- NEW: CATCH VICTORY BROADCAST ---
                    if (data.winner) {
                        setWinner(data.winner);
                        setGameState('GAME_OVER');
                        addLog(`SYS: CRITICAL ALERT. ${data.winner} HAS ACHIEVED TOTAL VICTORY.`);
                    }
                }

                // Handle Enemy HQ Purchases
                if (data.action === "UPDATE_PLAYERS") {
                    setPlayers(data.players);
                }

                // --- NEW: AI GHOST PROTOCOL ---
                // Handle enemy disconnects
                if (data.action === "PLAYER_LEFT") {
                    setPlayers(prevPlayers => {
                        let newPlayers = { ...prevPlayers };
                        // Convert any faction that isn't YOU into an AI
                        Object.keys(newPlayers).forEach(f => {
                            if (f !== localFaction && newPlayers[f].isHuman) {
                                newPlayers[f].isHuman = false;
                            }
                        });
                        return newPlayers;
                    });
                    addLog("WARNING: ENEMY SATELLITE LINK LOST.");
                    addLog("AI GHOST PROTOCOL ENGAGED.");
                }

                // Catch map requests from joining players
                if (data.action === "REQUEST_SYNC") {
                    setSyncRequests(prev => prev + 1);
                }

            } catch (err) {
                console.log("Ignored non-game websocket message", err);
            }
        };

        window.addEventListener("tactical_server_msg", handleServerMessage);
        return () => window.removeEventListener("tactical_server_msg", handleServerMessage);
    }, [localFaction]);

    // THE CLIENT REQUEST
    useEffect(() => {
        if (!isHost && isOnline && gameState === 'WAITING_FOR_SYNC') {
            if (transmitData) transmitData({ action: "REQUEST_SYNC" });
        }
    }, [isHost, isOnline, gameState]);

    // THE HOST RESPONSE
    useEffect(() => {
        if (syncRequests > 0 && isHost && gameState === 'PLAYING') {
            if (transmitData) {
                transmitData({ action: "SYNC_MAP", mapData, oils, players, units, bases, activeFactions, currentTurn });
            }
        }
    }, [syncRequests]);

    // ==========================================
    // --- 3. HOST GAME INITIALIZATION ---
    // ==========================================
    useEffect(() => {
        if (isHost && isOnline && activeRoom && gameState === 'SETUP') {

            let active = ['P1', 'P2'];
            if (setupConfig.totalPlayers >= 3) active.push('P3');
            if (setupConfig.totalPlayers === 4) active.push('P4');
            setActiveFactions(active);

            let initPlayers = {};
            let initUnits = [];
            let initBases = [];

            active.forEach((f, index) => {
                initPlayers[f] = { money: 200, level: 1, queue: [], isHuman: index < setupConfig.humans, color: FACTIONS[f].color, name: FACTIONS[f].name };
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
            setLog(["SYS.LOG: Map initialized.", `BATTLE START: OP-CODE ${activeRoom}`]);

            // BROADCAST THE GENERATED MAP TO THE ROOM
            if (transmitData) {
                setTimeout(() => {
                    transmitData({ action: "SYNC_MAP", mapData: newMap, oils: allOils, players: initPlayers, units: initUnits, bases: initBases, activeFactions: active, currentTurn: 'P1' });
                }, 500);
            }
        }
    }, [isHost, isOnline, activeRoom, gameState]);

    // ==========================================
    // --- 4. GAMEPLAY & LOGIC ENGINE ---
    // ==========================================
    const processTurnTransition = (currentFaction, currentUnits, currentPlayers, currentBases, isFromNetwork = false) => {
        if (gameState !== 'PLAYING') return;

        let idx = activeFactions.indexOf(currentFaction);
        let nextFaction = activeFactions[(idx + 1) % activeFactions.length];
        let nextPlayer = { ...currentPlayers[nextFaction] };
        let newLogs = [`--- ${FACTIONS[nextFaction].name} TURN ---`];
        let nextBases = [...currentBases];

        // --- 1. BASE CAPTURE ENGINE ---
        nextBases.forEach(base => {
            let occupant = currentUnits.find(u => u.x === base.x && u.y === base.y);
            // Captures only happen if it's an INF unit!
            if (occupant && occupant.type === 'INF' && occupant.faction !== base.owner) {
                if (occupant.faction === currentFaction) {
                    base.captureProgress -= 1;
                    newLogs.push(`${occupant.faction} hacking Base! (${base.captureProgress} left)`);
                    if (base.captureProgress <= 0) {
                        base.owner = occupant.faction;
                        base.captureProgress = 3;
                        newLogs.push(`>> BASE CAPTURED BY ${occupant.faction} <<`);
                    }
                }
            } else {
                base.captureProgress = 3;
            }
        });

        // --- 2. VICTORY CHECK ---
        let newWinner = null;
        const survivingFactions = activeFactions.filter(faction =>
            nextBases.some(base => base.owner === faction)
        );

        if (survivingFactions.length === 1) {
            newWinner = survivingFactions[0];
            setWinner(newWinner);
            setGameState('GAME_OVER');
        }

        // --- 3. ECONOMY & INCOME ---
        let oilCount = 0;
        oils.forEach(oil => { if (currentUnits.find(u => u.x === oil.x && u.y === oil.y && u.faction === nextFaction)) oilCount++; });
        const income = (oilCount * INCOME_RATES[nextPlayer.level]) + (nextBases.filter(b => b.owner === nextFaction).length * 50);
        nextPlayer.money += income;
        if (nextPlayer.isHuman) newLogs.push(`Income: +$${income}`);

        // --- 4. UNIT AP RESET & SPAWNING ---
        let nextUnits = currentUnits.map(u => u.faction === nextFaction ? { ...u, ap: 1 } : u);
        let updatedQueue = [];
        nextPlayer.queue.forEach(item => {
            if (item.turnsLeft > 1) {
                updatedQueue.push({ ...item, turnsLeft: item.turnsLeft - 1 });
            } else {
                let ownedBases = nextBases.filter(b => b.owner === nextFaction);
                let spawn = null;
                for (let b of ownedBases) { spawn = getSpawnLoc(b.x, b.y, nextUnits); if (spawn) break; }

                if (spawn) {
                    let stats = UNIT_STATS[item.type];
                    nextUnits.push({ id: `${nextFaction}-U${nextUnits.length + 1}`, x: spawn.x, y: spawn.y, faction: nextFaction, hp: stats.maxHp, maxHp: stats.maxHp, ap: 1, mp: stats.mp, type: item.type });
                    newLogs.push(`${item.type} deployed!`);
                } else {
                    updatedQueue.push({ ...item, turnsLeft: 0 });
                }
            }
        });
        nextPlayer.queue = updatedQueue;

        let updatedPlayers = { ...currentPlayers, [nextFaction]: nextPlayer };

        // --- 5. FINALIZE & TRANSMIT ---
        setBases(nextBases);
        setPlayers(updatedPlayers);
        setUnits(nextUnits);
        setCurrentTurn(nextFaction);
        newLogs.reverse().forEach(addLog);

        if (!isFromNetwork && transmitData) {
            transmitData({
                action: "END_TURN",
                units: nextUnits,
                players: updatedPlayers,
                bases: nextBases,
                currentTurn: nextFaction,
                winner: newWinner // The victory flag sent to the enemy!
            });
        }
    };

    // AI LOOP (Only runs on the Host to prevent duplicate moves!)
    useEffect(() => {
        if (gameState !== 'PLAYING' || !currentTurn) return;
        if (players[currentTurn].isHuman) return;
        if (!isHost) return;

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
                    let dmg = getDamage(unit, targetEnemy, mapData);
                    if (setupConfig.difficulty === 'EASY') dmg = Math.floor(dmg * 0.8);

                    targetEnemy.hp -= dmg; unit.ap = 0;
                    newLogs.push(`${unit.type} attacked for ${dmg} DMG.`);
                    if (targetEnemy.hp <= 0) nextUnits = nextUnits.filter(u => u.id !== targetEnemy.id);
                } else {
                    let unownedOils = oils.filter(o => !nextUnits.find(u => u.x === o.x && u.y === o.y && u.faction === currentTurn));
                    let enemyBases = bases.filter(b => b.owner !== currentTurn);

                    let target = (enemyBases.length > 0) ? enemyBases[0] : null;
                    if (unownedOils.length > 0 && setupConfig.difficulty !== 'HARD') target = unownedOils[0];
                    if (setupConfig.difficulty === 'HARD' && enemies.length > 0) target = enemies[0];
                    if (!target) return;

                    let validMoves = getValidMoves(unit, nextUnits, mapData);
                    let bestMove = { x: unit.x, y: unit.y };
                    let minDist = getDistance(unit.x, unit.y, target.x, target.y);

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
            processTurnTransition(currentTurn, nextUnits, updatedPlayers, bases, false);

        }, 1200);

        return () => clearTimeout(timer);
    }, [currentTurn, units, players, oils, bases, mapData, gameState, setupConfig.difficulty, activeFactions]);

    const handleCellClick = (x, y) => {
        if (gameState !== 'PLAYING') return;

        // CONTROL LOCK: Prevent clicking if it is not your turn!
        if (currentTurn !== localFaction) return;

        setHqMenuOpen(false);

        const clickedUnit = units.find(u => u.x === x && u.y === y);
        const selectedUnit = units.find(u => u.id === selectedUnitId);

        // 1. SELECT FRIENDLY UNIT
        if (clickedUnit && clickedUnit.faction === currentTurn) {
            if (clickedUnit.ap > 0) setSelectedUnitId(clickedUnit.id);
            return;
        }

        // --- ADJUSTED JUNCTION: NO UNIT SELECTED ---
        if (!selectedUnit) {
            // Check if the empty tile you clicked is a base you own
            const clickedBase = bases.find(b => b.x === x && b.y === y);

            if (clickedBase && clickedBase.owner === localFaction && currentTurn === localFaction) {
                // Only open the menu if the factory tile is clear (no unit blocking it)
                if (!clickedUnit) {
                    // Update this to match your project's state variables:
                    setSelectedBuildLocation({ x, y }); // Tracks where to spawn the unit
                    setHqMenuOpen(true);                // Opens your build UI
                } else {
                    addLog("SYS: Launchpad blocked by active deployment.");
                }
            }
            return; // Halt execution early since no unit is selected for movement
        }

        // 2. MOVE SELECTION
        const validMoves = getValidMoves(selectedUnit, units, mapData);

        if (!clickedUnit && validMoves[`${x}-${y}`] !== undefined && selectedUnit.ap > 0) {
            if (transmitData) transmitData({ action: "MOVE", unit: selectedUnit.id, x: x, y: y });

            setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, x, y, ap: 0 } : u));
            setSelectedUnitId(null);
            if (oils.find(o => o.x === x && o.y === y)) addLog(`Oil rig secured.`);

            let base = bases.find(b => b.x === x && b.y === y && b.owner !== currentTurn);
            if (base && selectedUnit.type === 'INF') addLog(`Initiating Base Hack...`);
            return;
        }

        // 3. COMBAT ENGINE
        if (clickedUnit && clickedUnit.faction !== currentTurn && getDistance(selectedUnit.x, selectedUnit.y, x, y) === 1 && selectedUnit.ap > 0) {
            const damage = getDamage(selectedUnit, clickedUnit, mapData);
            const newHp = clickedUnit.hp - damage;

            if (transmitData) {
                transmitData({ action: "MOVE", unit: selectedUnit.id, x: selectedUnit.x, y: selectedUnit.y, targetId: clickedUnit.id, newHp: newHp });
            }

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

        const updatedPlayers = { ...players, [currentTurn]: { ...players[currentTurn], money: players[currentTurn].money - cost, queue: [...players[currentTurn].queue, { type, turnsLeft: BUILD_TIMES[type] }] } };

        setPlayers(updatedPlayers);
        addLog(`Construction started: ${type}.`);
        if (transmitData) transmitData({ action: "UPDATE_PLAYERS", players: updatedPlayers });
    };

    const upgradeHq = () => {
        const cost = UPGRADE_COSTS[players[currentTurn].level];
        if (cost === "MAX" || players[currentTurn].money < cost) return;

        const updatedPlayers = { ...players, [currentTurn]: { ...players[currentTurn], money: players[currentTurn].money - cost, level: players[currentTurn].level + 1 } };
        setPlayers(updatedPlayers);
        addLog(`HQ Upgraded!`); setHqMenuOpen(false);
        if (transmitData) transmitData({ action: "UPDATE_PLAYERS", players: updatedPlayers });
    };

    // ==========================================
    // --- 5. RENDER ENGINE ---
    // ==========================================
    if (gameState === 'SETUP' || gameState === 'WAITING_FOR_SYNC') {
        return (
            <div className="conquest-container" style={{ alignItems: 'center' }}>
                <h2>SYS_INIT // NETWORK COMMAND</h2>
                <div style={{ marginBottom: '10px', color: isOnline ? '#33ff00' : 'red', fontFamily: 'monospace' }}>
                    SATELLITE LINK: {isOnline ? "ESTABLISHED" : "OFFLINE"}
                </div>

                {activeRoom && (
                    <div style={{ background: '#000', border: '1px dashed #33ff00', padding: '10px', marginBottom: '15px', textAlign: 'center' }}>
                        <span style={{ color: '#aaa' }}>ACTIVE ROOM CODE:</span><br />
                        <span style={{ fontSize: '1.5rem', color: '#fff', letterSpacing: '2px' }}>{activeRoom}</span>
                    </div>
                )}

                <div style={{ background: '#111', border: '1px solid #33ff00', padding: '20px', width: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {isSearching ? (
                        <div style={{ color: '#00eeff', textAlign: 'center', padding: '20px 0' }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>[ SEARCHING UPLINKS ]</h3>
                            {!isOnline && <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>Booting satellite uplink...<br />(May take up to 50s if servers are asleep)</p>}
                        </div>
                    ) : gameState === 'WAITING_FOR_SYNC' ? (
                        <div style={{ color: '#ffcc00', textAlign: 'center', padding: '20px 0' }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>[ SYNCHRONIZING ]</h3>
                            {!isOnline && <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>Booting satellite uplink...<br />(May take up to 50s if servers are asleep)</p>}
                        </div>
                    ) : (
                        <>
                            {/* --- RESTORED CONFIGURATION MENU --- */}
                            <div style={{ background: '#050505', padding: '10px', border: '1px dashed #555', marginBottom: '10px' }}>
                                <label style={{ color: '#aaa', display: 'block', fontSize: '0.9rem' }}>TOTAL FACTIONS:</label>
                                <select value={setupConfig.totalPlayers} onChange={(e) => setSetupConfig({ ...setupConfig, totalPlayers: parseInt(e.target.value), humans: Math.min(setupConfig.humans, parseInt(e.target.value)) })} className="game-btn" style={{ width: '100%', marginBottom: '10px' }}>
                                    <option value={2}>2 FACTIONS</option>
                                    <option value={3}>3 FACTIONS</option>
                                    <option value={4}>4 FACTIONS</option>
                                </select>

                                <label style={{ color: '#aaa', display: 'block', fontSize: '0.9rem' }}>NETWORK HUMANS:</label>
                                <select value={setupConfig.humans} onChange={(e) => setSetupConfig({ ...setupConfig, humans: parseInt(e.target.value) })} className="game-btn" style={{ width: '100%', marginBottom: '10px' }}>
                                    {[...Array(setupConfig.totalPlayers)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1} HUMAN(S)</option>
                                    ))}
                                </select>

                                <label style={{ color: '#aaa', display: 'block', fontSize: '0.9rem' }}>AI DIFFICULTY:</label>
                                <select value={setupConfig.difficulty} onChange={(e) => setSetupConfig({ ...setupConfig, difficulty: e.target.value })} className="game-btn" style={{ width: '100%' }}>
                                    <option value="EASY">EASY</option>
                                    <option value="NORMAL">NORMAL</option>
                                    <option value="HARD">HARD</option>
                                </select>
                            </div>
                            {/* ------------------------------------ */}

                            <button className="game-btn" style={{ borderColor: '#33ff00', color: '#33ff00' }} onClick={createPrivate}>[ HOST PRIVATE OPERATION ]</button>

                            <hr style={{ borderTop: '1px dashed #555', width: '100%', margin: '5px 0' }} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" placeholder="ENTER OP-CODE" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} style={{ background: '#000', color: '#33ff00', border: '1px solid #555', padding: '10px', width: '60%', fontFamily: "'VT323', monospace", fontSize: '1.2rem', textTransform: 'uppercase' }} />
                                <button className="game-btn" style={{ width: '40%', padding: '10px 0' }} onClick={joinPrivate}>[ JOIN ]</button>
                            </div>

                            <button className="game-btn" style={{ borderColor: '#00eeff', color: '#00eeff' }} onClick={searchPublic}>[ PUBLIC MATCHMAKING ]</button>
                            <button className="game-btn" style={{ borderColor: '#555', color: '#555', marginTop: '10px' }} onClick={() => setCurrentView('ARCADE')}>CANCEL</button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const selectedUnitObj = units.find(u => u.id === selectedUnitId);
    const validMovesObj = getValidMoves(selectedUnitObj, units, mapData);

    let cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const unit = units.find(u => u.x === x && u.y === y);
            const isOil = oils.find(o => o.x === x && o.y === y);
            const base = bases.find(b => b.x === x && b.y === y);
            const terrainType = mapData[`${x}-${y}`] || 'plain';
            const canMoveHere = validMovesObj[`${x}-${y}`] !== undefined;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', background: '#111', padding: '10px', border: `1px solid ${FACTIONS[localFaction]?.color || '#555'}` }}>
                {activeFactions.map(f => (
                    <div key={f} style={{ color: FACTIONS[f].color, textAlign: 'center', opacity: currentTurn === f ? 1 : 0.4 }}>
                        <strong>{FACTIONS[f].name}</strong> {localFaction === f && "(YOU)"}<br />
                        ${players[f].money} | L{players[f].level}
                    </div>
                ))}
            </div>

            <div className="turn-indicator" style={{ color: currentPlayer?.color, textAlign: 'center', margin: '10px 0' }}>
                <h3>{currentTurn === localFaction ? `>> YOUR COMMAND (${FACTIONS[currentTurn].name}) <<` : `>> ${FACTIONS[currentTurn].name} THINKING... <<`}</h3>
            </div>

            <div className="tactical-board" style={{ opacity: currentTurn === localFaction ? 1 : 0.6 }}>
                {cells}
            </div>

            <div style={{ width: '100%', maxWidth: '600px', background: '#050505', border: '1px dashed #555', padding: '10px', marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', textAlign: 'center', fontSize: '0.85rem', color: '#aaa', fontFamily: "'VT323', monospace" }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><div className="tac-cell plain" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div><div>FIELD<br />1 MP</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><div className="tac-cell swamp" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div><div>SWAMP<br />2 MP | +20% DEF</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><div className="tac-cell mid_mtn" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div><div>HILLS<br />1 MP | +10% ALL</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><div className="tac-cell high_mtn" style={{ width: '20px', height: '20px', border: '1px solid #33ff00' }}></div><div>MOUNTAIN<br />2 MP | +20% ALL</div></div>
            </div>

            {/* UI LOCK: Only show controls if it is actually YOUR turn! */}
            {currentTurn === localFaction ? (
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
                        <button className="game-btn" style={{ borderColor: currentPlayer.color, color: currentPlayer.color }} onClick={() => processTurnTransition(currentTurn, units, players, bases, false)}>[ END TURN ]</button>
                    </div>
                )
            ) : (
                <div className="game-controls" style={{ marginTop: '20px', border: '1px dashed #555', color: '#555', padding: '10px' }}>
                    [ AWAITING ENEMY COMMANDER... ]
                </div>
            )}

            {/* --- VICTORY OVERLAY --- */}
            {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 border-4 border-[#00FF41]">
                    <h1 className={`text-6xl font-bold mb-4 animate-pulse ${winner === localFaction ? 'text-[#00FF41]' : 'text-red-500'}`}>
                        {winner === localFaction ? "VICTORY ACHIEVED" : "CRITICAL DEFEAT"}
                    </h1>
                    <p className="text-xl text-[#00FF41] mb-8 uppercase tracking-widest">
                        {FACTIONS[winner]?.name} NOW CONTROLS ALL SECTORS.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 border-2 border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-colors font-bold tracking-widest"
                    >
                        [ INITIALIZE NEW OPERATION ]
                    </button>
                </div>
            )}

            <div style={{ marginTop: '20px', width: '100%', maxWidth: '600px', border: '1px dashed #33ff00', padding: '10px', background: '#000' }}>
                {log.map((msg, i) => <div key={i} style={{ color: i === 0 ? '#33ff00' : '#555', fontFamily: 'VT323', fontSize: '1rem' }}>{msg}</div>)}
            </div>
        </div>
    );
};

export default TacticalGame;


