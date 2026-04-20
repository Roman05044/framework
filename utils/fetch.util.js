import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'reference.json');
const TTL_SECONDS = 120;

const ensureCacheDir = async () => {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
};

const fetchWithTimeoutAndRetry = async (url, retries = 3, timeout = 5000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries - 1) throw error;

      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const getExternalDeviceType = async (typeId) => {
  await ensureCacheDir();

  try {
    const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
    const cache = JSON.parse(cacheData);

    const isCacheValid = Date.now() - cache.timestamp < TTL_SECONDS * 1000;
    if (isCacheValid && cache.data && cache.data.id === String(typeId)) {
      return cache.data;
    }
  } catch {}

  try {
    const url = `http://localhost:3001/types/${typeId}`;
    const data = await fetchWithTimeoutAndRetry(url);

    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify({ timestamp: Date.now(), data }, null, 2),
      'utf8'
    );

    return data;
  } catch {
    return null;
  }
};
