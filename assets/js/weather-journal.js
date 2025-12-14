/* Weather Journal System */
class WeatherJournal {
  constructor() {
    this.storageKey = 'klima:weather-journal';
  }

  // Get all journal entries
  getEntries() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load journal entries:', e);
      return [];
    }
  }

  // Save entries
  saveEntries(entries) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save journal entries:', e);
    }
  }

  // Add new entry
  addEntry(location, weather, note, mood) {
    const entries = this.getEntries();
    
    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      location: {
        name: location.name,
        lat: location.lat,
        lon: location.lon
      },
      weather: {
        temp: weather.current.temp,
        feels_like: weather.current.feels_like,
        humidity: weather.current.humidity,
        weather: weather.current.weather?.[0]?.main,
        description: weather.current.weather?.[0]?.description,
        icon: weather.current.weather?.[0]?.icon
      },
      note: note,
      mood: mood
    };

    entries.unshift(entry);
    this.saveEntries(entries);
    return entry;
  }

  // Delete entry
  deleteEntry(id) {
    let entries = this.getEntries();
    entries = entries.filter(entry => entry.id !== id);
    this.saveEntries(entries);
  }

  // Get entries for location
  getLocationEntries(locationName) {
    const entries = this.getEntries();
    return entries.filter(entry => 
      entry.location.name.toLowerCase() === locationName.toLowerCase()
    );
  }

  // Search entries
  searchEntries(query) {
    const entries = this.getEntries();
    const lowerQuery = query.toLowerCase();
    
    return entries.filter(entry => 
      entry.location.name.toLowerCase().includes(lowerQuery) ||
      entry.note.toLowerCase().includes(lowerQuery) ||
      entry.weather.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Initialize global instance
window.weatherJournal = new WeatherJournal();

// Mood emojis
const MOOD_EMOJIS = {
  happy: '😊',
  love: '😍',
  sad: '😢',
  angry: '😠',
  sick: '🤒',
  energetic: '⚡',
  tired: '😴',
  relaxed: '😌',
  excited: '🤩',
  neutral: '😐'
};

// Show add journal entry modal
function showAddJournalModal() {
  if (!window.state || !window.state.weather || !window.state.location) {
    alert('Please load weather data first!');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'journal-modal';
  modal.innerHTML = `
    <div class="journal-modal-content">
      <div class="journal-modal-header">
        <h2>📝 Add Weather Note</h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="journal-modal-body">
        <div class="journal-weather-context">
          <div class="context-location">${window.state.location.name}</div>
          <div class="context-weather">
            ${Math.round(window.state.weather.current.temp)}° • ${window.state.weather.current.weather?.[0]?.description}
          </div>
        </div>

        <div class="form-group">
          <label for="journal-mood">How do you feel about this weather?</label>
          <div class="mood-selector">
            ${Object.entries(MOOD_EMOJIS).map(([key, emoji]) => `
              <button class="mood-btn" data-mood="${key}" type="button">
                <span class="mood-emoji">${emoji}</span>
                <span class="mood-label">${key}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label for="journal-note">Your thoughts</label>
          <textarea 
            id="journal-note" 
            placeholder="How's the weather? What are you doing? Any observations?"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="char-counter">
            <span id="char-count">0</span>/500
          </div>
        </div>

        <button id="save-journal" class="save-journal-btn" disabled>
          Save Entry
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedMood = null;

  // Close modal
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Mood selection
  modal.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
      updateSaveButton();
    });
  });

  // Character counter
  const textarea = modal.querySelector('#journal-note');
  const charCount = modal.querySelector('#char-count');
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length;
    updateSaveButton();
  });

  // Update save button state
  function updateSaveButton() {
    const saveBtn = modal.querySelector('#save-journal');
    const hasContent = textarea.value.trim().length > 0 && selectedMood;
    saveBtn.disabled = !hasContent;
  }

  // Save entry
  modal.querySelector('#save-journal').addEventListener('click', () => {
    const note = textarea.value.trim();
    if (note && selectedMood) {
      window.weatherJournal.addEntry(
        window.state.location,
        window.state.weather,
        note,
        selectedMood
      );
      modal.remove();
      renderWeatherJournal();
      
      // Show success message
      showToast('Journal entry saved! 📝');
    }
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Render weather journal widget
function renderWeatherJournal() {
  const container = document.getElementById('weather-journal-card');
  if (!container) return;

  const entries = window.weatherJournal.getEntries();
  const recentEntries = entries.slice(0, 5);

  container.innerHTML = `
    <div class="journal-card">
      <div class="journal-header">
        <h3>📖 Weather Journal</h3>
        <button id="add-journal-entry" class="add-journal-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Note
        </button>
      </div>

      ${entries.length === 0 ? `
        <div class="journal-empty">
          <div class="empty-icon">📝</div>
          <p>No journal entries yet</p>
          <p class="empty-hint">Start recording your weather experiences and thoughts</p>
        </div>
      ` : `
        <div class="journal-entries">
          ${recentEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
              <div class="journal-entry">
                <div class="entry-header">
                  <div class="entry-meta">
                    <span class="entry-mood">${MOOD_EMOJIS[entry.mood]}</span>
                    <span class="entry-location">${entry.location.name}</span>
                  </div>
                  <button class="delete-entry" data-id="${entry.id}" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                
                <div class="entry-weather">
                  ${Math.round(entry.weather.temp)}° • ${entry.weather.description}
                </div>
                
                <div class="entry-note">${entry.note}</div>
                
                <div class="entry-footer">
                  <span class="entry-date">${dateStr} at ${timeStr}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${entries.length > 5 ? `
          <div class="journal-footer">
            <button id="view-all-entries" class="view-all-btn">
              View All ${entries.length} Entries
            </button>
          </div>
        ` : ''}
      `}
    </div>
  `;

  // Add journal entry button
  document.getElementById('add-journal-entry')?.addEventListener('click', showAddJournalModal);

  // Delete entry buttons
  document.querySelectorAll('.delete-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this journal entry?')) {
        const id = parseInt(btn.dataset.id);
        window.weatherJournal.deleteEntry(id);
        renderWeatherJournal();
      }
    });
  });

  // View all entries button
  document.getElementById('view-all-entries')?.addEventListener('click', showAllEntriesModal);
}

// Show all entries in modal
function showAllEntriesModal() {
  const entries = window.weatherJournal.getEntries();
  
  const modal = document.createElement('div');
  modal.className = 'journal-modal';
  modal.innerHTML = `
    <div class="journal-modal-content all-entries">
      <div class="journal-modal-header">
        <h2>📖 All Journal Entries (${entries.length})</h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="journal-modal-body">
        <div class="journal-entries full">
          ${entries.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
              <div class="journal-entry">
                <div class="entry-header">
                  <div class="entry-meta">
                    <span class="entry-mood">${MOOD_EMOJIS[entry.mood]}</span>
                    <span class="entry-location">${entry.location.name}</span>
                  </div>
                  <button class="delete-entry" data-id="${entry.id}" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                
                <div class="entry-weather">
                  ${Math.round(entry.weather.temp)}° • ${entry.weather.description}
                </div>
                
                <div class="entry-note">${entry.note}</div>
                
                <div class="entry-footer">
                  <span class="entry-date">${dateStr} at ${timeStr}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Delete buttons
  modal.querySelectorAll('.delete-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this journal entry?')) {
        const id = parseInt(btn.dataset.id);
        window.weatherJournal.deleteEntry(id);
        modal.remove();
        renderWeatherJournal();
      }
    });
  });
}

// Auto-render when weather loads
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderWeatherJournal();
  });
}
