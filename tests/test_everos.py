from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

import pytest
from everos_cloud import EverOS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cost_knee.everos import (
    DEFAULT_APP_ID,
    DEFAULT_DOTENV_FILENAME,
    DEFAULT_PROBE_QUERY,
    DEFAULT_PROBE_USER_ID,
    DEFAULT_PROJECT_ID,
    DEFAULT_TIMEOUT_SECONDS,
    EVEROS_API_KEY_ENV,
    EverOSClientCreationError,
    EverOSCredentialLoadError,
    MissingEverOSCredentialError,
    create_everos_client,
    load_everos_api_key,
    probe_everos_connection,
)


SENTINEL_SECRET = "everos-test-secret-DO-NOT-EXPOSE"


def _rendered_status(status: Any) -> str:
    return repr(status) + json.dumps(status.to_dict(), sort_keys=True)


def test_missing_credential_is_typed_and_secret_free(tmp_path: Path) -> None:
    with pytest.raises(MissingEverOSCredentialError) as captured:
        load_everos_api_key(
            environ={},
            dotenv_path=tmp_path / "missing.env",
        )

    assert EVEROS_API_KEY_ENV in str(captured.value)
    assert SENTINEL_SECRET not in str(captured.value)
    assert SENTINEL_SECRET not in repr(captured.value)


def test_blank_process_credential_is_missing_and_shadows_dotenv(
    tmp_path: Path,
) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.touch()

    def must_not_read_dotenv(_path: Path) -> dict[str, str]:
        raise AssertionError("dotenv must not be read when the process key exists")

    with pytest.raises(MissingEverOSCredentialError):
        load_everos_api_key(
            environ={EVEROS_API_KEY_ENV: " \t\n "},
            dotenv_path=dotenv_path,
            dotenv_loader=must_not_read_dotenv,
        )


def test_process_environment_takes_precedence_without_reading_dotenv(
    tmp_path: Path,
) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.touch()

    def must_not_read_dotenv(_path: Path) -> dict[str, str]:
        raise AssertionError("process environment must take precedence")

    assert (
        load_everos_api_key(
            environ={EVEROS_API_KEY_ENV: f"  {SENTINEL_SECRET}  "},
            dotenv_path=dotenv_path,
            dotenv_loader=must_not_read_dotenv,
        )
        == SENTINEL_SECRET
    )


