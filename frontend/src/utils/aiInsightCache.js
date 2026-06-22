const aiInsightCache = new Map();

export function getCachedInsight(skuId) {
  return aiInsightCache.get(skuId) || null;
}

export function setCachedInsight(skuId, insight) {
  aiInsightCache.set(skuId, { ...insight, cachedAt: Date.now() });
}

export function hasCachedInsight(skuId) {
  return aiInsightCache.has(skuId);
}

export function clearCache() {
  aiInsightCache.clear();
}

export function getCacheSize() {
  return aiInsightCache.size;
}