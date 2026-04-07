"""
WebSocket Handler — Real-time metric streaming for frontend.

Manages WebSocket connections and broadcasts metrics to subscribers.
"""

from typing import Dict, Set
from fastapi import WebSocket
import json
import asyncio


class WebSocketManager:
    """Manages WebSocket connections per session."""

    def __init__(self):
        # session_id -> set of connected WebSocket clients
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.broadcast_queue: Dict[str, list] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        """Register a new WebSocket connection for a session."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
            self.broadcast_queue[session_id] = []
        self.active_connections[session_id].add(websocket)

    async def disconnect(self, session_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                if session_id in self.broadcast_queue:
                    del self.broadcast_queue[session_id]

    async def broadcast_metric(self, session_id: str, observation: dict, step_info: dict = None):
        """
        Broadcast a metric update to all subscribers of a session.

        Args:
            session_id: Project session ID
            observation: Observable state dict
            step_info: Additional step information (reward, done, action, etc.)
        """
        if session_id not in self.broadcast_queue:
            return

        message = {
            "type": "metric_update",
            "timestamp": asyncio.get_event_loop().time(),
            "observation": observation,
            "step_info": step_info or {},
        }

        # Queue the message for batching
        self.broadcast_queue[session_id].append(message)

    async def flush_metrics(self, session_id: str):
        """
        Send queued metrics to all subscribers.
        Called periodically to batch updates.
        """
        if session_id not in self.broadcast_queue:
            return

        queue = self.broadcast_queue[session_id]
        if not queue:
            return

        # Bundle all queued messages
        batch = {
            "type": "metric_batch",
            "updates": queue,
        }

        # Send to all connected clients
        if session_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[session_id]:
                try:
                    await websocket.send_json(batch)
                except Exception as e:
                    disconnected.add(websocket)

            # Clean up disconnected clients
            for ws in disconnected:
                await self.disconnect(session_id, ws)

        # Clear queue after sending
        self.broadcast_queue[session_id] = []

    async def broadcast_control(self, session_id: str, message_type: str, data: dict = None):
        """
        Broadcast a control message (e.g., reset, error).
        Sent immediately without batching.
        """
        message = {
            "type": message_type,
            "data": data or {},
        }

        if session_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[session_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    disconnected.add(websocket)

            for ws in disconnected:
                await self.disconnect(session_id, ws)

    def get_subscriber_count(self, session_id: str) -> int:
        """Get number of active WebSocket subscribers for a session."""
        return len(self.active_connections.get(session_id, set()))


# Global WebSocket manager instance
ws_manager = WebSocketManager()
