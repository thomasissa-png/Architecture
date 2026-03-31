"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "versimo_queue_pending";

// Adaptive polling intervals (seconds): aggressive first, then slow down
const POLL_INTERVALS = [5, 5, 10, 10, 30, 60];
const MAX_POLL_DURATION_MS = 50 * 60 * 1000; // 50 minutes

interface QueueStatusDone {
  status: "done";
  userPhotoId: string | null;
  outputImageKey: string | null;
  completedAt: string;
}

interface QueueStatusFailed {
  status: "failed";
  abandonReason: string;
  creditRefunded: boolean;
}

interface QueueStatusPending {
  status: "pending" | "processing";
  retryCount: number;
}

type QueueStatus = QueueStatusDone | QueueStatusFailed | QueueStatusPending | null;

interface UseQueueStatusReturn {
  /** Current status of the queued job, or null if no active job */
  status: QueueStatus;
  /** Whether we're actively polling */
  isPolling: boolean;
  /** Queue a new job ID for polling */
  startPolling: (queueId: string) => void;
  /** Clear the queue (after user dismisses notification) */
  clearQueue: () => void;
  /** The queue ID, if any */
  queueId: string | null;
}

export function useQueueStatus(): UseQueueStatusReturn {
  const [queueId, setQueueId] = useState<string | null>(null);
  const [status, setStatus] = useState<QueueStatus>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.createdAt) {
          // Check if not too old (50 min)
          if (Date.now() - new Date(parsed.createdAt).getTime() < MAX_POLL_DURATION_MS) {
            setQueueId(parsed.id);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const clearQueue = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueueId(null);
    setStatus(null);
    setIsPolling(false);
    pollCountRef.current = 0;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/generation/${id}/status`);
      if (!res.ok) {
        if (res.status === 404) {
          clearQueue();
          return;
        }
        return; // Retry on next interval
      }

      const data = await res.json();

      if (data.status === "done" || data.status === "failed") {
        setStatus(data);
        setIsPolling(false);
        // Keep in localStorage until user dismisses
        return;
      }

      // Still pending/processing — schedule next poll
      setStatus(data);
      pollCountRef.current++;
      const intervalIndex = Math.min(pollCountRef.current, POLL_INTERVALS.length - 1);
      const nextDelay = POLL_INTERVALS[intervalIndex] * 1000;

      // Check max duration
      if (Date.now() - startTimeRef.current > MAX_POLL_DURATION_MS) {
        setIsPolling(false);
        return;
      }

      timerRef.current = setTimeout(() => poll(id), nextDelay);
    } catch {
      // Network error — retry in 30s
      timerRef.current = setTimeout(() => poll(id), 30_000);
    }
  }, [clearQueue]);

  // Start polling when queueId changes
  useEffect(() => {
    if (!queueId) return;

    setIsPolling(true);
    pollCountRef.current = 0;
    startTimeRef.current = Date.now();

    // Initial poll after 5s delay (give the queue time to process)
    timerRef.current = setTimeout(() => poll(queueId), 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queueId, poll]);

  const startPolling = useCallback((id: string) => {
    setQueueId(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, createdAt: new Date().toISOString() }));
  }, []);

  return { status, isPolling, startPolling, clearQueue, queueId };
}
