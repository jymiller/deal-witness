"""Secure construction and connectivity checks for the EverOS Cloud client.

Credentials are resolved only when :func:`load_everos_api_key` or
:func:`create_everos_client` is called.  This module deliberately never stores a
credential in a dataclass, exception, log message, or serializable status.
"""

from __future__ import annotations

import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Protocol

from everos_cloud import EverOS


EVEROS_API_KEY_ENV = "EVEROS_API_KEY"
DEFAULT_APP_ID = "default"
DEFAULT_PROJECT_ID = "default"
DEFAULT_TIMEOUT_SECONDS = 60.0
DEFAULT_PROBE_USER_ID = "memory-knee-connection-probe"
DEFAULT_PROBE_QUERY = "memory knee connection probe"
DEFAULT_DOTENV_FILENAME = ".env"

DotenvLoader = Callable[[Path], Mapping[str, str | None]]
ClientFactory = Callable[..., Any]


class EverOSCredentialError(RuntimeError):
    """Base class for safe EverOS credential configuration errors."""


class MissingEverOSCredentialError(EverOSCredentialError):
    """Raised when ``EVEROS_API_KEY`` has no non-blank configured value."""

    def __init__(self) -> None:
        super().__init__(
            "EVEROS_API_KEY is required; set it in the process environment "
            "or in the repository .env file."
        )


class EverOSCredentialLoadError(EverOSCredentialError):
    """Raised when the optional dotenv fallback cannot be read safely."""

    def __init__(self) -> None:
        super().__init__("Unable to read the optional EverOS dotenv fallback.")


class EverOSClientCreationError(RuntimeError):
    """Raised when the official facade cannot be constructed.

    The original exception is intentionally not chained because a third-party
    factory error can include constructor arguments, including the credential.
    """

    def __init__(self) -> None:
        super().__init__("Unable to create the EverOS Cloud client.")


class EverOSSearchClient(Protocol):
    """The non-mutating slice of the official facade used by the probe."""

    def search(self, query: str, **kwargs: Any) -> Any:
        """Search EverOS memory without changing it."""


@dataclass(frozen=True, slots=True)
class EverOSConnectionStatus:
    """Secret-free result of an EverOS v2 search connectivity probe."""

    connected: bool
    code: Literal["connected", "search_failed"]
    provider: Literal["everos-cloud"] = "everos-cloud"
    api_version: Literal["v2"] = "v2"
    operation: Literal["search"] = "search"

    def to_dict(self) -> dict[str, bool | str]:
        """Return a JSON-safe status without response or exception data."""

        return {
            "connected": self.connected,
            "code": self.code,
            "provider": self.provider,
            "api_version": self.api_version,
            "operation": self.operation,
        }


def _normalized_credential(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _read_dotenv(path: Path) -> Mapping[str, str | None]:
    """Read dotenv values without mutating ``os.environ``."""

    from dotenv import dotenv_values

    return dotenv_values(dotenv_path=path)


def load_everos_api_key(
    *,
    environ: Mapping[str, str] | None = None,
    use_dotenv: bool = True,
    dotenv_path: str | Path | None = None,
    dotenv_loader: DotenvLoader | None = None,
) -> str:
    """Resolve ``EVEROS_API_KEY`` at runtime with process-env precedence.

    If the variable exists in the supplied process environment, that value is
    authoritative: a blank value is a missing credential and does not silently
    fall through to a local file.  When the variable is absent, the repository
    ``.env`` file in the current working directory is an optional fallback read
    with ``python-dotenv``.  Reading the file does not modify the process
    environment.  Callers running outside the project directory can supply an
    explicit ``dotenv_path``.
    """

    runtime_environment = os.environ if environ is None else environ
    if EVEROS_API_KEY_ENV in runtime_environment:
        credential = _normalized_credential(
            runtime_environment.get(EVEROS_API_KEY_ENV)
        )
        if credential is None:
            raise MissingEverOSCredentialError()
        return credential

    if use_dotenv:
        fallback_path = (
            Path.cwd() / DEFAULT_DOTENV_FILENAME
            if dotenv_path is None
            else Path(dotenv_path).expanduser()
        )
        if fallback_path.is_file():
            loader = dotenv_loader or _read_dotenv
            dotenv_load_failed = False
            try:
                dotenv_values = loader(fallback_path)
                credential = _normalized_credential(
                    dotenv_values.get(EVEROS_API_KEY_ENV)
                )
            except Exception:
                dotenv_load_failed = True
                credential = None
            if dotenv_load_failed:
                # Raise outside the handler so even ``__context__`` cannot retain
                # a third-party parser exception containing sensitive input.
                raise EverOSCredentialLoadError()
            if credential is not None:
                return credential

    raise MissingEverOSCredentialError()


def create_everos_client(
    *,
    environ: Mapping[str, str] | None = None,
    use_dotenv: bool = True,
    dotenv_path: str | Path | None = None,
    dotenv_loader: DotenvLoader | None = None,
    client_factory: ClientFactory | None = None,
) -> EverOSSearchClient:
    """Construct the official 1.0.0 facade with its documented v2 defaults.

    The facade's production host remains untouched.  ``default`` app/project
    scope and the documented 60-second timeout are explicit so injected test
    factories can verify the construction contract without a network call.
    """

    credential = load_everos_api_key(
        environ=environ,
        use_dotenv=use_dotenv,
        dotenv_path=dotenv_path,
        dotenv_loader=dotenv_loader,
    )
    factory = client_factory or EverOS
    client_creation_failed = False
    try:
        client = factory(
            api_key=credential,
            app_id=DEFAULT_APP_ID,
            project_id=DEFAULT_PROJECT_ID,
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except Exception:
        client_creation_failed = True
        client = None
    if client_creation_failed:
        # Raise outside the handler so no constructor exception (and therefore
        # no exception text containing the key) remains attached as context.
        raise EverOSClientCreationError()
    return client


def probe_everos_connection(
    client: EverOSSearchClient,
    *,
    user_id: str = DEFAULT_PROBE_USER_ID,
) -> EverOSConnectionStatus:
    """Check EverOS connectivity with a non-mutating v2 search.

    A keyword search keeps the probe small and supplies the v2-required owner
    scope.  Search results are discarded.  Failures return a fixed status and
    intentionally omit exception type, message, request data, and credentials.
    """

    try:
        client.search(
            DEFAULT_PROBE_QUERY,
            user_id=user_id,
            method="keyword",
            top_k=1,
            include_profile=False,
            enable_llm_rerank=False,
        )
    except Exception:
        return EverOSConnectionStatus(
            connected=False,
            code="search_failed",
        )
    return EverOSConnectionStatus(
        connected=True,
        code="connected",
    )


__all__ = [
    "DEFAULT_APP_ID",
    "DEFAULT_DOTENV_FILENAME",
    "DEFAULT_PROBE_QUERY",
    "DEFAULT_PROBE_USER_ID",
    "DEFAULT_PROJECT_ID",
    "DEFAULT_TIMEOUT_SECONDS",
    "EVEROS_API_KEY_ENV",
    "EverOSClientCreationError",
    "EverOSConnectionStatus",
    "EverOSCredentialError",
    "EverOSCredentialLoadError",
    "EverOSSearchClient",
    "MissingEverOSCredentialError",
    "create_everos_client",
    "load_everos_api_key",
    "probe_everos_connection",
]
