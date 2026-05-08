# Truth Lens — Fake News Detection System
### BTech Final Year Project | AI-Powered Media Literacy Tool
**Powered by Groq AI (llama-3.3-70b-versatile)**

---

## Project Files

```
truth-lens/
├── index.html       ← Frontend (web app UI)
├── server.js        ← Backend (Node.js proxy server)
├── package.json     ← Project dependencies
└── README.md        ← This guide
```

---

## Features

| Feature | Description |
|---------|-------------|
| 📋 Paste Article Text | Paste any news text for instant AI analysis |
| 🔗 URL Scraping | Enter a news URL — the server fetches & analyzes it automatically |
| 📊 Credibility Score | 0–100 score with Source & Language sub-scores |
| ⚑ Red Flags | Specific misinformation signals detected in the article |
| ✓ Credibility Signals | Positive trust indicators found |
| ☑ Fact-Check Criteria | 8-point checklist (sources, author, emotional language, etc.) |
| 📰 Article Summary | If the article scores ≥ 65/100, a neutral summary is shown |
| 📂 History | Last 10 analyses saved in browser — click any to reload |
| 🖨 Print / Save PDF | Print-friendly layout — save as PDF from browser |
| 📄 Export as Text | Download a full .txt report of any analysis |

---

## Setup Guide (Step-by-Step)

### STEP 1 — Install Node.js

1. Go to https://nodejs.org
2. Download the **LTS version** (recommended)
3. Install it (click Next → Next → Install)
4. Open Command Prompt and verify:
   ```
   node --version
   ```
   You should see something like: `v20.11.0`

---

### STEP 2 — Get Your Free Groq API Key

1. Go to: https://console.groq.com
2. Sign up for a free account (works in India, no credit card needed)
3. Click **"API Keys"** → **"Create API Key"**
4. Copy the key (it starts with `gsk_...`)

---

### STEP 3 — Add Your API Key to the Server

**Option A — Environment Variable (Recommended, more secure):**

Windows (Command Prompt):
```
set GROQ_API_KEY=gsk_your_actual_key_here
node server.js
```

Mac/Linux:
```
export GROQ_API_KEY=gsk_your_actual_key_here
node server.js
```

**Option B — Edit server.js directly:**
1. Open `server.js` in any text editor
2. Find this line near the top:
   ```
   const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
   ```
3. Replace `YOUR_GROQ_API_KEY_HERE` with your actual key:
   ```
   const GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_xxxxxxxxxxxxxxx';
   ```
4. Save the file

> ⚠ Never share your API key or upload server.js with the real key to GitHub/cloud!

---

### STEP 4 — Install Dependencies

1. Open **Command Prompt** (search "cmd" in Start menu)
2. Navigate to your project folder:
   ```
   cd C:\Users\YourName\Downloads\truth-lens
   ```
3. Run:
   ```
   npm install
   ```
   This installs `express` and `cors` (takes ~30 seconds)

---

### STEP 5 — Start the Server

In the same Command Prompt window, run:
```
node server.js
```

You should see:
```
================================================
  Truth Lens — Fake News Detector
  Powered by Groq AI (llama-3.3-70b-versatile)
  BTech Final Year Project
================================================

  Server running at: http://localhost:3001
```

---

### STEP 6 — Open the App

1. Open your browser (Chrome, Firefox, Edge)
2. Go to: **http://localhost:3001**
3. The app loads — start analyzing!

---

## How to Use the App

### Analyze by Pasting Text
1. Stay on the **"Paste Article Text"** tab
2. Paste any news article, headline, or claim
3. Click **"Analyze for Fake News"**
4. Wait 5–10 seconds

### Analyze by URL
1. Click the **"Enter News URL"** tab
2. Paste the article URL (e.g. `https://www.ndtv.com/india-news/...`)
3. Click **"Analyze for Fake News"**
4. The server automatically fetches and reads the page, then analyzes it

> ⚠ Some sites (like paywalled articles) may block URL scraping. Use the text tab as fallback.

### Reading Results

| Result Section | What it means |
|---------------|---------------|
| **Verdict Banner** | Quick summary: Likely Credible / Uncertain / Likely Fake |
| **Credibility Score** | Overall score out of 100 |
| **Source Score** | How well-attributed the sources are |
| **Language Score** | How objective and professional the language is |
| **Article Summary** | (Only for credible articles) What the article actually reports |
| **Red Flags** | Specific misinformation patterns found |
| **Credibility Signals** | Positive trust indicators |
| **Fact-Check Criteria** | 8-point checklist with Pass/Fail/Warn badges |
| **Recommendation** | What you should do with this information |

### Export / Share Results
- **Print / Save PDF** → Opens print dialog; choose "Save as PDF" in your browser
- **Export as Text** → Downloads a `.txt` report file

### History
- Your last **10 analyses** are automatically saved in the browser
- Click any history entry to reload that analysis instantly
- Click **"Clear All"** to wipe history

---

## Stopping the Server

Press **Ctrl + C** in the Command Prompt window.

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `npm is not recognized` | Reinstall Node.js from nodejs.org |
| `API key not configured` | Add your Groq key in server.js or use `set GROQ_API_KEY=...` |
| `Error: API key invalid` | Double-check your key at console.groq.com → API Keys |
| `Cannot connect to localhost:3001` | Make sure `node server.js` is running |
| `EADDRINUSE: port 3001` | Change `PORT` in server.js to 3002 |
| URL scraping fails | Some sites block bots — paste the article text manually |
| Analysis fails every time | Check internet connection; Groq API needs internet |
| History not saving | Some browsers block localStorage in file:// mode — use http://localhost:3001 |

---

## Technical Architecture

```
User (Browser)
      │
      │  POST /analyze or POST /scrape
      ▼
Node.js Proxy Server (server.js)
      │  ├── /scrape → Fetches URL, extracts article text
      │  └── /analyze → Sends content to Groq API
      │
      ▼
Groq API (llama-3.3-70b-versatile)
      │
      ▼  JSON response
Node.js → Browser → Renders Result
```

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js 18+, Express.js |
| AI Engine | Groq API — llama-3.3-70b-versatile (free tier) |
| URL Scraping | Node.js native fetch + HTML text extraction |
| History | Browser localStorage |
| Export | Browser Print API + Blob download |

### Why a Proxy Server?
The Groq API key must be kept secret — it cannot be placed in the HTML file (visible to anyone). The Node.js backend holds the key securely and forwards requests, keeping the key server-side only.

---

## Project Abstract (for your report)

This project implements an AI-powered fake news detection system using a large language model (LLM). The system analyzes news articles for credibility signals including sensationalist language, missing attribution, emotional manipulation, unverified claims, and other indicators of misinformation.

The frontend provides an intuitive web interface where users can paste news text or enter article URLs for analysis. A URL scraping module automatically fetches and extracts text from news pages. The Node.js backend proxy server securely communicates with the Groq API, which uses the llama-3.3-70b-versatile model to perform natural language understanding and assess credibility across multiple dimensions.

Results include a structured credibility score (0–100), source and language sub-scores, detected red flags, credibility signals, an 8-point fact-check checklist, and — for credible articles — a neutral article summary. Analysis history is stored client-side, and users can export reports as text files or printable PDFs.

---

*Built with Groq AI (llama-3.3-70b-versatile) | BTech Final Year Project*
