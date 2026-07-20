from __future__ import annotations

from collections.abc import Callable

from sqlalchemy import select

from models.base import get_session
from models.quota import Quota


class FreshQuotaView:
    """Legacy dict-shaped quota reads backed by a fresh database query."""

    def __init__(self, serializer: Callable[[Quota], dict]) -> None:
        self._serializer = serializer

    def __getitem__(self, user_id: str) -> dict:
        value = self.get(user_id)
        if value is None:
            raise KeyError(user_id)
        return value

    def __setitem__(self, user_id: str, value: dict) -> None:
        # Writes are committed by the transaction that produced the snapshot.
        return None

    def get(self, user_id: str, default=None):
        with get_session() as session:
            row = session.scalar(select(Quota).where(Quota.user_id == user_id))
            return self._serializer(row) if row is not None else default
