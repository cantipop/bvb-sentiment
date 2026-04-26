# 📊 Monitor Piață Financiară România - Sistem Integrat

Sistem complet de monitorizare piață financiară cu AI, detectare automat a schimbărilor și alertare în timp real.

## 🎯 Ce face:

- ✅ Caută și analizează automat știri financiare despre piața din România
- ✅ **Detectează schimbări importante** (sentiment, volatilitate, trend)
- ✅ Generează alerte pentru mișcări critice
- ✅ Salvează istoric complet pentru analiză
- ✅ Dashboard web pentru vizualizare datelor
- ✅ Notificări pe Discord/Telegram/Email (opțional)

## 🚀 Start Rapid (3 pași)

### 1. Instalare
```bash
npm install
```

### 2. Configurare API Key
```bash
echo "ANTHROPIC_API_KEY=sk-..." > .env
# Completează sk-... cu cheia ta din https://console.anthropic.com
```

### 3. Rulare
```bash
npm run monitor
```

Asta e! Ai să vezi output-ul cu analiza pieței și orice schimbări detectate.

---

## 📋 Comenzi Disponibile

```bash
# Monitorizare completă (cea mai bună opțiune)
npm run monitor

# Doar monitor simplu (fără change detection)
npm run simple

# Monitor avansat (doar bază de date)
npm run advanced

# Detectare schimbări în izolare
npm run detect-changes

# Dashboard web (port 3000)
npm run dashboard

# Vizualizare logs
npm run logs
```

---

## 🗂️ Structura Proiectului

```
.
├── main_integrated.js          # ← ACEASTA RULEZI (sistem complet)
├── market_monitor_advanced.js  # Monitorizare + bază de date
├── market_monitor.js           # Versiune simplă
├── change_detector.js          # Detectare schimbări
├── dashboard.js                # Dashboard web
├── notifications.js            # Notificări (Discord/Telegram)
├── package.json               # Dependencies
├── .env                       # Configurație (nu se commit-ia)
└── DATA:
    ├── market_history.json           # Toate analizele
    ├── market_alerts.json            # Toate alertele
    ├── market_changes.json           # Schimbări detectate
    └── market_analysis_records.json  # Înregistrări
```

---

## 🔍 De Unde Detectează Schimbări?

Sistemul compară **două analize consecutive** și detectează:

```
ANALIZA 1 (ora 9:00)       ANALIZA 2 (ora 12:00)
sentiment: bullish    ✓  →  sentiment: bearish   ✗
score: 45            →     score: -35
volatility: low      →     volatility: high
trend: up            →     trend: down

REZULTAT: 🚨 SCHIMBARE MAJORĂ DETECTATĂ!
```

### Tipuri de schimbări detectate:
1. **Sentiment Change** - bullish → bearish (sau invers)
2. **Score Spike** - schimbare > 20 puncte
3. **Volatility Jump** - low → high (sau invers)
4. **Trend Reversal** - up → down
5. **Noi Evenimente Critice** - știri importante care apar

---

## 📊 Ce Vedeți în Output

```
🔄 Monitorizare piață în progres...

============================================================
📊 RAPORT PIAȚĂ FINANCIARĂ
============================================================

📈 Sentiment: BULLISH
Score: 45/100
Volatilitate: low
Trend BET: up
Volume: increasing

🚨 EVENIMENTE CRITICE:
   • Reforma fiscală pozitivă [HIGH]
     Activi: BET, EUR/RON
     Piață reacționează pozitiv

💡 Recomandări:
   • Urmărește indexul BET pentru confirmare trendului

============================================================


============================================================
🔔 SCHIMBĂRI DETECTATE!
============================================================

⚠️  📊 Sentiment a schimbat de la bearish la bullish
   BEARISH → BULLISH

🚨 📈 ↑ Score a se schimbat cu 80 puncte!
   -35 → 45

============================================================

📍 STATUS CURENT:
   last_analysis: 2026-04-26T12:30:00Z
   total_analyses: 5
   current_sentiment: bullish
   current_score: 45
   current_volatility: low
   current_trend: up

📅 RAPORT 24 ORE:
   date: 26.04.2026
   total_alerts_24h: 3
   critical_alerts: 1
   sentiment_changes: 2
   score_spikes: 1
   new_critical_events: 1
   predicted_sentiment: bullish
   prediction_confidence: 0.8
```

---

## 🔄 Rulare Automată (Cron)

### Linux/Mac:

```bash
# Editează crontab
crontab -e

# Adaugă linia (rulează la 9:00, 12:00, 15:00, 18:00):
0 9,12,15,18 * * * cd /path/to/project && npm run monitor >> logs/monitor.log 2>&1

# Pentru fiecare oră:
0 * * * * cd /path/to/project && npm run monitor >> logs/monitor.log 2>&1
```

### Windows (Task Scheduler):

1. Deschide Task Scheduler
2. Create Basic Task
3. Program: `C:\Program Files\nodejs\node.exe`
4. Arguments: `C:\path\to\project\node_modules\.bin\npm run monitor`
5. Start: daily, 09:00

---

## 📡 Dashboard Web (Opțional)

```bash
npm run dashboard
```

Deschide: **http://localhost:3000**

Arată:
- Status curent (sentiment, score, volatilitate)
- Alerte recente
- Statistici din ultimele 24 ore
- Reîncărcare automată la 30 secunde

