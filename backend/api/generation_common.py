from fastapi import HTTPException, status

from controllers import generation_transactions as generation_controller


def map_generation_error(error: generation_controller.GenerationTransactionError) -> HTTPException:
    if isinstance(error, generation_controller.GenerationScopeNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, generation_controller.GenerationValidationError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if isinstance(error, generation_controller.GenerationTaskStateError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    if isinstance(
        error,
        generation_controller.GenerationForbiddenError
        | generation_controller.GenerationFrozenError
        | generation_controller.GenerationQuotaError,
    ):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to save generated asset",
    )
