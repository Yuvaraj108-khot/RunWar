import { initAuth, getCurrentUser } from './auth.js';
import {
  startSession,
  endSession,
  fetchLeaderboards
} from './api.js';
import {
  initMap,
  resetPath,
  refreshTerritories
} from './map.js';
import {
  showGame,
  updatePoints,
  updateProtectionOverlay,
  renderLeaderboards
} from './ui.js';
import {
  startGPS,
  setSessionId,
  clearSession
} from './gps.js';

let activeSessionId = null;
let timerInterval = null;
let sessionTimeLeft = null;
let sessionStartTime = null;

// Timer functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('hud-timer');
  if (!timerEl) return;
  
  if (sessionTimeLeft !== null && sessionTimeLeft > 0) {
    timerEl.textContent = formatTime(sessionTimeLeft);
    sessionTimeLeft--;
    
    // Auto-stop when time runs out
    if (sessionTimeLeft < 0) {
      console.log('⏱️ Timer finished - auto-stopping session');
      handleStop();
    }
  } else if (sessionStartTime) {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    timerEl.textContent = formatTime(elapsed);
  }
}

function startTimer(durationMinutes) {
  console.log('⏱️ Starting timer for', durationMinutes, 'minutes');
  sessionTimeLeft = durationMinutes * 60;
  sessionStartTime = null;
  
  // Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function startTimerless() {
  console.log('⏱️ Starting session without timer');
  sessionTimeLeft = null;
  sessionStartTime = Date.now();
  
  // Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  sessionTimeLeft = null;
  sessionStartTime = null;
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 App initializing...');
  
  // Initialize tab switcher
  const tabs = document.querySelectorAll('.auth-tab');
  const panels = document.querySelectorAll('.auth-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      const panel = document.querySelector(`[id="${tabName}-panel"]`);
      if (panel) panel.classList.add('active');
      console.log('📑 Tab switched:', tabName);
    });
  });
  
  // Initialize Mapbox token modal
  if (!window.MAPBOX_TOKEN || window.MAPBOX_TOKEN === '') {
    const modal = document.getElementById('mapbox-token-modal');
    const input = document.getElementById('mapbox-token-input');
    const btnSave = document.getElementById('btn-token-save');
    const btnSkip = document.getElementById('btn-token-skip');
    
    if (modal) {
      setTimeout(() => {
        modal.classList.remove('hidden');
        input.focus();
        
        btnSave.onclick = () => {
          const token = input.value.trim();
          if (token) {
            localStorage.setItem('tr_mapbox', token);
            window.MAPBOX_TOKEN = token;
            modal.classList.add('hidden');
            location.reload();
          }
        };
        
        btnSkip.onclick = () => {
          modal.classList.add('hidden');
        };
      }, 500);
    }
  }
  
  initAuth();
  initMap();
  console.log('✓ Auth and Map initialized');

  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');

  if (btnStart) {
    btnStart.addEventListener('click', handleStart);
    console.log('✓ Start button wired');
  } else {
    console.warn('⚠ Start button not found');
  }

  if (btnStop) {
    btnStop.addEventListener('click', handleStop);
    console.log('✓ Stop button wired');
  } else {
    console.warn('⚠ Stop button not found');
  }

  setInterval(async () => {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const lb = await fetchLeaderboards();
      renderLeaderboards(lb);
    } catch (_) {}
  }, 30000);
});

async function handleStart() {
  console.log('🏃 Start run button clicked');
  const user = getCurrentUser();
  if (!user) {
    console.log('⚠ Not logged in, showing auth');
    showGame();
    return;
  }
  
  // Show timer setup modal
  const modal = document.getElementById('timer-setup-modal');
  if (modal) {
    modal.classList.remove('hidden');
    
    document.getElementById('btn-timer-ok').onclick = async () => {
      const minutes = parseInt(document.getElementById('timer-input').value) || 10;
      modal.classList.add('hidden');
      await startRun(minutes);
    };
    
    document.getElementById('btn-timer-cancel').onclick = async () => {
      modal.classList.add('hidden');
      await startRun(null);
    };
  } else {
    await startRun(null);
  }
}

async function startRun(durationMinutes) {
  try {
    console.log('📍 Starting session for user:', getCurrentUser().id);
    const { sessionId } = await startSession();
    console.log('✓ Session started:', sessionId);
    activeSessionId = sessionId;
    setSessionId(sessionId);
    resetPath();
    startGPS();
    
    if (durationMinutes) {
      startTimer(durationMinutes);
    } else {
      startTimerless();
    }
    
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    updatePoints(0);
  } catch (err) {
    console.error('✗ Start error:', err);
    alert(err.message);
  }
}

async function handleStop() {
  console.log('🛑 Stop run button clicked');
  if (!activeSessionId) return;
  try {
    console.log('📍 Ending session:', activeSessionId);
    const result = await endSession(activeSessionId);
    console.log('✓ Session ended. Points earned:', result.pointsEarned);
    stopTimer();
    updatePoints(result.pointsEarned);
    clearSession();
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;

    const user = getCurrentUser();
    if (user) {
      await refreshTerritories(user.id);
    }
  } catch (err) {
    console.error('✗ Stop error:', err);
    alert(err.message);
  } finally {
    activeSessionId = null;
    stopTimer();
  }
}
