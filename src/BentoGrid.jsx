import React, { useState } from 'react';
import './BentoGrid.css';

const BentoGrid = ({ language = 'en' }) => {
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
                    {/* BACK */}
                    <div className="bento-back" style={{ padding: '30px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h2>{t[language].greeting}</h2>
                        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#555' }}>
                            {t[language].bio}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- Contacts Card --- */}
            <div className="bento-wrapper bento-contacts" onClick={() => toggleFlip('contacts')}>
                <div className={`bento-inner ${flipped.contacts ? 'is-flipped' : ''}`}>
                    <div className="bento-front">
                        <h2>[ COMM-LINK ]</h2>
                        <div className="click-hint">ACCESS NODE</div>
                    </div>
                    <div className="bento-back">
                        <h2>Comm-Link</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <a href="https://www.linkedin.com/in/kirill-nikitenko-8b600a375/" target="_blank" rel="noopener noreferrer" className="social-link" onClick={e => e.stopPropagation()}>
                                LinkedIn ↗
                            </a>
                            <a href="https://github.com/Kirill-dev01" target="_blank" rel="noopener noreferrer" className="social-link" onClick={e => e.stopPropagation()}>
                                GitHub ↗
                            </a>
                            <a href="mailto:kirillnam2201@gmail.com" className="social-link" onClick={e => e.stopPropagation()}>
                                Email ↗
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Core Stack Card --- */}
            <div className="bento-wrapper bento-stack" onClick={() => toggleFlip('stack')}>
                <div className={`bento-inner ${flipped.stack ? 'is-flipped' : ''}`}>
                    <div className="bento-front">
                        <h2>[ CORE STACK ]</h2>
                        <div className="click-hint">ACCESS NODE</div>
                    </div>
                    <div className="bento-back">
                        <h2>Core Stack</h2>
                        <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                            <span className="tag" style={{ padding: '8px 12px', background: '#222', borderRadius: '5px', border: '1px solid #444' }}>Python</span>
                            <span className="tag" style={{ padding: '8px 12px', background: '#222', borderRadius: '5px', border: '1px solid #444' }}>Kotlin</span>
                            <span className="tag" style={{ padding: '8px 12px', background: '#222', borderRadius: '5px', border: '1px solid #444' }}>Java</span>
                            <span className="tag" style={{ padding: '8px 12px', background: '#222', borderRadius: '5px', border: '1px solid #444' }}>React</span>
                            <span className="tag" style={{ padding: '8px 12px', background: '#222', borderRadius: '5px', border: '1px solid #444' }}>Django</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BentoGrid;