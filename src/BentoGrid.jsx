import React from 'react';
import './BentoGrid.css'; // Make sure to link your CSS file

const BentoGrid = () => {
    return (
        <div className="bento-grid">

            {/* Card 1: The Intro */}
            <div className="bento-card card-intro">
                <h2>Hello.</h2>
                <p>
                    I am a full-stack and mobile developer specializing in Python, Kotlin, and Java.
                    I build robust server-side infrastructure and clean, accessible mobile applications.
                </p>
            </div>

            {/* Card 2: Highlight Product */}
            <div className="bento-card card-highlight">
                <h2>Nihongo Quest</h2>
                <p>
                    An offline-first Japanese study guide for N5-N1 levels. Designed for students
                    to study seamlessly in multiple languages with an expanding interactive story mode.
                </p>
            </div>

            {/* Card 3: The Toolkit */}
            <div className="bento-card card-toolkit">
                <h2>Core Stack</h2>
                <div className="tags">
                    <span className="tag">Python</span>
                    <span className="tag">Kotlin</span>
                    <span className="tag">Java</span>
                    <span className="tag">React</span>
                    <span className="tag">Django</span>
                </div>
            </div>

            {/* Card 5: The Sandbox */}
            <div className="bento-card card-sandbox">
                <h2>In Progress</h2>
                <p>Budget Manager: Experimenting with minimalist UI and lightweight state management.</p>
            </div>

            {/* Card 4: Deep Dive */}
            <div className="bento-card card-deep-dive">
                <h2>Backend Architecture: Chaos Organizer</h2>
                <p>
                    A robust backend system featuring real-time chat powered by WebSockets, coupled
                    with a REST API for seamless media synchronization and file uploads.
                </p>
            </div>

        </div>
    );
};

export default BentoGrid;