"""Tests for DataService — cache-hit, cache-miss, bypass, and rotation."""

from upgrade_client_lib.data_service import DataService
from upgrade_client_lib.types.enums import ExperimentType, PayloadType
from upgrade_client_lib.types.responses import AssignedCondition, AssignedFactor, ExperimentAssignment, Payload

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def make_assignment(
    site: str = "home",
    target: str = "banner",
    conditions: list[AssignedCondition] | None = None,
    assigned_factor: list[dict[str, AssignedFactor]] | None = None,
    experiment_type: ExperimentType = ExperimentType.SIMPLE,
) -> ExperimentAssignment:
    if conditions is None:
        conditions = [AssignedCondition(id="cond-1", conditionCode="control")]
    return ExperimentAssignment(
        site=site,
        target=target,
        experimentType=experiment_type,
        assignedCondition=conditions,
        assignedFactor=assigned_factor,
    )


def make_payload(value: str = "red") -> Payload:
    return Payload(type=PayloadType.STRING, value=value)


# ---------------------------------------------------------------------------
# Cold-cache behaviour (nothing set yet)
# ---------------------------------------------------------------------------


class TestColdCache:
    def test_get_all_assignments_returns_none(self) -> None:
        ds = DataService()
        assert ds.get_all_assignments() is None

    def test_get_assignment_returns_none(self) -> None:
        ds = DataService()
        assert ds.get_assignment("home", "banner") is None

    def test_get_feature_flags_returns_none(self) -> None:
        ds = DataService()
        assert ds.get_feature_flags() is None

    def test_has_feature_flag_returns_false(self) -> None:
        ds = DataService()
        assert ds.has_feature_flag("dark-mode") is False


# ---------------------------------------------------------------------------
# Assignment cache — set / get
# ---------------------------------------------------------------------------


class TestAssignmentCache:
    def test_set_then_get_all(self) -> None:
        ds = DataService()
        a1 = make_assignment("home", "banner")
        a2 = make_assignment("checkout", "cta")
        ds.set_assignments([a1, a2])
        result = ds.get_all_assignments()
        assert result is not None
        assert len(result) == 2

    def test_get_assignment_hit(self) -> None:
        ds = DataService()
        ds.set_assignments([make_assignment("home", "banner")])
        result = ds.get_assignment("home", "banner")
        assert result is not None
        assert result.site == "home"
        assert result.target == "banner"

    def test_get_assignment_miss(self) -> None:
        ds = DataService()
        ds.set_assignments([make_assignment("home", "banner")])
        assert ds.get_assignment("checkout", "cta") is None

    def test_empty_assignment_list_warms_cache(self) -> None:
        """An empty list is a valid warm cache — server returned no assignments."""
        ds = DataService()
        ds.set_assignments([])
        assert ds.get_all_assignments() == []
        assert ds.get_assignment("home", "banner") is None

    def test_key_uses_pipe_separator(self) -> None:
        """Assignments keyed by '{site}|{target}' — verify lookup consistency."""
        ds = DataService()
        ds.set_assignments([make_assignment("foo|bar", "baz")])
        assert ds.get_assignment("foo|bar", "baz") is not None
        assert ds.get_assignment("foo", "bar") is None

    def test_overwrite_replaces_previous(self) -> None:
        ds = DataService()
        ds.set_assignments([make_assignment("home", "banner")])
        new_assignment = make_assignment(
            "home", "banner",
            conditions=[AssignedCondition(id="cond-new", conditionCode="treatment")],
        )
        ds.set_assignments([new_assignment])
        result = ds.get_assignment("home", "banner")
        assert result is not None
        assert result.assignedCondition[0].conditionCode == "treatment"

    def test_upsert_replaces_matching_assignment_without_dropping_others(self) -> None:
        ds = DataService()
        ds.set_assignments([
            make_assignment("home", "banner"),
            make_assignment("checkout", "cta"),
        ])
        ds.upsert_assignments(
            [
                make_assignment(
                    "home",
                    "banner",
                    conditions=[AssignedCondition(id="cond-new", conditionCode="treatment")],
                )
            ]
        )

        home = ds.get_assignment("home", "banner")
        checkout = ds.get_assignment("checkout", "cta")
        assert home is not None
        assert home.assignedCondition[0].conditionCode == "treatment"
        assert checkout is not None

    def test_upsert_warms_cold_cache(self) -> None:
        ds = DataService()
        ds.upsert_assignments([make_assignment("quiz", "hint")])
        result = ds.get_assignment("quiz", "hint")
        assert result is not None
        assert result.site == "quiz"


