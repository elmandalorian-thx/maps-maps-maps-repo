"""
Queue Router - API endpoints for queue management.

Endpoints:
- GET /api/queue/status - Get queue statistics
- POST /api/queue/add - Add query IDs to queue
- POST /api/queue/start - Start processing
- POST /api/queue/pause - Pause processing
- POST /api/queue/resume - Resume processing
- POST /api/queue/stop - Stop processing
- POST /api/queue/retry-failed - Retry all failed queries
- POST /api/queue/process-next - Process next item (for manual triggering)
- DELETE /api/queue/clear - Clear queue
"""

import time
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..services.firebase_service import FirebaseService
from ..services.queue_service import QueueService, get_queue_service
from ..services.extractor_service import ExtractorService

router = APIRouter(prefix="/queue", tags=["queue"])


# ==================== Request/Response Models ====================


class AddToQueueRequest(BaseModel):
    queryIds: List[str]


class AddToQueueResponse(BaseModel):
    queued: int
    totalInQueue: int
    message: str


class QueueStatusResponse(BaseModel):
    state: str
    totalInQueue: int
    userQueueCount: int
    currentlyProcessing: Optional[str]
    processedCount: int
    errorCount: int
    avgProcessingTime: float
    estimatedTimeRemaining: Optional[int]
    isPaused: bool
    isRunning: bool
    # Firebase status counts
    pendingCount: int
    queuedCount: int
    runningCount: int
    completeCount: int
    errorDbCount: int


class QueueActionResponse(BaseModel):
    status: str
    message: str


class ProcessNextResponse(BaseModel):
    processed: bool
    queryId: Optional[str]
    success: Optional[bool]
    resultCount: Optional[int]
    error: Optional[str]
    processingTime: Optional[float]


class RetryFailedResponse(BaseModel):
    queued: int
    message: str


# ==================== Dependencies ====================


def get_firebase_service():
    return FirebaseService()


def get_extractor_service():
    return ExtractorService()


# ==================== Background Processing ====================


async def process_queue_item(
    query_id: str,
    user_id: str,
    firebase: FirebaseService,
    extractor: ExtractorService,
    queue: QueueService,
):
    """
    Process a single queue item.

    1. Update status to 'running'
    2. Run extraction
    3. Save version
    4. Update status to 'complete' or 'error'
    """
    start_time = time.time()

    try:
        # Get the query
        query = firebase.get_query(query_id)
        if not query:
            firebase.update_query_status(query_id, "error")
            queue.mark_complete(success=False)
            return {"success": False, "error": "Query not found"}

        # Verify ownership
        if query.get("createdBy") != user_id:
            queue.mark_complete(success=False)
            return {"success": False, "error": "Access denied"}

        # Update status to running
        firebase.update_query_status(query_id, "running")

        # Run extraction
        result = extractor.extract_businesses(query.get("fullQuery", ""))
        businesses = result.get("businesses", [])

        # Create version with results
        version = firebase.create_version(query_id, businesses)

        # Update query with results
        processing_time = time.time() - start_time
        firebase.db.collection("queries").document(query_id).update({
            "status": "complete",
            "completedAt": version.get("createdAt"),
            "resultCount": len(businesses),
            "latestVersionId": version.get("id"),
            "error": None,
        })

        # Update base term stats if linked
        if query.get("baseTermId"):
            firebase.update_base_term_stats(query.get("baseTermId"))

        queue.mark_complete(success=True, processing_time=processing_time)

        return {
            "success": True,
            "queryId": query_id,
            "resultCount": len(businesses),
            "versionId": version.get("id"),
            "processingTime": processing_time,
        }

    except Exception as e:
        processing_time = time.time() - start_time
        error_msg = str(e)

        # Update query with error
        try:
            firebase.db.collection("queries").document(query_id).update({
                "status": "error",
                "error": error_msg,
                "completedAt": None,
            })

            # Update base term stats if linked
            query = firebase.get_query(query_id)
            if query and query.get("baseTermId"):
                firebase.update_base_term_stats(query.get("baseTermId"))
        except Exception:
            pass

        queue.mark_complete(success=False, processing_time=processing_time)

        return {
            "success": False,
            "queryId": query_id,
            "error": error_msg,
            "processingTime": processing_time,
        }


