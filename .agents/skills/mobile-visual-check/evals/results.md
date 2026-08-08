# Mobile visual check eval results

Evaluated: 2026-08-08

## Method and limitation

- An independent read-only reviewer classified each query from the final frontmatter description
  before comparing it with `should_trigger`.
- A separate independent read-only reviewer graded each workflow expectation against the final
  `SKILL.md`, current tascal stories, preview, and package scripts.
- Trigger results are a **description-classification proxy**, not measured Codex runtime skill
  invocation. A nested ephemeral `codex exec` attempt was rejected by the managed sandbox before
  prompt execution, so it is not counted and its transcript is not retained.
- JSON shape, positive/negative balance, frontmatter, repository paths, Markdown formatting, and
  whitespace are also checked locally.

## Final trigger classification proxy

The full prompts and expected labels are in `trigger-cases.json`.

|  ID | Expected   | Reviewer decision | Match | Evidence                                                              |
| --: | ---------- | ----------------- | ----- | --------------------------------------------------------------------- |
|   1 | trigger    | trigger           | yes   | Mobile component spacing and iPhone visual evidence.                  |
|   2 | trigger    | trigger           | yes   | Design-token color change can affect Mobile consumers.                |
|   3 | trigger    | trigger           | yes   | Liquid Glass and compact-device layout are visual concerns.           |
|   4 | trigger    | trigger           | yes   | Post-upgrade Mobile story rendering explicitly needs visual evidence. |
|   5 | trigger    | trigger           | yes   | Mobile component overlap and dark mode are visual concerns.           |
|   6 | no trigger | no trigger        | yes   | Mobile API error mapping and tests are non-visual.                    |
|   7 | no trigger | no trigger        | yes   | Storybook upgrade implementation and build checks are non-visual.     |
|   8 | no trigger | no trigger        | yes   | API, CLI, and Web schema/type changes do not affect Mobile UI.        |
|   9 | no trigger | no trigger        | yes   | Hook logic and Jest coverage are non-visual.                          |
|  10 | no trigger | no trigger        | yes   | Dependency and build verification alone are non-visual.               |

Result: **10 / 10 matched; no ambiguous case**.

## Final workflow grading

The full prompts and expectations are in `evals.json`.

| Eval | Expectation                             | Result | Evidence in final skill                                                                                    |
| ---: | --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
|    1 | Scope Mobile visual change              | pass   | Description and Scope gate include Mobile component/style changes.                                         |
|    1 | Select stories from diff/imports        | pass   | Step 2 follows colocated stories, render tree, and consumers.                                              |
|    1 | Cover themes, sizes, related states     | pass   | Step 3 covers both themes/device classes and named related states without an unsupported Cartesian matrix. |
|    1 | Use tascal Storybook and Simulator      | pass   | Step 4 runs `storybook`, uses Expo `shift+i`, and verifies model/UDID.                                     |
|    1 | Structured evidence report              | pass   | Step 8 requires story, device, theme, result, evidence, and remaining issues.                              |
|    2 | Trace design-token consumers            | pass   | Step 2 includes token importers and representative stories.                                                |
|    2 | Record themes and device classes        | pass   | Steps 2–3 require light/dark and compact/standard in the matrix.                                           |
|    2 | Check native glass and fallback         | pass   | Step 6 uses Reduce Transparency and supported/unsupported runtimes.                                        |
|    2 | Treat missing coverage/tools as blocker | pass   | Steps 3 and 7 prohibit a pass without required coverage/evidence.                                          |
|    3 | Select button state stories             | pass   | Colocated selection plus named states covers Empty, MultipleTasks, and Dark.                               |
|    3 | Follow tool fallback order              | pass   | Step 7 orders assisted selection, `simctl`, and alternate images.                                          |
|    3 | Never pass without visual evidence      | pass   | Completion criteria and Step 7 explicitly prohibit it.                                                     |
|    3 | Report blocked status and gaps          | pass   | Steps 7–8 define statuses and Remaining issues.                                                            |

Result: **13 / 13 passed**.

## Iteration record

| Draft   | Trigger proxy | Workflow | Material reviewer feedback                                                                                   |
| ------- | ------------: | -------: | ------------------------------------------------------------------------------------------------------------ |
| Initial |       10 / 10 |  13 / 13 | Clarify matrix, UDID targeting, safe-area limitation, Liquid Glass fallback, statuses, and evidence sharing. |
| Final   |       10 / 10 |  13 / 13 | Use Expo `shift+i`; expose case-level proxy evidence; pair upgrade-only and post-upgrade visual boundaries.  |

The final draft uses a risk-based matrix, records the fixed 390×844 Storybook safe-area limitation,
defines native/fallback and pass/partial/blocked rules, and selects compact and standard Simulators
explicitly from the Expo Terminal UI. This evidence stays intentionally small and reviewable; no
ephemeral model transcripts or generated benchmark viewer are committed.
