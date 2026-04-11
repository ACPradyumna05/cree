# CREE Judge Pitch Sheet

## One-Line Pitch
CREE is a causality stress test for AI agents and operators: it measures whether they understand hidden system dynamics, not just short-term reward.

## 20-Second Elevator Pitch
Most evaluations overestimate agent capability because they reward surface optimization. CREE creates partially observable incident environments with delayed effects and hidden dependencies, then grades whether decisions actually reflect cause-effect understanding.

## 60-Second Demo Script
1. Paste an incident report.
2. Show generated scenario and mission.
3. Run 4-6 manual actions while narrating why each action is chosen.
4. Show grade and key metrics.
5. Close with practical value: safer agent evaluation and better incident training.

## What To Emphasize
- This is not random action clicking.
- The goal is reasoning quality under hidden state.
- Score plus explanation quality is the real signal.

## Judge FAQ Quick Answers
Q: Is this just a simulator?
A: It is a benchmarked causality simulator with grading logic for decision quality under uncertainty.

Q: Why is this useful?
A: It helps detect brittle policies before real-world deployment and improves incident-response training.

Q: What is technically novel here?
A: Sequence-sensitive hidden rules, delayed effects, and a strict partially observable interaction loop with task-specific scoring.

Q: Can this scale beyond one demo?
A: Yes. New tasks and rule packs can be added to evaluate different domains and failure patterns.
