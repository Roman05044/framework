
import path from 'path';

import { CONFIG } from '../constants/config.js';

const TTL_SECONDS = 120;

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

export const getExternalDeviceType = async (typeId, redis) => {
  const cacheKey = `cache:reference:${typeId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  try {
    const url = `${CONFIG.EXTERNAL_API.TYPES_BASE_URL}${typeId}`;
    const data = await fetchWithTimeoutAndRetry(url);

    if (data) {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', TTL_SECONDS);
    }

    return data;
  } catch {
    return null;
  }
};
