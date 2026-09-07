# Project Documentation

## Start here

- [Effect Design Thinking](architecture/EFFECT_DESIGN_THINKING.md) explains the
  architecture and its reasoning.
- [Feature Implementation Guide](architecture/FEATURE_IMPLEMENTATION_GUIDE.md)
  is the step-by-step development playbook.
- [Testing Effect Graphs](architecture/TESTING_EFFECT_GRAPHS.md) explains how
  to prove the same graph with test requirements.
- [User Creation Walkthrough](architecture/WALKTHROUGH_USER_CREATION.md) traces
  one real production and test graph end to end.
- [Migration Guide](architecture/MIGRATION_GUIDE.md) covers safe conversion of
  legacy modules.
- [Architecture Decisions](architecture/decisions/README.md) records decisions
  that should not be rediscovered in every pull request.

## Operational references

- [Changelog](CHANGELOG.md)
- [Release notes v0.1.4](RELEASE_NOTES_v0.1.4.md)
- [Short architecture policy](DESIGN_THINKING.md)

## Agent workflows

Project-scoped skills are stored under `.agents/skills/`:

| Skill | Use it when |
| --- | --- |
| `design-effect-graph` | A problem needs shapes and an A/E/R call graph |
| `implement-effect-feature` | Building or migrating an Effect feature |
| `review-effect-architecture` | Reviewing code for graph and layer violations |

The skills are intentionally short workflows. These documents are the source of
truth for explanations and examples.

## Suggested learning paths

### New contributor

1. Read Effect Design Thinking.
2. Follow the user-creation walkthrough.
3. Read Testing Effect Graphs.
4. make a small change using the Feature Implementation Guide.

### Coding agent

1. Read `AGENTS.md`.
2. Use `design-effect-graph` before editing.
3. Use `implement-effect-feature` to make the change.
4. Apply `review-effect-architecture` before reporting completion.

### Reviewer

1. Read ADR-0001.
2. Reconstruct A/E/R from the changed service.
3. Compare production and test graphs.
4. Run `bun run check` and the architecture search gates.
