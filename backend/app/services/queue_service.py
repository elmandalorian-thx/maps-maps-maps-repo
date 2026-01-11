"""
Queue Service for async processing of Google Maps extraction queries.

This is an in-memory queue implementation suitable for single-instance deployments.
For production scale, consider upgrading to Redis/Cloud Tasks.
"""

import asyncio
import threading
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum


class QueueState(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"


class QueueService:
    """
    In-memory queue manager for extraction jobs.

    Features:
    - Thread-safe queue operations
    - Pause/resume functionality
    - Status tracking
    - Background processing
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        # Queue state
        self._queue: deque = deque()
        self._state = QueueState.IDLE
        self._currently_processing: Optional[str] = None
        self._processing_user_id: Optional[str] = None

        # Processing stats
        self._processed_count = 0
        self._error_count = 0
        self._avg_processing_time = 3.0  # Initial estimate: 3 seconds per query

        # Background task
        self._processing_task: Optional[asyncio.Task] = None
        self._stop_event = threading.Event()

        self._initialized = True

    def add_to_queue(self, query_ids: List[str], user_id: str) -> Dict[str, int]:
        """
        Add query IDs to the processing queue.

        Args:
            query_ids: List of query IDs to process
            user_id: User ID for verification

        Returns:
            Dict with queued count
        """
        with self._lock:
            added = 0
            for query_id in query_ids:
                # Add tuple of (query_id, user_id) to queue
                self._queue.append((query_id, user_id))
                added += 1

            return {"queued": added, "total_in_queue": len(self._queue)}

    def get_queue_status(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current queue status.

        Args:
            user_id: Optional filter for user-specific counts

        Returns:
            Dict with queue statistics
        """
        with self._lock:
            total_in_queue = len(self._queue)

            # Count user-specific items if user_id provided
            user_queue_count = 0
            if user_id:
                user_queue_count = sum(1 for qid, uid in self._queue if uid == user_id)

            # Estimate time remaining
            estimated_time = None
            if total_in_queue > 0:
                estimated_time = int(total_in_queue * self._avg_processing_time)

            return {
                "state": self._state.value,
                "totalInQueue": total_in_queue,
                "userQueueCount": user_queue_count,
                "currentlyProcessing": self._currently_processing,
                "processingUserId": self._processing_user_id,
                "processedCount": self._processed_count,
                "errorCount": self._error_count,
                "avgProcessingTime": round(self._avg_processing_time, 2),
                "estimatedTimeRemaining": estimated_time,
                "isPaused": self._state == QueueState.PAUSED,
                "isRunning": self._state == QueueState.RUNNING,
            }

    def pause_queue(self) -> Dict[str, str]:
        """Pause queue processing."""
        with self._lock:
            if self._state == QueueState.RUNNING:
                self._state = QueueState.PAUSED
                return {"status": "paused", "message": "Queue processing paused"}
            elif self._state == QueueState.PAUSED:
                return {"status": "already_paused", "message": "Queue is already paused"}
            else:
                return {"status": "idle", "message": "Queue is idle, nothing to pause"}

    def resume_queue(self) -> Dict[str, str]:
        """Resume queue processing."""
        with self._lock:
            if self._state == QueueState.PAUSED:
                self._state = QueueState.RUNNING
                return {"status": "resumed", "message": "Queue processing resumed"}
            elif self._state == QueueState.RUNNING:
                return {"status": "already_running", "message": "Queue is already running"}
            else:
                return {"status": "idle", "message": "Queue is idle, use start to begin processing"}

    def clear_queue(self) -> Dict[str, int]:
        """Clear all items from the queue."""
        with self._lock:
            count = len(self._queue)
            self._queue.clear()
            return {"cleared": count}

    def get_next(self) -> Optional[tuple]:
        """Get next item from queue without removing it."""
        with self._lock:
            if self._queue and self._state != QueueState.PAUSED:
                return self._queue[0]
            return None

    def pop_next(self) -> Optional[tuple]:
        """Remove and return next item from queue."""
        with self._lock:
            if self._queue and self._state != QueueState.PAUSED:
                item = self._queue.popleft()
                self._currently_processing = item[0]
                self._processing_user_id = item[1]
                return item
            return None

    def mark_complete(self, success: bool, processing_time: float = 0):
        """Mark current processing as complete."""
        with self._lock:
            self._currently_processing = None
            self._processing_user_id = None

            if success:
                self._processed_count += 1
            else:
                self._error_count += 1

            # Update average processing time
            if processing_time > 0:
                # Exponential moving average
                self._avg_processing_time = (
                    0.7 * self._avg_processing_time + 0.3 * processing_time
                )

    def start_processing(self) -> Dict[str, str]:
        """Start background processing."""
        with self._lock:
            if self._state == QueueState.RUNNING:
                return {"status": "already_running", "message": "Queue is already running"}

            self._state = QueueState.RUNNING
            return {"status": "started", "message": "Queue processing started"}

    def stop_processing(self) -> Dict[str, str]:
        """Stop background processing."""
        with self._lock:
            if self._state == QueueState.IDLE:
                return {"status": "already_stopped", "message": "Queue is already stopped"}

            self._state = QueueState.IDLE
            self._currently_processing = None
            self._processing_user_id = None
            return {"status": "stopped", "message": "Queue processing stopped"}

    def remove_from_queue(self, query_ids: List[str]) -> Dict[str, int]:
        """Remove specific query IDs from the queue."""
        with self._lock:
            removed = 0
            new_queue = deque()

            for item in self._queue:
                if item[0] not in query_ids:
                    new_queue.append(item)
                else:
                    removed += 1

            self._queue = new_queue
            return {"removed": removed, "remaining": len(self._queue)}

    def get_user_queue_position(self, query_id: str) -> Optional[int]:
        """Get position of a query in the queue (1-indexed)."""
        with self._lock:
            for i, (qid, _) in enumerate(self._queue):
                if qid == query_id:
                    return i + 1
            return None

    def reset_stats(self):
        """Reset processing statistics."""
        with self._lock:
            self._processed_count = 0
            self._error_count = 0
            self._avg_processing_time = 3.0


# Singleton instance
queue_service = QueueService()


def get_queue_service() -> QueueService:
    """Get the singleton queue service instance."""
    return queue_service