# ---------------------------------------------------------------------------
# Feature-flag cache — set / get / has
# ---------------------------------------------------------------------------


class TestFeatureFlagCache:
    def test_set_then_has(self) -> None:
        ds = DataService()
        ds.set_feature_flags(["dark-mode", "new-ui"])
        assert ds.has_feature_flag("dark-mode") is True
        assert ds.has_feature_flag("new-ui") is True

    def test_has_returns_false_for_missing_key(self) -> None:
        ds = DataService()
        ds.set_feature_flags(["dark-mode"])
        assert ds.has_feature_flag("other-flag") is False

    def test_get_feature_flags_returns_all_keys(self) -> None:
        ds = DataService()
        ds.set_feature_flags(["a", "b", "c"])
        result = ds.get_feature_flags()
        assert result is not None
        assert set(result) == {"a", "b", "c"}

    def test_empty_flags_warms_cache(self) -> None:
        """Empty list → warm cache with no flags; has() returns False."""
        ds = DataService()
        ds.set_feature_flags([])
        assert ds.get_feature_flags() == []
        assert ds.has_feature_flag("any") is False

    def test_duplicate_flags_deduplicated(self) -> None:
        ds = DataService()
        ds.set_feature_flags(["a", "a", "b"])
        result = ds.get_feature_flags()
        assert result is not None
        assert len(result) == 2


# ---------------------------------------------------------------------------
# Cache invalidation (simulates re-init / ignore_cache)
# ---------------------------------------------------------------------------


class TestCacheInvalidation:
    def test_clear_resets_assignments_to_cold(self) -> None:
        ds = DataService()
        ds.set_assignments([make_assignment()])
        ds.clear()
        assert ds.get_all_assignments() is None
        assert ds.get_assignment("home", "banner") is None

    def test_clear_resets_flags_to_cold(self) -> None:
        ds = DataService()
        ds.set_feature_flags(["dark-mode"])
        ds.clear()
        assert ds.get_feature_flags() is None
        assert ds.has_feature_flag("dark-mode") is False

    def test_repopulate_after_clear(self) -> None:
        ds = DataService()
        ds.set_assignments([make_assignment("home", "banner")])
        ds.clear()
        ds.set_assignments([make_assignment("checkout", "cta")])
        assert ds.get_assignment("home", "banner") is None
        assert ds.get_assignment("checkout", "cta") is not None

    def test_cache_bypass_pattern(self) -> None:
        """Demonstrates the ignore_cache pattern used by UpgradeClient.

        When ignore_cache=True the caller clears then re-populates; the
        DataService simply reflects that via cold → warm transition.
        """
        ds = DataService()
        fresh_1 = make_assignment(
            "home", "banner",
            conditions=[AssignedCondition(id="c1", conditionCode="control")],
        )
        ds.set_assignments([fresh_1])

        # simulate ignore_cache=True: caller discards cache and re-fetches
        ds.clear()
        assert ds.get_all_assignments() is None  # cold after clear

        fresh_2 = make_assignment(
            "home", "banner",
            conditions=[AssignedCondition(id="c2", conditionCode="treatment")],
        )
        ds.set_assignments([fresh_2])
        result = ds.get_assignment("home", "banner")
        assert result is not None
        assert result.assignedCondition[0].conditionCode == "treatment"


# ---------------------------------------------------------------------------
# Assignment rotation
# ---------------------------------------------------------------------------


