class GenerationTransactionError(Exception):
    pass


class GenerationScopeNotFoundError(GenerationTransactionError):
    pass


class GenerationForbiddenError(GenerationTransactionError):
    pass


class GenerationFrozenError(GenerationTransactionError):
    pass


class GenerationQuotaError(GenerationTransactionError):
    def __init__(self, quota_type: str) -> None:
        self.quota_type = quota_type
        super().__init__(f"Insufficient {quota_type} quota")


class GenerationValidationError(GenerationTransactionError):
    pass


class GenerationPersistenceError(GenerationTransactionError):
    pass


class GenerationTaskStateError(GenerationTransactionError):
    pass


class GenerationIdempotencyConflictError(GenerationTransactionError):
    def __init__(self, task_id: str) -> None:
        self.task_id = task_id
        super().__init__("Client request ID was already used for a different generation request")


class GenerationRequestInProgressError(GenerationTransactionError):
    def __init__(self, task_id: str, *, duplicate: bool) -> None:
        self.task_id = task_id
        self.duplicate = duplicate
        super().__init__("Generation request is already in progress")


class GenerationRequestTerminalError(GenerationTransactionError):
    def __init__(self, task_id: str, task_status: str) -> None:
        self.task_id = task_id
        self.task_status = task_status
        super().__init__(f'Generation request is already terminal with status "{task_status}"')


class GenerationDeterministicFailureError(GenerationTransactionError):
    def __init__(self, task_id: str, error_code: str) -> None:
        self.task_id = task_id
        self.error_code = error_code
        super().__init__("Generation input is unchanged after a deterministic provider rejection")


class GenerationProviderBusyError(GenerationTransactionError):
    def __init__(self, retry_after_seconds: int) -> None:
        self.retry_after_seconds = retry_after_seconds
        super().__init__("Agnes provider capacity is busy")
