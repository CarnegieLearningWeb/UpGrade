"""Library-defined exceptions."""


class UpgradeApiError(Exception):
    """Raised when the UpGrade API returns a non-2xx response."""

    def __init__(self, status_code: int, message: str, response_body: str = "") -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.response_body = response_body

    def __repr__(self) -> str:
        return f"UpgradeApiError(status_code={self.status_code}, message={self.message!r})"
