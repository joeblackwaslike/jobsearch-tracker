---
name: using-beads
description: Use bd (beads) for issue tracking. Trigger when starting work, completing tasks, discovering new work, or ending a session.
---

# Using bd (beads) for Issue Tracking

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

## Why bd?

- **Dependency-aware**: Track blockers and relationships between issues
- **Git-friendly**: Dolt-powered version control with native sync
- **Agent-optimized**: JSON output, ready work detection, discovered-from links
- **Prevents confusion**: Single source of truth for all work

## When to Use This Skill

1. **Starting a session** — Check for ready work
2. **Completing a task** — Close the issue
3. **Discovering new work** — Create linked issues
4. **Ending a session** — Run the "Landing the Plane" workflow

---

## 1. Starting a Session: Check Ready Work

**Before asking "what should I work on?"**, check for unblocked issues:

```bash
bd ready --json
```

**Output format:**

```json
[
  {
    "id": "bd-42",
    "title": "Add email validation",
    "type": "task",
    "priority": 1,
    "created": "2025-03-16T10:00:00Z"
  }
]
```

**If work is available:**

1. Claim it atomically:

   ```bash
   bd update bd-42 --claim --json
   ```

2. Start working on it

**If no ready work:**

- Check if you need to create a new issue
- Ask the user what they want to work on
- Create an issue for the new work

---

## 2. Creating New Issues

**Syntax:**

```bash
bd create "Issue title" --description="Detailed context" -t TYPE -p PRIORITY --json
```

**Issue Types:**

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

**Priorities:**

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

**Example:**

```bash
bd create "Add markdown linting" --description="Install markdownlint-cli and add lint:md script" -t task -p 1 --json
```

---

## 3. Discovering New Work During Implementation

**When you find a bug, missing feature, or technical debt:**

Create a linked issue with `discovered-from` dependency:

```bash
bd create "Fix null pointer in getUserProfile" \
  --description="Found during bd-42: getUserProfile crashes when user has no email" \
  -t bug \
  -p 1 \
  --deps discovered-from:bd-42 \
  --json
```

**The `discovered-from` link:**

- Documents that bd-123 was found while working on bd-42
- Helps track scope creep
- Creates audit trail for discoveries

---

## 4. Completing Work: Close the Issue

**When you've finished implementing, testing, and committing:**

```bash
bd close bd-42 --reason "Completed: added email validation with tests" --json
```

**Before closing, verify:**

- ✅ Tests pass
- ✅ Code committed
- ✅ Documentation updated
- ✅ No remaining work for this issue

**If work is incomplete:**

Update status instead of closing:

```bash
bd update bd-42 --status in-progress --json
```

---

## 5. Ending a Session: Landing the Plane

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

### MANDATORY WORKFLOW:

1. **File issues for remaining work**

   Create issues for anything that needs follow-up:

   ```bash
   bd create "Finish XYZ" --description="Still need to..." -t task -p 2 --json
   ```

2. **Run quality gates** (if code changed)

   ```bash
   pnpm test
   pnpm lint:check
   pnpm type
   pnpm build
   ```

3. **Update issue status**

   Close finished work:

   ```bash
   bd close bd-42 --reason "Completed" --json
   ```

   Update in-progress items:

   ```bash
   bd update bd-43 --status in-progress --json
   ```

4. **PUSH TO REMOTE** (MANDATORY)

   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```

5. **Clean up**

   ```bash
   git stash clear  # If you used stash
   git remote prune origin  # Clean remote-tracking branches
   ```

6. **Verify**

   ```bash
   git status  # Should show "nothing to commit, working tree clean"
   git log origin/main..HEAD  # Should be empty (all commits pushed)
   ```

7. **Hand off**

   Provide context for next session:
   - What was completed
   - What's in progress
   - Any blockers or decisions needed

---

## Critical Rules

- ✅ **Use bd for ALL task tracking**
- ✅ **Always use `--json` flag** for programmatic use
- ✅ **Link discovered work** with `discovered-from` dependencies
- ✅ **Check `bd ready`** before asking "what should I work on?"
- ✅ **Push to remote** before ending session
- ❌ **Do NOT create markdown TODO lists**
- ❌ **Do NOT use external issue trackers**
- ❌ **Do NOT duplicate tracking systems**
- ❌ **NEVER say "ready to push when you are"** — YOU must push
- ❌ **Work is NOT complete until `git push` succeeds**

---

## Quick Reference

**Check ready work:**

```bash
bd ready --json
```

**Claim work:**

```bash
bd update <id> --claim --json
```

**Create issue:**

```bash
bd create "Title" --description="Details" -t TYPE -p PRIORITY --json
```

**Create discovered work:**

```bash
bd create "Title" --description="Details" -t TYPE -p PRIORITY --deps discovered-from:PARENT_ID --json
```

**Close issue:**

```bash
bd close <id> --reason "Reason" --json
```

**Sync with remote:**

```bash
bd dolt push
bd dolt pull
```

---

## Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

---

## For More Details

See:

- `README.md` in the bd repository
- `docs/QUICKSTART.md` in the bd repository
- bd CLI help: `bd --help`
