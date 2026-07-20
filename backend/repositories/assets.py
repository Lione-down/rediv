from __future__ import annotations

from sqlalchemy import select

from models.asset import Asset
from models.base import get_session
from repositories.records import asset_record


class AssetRepository:
    def get(self, asset_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(Asset, asset_id)
            return asset_record(row) if row is not None else None

    def list_all(self) -> list[dict]:
        with get_session() as session:
            rows = session.scalars(select(Asset).order_by(Asset.created_at.desc())).all()
            return [asset_record(row) for row in rows]