class TestRotateAssignment:
    def test_single_condition_unchanged(self) -> None:
        ds = DataService()
        a = make_assignment(conditions=[AssignedCondition(id="c1", conditionCode="control")])
        ds.rotate_assignment(a)
        assert a.assignedCondition[0].conditionCode == "control"

    def test_two_conditions_rotates(self) -> None:
        ds = DataService()
        a = make_assignment(
            conditions=[
                AssignedCondition(id="c1", conditionCode="control"),
                AssignedCondition(id="c2", conditionCode="treatment"),
            ]
        )
        ds.rotate_assignment(a)
        assert a.assignedCondition[0].conditionCode == "treatment"
        assert a.assignedCondition[1].conditionCode == "control"

    def test_three_conditions_full_cycle(self) -> None:
        ds = DataService()
        a = make_assignment(
            conditions=[
                AssignedCondition(id="c1", conditionCode="a"),
                AssignedCondition(id="c2", conditionCode="b"),
                AssignedCondition(id="c3", conditionCode="c"),
            ]
        )
        ds.rotate_assignment(a)
        assert [c.conditionCode for c in a.assignedCondition] == ["b", "c", "a"]
        ds.rotate_assignment(a)
        assert [c.conditionCode for c in a.assignedCondition] == ["c", "a", "b"]
        ds.rotate_assignment(a)
        assert [c.conditionCode for c in a.assignedCondition] == ["a", "b", "c"]

    def test_rotate_also_advances_factor_list(self) -> None:
        ds = DataService()
        f1 = {"color": AssignedFactor(level="red", payload=make_payload("red"))}
        f2 = {"color": AssignedFactor(level="blue", payload=make_payload("blue"))}
        a = make_assignment(
            conditions=[
                AssignedCondition(id="c1", conditionCode="A"),
                AssignedCondition(id="c2", conditionCode="B"),
            ],
            assigned_factor=[f1, f2],
            experiment_type=ExperimentType.FACTORIAL,
        )
        ds.rotate_assignment(a)
        assert a.assignedFactor is not None
        assert a.assignedFactor[0]["color"].level == "blue"
        assert a.assignedFactor[1]["color"].level == "red"

    def test_single_factor_not_rotated(self) -> None:
        """Factor list with one entry should not be touched."""
        ds = DataService()
        f1 = {"color": AssignedFactor(level="red")}
        a = make_assignment(
            conditions=[
                AssignedCondition(id="c1", conditionCode="A"),
                AssignedCondition(id="c2", conditionCode="B"),
            ],
            assigned_factor=[f1],
            experiment_type=ExperimentType.FACTORIAL,
        )
        ds.rotate_assignment(a)
        assert a.assignedFactor is not None
        assert a.assignedFactor[0]["color"].level == "red"

    def test_rotation_mutates_cached_object(self) -> None:
        """rotate_assignment works on the cached reference directly."""
        ds = DataService()
        a = make_assignment(
            conditions=[
                AssignedCondition(id="c1", conditionCode="control"),
                AssignedCondition(id="c2", conditionCode="treatment"),
            ]
        )
        ds.set_assignments([a])
        cached = ds.get_assignment("home", "banner")
        assert cached is not None
        ds.rotate_assignment(cached)
        refetched = ds.get_assignment("home", "banner")
        assert refetched is not None
        assert refetched.assignedCondition[0].conditionCode == "treatment"

    def test_returns_assignment(self) -> None:
        ds = DataService()
        a = make_assignment()
        result = ds.rotate_assignment(a)
        assert result is a


class TestRotateAssignmentsByExperimentId:
    def test_rotates_only_matching_assignments(self) -> None:
        ds = DataService()
        match_assignment = make_assignment(
            site="quiz",
            target="hint",
            conditions=[
                AssignedCondition(id="cond-A", conditionCode="A", experimentId="exp-2"),
                AssignedCondition(id="cond-B", conditionCode="B", experimentId="exp-2"),
            ],
            experiment_type=ExperimentType.SIMPLE,
        )
        non_match_assignment = make_assignment(
            site="home",
            target="banner",
            conditions=[
                AssignedCondition(id="cond-1", conditionCode="control", experimentId="exp-1"),
                AssignedCondition(id="cond-2", conditionCode="treatment", experimentId="exp-1"),
            ],
            experiment_type=ExperimentType.SIMPLE,
        )

        ds.set_assignments([match_assignment, non_match_assignment])
        ds.rotate_assignments_by_experiment_id("exp-2")

        matched = ds.get_assignment("quiz", "hint")
        unchanged = ds.get_assignment("home", "banner")
        assert matched is not None
        assert unchanged is not None
        assert matched.assignedCondition[0].id == "cond-B"
        assert matched.assignedCondition[1].id == "cond-A"
        assert unchanged.assignedCondition[0].id == "cond-1"
        assert unchanged.assignedCondition[1].id == "cond-2"

    def test_noop_when_cache_is_cold(self) -> None:
        ds = DataService()
        ds.rotate_assignments_by_experiment_id("exp-1")
        assert ds.get_all_assignments() is None


# ---------------------------------------------------------------------------
# Instance isolation
# ---------------------------------------------------------------------------


class TestInstanceIsolation:
    def test_two_instances_do_not_share_cache(self) -> None:
        ds1 = DataService()
        ds2 = DataService()
        ds1.set_assignments([make_assignment("home", "banner")])
        assert ds2.get_assignment("home", "banner") is None

    def test_two_instances_flags_independent(self) -> None:
        ds1 = DataService()
        ds2 = DataService()
        ds1.set_feature_flags(["dark-mode"])
        assert ds2.has_feature_flag("dark-mode") is False
