const fs = require("fs");

class MarketChangeDetector {
  constructor(historyFile = "market_history.json") {
    this.historyFile = historyFile;
    this.loadHistory();
  }

  loadHistory() {
    if (fs.existsSync(this.historyFile)) {
      this.history = JSON.parse(fs.readFileSync(this.historyFile, "utf-8"));
    } else {
      this.history = [];
    }
  }

  saveHistory() {
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  // Adaugă o nouă analiză
  addAnalysis(analysis) {
    const record = {
      timestamp: new Date().toISOString(),
      sentiment: analysis.sentiment,
      score: analysis.score,
      volatility: analysis.key_indicators?.volatility_level,
      trend: analysis.key_indicators?.bet_trend,
      events: analysis.critical_events || [],
    };

    this.history.push(record);
    this.saveHistory();

    // Detectează schimbări
    if (this.history.length >= 2) {
      this.detectChanges();
    }

    return record;
  }

  // Funcția principală de detectare a schimbărilor
  detectChanges() {
    const current = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];

    const changes = {
      timestamp: current.timestamp,
      detected: false,
      details: [],
    };

    // 1. Schimbare de sentiment
    if (current.sentiment !== previous.sentiment) {
      changes.detected = true;
      changes.details.push({
        type: "sentiment_change",
        from: previous.sentiment,
        to: current.sentiment,
        message: `📊 Sentiment a schimbat de la ${previous.sentiment} la ${current.sentiment}`,
        severity: this.calculateSentimentSeverity(previous.sentiment, current.sentiment),
      });
    }

    // 2. Schimbare mare de score (>20 puncte)
    const scoreDifference = current.score - previous.score;
    if (Math.abs(scoreDifference) > 20) {
      changes.detected = true;
      const direction = scoreDifference > 0 ? "📈 ↑" : "📉 ↓";
      changes.details.push({
        type: "score_spike",
        from: previous.score,
        to: current.score,
        difference: scoreDifference,
        message: `${direction} Score a se schimbat cu ${Math.abs(scoreDifference)} puncte!`,
        severity: Math.abs(scoreDifference) > 50 ? "critical" : "high",
      });
    }

    // 3. Schimbare volatilitate
    if (current.volatility !== previous.volatility) {
      changes.detected = true;
      changes.details.push({
        type: "volatility_change",
        from: previous.volatility,
        to: current.volatility,
        message: `⚡ Volatilitate s-a schimbat: ${previous.volatility} → ${current.volatility}`,
        severity: current.volatility === "high" ? "high" : "medium",
      });
    }

    // 4. Schimbare trend BET
    if (current.trend !== previous.trend) {
      changes.detected = true;
      changes.details.push({
        type: "trend_change",
        from: previous.trend,
        to: current.trend,
        message: `🔄 Trend BET a schimbat: ${previous.trend} → ${current.trend}`,
        severity: "medium",
      });
    }

    // 5. Noi evenimente critice
    const newCriticalEvents = this.findNewCriticalEvents(
      current.events,
      previous.events
    );
    if (newCriticalEvents.length > 0) {
      changes.detected = true;
      newCriticalEvents.forEach((event) => {
        changes.details.push({
          type: "new_critical_event",
          event: event.name,
          message: `🚨 EVENIMENT NOU CRITIC: ${event.name}`,
          severity: "critical",
        });
      });
    }

    if (changes.detected) {
      this.printChanges(changes);
      this.saveChanges(changes);
    }

    return changes;
  }

  // Caută noi evenimente critice
  findNewCriticalEvents(currentEvents, previousEvents) {
    const previousNames = previousEvents.map((e) => e.name);
    return currentEvents.filter(
      (e) => !previousNames.includes(e.name) && (e.impact === "critical" || e.impact === "high")
    );
  }

  // Calculează severitate schimbare sentiment
  calculateSentimentSeverity(from, to) {
    const transitions = {
      bullish_bearish: "critical", // Cădere bruscă
      bearish_bullish: "high", // Redresare
      bullish_neutral: "medium",
      bearish_neutral: "medium",
      neutral_bullish: "medium",
      neutral_bearish: "medium",
    };
    return transitions[`${from}_${to}`] || "medium";
  }

