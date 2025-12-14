/* Weather Data Export System */
class WeatherExport {
  constructor() {
    // Export formats
  }

  // Generate CSV from weather data
  generateCSV(weatherData, location, units) {
    if (!weatherData || !location) return null;

    const current = weatherData.current;
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const windUnit = units === 'metric' ? 'm/s' : 'mph';
    
    let csv = 'KLIMA Weather Report\n';
    csv += `Location,${location.name}\n`;
    csv += `Latitude,${location.lat}\n`;
    csv += `Longitude,${location.lon}\n`;
    csv += `Report Date,${new Date().toLocaleString()}\n`;
    csv += '\n';
    
    // Current conditions
    csv += 'CURRENT CONDITIONS\n';
    csv += 'Metric,Value,Unit\n';
    csv += `Temperature,${current.temp},${tempUnit}\n`;
    csv += `Feels Like,${current.feels_like},${tempUnit}\n`;
    csv += `Humidity,${current.humidity},%\n`;
    csv += `Wind Speed,${current.wind_speed},${windUnit}\n`;
    csv += `Wind Direction,${current.wind_deg},degrees\n`;
    csv += `Pressure,${current.pressure},hPa\n`;
    csv += `UV Index,${current.uvi || 0},index\n`;
    csv += `Visibility,${current.visibility || 'N/A'},meters\n`;
    csv += `Cloudiness,${current.clouds},%\n`;
    csv += `Weather,${current.weather?.[0]?.main || 'N/A'},\n`;
    csv += `Description,${current.weather?.[0]?.description || 'N/A'},\n`;
    csv += '\n';
    
    // Hourly forecast
    csv += 'HOURLY FORECAST (Next 24 Hours)\n';
    csv += `Time,Temperature (${tempUnit}),Feels Like (${tempUnit}),Humidity (%),Wind (${windUnit}),Rain Chance (%),Weather\n`;
    
    const hourly = weatherData.hourly.slice(0, 24);
    hourly.forEach(hour => {
      const time = new Date(hour.dt * 1000).toLocaleString();
      csv += `${time},${hour.temp},${hour.feels_like},${hour.humidity},${hour.wind_speed},${Math.round((hour.pop || 0) * 100)},${hour.weather?.[0]?.main || 'N/A'}\n`;
    });
    
    csv += '\n';
    
    // Daily forecast
    csv += 'DAILY FORECAST (7 Days)\n';
    csv += `Date,Min Temp (${tempUnit}),Max Temp (${tempUnit}),Humidity (%),Wind (${windUnit}),Rain Chance (%),Weather,Description\n`;
    
    weatherData.daily.forEach(day => {
      const date = new Date(day.dt * 1000).toLocaleDateString();
      csv += `${date},${day.temp.min},${day.temp.max},${day.humidity},${day.wind_speed},${Math.round((day.pop || 0) * 100)},${day.weather?.[0]?.main || 'N/A'},${day.weather?.[0]?.description || 'N/A'}\n`;
    });
    
    return csv;
  }