def test_python_dotenv_is_an_optional_non_mutating_fallback(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.write_text(
        f'{EVEROS_API_KEY_ENV}="{SENTINEL_SECRET}"\n',
        encoding="utf-8",
    )
    monkeypatch.delenv(EVEROS_API_KEY_ENV, raising=False)

    assert (
        load_everos_api_key(environ={}, dotenv_path=dotenv_path)
        == SENTINEL_SECRET
    )
    assert EVEROS_API_KEY_ENV not in os.environ


def test_default_dotenv_path_is_the_current_project_directory(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    (tmp_path / DEFAULT_DOTENV_FILENAME).write_text(
        f"{EVEROS_API_KEY_ENV}={SENTINEL_SECRET}\n",
        encoding="utf-8",
    )
    monkeypatch.chdir(tmp_path)

    assert load_everos_api_key(environ={}) == SENTINEL_SECRET


def test_dotenv_can_be_disabled_without_reading_it(tmp_path: Path) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.touch()

    def must_not_read_dotenv(_path: Path) -> dict[str, str]:
        raise AssertionError("disabled dotenv fallback must not be read")

    with pytest.raises(MissingEverOSCredentialError):
        load_everos_api_key(
            environ={},
            use_dotenv=False,
            dotenv_path=dotenv_path,
            dotenv_loader=must_not_read_dotenv,
        )


def test_blank_dotenv_credential_is_missing(tmp_path: Path) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.touch()

    with pytest.raises(MissingEverOSCredentialError):
        load_everos_api_key(
            environ={},
            dotenv_path=dotenv_path,
            dotenv_loader=lambda _path: {EVEROS_API_KEY_ENV: "  "},
        )


def test_dotenv_loader_error_is_redacted(tmp_path: Path) -> None:
    dotenv_path = tmp_path / ".env"
    dotenv_path.touch()

    def broken_loader(_path: Path) -> dict[str, str]:
        raise RuntimeError(f"parser leaked {SENTINEL_SECRET}")

    with pytest.raises(EverOSCredentialLoadError) as captured:
        load_everos_api_key(
            environ={},
            dotenv_path=dotenv_path,
            dotenv_loader=broken_loader,
        )

    assert SENTINEL_SECRET not in str(captured.value)
    assert SENTINEL_SECRET not in repr(captured.value)
    assert captured.value.__cause__ is None
    assert captured.value.__context__ is None


def test_client_factory_receives_official_v2_defaults() -> None:
    calls: list[dict[str, Any]] = []

    class FakeClient:
        pass

    fake_client = FakeClient()

    def factory(**kwargs: Any) -> FakeClient:
        calls.append(kwargs)
        return fake_client

    client = create_everos_client(
        environ={EVEROS_API_KEY_ENV: SENTINEL_SECRET},
        use_dotenv=False,
        client_factory=factory,
    )

    assert client is fake_client
    assert calls == [
        {
            "api_key": SENTINEL_SECRET,
            "app_id": DEFAULT_APP_ID,
            "project_id": DEFAULT_PROJECT_ID,
            "timeout": DEFAULT_TIMEOUT_SECONDS,
        }
    ]
    assert SENTINEL_SECRET not in repr(client)


def test_official_facade_construction_is_local_and_repr_is_redacted() -> None:
    client = create_everos_client(
        environ={EVEROS_API_KEY_ENV: SENTINEL_SECRET},
        use_dotenv=False,
    )
    try:
        assert isinstance(client, EverOS)
        assert SENTINEL_SECRET not in repr(client)
    finally:
        client.close()


def test_client_factory_errors_do_not_expose_the_credential() -> None:
    def broken_factory(**kwargs: Any) -> None:
        raise RuntimeError(f"constructor received {kwargs['api_key']}")

    with pytest.raises(EverOSClientCreationError) as captured:
        create_everos_client(
            environ={EVEROS_API_KEY_ENV: SENTINEL_SECRET},
            use_dotenv=False,
            client_factory=broken_factory,
        )

    assert SENTINEL_SECRET not in str(captured.value)
    assert SENTINEL_SECRET not in repr(captured.value)
    assert captured.value.__cause__ is None
    assert captured.value.__context__ is None


def test_search_probe_success_discards_response_and_returns_safe_status() -> None:
    class SuccessfulClient:
        def __init__(self) -> None:
            self.calls: list[tuple[str, dict[str, Any]]] = []

        def search(self, query: str, **kwargs: Any) -> dict[str, str]:
            self.calls.append((query, kwargs))
            return {"untrusted_response": SENTINEL_SECRET}

    client = SuccessfulClient()
    status = probe_everos_connection(client)

    assert status.to_dict() == {
        "connected": True,
        "code": "connected",
        "provider": "everos-cloud",
        "api_version": "v2",
        "operation": "search",
    }
    assert client.calls == [
        (
            DEFAULT_PROBE_QUERY,
            {
                "user_id": DEFAULT_PROBE_USER_ID,
                "method": "keyword",
                "top_k": 1,
                "include_profile": False,
                "enable_llm_rerank": False,
            },
        )
    ]
    assert SENTINEL_SECRET not in _rendered_status(status)


def test_search_probe_failure_redacts_exception_details() -> None:
    class FailingClient:
        def search(self, query: str, **kwargs: Any) -> None:
            raise RuntimeError(f"transport leaked {SENTINEL_SECRET}")

    status = probe_everos_connection(FailingClient())

    assert status.to_dict() == {
        "connected": False,
        "code": "search_failed",
        "provider": "everos-cloud",
        "api_version": "v2",
        "operation": "search",
    }
    assert SENTINEL_SECRET not in _rendered_status(status)
