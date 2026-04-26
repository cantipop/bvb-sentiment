const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Helper - citire fișiere JSON
function readJsonFile(filename) {
  try {
    if (fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename, "utf-8"));
    }
  } catch (error) {
    console.error(`Eroare citire ${filename}:`, error.message);
  }
  return [];
}

// API Endpoints
app.get("/api/status", (req, res) => {
  const history = readJsonFile("market_history.json");
  const alerts = readJsonFile("market_alerts.json");
  const changes = readJsonFile("market_changes.json");

  const latest = history[history.length - 1];
  const recentAlerts = alerts.slice(-10);

  res.json({
    current: latest
      ? {
          timestamp: latest.timestamp,
          sentiment: latest.sentiment,
          score: latest.score,
          volatility: latest.volatility,
          trend: latest.trend,
        }
      : null,
    statistics: {
      total_analyses: history.length,
      total_alerts: alerts.length,
      recent_alerts: recentAlerts.length,
      sentiment_distribution: calculateDistribution(history),
    },
    alerts: recentAlerts.slice(-5),
    changes: changes.slice(-5),
  });
});

app.get("/api/history", (req, res) => {
  const history = readJsonFile("market_history.json");
  const limit = req.query.limit ? parseInt(req.query.limit) : 30;

  res.json(history.slice(-limit));
});

app.get("/api/alerts", (req, res) => {
  const alerts = readJsonFile("market_alerts.json");
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;

  res.json(alerts.slice(-limit));
});

app.get("/api/summary", (req, res) => {
  const history = readJsonFile("market_history.json");
  const alerts = readJsonFile("market_alerts.json");
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentAlerts = alerts
    .filter((a) => new Date(a.timestamp) > oneDayAgo)
    .flatMap((a) => a.alerts);

  const recentAnalyses = history.filter(
    (h) => new Date(h.timestamp) > oneDayAgo
  );

  res.json({
    period: "24 hours",
    analyses_count: recentAnalyses.length,
    alerts_count: recentAlerts.length,
    critical_alerts: recentAlerts.filter((a) => a.severity === "critical")
      .length,
    sentiment_changes: recentAlerts.filter((a) => a.type === "sentiment_change")
      .length,
    current_sentiment: recentAnalyses[recentAnalyses.length - 1]?.sentiment,
    average_score:
      recentAnalyses.length > 0
        ? Math.round(
            recentAnalyses.reduce((sum, h) => sum + h.score, 0) /
              recentAnalyses.length
          )
        : 0,
  });
});

// Helper function
function calculateDistribution(history) {
  return history.reduce((acc, h) => {
    acc[h.sentiment] = (acc[h.sentiment] || 0) + 1;
    return acc;
  }, {});
}

