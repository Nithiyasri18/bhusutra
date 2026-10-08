class OfficialVerificationUnavailable(RuntimeError):
    pass


class OfficialLandRecordsAdapter:
    """Adapter contract for a government land-record provider."""

    def verify(self, fields: dict[str, str]) -> dict:
        raise NotImplementedError


class UnconfiguredLandRecordsAdapter(OfficialLandRecordsAdapter):
    def verify(self, fields: dict[str, str]) -> dict:
        raise OfficialVerificationUnavailable("Official verification service unavailable")


PROVIDERS = {
    "DILRMP": UnconfiguredLandRecordsAdapter,
    "LRMS": UnconfiguredLandRecordsAdapter,
    "Bhulekh": UnconfiguredLandRecordsAdapter,
    "state_land_records": UnconfiguredLandRecordsAdapter,
}


def verify_with_official_provider(provider: str, fields: dict[str, str]) -> dict:
    adapter_type = PROVIDERS.get(provider)
    if adapter_type is None:
        raise OfficialVerificationUnavailable("Official verification service unavailable")
    return adapter_type().verify(fields)
