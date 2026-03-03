import React from 'react';
import './LiveSports.css';

function LiveSports({ sports }) {
    const games = Array.isArray(sports) ? sports : [];

    if (games.length === 0) {
        return (
            <div className="sports-container fade-in empty-state">
                <div className="sports-bg" />
                <div className="glass-panel message-panel">
                    <h2>No Scheduled Games</h2>
                    <p>There are no active or recently scheduled games for your tracked leagues today.</p>
                </div>
            </div>
        );
    }

    // Group games by sport
    const groupedGames = games.reduce((acc, game) => {
        if (!acc[game.sport]) acc[game.sport] = [];
        acc[game.sport].push(game);
        return acc;
    }, {});

    const sportIcons = {
        'NFL': '🏈',
        'NBA': '🏀',
        'NCAAF': '🏈',
        'NCAAB': '🏀',
        'NCAA Softball': '🥎'
    };

    // Collect Favorite Teams records for the header bar
    const favoriteTeams = [];
    games.forEach(game => {
        if (game.home.isFavorite) {
            favoriteTeams.push({ ...game.home, sport: game.sport });
        }
        if (game.away.isFavorite) {
            favoriteTeams.push({ ...game.away, sport: game.sport });
        }
    });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="sports-container fade-in">
            <div className="sports-bg" />

            {/* Dashboard Main Header */}
            <div className="dashboard-header">
                <div className="live-pill">
                    <span className="live-dot-header"></span> LIVE
                </div>
                <div className="header-titles">
                    <h1>SPORTS DASHBOARD</h1>
                    <span className="header-date">{today}</span>
                </div>
            </div>

            <div className="sports-content">
                {favoriteTeams.length > 0 && (
                    <div className="favorites-bar glass-panel">
                        <span className="favorites-label">MY TEAMS:</span>
                        <div className="favorites-list">
                            {favoriteTeams.map((team, idx) => (
                                <div key={idx} className="fav-team-stat">
                                    <span className="sport-icon">{sportIcons[team.sport] || '🏆'}</span>
                                    {team.logo && <img src={team.logo} alt="logo" className="mini-logo" />}
                                    <span className="team-name-small fav-text">{team.name}</span>
                                    {team.record && <span className="team-record">({team.record})</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {Object.keys(groupedGames).map(sport => (
                    <div key={sport} className="sport-section">
                        <h2 className="section-title">{sport}</h2>
                        <div className="games-flex">
                            {groupedGames[sport].map((game, index) => {
                                const isFavoriteGame = game.home.isFavorite || game.away.isFavorite;
                                const isLive = game.status === 'in';
                                const isFinal = game.status === 'post';

                                return (
                                    <div key={game.id || index} className={`game-card glass-panel ${isFavoriteGame ? 'favorite-highlight' : ''}`}>
                                        <div className="game-header">
                                            {isLive ? (
                                                <span className="live-indicator"><span className="live-dot"></span> LIVE</span>
                                            ) : (
                                                <span className={`status-indicator ${isFinal ? 'final' : 'upcoming'}`}>
                                                    {isFinal ? 'FINAL' : 'UPCOMING'}
                                                </span>
                                            )}
                                            <div className="clock-compact">{game.clock}</div>
                                        </div>

                                        <div className="teams-stack">
                                            {/* Away Team Row */}
                                            <div className="team-row">
                                                <div className="team-info">
                                                    {game.away.logo && <img src={game.away.logo} alt="logo" className="mini-logo" />}
                                                    <span className={`team-name-small ${game.away.isFavorite ? 'fav-text' : ''}`}>
                                                        {game.away.rank && <span className="rank-badge-small">{game.away.rank}</span>}
                                                        {game.away.name}
                                                    </span>
                                                </div>
                                                <div className={`score-small ${game.away.score > game.home.score && isFinal ? 'winner' : ''}`}>
                                                    {game.status !== 'pre' ? game.away.score : '-'}
                                                </div>
                                            </div>

                                            {/* Home Team Row */}
                                            <div className="team-row">
                                                <div className="team-info">
                                                    {game.home.logo && <img src={game.home.logo} alt="logo" className="mini-logo" />}
                                                    <span className={`team-name-small ${game.home.isFavorite ? 'fav-text' : ''}`}>
                                                        {game.home.rank && <span className="rank-badge-small">{game.home.rank}</span>}
                                                        {game.home.name}
                                                    </span>
                                                </div>
                                                <div className={`score-small ${game.home.score > game.away.score && isFinal ? 'winner' : ''}`}>
                                                    {game.status !== 'pre' ? game.home.score : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LiveSports;
