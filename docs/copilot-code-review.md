# Code review with GitHub Copilot

This repository uses [GitHub Copilot's code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review)
as a **first pass on pull requests**. It does not replace a human review — a
maintainer approves every merge — but it catches formula, consistency and
housekeeping issues in minutes instead of days.

## Prerequisites

- A GitHub account with Copilot access (Copilot Pro, Pro+, Business, or
  Enterprise). In an organization, an owner can enable review access for
  members without individual licenses.
- Nothing to install locally: reviews run on GitHub's infrastructure
  (GitHub Actions) and the comments appear on the pull request itself.

## One-time setup (already done in this repo)

- `.github/copilot-instructions.md` tells the reviewer what this repository
  is and which rules to enforce (cited sources, generated files, permanent
  voicing ids, the open-source scope rule). Copilot reads it from the pull
  request's head branch, so changes to it can be tested in the same PR that
  changes it.
- `.github/workflows/copilot-setup-steps.yml` prepares the environment
  (Node 24, `npm ci`) so the reviewer can run the typecheck, tests and data
  formatting checks itself instead of guessing.

## Requesting a review

Reviews are **manual** — requested per pull request, not automatic.

**On github.com:**

1. Open (or create) the pull request.
2. In the right sidebar, find **Reviewers** and click **Request** next to
   **Copilot**.
3. Pick the review effort:
   - **Lite** — a targeted pass for glaring issues; fine for docs-only or
     typo-level PRs.
   - **Balanced** — deeper analysis; use this for anything touching `data/`,
     `schema/` or `src/`.

Comments usually arrive within 30 seconds, labelled **High**, **Medium** or
**Low** severity.

**With the GitHub CLI:**

```sh
gh pr create --reviewer @copilot          # request at creation time
gh pr edit 42 --add-reviewer @copilot     # or on an existing PR
```

**After pushing new commits:** re-request via the re-request button next to
Copilot in the Reviewers menu (a new push resets the previous review).

## What the reviewer checks here

The review instructions in `.github/copilot-instructions.md` are the
contract. In short, every PR should:

- keep `data/` the only hand-written source; never hand-edit `lib/` or
  `reports/`;
- cite a verifiable source for every chord or scale formula, with `quote`
  (cited) or `explanation` (compositional);
- pass the schemas, the canonical formatting, and the tonal cross-checks in
  the tests;
- leave voicing `id`s untouched;
- stay product-independent — nothing may reference Tabsy's own sites or
  routes; this library is for anyone.

## Working with the review

- Fix or refute each comment, then resolve the thread. A comment you disagree
  with is fine to resolve with a short justification — the reviewer is a
  first pass, not the gate.
- Do not reply to Copilot's comments expecting an answer: humans can see the
  replies, but Copilot does not read them. Ask a maintainer instead.
- A Copilot review is a **Comment** review. It does not approve a PR and does
  not count towards branch-protection approvals.

## Limitations

- On re-review it may repeat comments that were already resolved; resolve
  them again or leave a note in the PR description.
- It cannot see conversations outside the PR diff and the instruction files.
- Pushing new commits resets its review state, so request a fresh review on
  the final commit, not on every push.

## Appendix: automatic reviews (not enabled)

An admin can make Copilot review every pull request automatically: repository
**Settings → Copilot → Code review**, enable the review rule and optionally
"Review new pushes". Path-specific review rules can also be added under
`.github/instructions/**/*.instructions.md`. We keep reviews manual for now
so the reviewer's attention goes where a human asks for it.
