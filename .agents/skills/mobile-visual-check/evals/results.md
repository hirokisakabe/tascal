# Mobile visual check eval results

Evaluated: 2026-08-08

## Method

- Trigger evaluation: an independent read-only agent classified all queries from the
  `SKILL.md` description before comparing its decisions with `should_trigger`.
- Workflow evaluation: a separate independent read-only agent graded every expectation in
  `evals.json` against the skill instructions and the current tascal Storybook files.
- Static validation: JSON shape, positive/negative balance, frontmatter, repository paths,
  Markdown formatting, and whitespace checks are verified locally.
- A nested ephemeral `codex exec` attempt could not initialize its app-server inside the
  managed sandbox. This was an evaluator-harness limitation before prompt execution, so it is
  not counted as a skill result and no bulky transcript is retained.

## Iteration 1

| Evaluation             |  Result | Notes                                                                                  |
| ---------------------- | ------: | -------------------------------------------------------------------------------------- |
| Trigger classification | 10 / 10 | Five visual Mobile prompts triggered; five near-miss non-visual/setup prompts did not. |
| Workflow expectations  | 13 / 13 | All three representative workflows were explicitly covered.                            |

The reviewers identified useful execution ambiguities despite the passing expectations:

- compact / standard coverage conflicted between the completion criteria and matrix guidance;
- `expo start --ios` does not target a specific Simulator UDID;
- Storybook safe-area metrics are fixed at 390×844;
- Liquid Glass native/fallback reproduction and partial/blocked status needed sharper rules;
- local screenshot paths alone are not durable PR evidence.

## Iteration 2 changes

- Require the matrix to cover both device classes and both themes, while combining states only
  where the diff's size, color, contrast, or native-material concern makes that combination
  relevant. This avoids an unsupported Cartesian product of current stories.
- Require verification of the actual Simulator model/UDID and block when target selection is
  ambiguous.
- Record fixed safe-area metrics as a limitation when safe area is in scope.
- Define native/fallback checks using the iOS Reduce Transparency setting and supported runtime.
- Define pass, partial, and blocked boundaries and explain how to share screenshot evidence.
- Clarify the formerly ambiguous positive badge prompt with explicit Mobile component context.

The persisted eval inputs remain intentionally small: they cover the issue's representative
Mobile component, design-token/native, unavailable-tool, and non-UI boundaries without storing
ephemeral model transcripts or benchmark artifacts.