  // Generate HTML report
  generateHTML(weatherData, location, units) {
    if (!weatherData || !location) return null;

    const current = weatherData.current;
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const windUnit = units === 'metric' ? 'm/s' : 'mph';
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KLIMA Weather Report - ${location.name}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #38bdf8, #3b82f6);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 2rem;
    }
    .header p {
      margin: 5px 0;
      opacity: 0.9;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin-top: 0;
      color: #1e293b;
      border-bottom: 2px solid #38bdf8;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    tr:hover {
      background: #f8fafc;
    }
    .current-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .stat-box {
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #38bdf8;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 0.9rem;
    }
    @media print {
      body {
        background: white;
      }
      .section {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KLIMA Weather Report</h1>
    <p><strong>Location:</strong> ${location.name}</p>
    <p><strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Current Conditions</h2>
    <div class="current-grid">
      <div class="stat-box">
        <div class="stat-label">Temperature</div>
        <div class="stat-value">${current.temp}${tempUnit}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Feels Like</div>
        <div class="stat-value">${current.feels_like}${tempUnit}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Humidity</div>
        <div class="stat-value">${current.humidity}%</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Wind Speed</div>
        <div class="stat-value">${current.wind_speed} ${windUnit}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">UV Index</div>
        <div class="stat-value">${current.uvi || 0}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Weather</div>
        <div class="stat-value" style="font-size: 1.2rem;">${current.weather?.[0]?.description || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Hourly Forecast (Next 24 Hours)</h2>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Temp</th>
          <th>Feels</th>
          <th>Rain %</th>
          <th>Wind</th>
          <th>Weather</th>
        </tr>
      </thead>
      <tbody>`;

    const hourly = weatherData.hourly.slice(0, 24);
    hourly.forEach(hour => {
      const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      html += `
        <tr>
          <td>${time}</td>
          <td>${Math.round(hour.temp)}${tempUnit}</td>
          <td>${Math.round(hour.feels_like)}${tempUnit}</td>
          <td>${Math.round((hour.pop || 0) * 100)}%</td>
          <td>${hour.wind_speed} ${windUnit}</td>
          <td>${hour.weather?.[0]?.main || 'N/A'}</td>
        </tr>`;
    });

    html += `
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>7-Day Forecast</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Min/Max</th>
          <th>Rain %</th>
          <th>Humidity</th>
          <th>Wind</th>
          <th>Weather</th>
        </tr>
      </thead>
      <tbody>`;

    weatherData.daily.forEach(day => {
      const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      html += `
        <tr>
          <td>${date}</td>
          <td>${Math.round(day.temp.min)}° / ${Math.round(day.temp.max)}°</td>
          <td>${Math.round((day.pop || 0) * 100)}%</td>
          <td>${day.humidity}%</td>
          <td>${day.wind_speed} ${windUnit}</td>
          <td>${day.weather?.[0]?.description || 'N/A'}</td>
        </tr>`;
    });

    html += `
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Generated by KLIMA Weather App</p>
    <p>Data is for informational purposes only</p>
  </div>
</body>
</html>`;

    return html;
  }

  // Generate JSON export
  generateJSON(weatherData, location, units) {
    if (!weatherData || !location) return null;

    return JSON.stringify({
      metadata: {
        location: location,
        generatedAt: new Date().toISOString(),
        units: units
      },
      current: weatherData.current,
      hourly: weatherData.hourly.slice(0, 24),
      daily: weatherData.daily
    }, null, 2);
  }

  // Download file
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export as CSV
  exportCSV(weatherData, location, units) {
    const csv = this.generateCSV(weatherData, location, units);
    if (csv) {
      const filename = `klima-weather-${location.name.replace(/\s+/g, '-')}-${Date.now()}.csv`;
      this.downloadFile(csv, filename, 'text/csv');
      return true;
    }
    return false;
  }

  // Export as HTML
  exportHTML(weatherData, location, units) {
    const html = this.generateHTML(weatherData, location, units);
    if (html) {
      const filename = `klima-weather-report-${location.name.replace(/\s+/g, '-')}-${Date.now()}.html`;
      this.downloadFile(html, filename, 'text/html');
      return true;
    }
    return false;
  }

  // Export as JSON
  exportJSON(weatherData, location, units) {
    const json = this.generateJSON(weatherData, location, units);
    if (json) {
      const filename = `klima-weather-${location.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
      this.downloadFile(json, filename, 'application/json');
      return true;
    }
    return false;
  }

  // Print current page
  printReport() {
    window.print();
  }
}

// Initialize global instance
window.weatherExport = new WeatherExport();

// Render export button widget
function renderExportWidget() {
  const container = document.getElementById('export-widget');
  if (!container) return;

  container.innerHTML = `
    <div class="export-card">
      <h3>📥 Export Weather Data</h3>
      <p class="export-subtitle">Download current weather data in multiple formats</p>
      
      <div class="export-buttons">
        <button id="export-csv" class="export-btn csv-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Export CSV
        </button>
        
        <button id="export-html" class="export-btn html-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Export HTML
        </button>
        
        <button id="export-json" class="export-btn json-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Export JSON
        </button>
        
        <button id="print-report" class="export-btn print-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('export-csv')?.addEventListener('click', () => {
    if (window.state && window.state.weather && window.state.location) {
      window.weatherExport.exportCSV(window.state.weather, window.state.location, window.state.units);
    }
  });

  document.getElementById('export-html')?.addEventListener('click', () => {
    if (window.state && window.state.weather && window.state.location) {
      window.weatherExport.exportHTML(window.state.weather, window.state.location, window.state.units);
    }
  });

  document.getElementById('export-json')?.addEventListener('click', () => {
    if (window.state && window.state.weather && window.state.location) {
      window.weatherExport.exportJSON(window.state.weather, window.state.location, window.state.units);
    }
  });

  document.getElementById('print-report')?.addEventListener('click', () => {
    window.weatherExport.printReport();
  });
}

// Auto-render when weather data is available
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderExportWidget();
  });
}
