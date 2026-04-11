"""
WebSocket Handler — Real-time metric streaming for frontend.

Manages WebSocket connections and broadcasts metrics to subscribers.
"""

from typing import Dict, Set
from fastapi import WebSocket
import asyncio


class WebSocketManager:
    """Manages WebSocket connections per session."""

    def __init__(self):
        # session_id -> set of connected WebSocket clients
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        """Register a new WebSocket connection for a session."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)

    async def disconnect(self, session_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_metric(self, session_id: str, observation: dict, step_info: dict = None):
        """Broadcast a metric update to all subscribers of a session."""
        if session_id not in self.active_connections:
            return

        message = {
            "type": "metric_update",
            "timestamp": asyncio.get_event_loop().time(),
            "observation": observation,
            "step_info": step_info or {},
        }

        disconnected = set()
        for websocket in self.active_connections.get(session_id, set()):
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.add(websocket)

        for ws in disconnected:
            await self.disconnect(session_id, ws)

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
                except Exception:
                    disconnected.add(websocket)

            for ws in disconnected:
                await self.disconnect(session_id, ws)

    def get_subscriber_count(self, session_id: str) -> int:
        """Get number of active WebSocket subscribers for a session."""
        return len(self.active_connections.get(session_id, set()))


# Global WebSocket manager instance
ws_manager = WebSocketManager()