async def run_queue_processor(
    firebase: FirebaseService,
    extractor: ExtractorService,
    queue: QueueService,
):
    """
    Background task to process queue items continuously.
    """
    while True:
        # Check if we should continue
        status = queue.get_queue_status()
        if not status["isRunning"] or status["totalInQueue"] == 0:
            await asyncio.sleep(1)
            continue

        # Get next item
        item = queue.pop_next()
        if not item:
            await asyncio.sleep(1)
            continue

        query_id, user_id = item

        # Update status to queued -> running
        try:
            firebase.update_query_status(query_id, "running")
        except Exception:
            pass

        # Process the item
        await process_queue_item(query_id, user_id, firebase, extractor, queue)

        # Small delay to prevent rate limiting
        await asyncio.sleep(0.5)


# ==================== Endpoints ====================


@router.get("/status", response_model=QueueStatusResponse)
async def get_queue_status(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Get current queue status and statistics."""
    # Get queue service status
    queue_status = queue.get_queue_status(user_id=current_user.uid)

    # Get Firebase status counts
    db_status = firebase.get_queue_status(user_id=current_user.uid)

    return QueueStatusResponse(
        state=queue_status["state"],
        totalInQueue=queue_status["totalInQueue"],
        userQueueCount=queue_status["userQueueCount"],
        currentlyProcessing=queue_status["currentlyProcessing"],
        processedCount=queue_status["processedCount"],
        errorCount=queue_status["errorCount"],
        avgProcessingTime=queue_status["avgProcessingTime"],
        estimatedTimeRemaining=queue_status["estimatedTimeRemaining"],
        isPaused=queue_status["isPaused"],
        isRunning=queue_status["isRunning"],
        pendingCount=db_status.get("pending", 0),
        queuedCount=db_status.get("queued", 0),
        runningCount=db_status.get("running", 0),
        completeCount=db_status.get("complete", 0),
        errorDbCount=db_status.get("error", 0),
    )


@router.post("/add", response_model=AddToQueueResponse)
async def add_to_queue(
    request: AddToQueueRequest,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Add query IDs to the processing queue."""
    # Verify all queries exist and belong to user
    valid_ids = []
    for query_id in request.queryIds:
        query = firebase.get_query(query_id)
        if query and query.get("createdBy") == current_user.uid:
            # Only add pending/error queries
            if query.get("status") in ["pending", "error"]:
                valid_ids.append(query_id)

    if not valid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid queries found to add to queue",
        )

    # Update query statuses to 'queued'
    firebase.bulk_update_query_status(valid_ids, "queued")

    # Add to queue
    result = queue.add_to_queue(valid_ids, current_user.uid)

    return AddToQueueResponse(
        queued=result["queued"],
        totalInQueue=result["total_in_queue"],
        message=f"Added {result['queued']} queries to queue",
    )


