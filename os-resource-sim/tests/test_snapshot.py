from sim.runner import run_simulation

KEYS = {"t", "running", "ready", "waiting_io", "waiting_mem", "frames",
        "disk_busy", "disk_queue", "cpu_busy", "thrashing", "events"}


def test_snapshot_schema_and_time():
    out = run_simulation("mixed.json")
    snaps = out.result.snapshots
    assert [s["t"] for s in snaps] == list(range(len(snaps)))
    for s in snaps:
        assert set(s) == KEYS
        assert len(s["frames"]) == out.result.config.ram_frames
        assert (s["running"] is None) or isinstance(s["running"], int)
        assert isinstance(s["events"], list)


def test_state_lists_are_disjoint():
    out = run_simulation("memory_hog.json")
    for s in out.result.snapshots:
        groups = [set(s["ready"]), set(s["waiting_io"]), set(s["waiting_mem"])]
        assert sum(len(g) for g in groups) == len(set().union(*groups))


def test_result_is_json_serializable():
    import json
    json.dumps(run_simulation("cpu_heavy.json").to_dict())
