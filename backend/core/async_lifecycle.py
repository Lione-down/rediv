from __future__ import annotations

import asyncio
from collections.abc import Awaitable
from typing import TypeVar


T = TypeVar("T")


async def await_with_deferred_cancellation(
    awaitable: Awaitable[T],
) -> tuple[T, asyncio.CancelledError | None]:
    task = asyncio.ensure_future(awaitable)
    cancellation: asyncio.CancelledError | None = None
    while True:
        try:
            return await asyncio.shield(task), cancellation
        except asyncio.CancelledError as error:
            cancellation = cancellation or error
            if task.done():
                return task.result(), cancellation
        except BaseException:
            if cancellation is not None:
                raise cancellation
            raise
