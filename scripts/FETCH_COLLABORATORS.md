# Fetch Repository Collaborators

A Node.js script that retrieves all collaborators for a GitHub repository and
their permission levels using the [GitHub REST API](https://docs.github.com/en/rest/collaborators/collaborators).

---

## Table of Contents

- [Changes Introduced](#changes-introduced)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Usage](#usage)
- [Output Formats](#output-formats)
- [Error Handling](#error-handling)
- [How It Works](#how-it-works)
- [GitHub Token Scopes](#github-token-scopes)

---

## Changes Introduced

### New Files

| File | Description |
|------|-------------|
| `scripts/fetch-collaborators.js` | Main script – fetches collaborators via the GitHub REST API with pagination, authentication, and error handling. |
| `scripts/FETCH_COLLABORATORS.md` | This documentation file. |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Added `@octokit/rest ^22.0.1` to `dependencies` for the authenticated GitHub API client. |
| `package-lock.json` | Updated automatically by `npm install @octokit/rest`. |

### Summary of Functional Changes

- **Authentication** – reads `GITHUB_TOKEN` from the environment and passes it
  to the Octokit client so every API call is authenticated.
- **Pagination** – uses `octokit.paginate.iterator` with `per_page: 100` to
  walk through all pages of results, ensuring every collaborator is fetched
  even when the list exceeds 30 (GitHub's default page size).
- **Per-collaborator data** – captures `login`, `id`, `type` (User / Bot), and
  the full `permissions` object returned by the API.
- **Output formats** – prints either a **JSON array** (default) or a
  **Markdown table** depending on the `--format` flag.
- **Error handling** – produces clear, actionable messages for the most common
  failure modes: `401 Unauthorized`, `403 Forbidden`, `403 Rate-limit
  exceeded`, and `404 Not Found`.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v18 or newer (ESM support required) |
| npm | v8 or newer |
| GitHub Personal Access Token | with `repo` scope (see [GitHub Token Scopes](#github-token-scopes)) |

---

## Setup

1. **Install dependencies** (run once from the repository root):

   ```bash
   npm install
   ```

   This installs `@octokit/rest` (and all other project dependencies) from
   `package.json`.

2. **Set your GitHub Personal Access Token** as an environment variable:

   ```bash
   # macOS / Linux
   export GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere

   # Windows (Command Prompt)
   set GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere

   # Windows (PowerShell)
   $env:GITHUB_TOKEN = "ghp_yourPersonalAccessTokenHere"
   ```

   > **Never commit your token to source control.**  
   > If you use a `.env` file, make sure `.env` is in `.gitignore`.

---

## Usage

```
node scripts/fetch-collaborators.js <owner/repo> [--format=json|table]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `<owner/repo>` | ✅ | Repository in `owner/repo` format (e.g. `octocat/Hello-World`). |
| `--format=json` | ❌ | Output as a JSON array *(default)*. |
| `--format=table` | ❌ | Output as a Markdown table. |
| `--help` / `-h` | ❌ | Show usage information and exit. |

### Examples

```bash
# JSON output (default)
node scripts/fetch-collaborators.js octocat/Hello-World

# Markdown table output
node scripts/fetch-collaborators.js octocat/Hello-World --format=table

# Show help
node scripts/fetch-collaborators.js --help
```

---

## Output Formats

### JSON (default)

Prints a JSON array where each element represents one collaborator:

```json
[
  {
    "login": "monalisa",
    "id": 1234567,
    "type": "User",
    "permissions": {
      "pull": true,
      "triage": false,
      "push": true,
      "maintain": false,
      "admin": false
    }
  },
  {
    "login": "octobot",
    "id": 9876543,
    "type": "Bot",
    "permissions": {
      "pull": true,
      "triage": false,
      "push": false,
      "maintain": false,
      "admin": false
    }
  }
]
```

### Markdown Table (`--format=table`)

```
Collaborators for **octocat/Hello-World**

| Username | User ID | Type | Permission |
|----------|---------|------|------------|
| monalisa | 1234567 | User | push       |
| octobot  | 9876543 | Bot  | pull       |
```

The **Permission** column reflects the *highest* privilege level granted, evaluated in this order: `admin` → `maintain` → `push` → `triage` → `pull`.

---

## Error Handling

| HTTP Status | Cause | Message |
|-------------|-------|---------|
| `401 Unauthorized` | Token is missing, expired, or malformed. | Prompts you to check `GITHUB_TOKEN` and its scopes. |
| `403 Forbidden` | Token lacks permission to list collaborators. | Advises adding the `repo` scope to the token. |
| `403 Rate Limit` | GitHub API rate limit reached (detected via `x-ratelimit-remaining: 0` header). | Shows the exact time the rate limit resets. |
| `404 Not Found` | Repository does not exist or the token cannot see it. | Confirms the `owner/repo` string and token access. |
| Other errors | Unexpected network or API error. | Prints `err.message` and exits with code `1`. |

All errors exit the process with a **non-zero status code** so the script can
be used reliably inside CI pipelines or shell scripts.

---

## How It Works

```
┌─────────────────────────────────────────────┐
│  CLI argument parsing                        │
│  • owner/repo  → split into owner + repo    │
│  • --format    → "json" (default) or "table"│
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Authentication                              │
│  • Read GITHUB_TOKEN from environment        │
│  • Initialise Octokit with the token         │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Paginated API calls                         │
│  GET /repos/{owner}/{repo}/collaborators     │
│  per_page=100, iterates all pages            │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Data extraction per collaborator            │
│  • login, id, type, permissions{}            │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Output                                      │
│  • JSON array  –or–  Markdown table          │
└─────────────────────────────────────────────┘
```

**Pagination detail:** `octokit.paginate.iterator` automatically follows the
`Link: <...>; rel="next"` response header that GitHub includes when there are
more pages. Each page fetches up to 100 collaborators, so a repository with
350 collaborators requires 4 API calls.

---

## GitHub Token Scopes

Create a **Classic Personal Access Token** at
<https://github.com/settings/tokens> with at least the following scope:

| Scope | Why it is needed |
|-------|-----------------|
| `repo` | Grants read access to private repository metadata, including the collaborators list. For public repositories a token with no extra scopes also works, but the `repo` scope is recommended for consistent behaviour. |

For a **Fine-grained Personal Access Token**, grant:

- **Repository permissions → Members** → *Read-only*