  // Afișează schimbările
  printChanges(changes) {
    console.log("\n" + "=".repeat(60));
    console.log("🔔 SCHIMBĂRI DETECTATE!");
    console.log("=".repeat(60));

    changes.details.forEach((detail) => {
      const icon = {
        critical: "🚨",
        high: "⚠️ ",
        medium: "ℹ️ ",
      };

      console.log(`\n${icon[detail.severity]} ${detail.message}`);

      if (detail.from && detail.to) {
        const from = typeof detail.from === 'string' ? detail.from : String(detail.from);
        const to = typeof detail.to === 'string' ? detail.to : String(detail.to);
        console.log(
          `   ${from.toUpperCase()} → ${to.toUpperCase()}`
        );
      }
      if (detail.difference) {
        console.log(`   Diferență: ${detail.difference > 0 ? "+" : ""}${detail.difference}`);
      }
    });

    console.log("\n" + "=".repeat(60) + "\n");
  }

  // Salvează schimbările în fișier
  saveChanges(changes) {
    const changesFile = "market_changes.json";
    let changesLog = [];

    if (fs.existsSync(changesFile)) {
      changesLog = JSON.parse(fs.readFileSync(changesFile, "utf-8"));
    }

    changesLog.push(changes);

    // Păstrează doar ultimele 100 schimbări
    if (changesLog.length > 100) {
      changesLog = changesLog.slice(-100);
    }

    fs.writeFileSync(changesFile, JSON.stringify(changesLog, null, 2));
  }

  // Raport de schimbări în ultimele X zile
  getSummaryReport(days = 7) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentHistory = this.history.filter(
      (h) => new Date(h.timestamp) > cutoffDate
    );

    const sentimentChanges = [];
    for (let i = 1; i < recentHistory.length; i++) {
      if (recentHistory[i].sentiment !== recentHistory[i - 1].sentiment) {
        sentimentChanges.push({
          from: recentHistory[i - 1].sentiment,
          to: recentHistory[i].sentiment,
          time: recentHistory[i].timestamp,
        });
      }
    }

    const volatilityRatings = recentHistory.reduce((acc, h) => {
      acc[h.volatility] = (acc[h.volatility] || 0) + 1;
      return acc;
    }, {});

    return {
      period_days: days,
      total_analyses: recentHistory.length,
      sentiment_changes: sentimentChanges.length,
      sentiment_changes_detail: sentimentChanges,
      volatility_distribution: volatilityRatings,
      current_sentiment: recentHistory[recentHistory.length - 1]?.sentiment,
      average_score:
        recentHistory.reduce((sum, h) => sum + h.score, 0) /
        recentHistory.length,
    };
  }

  // Predicție simplă (trend)
  predictNextSentiment() {
    if (this.history.length < 3) return null;

    const recent = this.history.slice(-5);
    const sentiments = recent.map((h) => h.sentiment);
    const scores = recent.map((h) => h.score);

    const bullishCount = sentiments.filter((s) => s === "bullish").length;
    const bearishCount = sentiments.filter((s) => s === "bearish").length;

    const scoreDirection = scores[scores.length - 1] - scores[0];

    return {
      likely_sentiment: bullishCount > bearishCount ? "bullish" : "bearish",
      confidence: Math.abs(bullishCount - bearishCount) / recent.length,
      score_direction: scoreDirection > 0 ? "up" : "down",
      warning: bearishCount > 3 ? "⚠️ Trend negativ persistent" : null,
    };
  }
}

// EXEMPLU DE UTILIZARE
const detector = new MarketChangeDetector();

// Simulare analize în timp
function simulateAnalyses() {
  // Analiza 1: bullish
  detector.addAnalysis({
    sentiment: "bullish",
    score: 45,
    key_indicators: {
      volatility_level: "low",
      bet_trend: "up",
    },
    critical_events: [
      { name: "Reforma pozitivă", impact: "medium" }
    ],
  });

  console.log("\n✅ Analiza 1 adăugată\n");

  // Analiza 2: schimbare la bearish!
  setTimeout(() => {
    detector.addAnalysis({
      sentiment: "bearish",
      score: -35,
      key_indicators: {
        volatility_level: "high",
        bet_trend: "down",
      },
      critical_events: [
        { name: "Știri economice negative", impact: "critical" }
      ],
    });

    console.log("\n✅ Analiza 2 adăugată\n");

    // Raport
    console.log("\n📋 RAPORT SCHIMBĂRI (7 zile):");
    console.log(JSON.stringify(detector.getSummaryReport(7), null, 2));

    console.log("\n🔮 PREDICȚIE SENTIMENT:");
    console.log(JSON.stringify(detector.predictNextSentiment(), null, 2));
  }, 2000);
}

// Rulează simulare
simulateAnalyses();

module.exports = MarketChangeDetector;
