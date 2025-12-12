/* Daily Streak Tracker - Consecutive Good Jog Days */

function loadStreak() {
  const streakData = localStorage.getItem('jogStreak');
  if (!streakData) {
    return { count: 0, lastDate: null, history: [] };
  }
  try {
    return JSON.parse(streakData);
  } catch {
    return { count: 0, lastDate: null, history: [] };
  }
}

function saveStreak(streak) {
  localStorage.setItem('jogStreak', JSON.stringify(streak));
}

function updateStreak(isGoodJogDay) {
  const streak = loadStreak();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Initialize or check if we need to reset
  if (!streak.lastDate) {
    if (isGoodJogDay) {
      streak.count = 1;
      streak.lastDate = today;
      streak.history = [today];
    }
  } else if (streak.lastDate === today) {
    // Same day - already counted
  } else {
    // Different day - check if yesterday was the last date
    const lastDate = new Date(streak.lastDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastDateStr = lastDate.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (isGoodJogDay) {
      if (lastDateStr === yesterdayStr) {
        // Streak continues
        streak.count++;
        streak.lastDate = today;
        streak.history.push(today);
      } else {
        // Streak broken, start new
        streak.count = 1;
        streak.lastDate = today;
        streak.history = [today];
      }
    } else {
      // Bad jog day - reset streak
      streak.count = 0;
      streak.lastDate = today;
    }
  }

  saveStreak(streak);
  return streak;
}

function renderStreakTracker() {
  if (!state.weather || !state.weather.current) return;

  // Determine if today is a good jog day
  const { rating: jogRating } = jogScore(
    state.weather.current.temp,
    state.weather.current.wind_speed,
    state.weather.daily?.[0]?.pop || 0,
    state.weather.current.is_day !== 0
  );

  const isGoodJogDay = jogRating === 'Good';
  const streak = updateStreak(isGoodJogDay);

  const card = document.getElementById('streak-card');
  if (!card) return;

  // Create visual streak display (last 7 days)
  const today = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const isInHistory = streak.history.includes(dateStr);
    last7Days.push({ date: dateStr, isGood: isInHistory });
  }

  const streakDays = last7Days.map((day, idx) => {
    const isToday = idx === 6;
    return `
      <div class="streak-day ${day.isGood ? 'good' : 'empty'} ${isToday ? 'today' : ''}" 
           title="${day.date}">
        ${day.isGood ? '✅' : '○'}
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div class="streak-container">
      <div class="streak-header">
        <h3 class="streak-title">Jog Streak</h3>
        <span class="streak-emoji">${streak.count > 0 ? '🔥' : '🌱'}</span>
      </div>

      <div class="streak-counter">
        <div class="streak-number">${streak.count}</div>
        <div class="streak-label">${streak.count === 1 ? 'Day' : 'Days'} in a row</div>
      </div>

      <div class="streak-visual">
        <div class="week-header">Last 7 Days</div>
        <div class="streak-days">
          ${streakDays}
        </div>
      </div>

      <div class="streak-motivation">
        ${streak.count >= 7 ? `<p>🏆 Amazing! You've jogged for a full week! Keep it up!</p>` :
          streak.count >= 3 ? `<p>💪 Great momentum! ${7 - streak.count} more days to a full week!</p>` :
          isGoodJogDay ? `<p>✨ Great jog conditions today! ${streak.count > 0 ? 'Continue your streak!' : 'Start your streak now!'}</p>` :
          streak.count > 0 ? `<p>⚠️ Today's conditions aren't ideal, but ${streak.count} day${streak.count > 1 ? 's' : ''} of great jogs!</p>` :
          `<p>🌅 Check back tomorrow for better conditions!</p>`}
      </div>

      <div class="streak-info">
        <small>💡 Your streak resets if you miss a day with good jog conditions. Track your consistency!</small>
      </div>
    </div>
  `;

  document.getElementById('streak-card').style.display = 'block';
}

window.updateStreak = updateStreak;
window.renderStreakTracker = renderStreakTracker;
