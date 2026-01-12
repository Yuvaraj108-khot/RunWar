import { refreshTerritories } from './map.js';

const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const distanceEl = document.getElementById('hud-distance');
const pointsEl = document.getElementById('hud-points');
const mapContainer = document.getElementById('map-container');
const protectionOverlay = document.getElementById('protection-overlay');
const protectionText = document.getElementById('protection-text');
const leaderboardsContent = document.getElementById('leaderboards-content');

export function showAuth() {
  console.log('👁️ Showing auth section, hiding game section');
  if (authSection) {
    authSection.classList.remove('hidden');
  }
  if (gameSection) {
    gameSection.classList.add('hidden');
  }
}

export function showGame() {
  console.log('👁️ Showing game section, hiding auth section');
  if (gameSection) {
    gameSection.classList.remove('hidden');
  }
  if (authSection) {
    authSection.classList.add('hidden');
  }
}

export function updateDistance(meters) {
  const km = meters / 1000;
  if (distanceEl) {
    distanceEl.textContent = `${km.toFixed(2)} km`;
  }
}

export function updatePoints(points) {
  if (pointsEl) {
    pointsEl.textContent = String(points);
  }
}

export function showCaptureGlow() {
  if (mapContainer) {
    mapContainer.classList.add('capture-glow');
    setTimeout(() => mapContainer.classList.remove('capture-glow'), 300);
  }
}

export function updateProtectionOverlay(territories, currentUserId) {
  const protectedOwn = (territories || []).find(t => {
    return (
      t.ownerId === currentUserId &&
      t.protectionRemainingMs &&
      t.protectionRemainingMs > 0
    );
  });

  if (!protectedOwn) {
    if (protectionOverlay) protectionOverlay.classList.add('hidden');
    return;
  }

  const remainingMs = protectedOwn.protectionRemainingMs;
  const remainingHours = remainingMs / 3600000;
  if (protectionText) {
    protectionText.textContent = `${remainingHours.toFixed(1)}h protection`;
  }
  if (protectionOverlay) {
    protectionOverlay.classList.remove('hidden');
  }
}

export function renderLeaderboards(data) {
  if (!leaderboardsContent) return;
  const sections = [];

  const formatRows = (arr, unit) =>
    arr
      .map((row, idx) => {
        const value =
          unit === 'km'
            ? (row.distanceMeters / 1000).toFixed(2) + ' km'
            : unit === 'm2'
            ? row.area.toFixed(0) + ' m²'
            : row.points + ' pts';

        return `<div class="leader-row">
          <span>#${idx + 1} ${row._id}</span>
          <span>${value}</span>
        </div>`;
      })
      .join('');

  if (data?.dailyDistance && data.dailyDistance.length > 0) {
    sections.push(`
      <h4>Daily distance</h4>
      ${formatRows(data.dailyDistance, 'km')}
    `);
  }

  if (data?.monthlyDistance && data.monthlyDistance.length > 0) {
    sections.push(`
      <h4>Monthly distance</h4>
      ${formatRows(data.monthlyDistance, 'km')}
    `);
  }

  if (data?.monthlyArea && data.monthlyArea.length > 0) {
    sections.push(`
      <h4>Monthly territory</h4>
      ${formatRows(data.monthlyArea, 'm2')}
    `);
  }

  if (data?.combined && data.combined.length > 0) {
    sections.push(`
      <h4>Combined score</h4>
      ${formatRows(data.combined, 'pts')}
    `);
  }

  leaderboardsContent.innerHTML = sections.length > 0 ? sections.join('') : '<p style="opacity: 0.6; font-size: 0.9rem;">No leaderboard data yet</p>';
}