@router.post("/start", response_model=QueueActionResponse)
async def start_queue(
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    extractor: ExtractorService = Depends(get_extractor_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Start queue processing."""
    result = queue.start_processing()

    if result["status"] == "started":
        # Start background processor
        background_tasks.add_task(
            run_queue_processor,
            firebase,
            extractor,
            queue,
        )

    return QueueActionResponse(**result)


@router.post("/pause", response_model=QueueActionResponse)
async def pause_queue(
    current_user: TokenData = Depends(get_current_user),
    queue: QueueService = Depends(get_queue_service),
):
    """Pause queue processing."""
    result = queue.pause_queue()
    return QueueActionResponse(**result)


@router.post("/resume", response_model=QueueActionResponse)
async def resume_queue(
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    extractor: ExtractorService = Depends(get_extractor_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Resume queue processing."""
    result = queue.resume_queue()

    if result["status"] == "resumed":
        # Restart background processor
        background_tasks.add_task(
            run_queue_processor,
            firebase,
            extractor,
            queue,
        )

    return QueueActionResponse(**result)


@router.post("/stop", response_model=QueueActionResponse)
async def stop_queue(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Stop queue processing and reset queued queries to pending."""
    result = queue.stop_processing()

    # Reset any queued queries back to pending
    # This is done in case the queue was stopped mid-processing
    queue_status = queue.get_queue_status(user_id=current_user.uid)
    if queue_status["totalInQueue"] > 0:
        # Get all queued items and reset them
        queue.clear_queue()

    return QueueActionResponse(**result)


@router.post("/retry-failed", response_model=RetryFailedResponse)
async def retry_failed(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Retry all failed queries by adding them back to the queue."""
    # Get all failed queries
    failed_queries = firebase.get_queries(
        user_id=current_user.uid,
        status="error",
    )

    if not failed_queries:
        return RetryFailedResponse(
            queued=0,
            message="No failed queries to retry",
        )

    # Extract IDs
    query_ids = [q["id"] for q in failed_queries]

    # Reset status to queued
    firebase.bulk_update_query_status(query_ids, "queued")

    # Clear errors
    for query_id in query_ids:
        try:
            firebase.db.collection("queries").document(query_id).update({
                "error": None,
            })
        except Exception:
            pass

    # Add to queue
    result = queue.add_to_queue(query_ids, current_user.uid)

    return RetryFailedResponse(
        queued=result["queued"],
        message=f"Added {result['queued']} failed queries to retry queue",
    )


@router.post("/process-next", response_model=ProcessNextResponse)
async def process_next(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    extractor: ExtractorService = Depends(get_extractor_service),
    queue: QueueService = Depends(get_queue_service),
):
    """
    Manually process the next item in the queue.
    Useful for testing or single-step processing.
    """
    # Get next item
    item = queue.pop_next()
    if not item:
        return ProcessNextResponse(
            processed=False,
            queryId=None,
            success=None,
            resultCount=None,
            error="No items in queue",
            processingTime=None,
        )

    query_id, user_id = item

    # Verify the user matches
    if user_id != current_user.uid:
        # Put it back in the queue
        queue.add_to_queue([query_id], user_id)
        return ProcessNextResponse(
            processed=False,
            queryId=query_id,
            success=None,
            resultCount=None,
            error="Query belongs to another user",
            processingTime=None,
        )

    # Process the item
    result = await process_queue_item(
        query_id, user_id, firebase, extractor, queue
    )

    return ProcessNextResponse(
        processed=True,
        queryId=query_id,
        success=result.get("success"),
        resultCount=result.get("resultCount"),
        error=result.get("error"),
        processingTime=result.get("processingTime"),
    )


@router.delete("/clear")
async def clear_queue(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Clear all items from the queue and reset queued queries to pending."""
    # Get all items in queue for this user
    queue_status = queue.get_queue_status(user_id=current_user.uid)

    # Clear the queue
    result = queue.clear_queue()

    # Reset all queued queries for this user back to pending
    queued_queries = firebase.get_queries(
        user_id=current_user.uid,
        status="queued",
    )
    if queued_queries:
        query_ids = [q["id"] for q in queued_queries]
        firebase.bulk_update_query_status(query_ids, "pending")

    return {
        "cleared": result["cleared"],
        "message": f"Cleared {result['cleared']} items from queue",
    }


@router.post("/add-all-pending", response_model=AddToQueueResponse)
async def add_all_pending(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
    queue: QueueService = Depends(get_queue_service),
):
    """Add all pending queries to the queue."""
    # Get all pending queries
    pending_queries = firebase.get_queries(
        user_id=current_user.uid,
        status="pending",
    )

    if not pending_queries:
        return AddToQueueResponse(
            queued=0,
            totalInQueue=queue.get_queue_status()["totalInQueue"],
            message="No pending queries to add",
        )

    # Extract IDs
    query_ids = [q["id"] for q in pending_queries]

    # Update status to queued
    firebase.bulk_update_query_status(query_ids, "queued")

    # Add to queue
    result = queue.add_to_queue(query_ids, current_user.uid)

    return AddToQueueResponse(
        queued=result["queued"],
        totalInQueue=result["total_in_queue"],
        message=f"Added {result['queued']} pending queries to queue",
    )
