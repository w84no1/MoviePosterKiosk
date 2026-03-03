import React, { useEffect, useState } from 'react';
import '../index.css';
import NowPlaying from './NowPlaying';
import IdleSlideshow from './IdleSlideshow';
import LiveSports from './LiveSports';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function KioskDisplay() {
    const [appState, setAppState] = useState({ mode: 'idle', media: null, sports: null, forceSports: false });

    useEffect(() => {
        // Poll the backend for structural changes every 2 seconds
        const fetchState = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/state`);
                const data = await response.json();

                // Deep compare or simple stringify to avoid unnecessary re-renders
                setAppState(prevState => {
                    if (JSON.stringify(prevState) !== JSON.stringify(data)) {
                        return data;
                    }
                    return prevState;
                });
            } catch (err) {
                console.error("Failed to fetch state:", err);
            }
        };

        // Initial fetch
        fetchState();
        const interval = setInterval(fetchState, 2000);
        return () => clearInterval(interval);
    }, []);

    // Determine what to show. If forceSports is true, OVERRIDE everything and show sports.
    const displayMode = appState.forceSports ? 'sports' : appState.mode;

    return (
        <div className="container">
            {displayMode === 'playing' && <NowPlaying media={appState.media} apiUrl={BACKEND_URL} />}
            {displayMode === 'idle' && <IdleSlideshow apiUrl={BACKEND_URL} />}
            {displayMode === 'sports' && <LiveSports sports={appState.sports} apiUrl={BACKEND_URL} />}
        </div>
    );
}

export default KioskDisplay;
