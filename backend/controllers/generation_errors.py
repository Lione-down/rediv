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
