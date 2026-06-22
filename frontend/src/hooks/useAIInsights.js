import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { generateFallbackInsights } from "../utils/fallbackInsights";
import { generateAIInsights } from "../services/aiInsights";
import { getCachedInsight, setCachedInsight, hasCachedInsight } from "../utils/aiInsightCache";

const AI_INSIGHT_STATES = {
  BULK: "bulk",
  SELECTED: "selected",
  EXPANDED: "expanded",
};

export default function useAIInsights(data, enabled = true, priority = AI_INSIGHT_STATES.BULK) {
  const signature = JSON.stringify(data || {});
  const cacheKey = data?.partNo || data?.["Part No"] || null;
  const [resolved, setResolved] = useState(null);
  const [loadingState, setLoadingState] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadInsight = useCallback(() => {
    if (!enabled || priority === AI_INSIGHT_STATES.BULK) {
      return;
    }

    if (cacheKey && hasCachedInsight(cacheKey)) {
      setResolved({ signature, insight: getCachedInsight(cacheKey) });
      setLoadingState(false);
      return;
    }

    setLoadingState(true);
    let cancelled = false;
    
    generateAIInsights(JSON.parse(signature))
      .then((insight) => {
        if (isMounted.current && !cancelled) {
          setResolved({ signature, insight });
          if (cacheKey) {
            setCachedInsight(cacheKey, insight);
          }
        }
      })
      .catch(() => {
        if (isMounted.current && !cancelled) {
          setResolved(null);
        }
      })
      .finally(() => {
        if (isMounted.current && !cancelled) {
          setLoadingState(false);
        }
      });
  }, [signature, enabled, priority, cacheKey]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadInsight();
  }, [loadInsight]);

  const fallback = useMemo(() => generateFallbackInsights(JSON.parse(signature)), [signature]);
  const isCurrent = resolved?.signature === signature;
  
  return {
    insight: isCurrent ? resolved.insight : fallback,
    loading: enabled && !isCurrent && priority !== AI_INSIGHT_STATES.BULK && loadingState,
  };
}

export { AI_INSIGHT_STATES };