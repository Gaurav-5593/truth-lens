// =====================================================
//  Truth Lens — Fake News Detector v2.0
//  Backend Proxy Server (Node.js + Express)
//  Using Groq API (Free, Fast & India-friendly)
//  BTech Final Year Project | XAI Enhanced
// =====================================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Your Groq API Key ──────────────────────────────
// SECURITY: Use environment variable in production:
//   set GROQ_API_KEY=your_key_here   (Windows)
//   export GROQ_API_KEY=your_key     (Mac/Linux)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
// ───────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Truth Lens v2.0 running with Groq!' });
});

// ── URL Scraper ───────────────────────────────────
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Please provide a valid URL starting with http:// or https://' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Scraping URL: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Could not fetch the URL (HTTP ${response.status}). The site may block scrapers.` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return res.status(400).json({ error: 'URL does not point to a web page (not HTML content).' });
    }

    const html = await response.text();

    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const text = (title ? `HEADLINE: ${title}\n\n` : '') + cleaned.substring(200, 5000);

    if (text.length < 100) {
      return res.status(422).json({ error: 'Could not extract enough text from this URL. Please paste the article text manually.' });
    }

    console.log(`[${new Date().toISOString()}] Scraped ${text.length} chars from ${url}`);
    res.json({ text, title });

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'The URL took too long to load (timeout 12s). Try pasting the article text instead.' });
    }
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: `Failed to scrape URL: ${err.message}` });
  }
});

// ── Analyze ───────────────────────────────────────
app.post('/analyze', async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide content to analyze (minimum 10 characters).' });
  }

  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    return res.status(500).json({ error: 'API key not configured. Please add your Groq API key in server.js or set the GROQ_API_KEY environment variable.' });
  }

  const truncated = content.substring(0, 3500);

  const prompt = `You are an expert media literacy analyst, fake news detector, and Explainable AI (XAI) specialist. Analyze the following news content carefully and return ONLY a valid JSON object — no markdown, no code blocks, no extra text.

News content to analyze:
"""
${truncated}
"""

Return exactly this JSON structure:
{
  "credibilityScore": <integer 0-100, where 0=definitely fake, 100=highly credible>,
  "sourceScore": <integer 0-100 rating of source credibility signals>,
  "languageScore": <integer 0-100 rating of language objectivity and professionalism>,
  "biasScore": <integer 0-100, where 0=extreme left bias, 50=neutral, 100=extreme right bias>,
  "category": "<ONE of: Politics / Health / Finance / Entertainment / Science / Sports / Technology / Business / Crime / Environment / Other>",
  "summary": "<2-3 sentence credibility analysis explaining your overall assessment>",
  "whyFakeOrReal": "<3-4 specific, concrete sentences explaining EXACTLY WHY this content received its score. Reference specific words, phrases, patterns, or missing elements actually present in the text. This is the core XAI explanation — be precise and direct.>",
  "suspiciousWords": ["<exact suspicious word or short phrase from the text that signals misinformation — copy it exactly>", "<another if present, list up to 8 total>"],
  "articleSummary": "<ONLY if credibilityScore >= 65: a neutral 3-4 sentence factual summary of what this article reports. If credibilityScore < 65, return empty string \"\">",
  "redFlags": ["<specific red flag found in content>", "<another if present>"],
  "credibilitySignals": ["<specific positive credibility signal found>", "<another if present>"],
  "checks": {
    "Sensational Headlines": "<Yes / No / Moderate>",
    "Sources Cited": "<Yes / No / Partial>",
    "Author Identified": "<Yes / No>",
    "Emotional Language": "<Yes / No / Moderate>",
    "Verifiable Claims": "<Yes / No / Partial>",
    "Grammar & Spelling": "<Professional / Poor / Mixed>",
    "Call to Share Urgently": "<Yes / No>",
    "Anonymous Sources Only": "<Yes / No / Partial>"
  },
  "trustedSourcesMatch": "<If credible: name 1-2 specific major outlets (BBC, Reuters, AP, PTI, NDTV, The Hindu, Times of India, Al Jazeera) that would typically cover this type of verified story, explaining why their coverage would validate it. If fake/misleading: clearly state that no major credible outlet would publish these unverified claims and explain what a legitimate report would require.>",
  "recommendation": "<1-2 sentence clear, actionable advice for the reader>"
}`;

  try {
    console.log(`[${new Date().toISOString()}] Analyzing content (${content.length} chars)...`);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fake news detector, media literacy analyst, and Explainable AI (XAI) specialist. Always respond with valid JSON only. No markdown, no explanation text, just the JSON object.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      console.error('Groq API error:', errData);
      const errMsg = errData.error?.message || `Groq API error (HTTP ${groqResponse.status}). Check your API key.`;
      return res.status(502).json({ error: errMsg });
    }

    const data = await groqResponse.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse error. Raw response:', rawText.substring(0, 300));
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    // Validate & sanitize
    parsed.credibilityScore = Math.min(100, Math.max(0, parseInt(parsed.credibilityScore) || 50));
    parsed.sourceScore      = Math.min(100, Math.max(0, parseInt(parsed.sourceScore) || 50));
    parsed.languageScore    = Math.min(100, Math.max(0, parseInt(parsed.languageScore) || 50));
    parsed.biasScore        = Math.min(100, Math.max(0, parseInt(parsed.biasScore) || 50));

    if (!Array.isArray(parsed.redFlags))          parsed.redFlags = [];
    if (!Array.isArray(parsed.credibilitySignals)) parsed.credibilitySignals = [];
    if (!Array.isArray(parsed.suspiciousWords))    parsed.suspiciousWords = [];
    if (!parsed.category)          parsed.category = 'Other';
    if (!parsed.whyFakeOrReal)     parsed.whyFakeOrReal = parsed.summary || '';
    if (!parsed.trustedSourcesMatch) parsed.trustedSourcesMatch = '';

    console.log(`[${new Date().toISOString()}] Done! Score: ${parsed.credibilityScore}/100 | Category: ${parsed.category}`);
    res.json(parsed);

  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error. Please try again.' });
  }
});

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n================================================');
  console.log('  Truth Lens — Fake News Detector v2.0');
  console.log('  Powered by Groq AI (llama-3.3-70b-versatile)');
  console.log('  BTech Final Year Project | XAI Enhanced');
  console.log('================================================');
  console.log(`\n  Server running at: http://localhost:${PORT}`);
  console.log(`  Open this URL in your browser!\n`);
  console.log('  Press Ctrl+C to stop the server.\n');
});
