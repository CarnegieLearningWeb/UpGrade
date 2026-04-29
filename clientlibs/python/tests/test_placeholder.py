"""Placeholder test — verifies the package is importable."""

import upgrade_client_lib


def test_package_importable() -> None:
    assert upgrade_client_lib.__version__ == "6.5.0"
