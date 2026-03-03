import React, { useEffect, useState } from 'react';
import './IdleSlideshow.css';

function IdleSlideshow({ apiUrl }) {
    const [posters, setPosters] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetch(`${apiUrl}/api/posters`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setPosters(data);
                }
            })
            .catch(err => console.error("Error fetching posters:", err));
    }, [apiUrl]);

    useEffect(() => {
        if (posters.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % posters.length);
        }, 15000);

        return () => clearInterval(interval);
    }, [posters]);

    if (posters.length === 0) {
        return (
            <div className="idle-container fade-in empty">
                <h2 style={{ opacity: 0.2 }}>Waiting for Media...</h2>
                <p style={{ opacity: 0.1 }}>Add posters to your mapped directory.</p>
            </div>
        );
    }

    return (
        <div className="idle-container">
            {posters.map((poster, index) => {
                const isCurrent = index === currentIndex;
                return (
                    <div
                        key={poster}
                        className={`idle-slide ${isCurrent ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${apiUrl}/posters/${poster})` }}
                    />
                );
            })}
        </div>
    );
}

export default IdleSlideshow;
