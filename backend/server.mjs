import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.join(__dirname, 'uploads') });

const CACHE_FILE = path.join(__dirname, 'cache', 'certCache.json');
const BASE_URL = 'https://drm.my.salesforce-sites.com/services/apexrest/credential';

// Define mandatory certifications per role
const ROLE_REQUIREMENTS = {
  Consultant: ['Sales Cloud Consultant', 'Service Cloud Consultant', 'Platform App Builder'],
  Analyst: ['Administrator', 'Platform Developer I', 'Data Cloud Consultant'],
  Architect: ['Application Architect', 'System Architect', 'Identity and Access Management Architect'],
  Developer: ['Platform Developer I', 'Platform Developer II', 'JavaScript Developer I'],
  Admin: ['Administrator', 'Advanced Administrator'],
};

async function readCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function fetchCertification(searchString, role) {
  let url = `${BASE_URL}?searchString=${encodeURIComponent(searchString)}&languageLocaleKey=en`;
  if (role === 'Admin') {
    // Example of role-based branching logic
    url += '&admin=true';
  }
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parsed = JSON.parse(text);
    if (parsed.status !== 'success' || !parsed.data?.[0]?.jsonResponse) {
      return null;
    }
    const innerJson = JSON.parse(parsed.data[0].jsonResponse);
    return innerJson;
  } catch (err) {
    console.error(`❌ Error fetching for ${searchString}:`, err.message);
    return null;
  }
}

function mapCerts(apiRecord) {
  const records = apiRecord?.RelatedCertificationStatus?.records || [];
  return records.map(r => ({
    provider: 'Salesforce',
    name: r.ExternalCertificationTypeName || '',
    earnedAt: r.CertificationDate || '',
    expiresAt: null,
    status: 'active',
    meta: r.RelatedCertificationType || {},
  }));
}

app.get('/api/get-cache', async (req, res) => {
  const cache = await readCache();
  res.json(cache);
});

app.get('/api/users/:email', async (req, res) => {
  const cache = await readCache();
  const user = cache.find(u => u.email === req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/users', async (req, res) => {
  try {
    const { email, role, searchString, certifications = [] } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'email and role required' });
    }
    const required = ROLE_REQUIREMENTS[role] || [];
    const names = certifications.map(c => c.name);
    const missing = required.filter(r => !names.includes(r));
    if (missing.length) {
      return res.status(400).json({ error: `Missing mandatory certifications: ${missing.join(', ')}` });
    }
    const cache = await readCache();
    const idx = cache.findIndex(u => u.email === email);
    const entry = {
      email,
      role,
      searchString: searchString || (idx >= 0 ? cache[idx].searchString : ''),
      certifications,
      lastUpdated: new Date().toISOString(),
    };
    if (idx >= 0) {
      cache[idx] = entry;
    } else {
      cache.push(entry);
    }
    await writeCache(cache);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/refresh-cache', async (req, res) => {
  try {
    const users = await readCache();
    const results = [];
    for (const user of users) {
      const result = await fetchCertification(user.searchString, user.role);
      if (result && result.data && result.data[0]) {
        const certs = mapCerts(result.data[0]);
        results.push({ ...user, certifications: certs, lastUpdated: new Date().toISOString() });
      } else {
        results.push({ ...user, certifications: [], lastUpdated: new Date().toISOString() });
      }
    }
    await writeCache(results);
    res.json({ success: true, count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  try {
    const content = await fs.readFile(req.file.path, 'utf-8');
    await fs.unlink(req.file.path);
    const lines = content.trim().split('\n').slice(1);
    let processed = 0;
    let success = 0;
    const errors = [];
    const cache = await readCache();
    for (const [index, line] of lines.entries()) {
      processed++;
      const [email, role, searchString] = line.split(',');
      if (email && role && searchString) {
        const entry = {
          email: email.trim(),
          role: role.trim(),
          searchString: searchString.trim(),
          certifications: [],
          lastUpdated: null,
        };
        const existingIdx = cache.findIndex(u => u.email === entry.email);
        if (existingIdx >= 0) {
          cache[existingIdx] = { ...cache[existingIdx], ...entry };
        } else {
          cache.push(entry);
        }
        success++;
      } else {
        errors.push({ row: index + 2, error: 'Invalid row' });
      }
    }
    await writeCache(cache);
    res.json({ processed, success, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/roles', (req, res) => {
  res.json(ROLE_REQUIREMENTS);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});
