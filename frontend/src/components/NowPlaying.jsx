import React, { useEffect, useState } from 'react';
import './NowPlaying.css';

function NowPlaying({ media, apiUrl }) {
    const [progress, setProgress] = useState(0);

    const ratingText = media?.rating || 'NR';

    const resolutionIcon = media?.resolution || '1080p'; // e.g., '4K', '1080p', '720p', '480p'
    const videoCodecIcon = media?.videoCodec || 'h264'; // e.g., 'hevc', 'h264'
    const audioCodecIcon = media?.audioCodec || 'ac3'; // e.g., 'truehd', 'ac3', 'aac'

    return (
        <div className="now-playing-container fade-in">
            {/* Top Header */}
            <div className="np-header">
                <h2>NOW PLAYING</h2>
            </div>

            {/* Blurred background to fill screen bounds */}
            <div
                className="np-background"
                style={{ backgroundImage: `url(${media?.thumb || 'placeholder.jpg'})` }}
            />

            {/* Main poster image designed to scale flexibly to the screen dimensions */}
            <div className="np-poster-wrapper">
                <img
                    src={media?.thumb || 'placeholder.jpg'}
                    className="np-poster-main"
                    alt="Movie Poster"
                />
            </div>

            <div className="np-gradient-overlay" />

            {/* Elegant overlay for the metadata */}
            <div className="np-info-overlay">
                <div className="np-meta">
                    <span className="np-rating">{ratingText}</span>
                    <span className="np-dot">•</span>
                    <div className="np-badges">
                        <span className="codec-badge">{resolutionIcon}</span>
                        <span className="codec-badge">{videoCodecIcon.toUpperCase()}</span>
                        <span className="codec-badge">{audioCodecIcon.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NowPlaying;
