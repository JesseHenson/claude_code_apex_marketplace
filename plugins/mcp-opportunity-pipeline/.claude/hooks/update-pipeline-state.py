#!/usr/bin/env python3
"""
Post-response hook to scan outputs/ and update pipeline-state.json.

Scans the outputs/ directory for project folders, infers current stage
from file presence, and updates the pipeline-state.json tracking file.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Find the plugin root (parent of .claude/)
SCRIPT_DIR = Path(__file__).parent
PLUGIN_ROOT = SCRIPT_DIR.parent.parent
OUTPUTS_DIR = PLUGIN_ROOT / "outputs"
STATE_FILE = PLUGIN_ROOT / "pipeline-state.json"

# System folders to ignore (not project folders)
SYSTEM_FOLDERS = {
    "discover", "analyze", "validate", "spec",
    "build", "qa", "package", "publish"
}

# File detection -> Stage inference
# Order matters: check most advanced stages first
STAGE_INFERENCE = [
    (["package/"], "make", "package"),
    (["qa-report.json"], "make", "qa"),
    (["build/"], "make", "build"),
    (["walkthrough.md"], "refine", "walkthrough"),
    (["spec.md", "critique.md"], "refine", "critique-spec"),
    (["spec.md"], "refine", "spec"),
    (["draft.md", "critique.md"], "refine", "critique-draft"),
    (["draft.md"], "refine", "draft"),
    (["pre-check.md"], "ideate", "pre-check"),
]


def load_state() -> dict:
    """Load existing pipeline state or create new."""
    if STATE_FILE.exists():
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {
        "version": "1.0.0",
        "lastUpdated": None,
        "projects": {},
        "summary": {
            "totalProjects": 0,
            "byStatus": {"active": 0, "completed": 0, "killed": 0, "pivoted": 0},
            "byPhase": {"ideate": 0, "refine": 0, "make": 0, "ship": 0}
        }
    }


def get_project_folders() -> list[str]:
    """Get list of project folders (exclude system folders)."""
    if not OUTPUTS_DIR.exists():
        return []

    folders = []
    for item in OUTPUTS_DIR.iterdir():
        if item.is_dir() and item.name not in SYSTEM_FOLDERS and not item.name.startswith("."):
            folders.append(item.name)
    return folders


def check_files(project_dir: Path) -> dict[str, bool]:
    """Check which standard files exist in project folder."""
    files_to_check = [
        "pre-check.md",
        "draft.md",
        "spec.md",
        "critique.md",
        "walkthrough.md",
        "decisions.json",
        "qa-report.json"
    ]
    dirs_to_check = ["build/", "package/"]

    result = {}
    for f in files_to_check:
        result[f] = (project_dir / f).exists()
    for d in dirs_to_check:
        result[d] = (project_dir / d.rstrip("/")).is_dir()

    return result


def infer_stage(files: dict[str, bool]) -> tuple[str, str]:
    """Infer current phase and stage from file presence."""
    for required_files, phase, stage in STAGE_INFERENCE:
        all_present = all(files.get(f, False) for f in required_files)
        if all_present:
            return phase, stage
    return "ideate", "discovered"


def slug_to_display_name(slug: str) -> str:
    """Convert slug to display name."""
    return slug.replace("-", " ").title().replace("Mcp", "MCP")


def scan_projects(existing_state: dict) -> dict:
    """Scan outputs/ and merge with existing state."""
    projects = existing_state.get("projects", {})
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    scanned_slugs = set()

    for slug in get_project_folders():
        scanned_slugs.add(slug)
        project_dir = OUTPUTS_DIR / slug
        files = check_files(project_dir)
        phase, stage = infer_stage(files)

        if slug in projects:
            # Update existing project
            proj = projects[slug]
            proj["files"] = files
            proj["currentPhase"] = phase
            proj["currentStage"] = stage
            proj["updatedAt"] = now
        else:
            # New project discovered
            projects[slug] = {
                "slug": slug,
                "displayName": slug_to_display_name(slug),
                "status": "active",
                "currentPhase": phase,
                "currentStage": stage,
                "files": files,
                "scores": {
                    "opportunityScore": None,
                    "validationScore": None,
                    "estimatedRevenue": None
                },
                "lastDecision": None,
                "lineage": {
                    "originProject": None,
                    "pivotedTo": [],
                    "pivotHistory": []
                },
                "createdAt": now,
                "updatedAt": now
            }

    # Keep projects that were in state but not scanned
    # (they might be archived or in a different location)

    return projects


def compute_summary(projects: dict) -> dict:
    """Compute summary statistics."""
    summary = {
        "totalProjects": len(projects),
        "byStatus": {"active": 0, "completed": 0, "killed": 0, "pivoted": 0},
        "byPhase": {"ideate": 0, "refine": 0, "make": 0, "ship": 0}
    }

    for proj in projects.values():
        status = proj.get("status", "active")
        phase = proj.get("currentPhase", "ideate")

        if status in summary["byStatus"]:
            summary["byStatus"][status] += 1
        if phase in summary["byPhase"]:
            summary["byPhase"][phase] += 1

    return summary


def save_state(state: dict) -> None:
    """Atomically save state (write to temp, then rename)."""
    temp_file = STATE_FILE.with_suffix(".json.tmp")
    with open(temp_file, "w") as f:
        json.dump(state, f, indent=2)
    temp_file.rename(STATE_FILE)


def main():
    """Main entry point."""
    try:
        # Load existing state
        state = load_state()

        # Scan and merge projects
        state["projects"] = scan_projects(state)

        # Update summary
        state["summary"] = compute_summary(state["projects"])

        # Update timestamp
        state["lastUpdated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        # Save atomically
        save_state(state)

        # Output for hook logging (optional)
        print(f"[pipeline-state] Updated {len(state['projects'])} projects")

    except Exception as e:
        print(f"[pipeline-state] Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
