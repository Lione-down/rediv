from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Template(Base):
    __tablename__ = "templates"
    __table_args__ = (
        CheckConstraint("schema_version >= 1", name="ck_templates_graph_schema_version"),
        CheckConstraint(
            "JSON_CONTAINS_PATH(graph_data, 'all', '$.schema_version', '$.nodes', '$.connections') = 1 "
            "AND CAST(JSON_UNQUOTE(JSON_EXTRACT(graph_data, '$.schema_version')) AS UNSIGNED) = schema_version "
            "AND JSON_TYPE(JSON_EXTRACT(graph_data, '$.nodes')) = 'ARRAY' "
            "AND JSON_TYPE(JSON_EXTRACT(graph_data, '$.connections')) = 'ARRAY'",
            name="ck_templates_graph_data_shape",
        ),
        Index("ix_templates_user_created", "user_id", "created_at"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "模板表"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="模板唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="所属用户ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="模板名称")
    node_data: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list, comment="节点数据JSON")
    schema_version: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True), nullable=False, default=1, comment="Template graph schema version"
    )
    graph_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=lambda: {"schema_version": 1, "nodes": [], "connections": []},
        comment="Versioned template graph with nodes and connections",
    )
    node_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="节点数量")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
