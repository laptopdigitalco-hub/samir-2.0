# Code Review

Run a full code review of this repository, then draft an email summary and post a GitHub comment.

## Before starting

Confirm with fttah: "Running code review — I will read all repo files. Proceed?"
Wait for confirmation. Do not continue until confirmed.

## Steps

### 1. Collect the file inventory

```bash
python equipment/code_review_agent.py
```

This saves a snapshot to `equipment/.tmp/snapshot-YYYY-MM-DD.txt`. Note the file list printed to stdout.

### 2. Read and review the repo

Use your Read and Glob tools to read:
- All files in `equipment/` (Python scripts)
- All files in `blueprints/` (SOPs)
- All files in `intel/` (context)
- `CLAUDE.md`, `.claude/rules/`, `.env.example`

Review against these five criteria:
1. **Code quality** — are the Python scripts clean, safe, and maintainable?
2. **Blueprint completeness** — are the SOPs clear and executable?
3. **System coherence** — does everything hold together? Gaps or contradictions?
4. **Security** — any hardcoded secrets, exposed credentials, or unsafe patterns?
5. **Gaps** — what is missing or inconsistent?

Produce a structured review with:
- Score (1–10)
- One-sentence headline verdict
- Strengths (bullet list)
- Issues table: severity | file | finding | fix
- Email summary (3–4 paragraphs, plain English, no markdown)
- GitHub comment (markdown, with headers, bullets, issues table)

### 3. Draft the email

Use Gmail to create a draft:
- **To:** fttah.whm@gmail.com
- **Subject:** Code Review — samir-2.0 — [today's date]
- **Body:** the plain English email summary

Save as draft only. Never send.

### 4. Post the GitHub comment

Check for open pull requests:
```bash
gh pr list --repo laptopdigitalco-hub/samir-2.0 --json number --limit 1
```

If an open PR exists — post to it:
```bash
gh pr comment <number> --repo laptopdigitalco-hub/samir-2.0 --body "<github_comment>"
```

If no open PR — post as a commit comment on HEAD:
```bash
gh api repos/laptopdigitalco-hub/samir-2.0/commits/$(git rev-parse HEAD)/comments -f body="<github_comment>"
```

If `gh` is not authenticated — skip GitHub and note it in the report.

### 5. Report back

```
Review complete.

Score: X/10
[headline]

Top issues:
- [severity] file: finding
- [severity] file: finding
- [severity] file: finding

Email draft saved. GitHub comment posted to [PR #X / commit SHA].
```

## Failure handling

| Failure | Action |
|---------|--------|
| Script error | Report error, continue with manual file reading |
| Gmail draft fails | Paste email body in chat instead |
| GitHub post fails | Save comment to `briefings/review-[date].md` and note it |
