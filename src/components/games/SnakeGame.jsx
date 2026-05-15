import React, { useState, useEffect } from 'react';
// Note: If your <Typewriter /> component is in another file, you need to import it here! 
// e.g., import Typewriter from '../App'; (if it's exported from App.jsx)


// --- 1. Auto-Simulation Game ---
const SnakeGame = ({ setCurrentView }) => {
    const GRID_SIZE = 15;

    const createInitialGrid = () => {
        let newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        newGrid[0][0] = 1;
        newGrid[GRID_SIZE - 1][GRID_SIZE - 1] = 2;
        return newGrid;
    };

    const [grid, setGrid] = useState(createInitialGrid());
    const [isRunning, setIsRunning] = useState(false);
    const [drawMode, setDrawMode] = useState('mountain');
    const [scores, setScores] = useState({ a: 1, b: 1 });

    const handleCellClick = (r, c) => {
        if (isRunning) return;
        if (grid[r][c] === 1 || grid[r][c] === 2) return;

        const newGrid = [...grid.map(row => [...row])];
        newGrid[r][c] = drawMode === 'mountain' ? 3 : 0;
        setGrid(newGrid);
    };

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setGrid(prevGrid => {
                    let nextGrid = [...prevGrid.map(row => [...row])];
                    let addedA = false;
                    let addedB = false;

                    const getEmptyNeighbors = (r, c) => {
                        const neighbors = [];
                        if (r > 0 && prevGrid[r - 1][c] === 0) neighbors.push([r - 1, c]);
                        if (r < GRID_SIZE - 1 && prevGrid[r + 1][c] === 0) neighbors.push([r + 1, c]);
                        if (c > 0 && prevGrid[r][c - 1] === 0) neighbors.push([r, c - 1]);
                        if (c < GRID_SIZE - 1 && prevGrid[r][c + 1] === 0) neighbors.push([r, c + 1]);
                        return neighbors;
                    };

                    for (let r = 0; r < GRID_SIZE; r++) {
                        for (let c = 0; c < GRID_SIZE; c++) {
                            if (prevGrid[r][c] === 1 && !addedA) {
                                const empty = getEmptyNeighbors(r, c);
                                if (empty.length > 0) {
                                    const target = empty[Math.floor(Math.random() * empty.length)];
                                    nextGrid[target[0]][target[1]] = 1;
                                    addedA = true;
                                }
                            }
                            if (prevGrid[r][c] === 2 && !addedB) {
                                const empty = getEmptyNeighbors(r, c);
                                if (empty.length > 0) {
                                    const target = empty[Math.floor(Math.random() * empty.length)];
                                    nextGrid[target[0]][target[1]] = 2;
                                    addedB = true;
                                }
                            }
                        }
                    }

                    let scoreA = 0, scoreB = 0;
                    nextGrid.forEach(row => row.forEach(cell => {
                        if (cell === 1) scoreA++;
                        if (cell === 2) scoreB++;
                    }));
                    setScores({ a: scoreA, b: scoreB });

                    if (!addedA && !addedB) setIsRunning(false);
                    return nextGrid;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <div className="conquest-container">
            {/* NEW: Return Button */}
            <div style={{ width: '100%', maxWidth: '450px', display: 'flex' }}>
                <button className="game-btn" style={{ borderColor: '#aaa', color: '#aaa', fontSize: '1rem' }} onClick={() => setCurrentView('ARCADE')}>
                    {'< RETURN TO ARCADE'}
                </button>
            </div>

            <h2><Typewriter text="SYS.RUN // SECTOR_CONQUEST" speed={30} /></h2>

            <div className="game-hud">
                <span className="score-a">RED_SWARM: {scores.a}</span>
                <span className="score-b">CYAN_NET: {scores.b}</span>
            </div>

            <div className="game-board">
                {grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                        let cellClass = "cell";
                        if (cell === 1) cellClass += " faction-a";
                        if (cell === 2) cellClass += " faction-b";
                        if (cell === 3) cellClass += " mountain";

                        return (
                            <div
                                key={`${rIdx}-${cIdx}`}
                                className={cellClass}
                                onClick={() => handleCellClick(rIdx, cIdx)}
                            />
                        );
                    })
                )}
            </div>

            <div className="game-controls">
                <button className="game-btn" onClick={() => setIsRunning(!isRunning)}>
                    {isRunning ? "|| PAUSE" : "> START SIMULATION"}
                </button>
                <button className={`game-btn ${drawMode === 'mountain' ? 'active' : ''}`} onClick={() => setDrawMode('mountain')}>
                    [+] DRAW MOUNTAINS
                </button>
                <button className={`game-btn ${drawMode === 'erase' ? 'active' : ''}`} onClick={() => setDrawMode('erase')}>
                    [-] ERASE
                </button>
                <button className="game-btn" style={{ borderColor: '#ea4335', color: '#ea4335' }} onClick={() => { setIsRunning(false); setGrid(createInitialGrid()); setScores({ a: 1, b: 1 }); }}>
                    RESET MAP
                </button>
            </div>
        </div>
    );
};

export default SnakeGame;