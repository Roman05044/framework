export const REDIS_KEYS = {
  REFERENCE: 'cache:reference',
  ITEMS_V2: (page, limit) => `cache:items:v2:${page}:${limit}`,
  ITEMS_V2_PATTERN: 'cache:items:v2:*',
  BLACKLIST: (jti) => `blacklist:${jti}`,
  REFRESH: (userId) => `refresh:${userId}`,
};
