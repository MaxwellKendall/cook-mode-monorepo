---
name: commit
description: Create a git commit with the project's [prefix] Title format. Analyzes staged/unstaged changes, determines the correct prefix from affected areas, and generates a concise commit message.
user-invocable: true
allowed-tools: Bash(git status), Bash(git diff*), Bash(git log*), Bash(git add*), Bash(git commit*)
---

# Commit Skill

Create commits using the project's commit message format: `[prefix] Title`

## Commit Message Format

```
[prefix] Concise description of the change
```

### Prefix Rules

1. **Single area changed** — use that area as prefix:
   - Apps: `[api]`, `[web]`, `[realtime]`, `[voice-bridge]`, `[worker]`
   - Packages: `[db]`, `[config]`, `[shared]`, `[redis]`, `[vector]`
   - Other: `[mcp]`, `[infra]`, `[ci]`, `[docs]`

2. **Multiple areas changed** — combine prefixes: `[api][web]`, `[db][api]`

3. **Category prefixes** — can precede area prefixes for cross-cutting concerns:
   - `[bug]` — bug fix, e.g. `[bug][web] fix broken login redirect`
   - `[feature]` — new feature, e.g. `[feature] meal planning`
   - `[techdebt]` — cleanup/refactoring, e.g. `[techdebt] remove unused deps`
   - `[deploy]` — deployment-related, e.g. `[config][deploy] add deployment configuration`

### Title Rules

- Start with a **lowercase verb** (add, fix, remove, update, refactor, sync, route, etc.)
- Be concise but descriptive — explain **what changed**, not how
- No trailing period
- If the user provided a description of the change, use it to inform the title

### Body Format

The commit body uses a before/after structure:

```
Prior to these changes, <description of old behavior or state>.

Now with these changes, <description of new behavior or state>.
```

- Both sentences should be concise and informative
- Focus on the **why** and **impact**, not implementation details
- The body is separated from the title by a blank line

## Procedure

1. Run `git status` (never use `-uall`) and `git diff` (staged + unstaged) in parallel to understand changes
2. Run `git log --oneline -5` to see recent commit style for reference
3. Determine the correct prefix(es) from the files changed
4. Draft a commit message following the format above
5. Stage the relevant files by name (avoid `git add -A` or `git add .`)
6. Show the user the proposed commit message and wait for confirmation
7. Create the commit using a HEREDOC:
   ```bash
   git commit -m "$(cat <<'EOF'
   [prefix] description

   Prior to these changes, <old behavior>.

   Now with these changes, <new behavior>.

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```
8. Run `git status` to verify success

## Important

- Never push unless the user explicitly asks
- Never amend unless the user explicitly asks
- Never use `--no-verify`
- If a pre-commit hook fails, fix the issue and create a NEW commit (do not amend)
- Do not stage files that contain secrets (.env, credentials, etc.)