---

## 🔔 Notificări (Opțional)

### Discord:

1. Copia webhook URL din Discord server
2. Adaugă în `.env`:
   ```
   DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
   ```

### Telegram:

1. Creează bot cu BotFather
2. Adaugă în `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABCDefgh...
   TELEGRAM_CHAT_ID=-1001234567890
   ```

### Email:

Instalează și configurează nodemailer:
```bash
npm install nodemailer
```

---

## 📈 Indicatori Monitorizați

### Index BET
- Indice principal al BVB
- Acționează ca barometru al economiei

### Curs EUR/RON
- Arată stabilitate macroeconomică
- Volatilitate = preocupări investitori

### Volatilitate
- **Low**: Piață liniștită
- **Medium**: Normal
- **High**: Atenție, riscuri mari

### Volume
- **Increasing**: Investitori interesați
- **Decreasing**: Dezinteres

### Evenimente Critice
- Anunțuri economice
- Reformă fiscală
- Crize pe plan economic

---

## 🎯 Interpretare Sentiment

```
📈 BULLISH (> 0):
  - Investitorii sunt optimiști
  - Piață în creștere
  - Bun pentru acțiuni

📉 BEARISH (< 0):
  - Investitorii sunt pesimiști
  - Piață în scădere
  - Bun pentru obligații/cash

➡️  NEUTRAL (≈ 0):
  - Piață echilibrată
  - Așteptări, indecizii
```

---

## 📊 Unde Se Salvează Datele

| Fișier | Conținut | Când se actualizează |
|--------|----------|---------------------|
| `market_history.json` | Toate analizele | La fiecare monitor |
| `market_alerts.json` | Toți alertele | Când e schimbare detectată |
| `market_changes.json` | Doar schimbări | Când e schimbare detectată |
| `market_analysis_records.json` | Rezumat analize | La fiecare monitor |

---

## 🧪 Testare

### Test 1: Rulare manuală
```bash
npm run monitor
```

### Test 2: Simulator schimbări
```bash
node change_detector.js
```

### Test 3: Dashboard
```bash
npm run dashboard
# Apoi deschide http://localhost:3000
```

---

## 🐛 Troubleshooting

### "Eroare: API key invalid"
- Verifică `.env`: `echo $ANTHROPIC_API_KEY`
- Mergi pe https://console.anthropic.com și copiază key

### "Eroare: Nu se conectează la API"
- Verifică conexiunea internet
- Testează: `curl https://api.anthropic.com`

### "Fișierele JSON sunt goale"
- Normal la prima rulare - se vor popula
- Asteaptă 2-3 analize

### "Cron job nu rulează"
```bash
# Verifică:
crontab -l                    # Vezi cron jobs
tail -f logs/monitor.log      # Vezi logs
```

---

## 🚀 Optimizări pentru Production

### 1. Batch API (pentru volume mari)
```javascript
// Reduce costul cu 50%, dar răspunsuri în ~24h
const model = "claude-3-5-sonnet-20241022";
const useBatch = true;
```

### 2. Rate Limiting
```javascript
// Limitează la 1 request/oră
setTimeout(() => {
  monitor.analyzeMarket();
}, 3600000);
```

### 3. Cloud Storage
```bash
# Salvează datele pe S3/GCP
npm install aws-sdk
```

### 4. Bază de date reală
```bash
# SQLite (lightweight)
npm install sqlite3

# PostgreSQL (scalabil)
npm install pg
```

---

## 📞 Support

**Fișiere de log:**
```bash
tail -f logs/monitor.log
cat market_history.json        # Istoric
cat market_alerts.json         # Alerte
```

**Debug mode:**
```bash
DEBUG=* npm run monitor
```

---

## 📝 Modele Disponibile

- **Claude 3.5 Sonnet** ← Recomandat (rapid, ieftin, smart)
- Claude 3.5 Haiku (mai rapid, mai ieftin)
- Claude Opus (cel mai puternic)

---

## 💡 Exemple de Utilizare

### Scenario 1: Trading
```
Monitor rulează la 9:00, 12:00, 15:00, 18:00
Primești alerte când se detectează schimbări
Decizi să cumperi/vânzi pe baza alertelor
```

### Scenario 2: Analiză
```
Colectezi datele o lună
Apoi analizezi trendul
Găsești correlații cu știri economice
```

### Scenario 3: Dashboard
```
Deschizi dashboard pe telefon
Vezi status real-time
Citești alertele importante
```

---

## 📋 Checklist Setup

- [ ] `npm install`
- [ ] Creează `.env` cu API key
- [ ] Testează: `npm run monitor`
- [ ] Verifică output și fișierele JSON
- [ ] (Opțional) Setup cron job
- [ ] (Opțional) Configurează notificări
- [ ] (Opțional) Rulează dashboard

---

## 📈 Următorii Pași

1. **Lase sistemul să ruleze 1-2 săptămâni** pentru a colecta datele
2. **Analizează patternurile** - ce eveniamente afectează piața?
3. **Optimizează alertele** - ce-ți e util, ce nu
4. **Integrează cu trading bot** (opțional)
5. **Automatizează deciziile** pe baza sentiment-ului

---

**Versiune:** 1.0.0
**Creat:** 2026
**Status:** Production Ready ✅
