const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const MarketChangeDetector = require("./change_detector");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class IntegratedMarketMonitor {
  constructor() {
    this.changeDetector = new MarketChangeDetector();
    this.configFile = "monitor_config.json";
    this.loadConfig();
  }

  loadConfig() {
    this.config = {
      alertOnSentimentChange: true,
      alertOnScoreSpike: true,
      alertOnNewCriticalEvents: true,
      scoreSpikeThreshold: 20,
    };
  }

  async analyzeMarket() {
    try {
      console.log("🔄 Monitorizare piață în progres...\n");

      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        tools: [
          {
            type: "web_search",
            name: "web_search",
          },
        ],
        messages: [
          {
            role: "user",
            content: `Analizează piața financiară din România ACUM. Caută ultimele știri despre:
- BVB (Bursa de Valori București) - indici, volume
- Curs EUR/RON și alte perechi forex
- Știri economice care afectează piața
- Volatilitate și riscuri detectate

Răspunde cu JSON structurat:
{
  "sentiment": "bullish|bearish|neutral",
  "score": -100 to 100,
  "critical_events": [
    {
      "name": "Numele evenimentului",
      "impact": "critical|high|medium|low",
      "affected_assets": ["BET", "EUR/RON"],
      "description": "Descriere scurtă"
    }
  ],
  "key_indicators": {
    "bet_trend": "up|down|sideways",
    "volatility_level": "low|medium|high",
    "volume_trend": "increasing|decreasing|stable"
  },
  "recommended_actions": ["Acțiune 1"],
  "next_watch_points": ["Punct 1"]
}`,
          },
        ],
      });

      // Parse JSON
      const analysisText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Nu s-a putut extrage JSON");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Adaugă la change detector și detectează schimbări
      console.log("📊 ADĂUGARE ANALIZĂ ȘI DETECTARE SCHIMBĂRI...\n");
      const record = this.changeDetector.addAnalysis(analysis);

      // Afișează raportul de piață
      this.displayMarketReport(analysis);

      // Generează alerte dacă sunt schimbări detectate
      if (this.changeDetector.history.length >= 2) {
        this.handleDetectedChanges(analysis);
      }

      // Salvează pentru audit
      this.saveAnalysisRecord(analysis, record);

      return {
        analysis,
        record,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Eroare la analiză:", error.message);
    }
  }

  displayMarketReport(analysis) {
    const sentimentEmoji = {
      bullish: "📈",
      bearish: "📉",
      neutral: "➡️",
    };

    console.log("=".repeat(60));
    console.log("📊 RAPORT PIAȚĂ FINANCIARĂ");
    console.log("=".repeat(60));

    console.log(
      `\n${sentimentEmoji[analysis.sentiment]} Sentiment: ${analysis.sentiment.toUpperCase()}`
    );
    console.log(`Score: ${analysis.score}/100`);
    console.log(`Volatilitate: ${analysis.key_indicators.volatility_level}`);
    console.log(`Trend BET: ${analysis.key_indicators.bet_trend}`);
    console.log(`Volume: ${analysis.key_indicators.volume_trend}`);

    if (analysis.critical_events.length > 0) {
      console.log("\n🚨 EVENIMENTE CRITICE:");
      analysis.critical_events
        .filter((e) => e.impact === "critical" || e.impact === "high")
        .forEach((event) => {
          console.log(
            `   • ${event.name} [${event.impact.toUpperCase()}]`
          );
          console.log(`     Activi: ${event.affected_assets.join(", ")}`);
          console.log(`     ${event.description}`);
        });
    }

    if (analysis.recommended_actions.length > 0) {
      console.log("\n💡 Recomandări:");
      analysis.recommended_actions.forEach((action) => {
        console.log(`   • ${action}`);
      });
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }

  handleDetectedChanges(currentAnalysis) {
    const history = this.changeDetector.history;
    const previous = history[history.length - 2];
    const current = history[history.length - 1];

    const alerts = [];

    // 1. Sentiment change
    if (
      this.config.alertOnSentimentChange &&
      current.sentiment !== previous.sentiment
    ) {
      const severity =
        (previous.sentiment === "bullish" &&
          current.sentiment === "bearish") ||
        (previous.sentiment === "bearish" && current.sentiment === "bullish")
          ? "critical"
          : "high";

      alerts.push({
        type: "sentiment_change",
        severity,
        message: `🔴 SENTIMENT SCHIMBAT: ${previous.sentiment.toUpperCase()} → ${current.sentiment.toUpperCase()}`,
        action:
          severity === "critical"
            ? "Evaluează poziția curentă urgent!"
            : "Monitorizează mai atent.",
      });
    }

    // 2. Score spike
    if (this.config.alertOnScoreSpike) {
      const scoreDiff = current.score - previous.score;
      if (Math.abs(scoreDiff) > this.config.scoreSpikeThreshold) {
        alerts.push({
          type: "score_spike",
          severity: Math.abs(scoreDiff) > 50 ? "critical" : "high",
          message: `📊 SPIKE SCORE: ${scoreDiff > 0 ? "+" : ""}${scoreDiff} puncte (${previous.score} → ${current.score})`,
          action:
            Math.abs(scoreDiff) > 50
              ? "Verifică recentele știri economice!"
              : "Urmărește evoluția.",
        });
      }
    }

    // 3. Volatility increase
    if (current.volatility === "high" && previous.volatility !== "high") {
      alerts.push({
        type: "volatility_increase",
        severity: "high",
        message: `⚡ VOLATILITATE CRESCUTĂ: ${previous.volatility} → ${current.volatility}`,
        action: "Reduce expunerea sau diversifică mai mult.",
      });
    }

    // 4. New critical events
    if (this.config.alertOnNewCriticalEvents) {
      const newEvents = this.findNewCriticalEvents(
        currentAnalysis.critical_events,
        previous.events || []
      );
      newEvents.forEach((event) => {
        alerts.push({
          type: "new_critical_event",
          severity: "critical",
          message: `🚨 EVENIMENT NOU: ${event.name} [${event.impact}]`,
          action: `Activi afectați: ${event.affected_assets.join(", ")} - ${event.description}`,
        });
      });
    }

    // Afișează alertele
    if (alerts.length > 0) {
      this.displayAlerts(alerts);
      this.saveAlerts(alerts);
      this.notifyOnAlerts(alerts);
    }
  }

  findNewCriticalEvents(currentEvents, previousEvents) {
    const previousNames = previousEvents.map((e) => e.name);
    return currentEvents.filter(
      (e) =>
        !previousNames.includes(e.name) &&
        (e.impact === "critical" || e.impact === "high")
    );
  }

  displayAlerts(alerts) {
    console.log("\n" + "⚠️ ".repeat(30));
    console.log("🔔 ALERTE SCHIMBĂRI DETECTATE");
    console.log("⚠️ ".repeat(30) + "\n");

    alerts.forEach((alert) => {
      const severityIcon = {
        critical: "🚨",
        high: "⚠️ ",
        medium: "ℹ️ ",
      };

      console.log(`${severityIcon[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.message}`);
      console.log(`   → ${alert.action}\n`);
    });

    console.log("⚠️ ".repeat(30) + "\n");
  }

  saveAlerts(alerts) {
    const alertsFile = "market_alerts.json";
    let allAlerts = [];

    if (fs.existsSync(alertsFile)) {
      allAlerts = JSON.parse(fs.readFileSync(alertsFile, "utf-8"));
    }

    const alertRecord = {
      timestamp: new Date().toISOString(),
      alerts,
      count: alerts.length,
    };

    allAlerts.push(alertRecord);

    // Păstrează doar ultimele 500 seturi de alerte
    if (allAlerts.length > 500) {
      allAlerts = allAlerts.slice(-500);
    }

    fs.writeFileSync(alertsFile, JSON.stringify(allAlerts, null, 2));
  }

  saveAnalysisRecord(analysis, record) {
    const recordsFile = "market_analysis_records.json";
    let records = [];

    if (fs.existsSync(recordsFile)) {
      records = JSON.parse(fs.readFileSync(recordsFile, "utf-8"));
    }

    records.push({
      timestamp: new Date().toISOString(),
      sentiment: analysis.sentiment,
      score: analysis.score,
      volatility: analysis.key_indicators.volatility_level,
      critical_events_count: analysis.critical_events.length,
    });

    // Păstrează doar ultimele 1000 înregistrări
    if (records.length > 1000) {
      records = records.slice(-1000);
    }

    fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
  }

  notifyOnAlerts(alerts) {
    const criticalCount = alerts.filter((a) => a.severity === "critical")
      .length;

    if (criticalCount > 0) {
      console.log(`\n📧 NOTIFICARE: ${criticalCount} alertă(e) critică(e) ar trebui trimisă(e)`);
      console.log(
        "   → Configurează Discord/Telegram/Email în producție\n"
      );
    }
  }

  // Raport zilnic
  getDailyReport() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayAlerts = fs
      .existsSync("market_alerts.json")
      ? JSON.parse(fs.readFileSync("market_alerts.json", "utf-8"))
          .filter((a) => new Date(a.timestamp) > oneDayAgo)
          .flatMap((a) => a.alerts)
      : [];

    const trend = this.changeDetector.predictNextSentiment();

    return {
      date: new Date().toLocaleDateString("ro-RO"),
      total_alerts_24h: todayAlerts.length,
      critical_alerts: todayAlerts.filter((a) => a.severity === "critical")
        .length,
      sentiment_changes: todayAlerts.filter(
        (a) => a.type === "sentiment_change"
      ).length,
      score_spikes: todayAlerts.filter((a) => a.type === "score_spike").length,
      new_critical_events: todayAlerts.filter(
        (a) => a.type === "new_critical_event"
      ).length,
      predicted_sentiment: trend?.likely_sentiment,
      prediction_confidence: trend?.confidence,
    };
  }

  // Status curent
  getStatus() {
    const history = this.changeDetector.history;
    const latest = history[history.length - 1];

    return {
      last_analysis: latest?.timestamp,
      total_analyses: history.length,
      current_sentiment: latest?.sentiment,
      current_score: latest?.score,
      current_volatility: latest?.volatility,
      current_trend: latest?.trend,
    };
  }
}

// RULARE
async function main() {
  const monitor = new IntegratedMarketMonitor();

  // Rulează analiza
  await monitor.analyzeMarket();

  // Afișează status
  console.log("📍 STATUS CURENT:");
  const status = monitor.getStatus();
  Object.entries(status).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // Afișează raport zilnic
  console.log("\n📅 RAPORT 24 ORE:");
  const dailyReport = monitor.getDailyReport();
  Object.entries(dailyReport).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // Sugestii
  console.log("\n💡 SUGESTII:");
  if (status.current_volatility === "high") {
    console.log("   ⚡ Piața e volatilă - protejează-ți poziția");
  }
  if (
    status.current_sentiment === "bearish" &&
    status.current_score < -30
  ) {
    console.log("   📉 Sentiment pesimist - consideră cash/obligații");
  }
  if (
    status.current_sentiment === "bullish" &&
    status.current_score > 30
  ) {
    console.log("   📈 Sentiment optimist - poți crește expunerea");
  }
}

main().catch(console.error);

module.exports = IntegratedMarketMonitor;