// Serve HTML Dashboard
app.get("/", (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📊 Monitor Piață Financiară</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #333;
    }

    .header .timestamp {
      color: #999;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .card h2 {
      font-size: 16px;
      color: #999;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .card .value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .card.bullish .value {
      color: #10b981;
    }

    .card.bearish .value {
      color: #ef4444;
    }

    .card.neutral .value {
      color: #f59e0b;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }

    .badge.critical {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge.high {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.medium {
      background: #e0e7ff;
      color: #312e81;
    }

    .alert-box {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }

    .alert-box.high {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }

    .alert-box.medium {
      background: #f0f9ff;
      border-left-color: #3b82f6;
    }

    .alert-title {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .alert-message {
      font-size: 14px;
      color: #666;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .chart-container {
      margin-top: 20px;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .loading {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 10px;
    }

    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }

    .refresh-btn:hover {
      background: #5568d3;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .summary-item {
      text-align: center;
    }

    .summary-number {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }

    .summary-label {
      font-size: 12px;
      color: #999;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Monitor Piață Financiară României</h1>
      <p class="timestamp">Se actualizează la: <span id="lastUpdate">--:--:--</span></p>
      <button class="refresh-btn" onclick="loadData()">🔄 Reîncarcă acum</button>
    </div>

    <div id="loading" class="loading">
      ⏳ Se încarcă datele...
    </div>

    <div id="content" style="display: none;">
      <!-- Status Cards -->
      <div class="grid">
        <div class="card" id="sentimentCard">
          <h2>Sentiment</h2>
          <div class="value" id="sentimentValue">-</div>
          <div id="sentimentBadge"></div>
        </div>

        <div class="card">
          <h2>Score</h2>
          <div class="value" id="scoreValue">-</div>
          <div style="font-size: 12px; color: #999;">-100 (bearish) la +100 (bullish)</div>
        </div>

        <div class="card">
          <h2>Volatilitate</h2>
          <div class="value" id="volatilityValue">-</div>
          <div id="volatilityBadge"></div>
        </div>

        <div class="card">
          <h2>Trend BET</h2>
          <div class="value" id="trendValue">-</div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="card full-width">
        <h2>Statistici 24 Ore</h2>
        <div class="summary-grid" id="summaryStats">
          <div class="summary-item">
            <div class="summary-number" id="stat-analyses">0</div>
            <div class="summary-label">Analize</div>
          </div>
          <div class="summary-item">
            <div class="summary-number" id="stat-alerts">0</div>
            <div class="summary-label">Alerte</div>
          </div>
          <div class="summary-item">
            <div class="summary-number" id="stat-critical">0</div>
            <div class="summary-label">Critice</div>
          </div>
          <div class="summary-item">
            <div class="summary-number" id="stat-sentiment-changes">0</div>
            <div class="summary-label">Schimbări Sentiment</div>
          </div>
          <div class="summary-item">
            <div class="summary-number" id="stat-avg-score">0</div>
            <div class="summary-label">Score Mediu</div>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="card full-width">
        <h2>⚠️ Alerte Recente</h2>
        <div id="alertsList"></div>
      </div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('content').style.display = 'none';

        // Fetch status
        const statusRes = await fetch('/api/status');
        const status = await statusRes.json();

        // Fetch summary
        const summaryRes = await fetch('/api/summary');
        const summary = await summaryRes.json();

        // Update DOM
        if (status.current) {
          const sentiment = status.current.sentiment;
          document.getElementById('sentimentValue').textContent = sentiment.toUpperCase();
          document.getElementById('sentimentCard').className = \`card \${sentiment}\`;
          document.getElementById('sentimentBadge').innerHTML = \`<span class="badge high">\${sentiment}</span>\`;

          document.getElementById('scoreValue').textContent = status.current.score;
          document.getElementById('volatilityValue').textContent = status.current.volatility || '-';
          document.getElementById('trendValue').textContent = (status.current.trend || '-').toUpperCase();

          const volatilityEmoji = {
            'low': '🟢 Low',
            'medium': '🟡 Medium',
            'high': '🔴 High'
          };
          document.getElementById('volatilityBadge').innerHTML = \`
            <span class="badge medium">\${volatilityEmoji[status.current.volatility] || '-'}</span>
          \`;
        }

        // Update summary
        document.getElementById('stat-analyses').textContent = summary.analyses_count;
        document.getElementById('stat-alerts').textContent = summary.alerts_count;
        document.getElementById('stat-critical').textContent = summary.critical_alerts;
        document.getElementById('stat-sentiment-changes').textContent = summary.sentiment_changes;
        document.getElementById('stat-avg-score').textContent = summary.average_score;

        // Update alerts
        const alertsList = document.getElementById('alertsList');
        if (status.alerts && status.alerts.length > 0) {
          alertsList.innerHTML = status.alerts.map(alert => \`
            <div class="alert-box \${alert.severity}">
              <div class="alert-title">\${alert.message}</div>
              <div class="alert-message">\${alert.action}</div>
            </div>
          \`).join('');
        } else {
          alertsList.innerHTML = '<p style="color: #999; text-align: center;">Nicio alertă în acest moment</p>';
        }

        // Update timestamp
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ro-RO');

        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
      } catch (error) {
        console.error('Eroare:', error);
        document.getElementById('loading').innerHTML = \`
          <p>❌ Eroare la încărcarea datelor: \${error.message}</p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">Asigură-te că scriptul de monitorizare rulează.</p>
        \`;
      }
    }

    // Reîncarcă datele la fiecare 30 de secunde
    setInterval(loadData, 30000);

    // Reîncarcă inițial
    loadData();
  </script>
</body>
</html>
  `;

  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(\`\n📊 Dashboard disponibil la: http://localhost:\${PORT}\`);
  console.log(
    "Deschide în browser pentru a vedea datele în timp real\n"
  );
});

module.exports = app;
