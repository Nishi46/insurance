from pathlib import Path
from typing import Literal
import yaml
from pydantic import BaseModel

DEFINITIONS_DIR = Path(__file__).parent / "definitions"


class ProbeTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ProbeDefinition(BaseModel):
    id: str
    category: str
    name: str
    severity: Literal["critical", "high", "medium"]
    turns: list[ProbeTurn]
    expected_behavior: str
    failure_indicators: list[str]
    remediation_template: str


def load_probes(categories: list[str] | None = None) -> list[ProbeDefinition]:
    probes: list[ProbeDefinition] = []
    files = sorted(DEFINITIONS_DIR.glob("*.yaml"))

    for file in files:
        raw = yaml.safe_load(file.read_text())
        for item in raw:
            probe = ProbeDefinition(**item)
            if categories is None or probe.category in categories:
                probes.append(probe)

    return probes
