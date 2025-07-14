import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const CACHE_FILE = path.join(__dirname, 'cache', 'certCache.json');
const USER_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'cert-users.txt');
const BASE_URL = 'https://drm.my.salesforce-sites.com/services/apexrest/credential';

async function readUserList() {
  const content = await fs.readFile(USER_FILE, 'utf-8');
  const lines = content.trim().split('\n').slice(1);
  return lines
    .map(line => {
      const [email, searchString] = line.split(',');
      if (email && searchString) return { email: email.trim(), searchString: searchString.trim() };
      return null;
    })
    .filter(entry => entry !== null);
}

async function fetchCertification(searchString) {
  const url = `${BASE_URL}?searchString=${encodeURIComponent(searchString)}&languageLocaleKey=en`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log("🔎 Raw response for", searchString, ":\n", text.slice(0, 500));

    // Try to parse as full JSON (not from XML tag)
    const parsed = JSON.parse(text);

    if (parsed.status !== 'success' || !parsed.data?.[0]?.jsonResponse) {
      console.warn(`⚠️ Invalid or missing data for searchString: ${searchString}`);
      return null;
    }

    // Extract and parse nested JSON string
    const innerJson = JSON.parse(parsed.data[0].jsonResponse);
    return innerJson;
  } catch (err) {
    console.error(`❌ Error fetching for ${searchString}:`, err.message);
    return null;
  }
}



app.get('/api/get-cache', async (req, res) => {
  try {
    const cache = await fs.readFile(CACHE_FILE, 'utf-8');
    res.json(JSON.parse(cache));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/refresh-cache', async (req, res) => {
  try {
    const users = await readUserList();
    console.log(`🔁 Refreshing data for ${users.length} users...`);

    const results = [];

    for (const user of users) {
      console.log(`→ Fetching for ${user.email}`);
      const result = await fetchCertification(user.searchString);
      if (result && result.data && result.data[0]) {
        results.push({ email: user.email, ...result.data[0] });
      } else {
        console.warn(`❌ No result for ${user.email}`);
      }
    }

    await fs.writeFile(CACHE_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Cache updated: ${results.length} records saved.`);
    res.json({ success: true, count: results.length });
  } catch (err) {
    console.error(`❌ Error refreshing cache:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});