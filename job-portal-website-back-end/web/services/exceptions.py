

class AppError(ValueError):

    status_code = 400

    def __init__(self, message, status_code=None):
        super().__init__(message)

        if status_code is not None:
            self.status_code = status_code


class ValidationError(AppError):

    status_code = 400


class NotFoundError(AppError):

    status_code = 404


class PermissionDeniedError(AppError):

    status_code = 403


class ConflictError(AppError):

    status_code = 409
