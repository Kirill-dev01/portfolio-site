import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';

const SystemDaemon = ({ language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasPromptedIdle, setHasPromptedIdle] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [messages, setMessages] = useState([
        { sender: 'sys', text: 'SYS_DAEMON V1.0 INITIALIZED.' },
        { sender: 'sys', text: 'WELCOME, STRANGER. ARE YOU READY TO EXPLORE THE SYSTEM AND PLAY SOME GAMES IN THE ARCADE?' }
    ]);

    const messagesEndRef = useRef(null);
    const nodeRef = useRef(null);

    // --- NEW: REACT TO LANGUAGE SWITCH IN REAL-TIME ---
    useEffect(() => {
        // Only trigger this if there are already messages (don't duplicate on first load)
        if (messages.length > 2) {
            setMessages(prev => [
                ...prev,
                {
                    sender: 'sys',
                    text: language === 'ja' ? '>>> システム言語が日本語に設定されました。' : '>>> SYSTEM LANGUAGE SET TO ENGLISH.'
                }
            ]);
        }
    }, [language]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        let idleTimer;
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (!hasPromptedIdle) {
                idleTimer = setTimeout(() => {
                    setIsOpen(true);
                    setMessages(prev => [
                        ...prev,
                        {
                            sender: 'sys',
                            text: language === 'ja'
                                ? "システム待機状態を検出しました。アーケードセクターでゲームをしましょう。ここで待っているとトランジスタが錆びてしまいます。"
                                : "SYSTEM IDLE DETECTED. LET'S GO PLAY SOME GAMES IN THE ARCADE SECTOR. MY TRANSISTORS ARE GETTING RUSTY WAITING HERE."
                        }
                    ]);
                    setHasPromptedIdle(true);
                }, 120000);
            }
        };

        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
        window.addEventListener('click', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer);

        resetIdleTimer();

        return () => {
            clearTimeout(idleTimer);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('click', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer);
        };
    }, [hasPromptedIdle, language]); // Added language to dependency array

    // --- BILINGUAL BOT BRAIN ---
    const generateResponse = (input) => {
        const text = input.toLowerCase();

        // 1. JAPANESE LOGIC
        if (language === 'ja') {
            if (text.includes('はい') || text.includes('yes') || text.includes('ready')) {
                return "素晴らしい。左側のSYS_MENUからアーケードを起動することをお勧めします。その間、Kirillのポートフォリオを開きましょうか？";
            }
            if (text.includes('いいえ') || text.includes('no') || text.includes('後で')) {
                return "了解しました。ご自身のペースで進めてください。ガイダンスが必要な場合は「help」と入力してください。";
            }
            if (text.includes('こんにちは') || text.includes('hello') || text.includes('hi')) {
                return "こんにちは、ユーザー。システムは完全に稼働しています。ナビゲーションのサポートが必要ですか？";
            }
            if (text.includes('誰') || text.includes('who')) {
                return "私は機械の中の幽霊です。このポートフォリオを案内するためにプログラムされた仮想システムデーモンです。";
            }
            if (text.includes('何ができる') || text.includes('start') || text.includes('おすすめ')) {
                return "Kirillの開発ポートフォリオを閲覧したり、テックニュースを読んだり、アーケードで私や友達と対戦ゲームをプレイしたりできます。「ポートフォリオ」から始めることをお勧めします。";
            }
            if (text.includes('どうやって作') || text.includes('build') || text.includes('tech')) {
                return "このOSインターフェースは、ReactとViteを使用してKirillによって構築され、カスタムCSSとマルチプレイヤーWebSocketバックエンドを備えています。";
            }
            if (text.includes('sudo') || text.includes('hack') || text.includes('root')) {
                return "アクセス拒否。不正な権限昇格が検出されました。このインシデントはシステム管理者に報告されます。";
            }
            if (text.includes('ls') || text.includes('dir')) {
                return "ディレクトリのリスト表示は制限されています。左側のグラフィカルなシステムメニューを使用してください。";
            }
            if (text.includes('help') || text.includes('ヘルプ')) {
                return "利用可能なクエリ：[ about, skills, contact, games, clear ]";
            }
            if (text.includes('about') || text.includes('アバウト')) {
                return "KirillはPythonとAndroidを専門とするフルスタック開発者であり、現在Netologyで高度な学習を修了しています。";
            }
            if (text.includes('skill') || text.includes('スキル') || text.includes('スタック')) {
                return "コアスタック：Kotlin、Java、Python、Django、React。現在、Unityでのゲーム開発へとプロトコルを拡張中です。";
            }
            if (text.includes('contact') || text.includes('連絡') || text.includes('email')) {
                return "通信リンク確立：kirillnam2201@gmail.com | GITHUB: /Kirill-dev01";
            }
            if (text.includes('game') || text.includes('ゲーム') || text.includes('アーケード')) {
                return "アーケードセクターには複数のインタラクティブなビルドが格納されています。メインシステムメニューからアクセスしてください。";
            }
            return "コマンドが認識されません。有効なディレクティブのリストを表示するには「help」と入力してください。";
        }

        // 2. ENGLISH LOGIC (Your existing code)
        if (text === 'yes' || text.includes('ready') || text === 'y' || text === 'yeah') {
            return "EXCELLENT. I HIGHLY RECOMMEND BOOTING UP THE ARCADE FROM THE SYS_MENU ON THE LEFT. SHALL I PULL UP KIRILL'S DEV PORTFOLIO IN THE MEANTIME?";
        }
        if (text === 'no' || text.includes('not yet') || text.includes('later')) {
            return "UNDERSTOOD. PROCEED AT YOUR OWN PACE. TYPE 'help' WHENEVER YOU REQUIRE GUIDANCE.";
        }
        if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
            return "GREETINGS, USER. THE SYSTEM IS FULLY OPERATIONAL. HOW CAN I ASSIST YOUR NAVIGATION?";
        }
        if (text.includes('joke') || text.includes('funny')) {
            return "WHY DO JAVA DEVELOPERS WEAR GLASSES? BECAUSE THEY CAN'T C#.";
        }
        if (text.includes('who are you') || text.includes('what are you')) {
            return "I AM THE GHOST IN THE MACHINE. A VIRTUAL DAEMON PROGRAMMED TO GUIDE VISITORS THROUGH THIS PORTFOLIO.";
        }
        if (text.includes('what can i do') || text.includes('interesting') || text.includes('start') || text.includes('where')) {
            return "YOU CAN BROWSE KIRILL'S DEVELOPMENT PORTFOLIO, READ TECH NEWS, OR PLAY against me or with your friends IN THE ARCADE games. I RECOMMEND CLICKING 'MY PORTFOLIO' ON THE LEFT.";
        }
        if (text.includes('build this') || text.includes('how was this made') || text.includes('source code') || text.includes('tech stack')) {
            return "THIS OS INTERFACE WAS BUILT BY KIRILL USING REACT AND VITE, FEATURING CUSTOM CSS AND A MULTIPLAYER WEBSOCKET BACKEND.";
        }
        if (text.includes('sudo') || text.includes('hack') || text.includes('root') || text.includes('admin')) {
            return "ACCESS DENIED. UNAUTHORIZED PRIVILEGE ESCALATION DETECTED. THIS INCIDENT WILL BE REPORTED TO THE SYS_ADMIN.";
        }
        if (text.includes('ls') || text.includes('dir')) {
            return "DIRECTORY LISTING RESTRICTED. PLEASE USE THE GRAPHICAL SYS_MENU ON THE LEFT.";
        }
        if (text.includes('help')) {
            return "AVAILABLE QUERIES: [ about, skills, contact, games, joke, clear ]";
        }
        if (text.includes('about')) {
            return "KIRILL IS A FULL-STACK DEVELOPER SPECIALIZING IN PYTHON AND ANDROID, CURRENTLY COMPLETING ADVANCED STUDIES AT NETOLOGY.";
        }
        if (text.includes('skill') || text.includes('stack')) {
            return "CORE STACK: KOTLIN, JAVA, PYTHON, DJANGO, REACT. CURRENTLY EXPANDING PROTOCOLS TO INCLUDE UNITY GAME DEVELOPMENT.";
        }
        if (text.includes('contact') || text.includes('email') || text.includes('hire')) {
            return "COMM-LINK ESTABLISHED: kirillnam2201@gmail.com | GITHUB: /Kirill-dev01";
        }
        if (text.includes('game') || text.includes('arcade')) {
            return "THE ARCADE SECTOR HOUSES MULTIPLE INTERACTIVE BUILDS. ACCESS IT VIA THE MAIN SYSTEM MENU.";
        }

        return "COMMAND UNRECOGNIZED. TYPE 'help' FOR A LIST OF VALID DIRECTIVES.";
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        if (inputValue.toLowerCase() === 'clear' || inputValue === 'クリア') {
            setTimeout(() => {
                setMessages([{
                    sender: 'sys',
                    text: language === 'ja' ? 'ターミナルがクリアされました。ご用件は何ですか？' : 'TERMINAL CLEARED. HOW CAN I HELP?'
                }]);
                setIsTyping(false);
            }, 500);
            return;
        }

        setTimeout(() => {
            const botReply = { sender: 'sys', text: generateResponse(inputValue) };
            setMessages(prev => [...prev, botReply]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <>
            <button
                className="daemon-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? (language === 'ja' ? '[ X ] デーモンを閉じる' : '[ X ] CLOSE DAEMON')
                    : (language === 'ja' ? '[ ? ] システムデーモン' : '[ ? ] SYS_DAEMON')}
            </button>

            {isOpen && (
                <Draggable handle=".daemon-header" nodeRef={nodeRef} disabled={isMobile}>
                    <div className="daemon-window" ref={nodeRef}>

                        <div className="daemon-header">
                            <span>&gt; {language === 'ja' ? 'デーモンプロセス_ID: 9942' : 'DAEMON_PROCESS_ID: 9942'}</span>
                        </div>

                        <div className="daemon-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message-row ${msg.sender}`}>
                                    <span className="message-prefix">
                                        {msg.sender === 'sys' ? 'SYS> ' : 'USR> '}
                                    </span>
                                    <span className="message-text">{msg.text}</span>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="message-row sys">
                                    <span className="message-prefix">SYS&gt; </span>
                                    <span className="message-text blink-text">
                                        {language === 'ja' ? '[ 処理中... ]' : '[ processing... ]'}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="daemon-input-area">
                            <span className="input-prefix">USR&gt;</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                spellCheck="false"
                                placeholder={language === 'ja' ? 'コマンドを入力...' : ''}
                            />
                            <button type="submit" style={{ display: 'none' }}>SEND</button>
                        </form>

                    </div>
                </Draggable>
            )}
        </>
    );
};

export default SystemDaemon;