import React, { useEffect, useState } from 'react';
import './AdminPanel.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function AdminPanel() {
    const [appState, setAppState] = useState({ mode: 'idle', forceSports: false, sports: null });

    useEffect(() => {
        const fetchState = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/state`);
                const data = await response.json();
                setAppState(data);
            } catch (err) {
                console.error("Failed to fetch state:", err);
            }
        };
        fetchState();
        const interval = setInterval(fetchState, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleSports = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/admin/mode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forceSports: !appState.forceSports })
            });
            // Optimistic update
            setAppState(prev => ({ ...prev, forceSports: !prev.forceSports }));
        } catch (err) {
            console.error("Failed to toggle mode:", err);
        }
    };

    const triggerDebug = async (endpoint) => {
        try {
            await fetch(`${BACKEND_URL}${endpoint}`, { method: 'POST' });
        } catch (err) {
            console.error("Debug action failed:", err);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Digital Poster Management</h1>
            </div>

            <div className="admin-content">
                <div className="status-card glass-panel">
                    <h2>Current State</h2>
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="label">Background Media:</span>
                            <span className="value">{appState.mode.toUpperCase()}</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Render Mode:</span>
                            <span className={`value display-mode ${appState.forceSports ? 'sports-active' : ''}`}>
                                {appState.forceSports ? 'FORCED SPORTS' : 'AUTOMATIC'}
                            </span>
                        </div>
                        {appState.sports && (
                            <div className="status-item">
                                <span className="label">Current Game:</span>
                                <span className="value">{appState.sports.away} vs {appState.sports.home}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="control-card glass-panel">
                    <h2>Manual Controls</h2>
                    <p className="control-desc">
                        Use this toggle to override whatever is currently playing in the theater and force the Digital Poster to show the live sports scoreboard.
                    </p>

                    <button
                        className={`toggle-btn ${appState.forceSports ? 'active' : ''}`}
                        onClick={handleToggleSports}
                    >
                        <div className="toggle-indicator"></div>
                        <span>{appState.forceSports ? 'Disable Sports override' : 'Force Sports Mode'}</span>
                    </button>

                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Debug Commands</h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                className="toggle-btn"
                                style={{ flex: 1, padding: '10px' }}
                                onClick={() => triggerDebug('/api/debug/play')}
                            >Simulate Movie</button>
                            <button
                                className="toggle-btn"
                                style={{ flex: 1, padding: '10px' }}
                                onClick={() => triggerDebug('/api/debug/sports')}
                            >Simulate Sports</button>
                            <button
                                className="toggle-btn"
                                style={{ flex: 1, padding: '10px' }}
                                onClick={() => triggerDebug('/api/debug/stop')}
                            >Simulate Stop</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
