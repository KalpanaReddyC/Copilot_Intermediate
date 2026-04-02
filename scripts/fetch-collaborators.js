/**
 * fetch-collaborators.js
 *
 * Fetches all collaborators (and their permission levels) for a GitHub
 * repository using the GitHub REST API.
 *
 * Usage:
 *   node scripts/fetch-collaborators.js <owner/repo> [--format=json|table]
 *
 * Examples:
 *   node scripts/fetch-collaborators.js octocat/Hello-World
 *   node scripts/fetch-collaborators.js octocat/Hello-World --format=table
 *
 * Prerequisites:
 *   1. Install dependencies:
 *        npm install @octokit/rest
 *   2. Set your GitHub Personal Access Token as an environment variable:
 *        export GITHUB_TOKEN=ghp_yourTokenHere
 *      The token needs the `repo` scope (or at minimum read:org) so that
 *      the collaborators endpoint is accessible.
 *
 * Output:
 *   --format=json  (default) Prints a JSON array of collaborator objects.
 *   --format=table          Prints a Markdown table.
 */

const { Octokit } = require("@octokit/rest");

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(
    "Usage: node scripts/fetch-collaborators.js <owner/repo> [--format=json|table]"
  );
  process.exit(0);
}

const repoArg = args.find((a) => !a.startsWith("--"));
const formatArg = args.find((a) => a.startsWith("--format="));
const outputFormat = formatArg ? formatArg.split("=")[1] : "json";

if (!repoArg || !repoArg.includes("/")) {
  console.error(
    'Error: Repository must be in the format "owner/repo" (e.g. octocat/Hello-World).'
  );
  process.exit(1);
}

if (!["json", "table"].includes(outputFormat)) {
  console.error('Error: --format must be either "json" or "table".');
  process.exit(1);
}

const [owner, repo] = repoArg.split("/");

// ---------------------------------------------------------------------------
// Set up Octokit
// ---------------------------------------------------------------------------

const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error(
    "Error: GITHUB_TOKEN environment variable is not set.\n" +
      "Export your Personal Access Token before running this script:\n" +
      "  export GITHUB_TOKEN=ghp_yourTokenHere"
  );
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

// ---------------------------------------------------------------------------
// Fetch all collaborators (with pagination)
// ---------------------------------------------------------------------------

/**
 * Retrieves a flat array of collaborator data objects for the given repository.
 * Handles pagination automatically by iterating through all pages.
 *
 * @param {string} owner - Repository owner (user or organization).
 * @param {string} repo  - Repository name.
 * @returns {Promise<Array<{login: string, id: number, type: string, permissions: object}>>}
 */
async function fetchCollaborators(owner, repo) {
  const collaborators = [];

  // octokit.paginate iterates through every page automatically.
  const pages = octokit.paginate.iterator(
    octokit.rest.repos.listCollaborators,
    {
      owner,
      repo,
      per_page: 100, // maximum allowed per page
    }
  );

  for await (const { data } of pages) {
    for (const user of data) {
      collaborators.push({
        login: user.login,
        id: user.id,
        type: user.type, // "User" or "Bot"
        permissions: user.permissions ?? {},
      });
    }
  }

  return collaborators;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/**
 * Derives a single human-readable permission level from the permissions object.
 * GitHub returns a map like { admin: false, push: true, pull: true, ... }.
 * We return the highest privilege that is set to true.
 *
 * @param {object} permissions
 * @returns {string}
 */
function highestPermission(permissions) {
  const order = ["admin", "maintain", "push", "triage", "pull"];
  for (const level of order) {
    if (permissions[level]) return level;
  }
  return "none";
}

/**
 * Renders the collaborator list as a Markdown table.
 *
 * @param {Array} collaborators
 * @returns {string}
 */
function toMarkdownTable(collaborators) {
  const header =
    "| Username | User ID | Type | Permission |\n" +
    "|----------|---------|------|------------|";

  const rows = collaborators.map(
    (c) =>
      `| ${c.login} | ${c.id} | ${c.type} | ${highestPermission(c.permissions)} |`
  );

  return [header, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  try {
    const collaborators = await fetchCollaborators(owner, repo);

    if (collaborators.length === 0) {
      console.log(`No collaborators found for ${owner}/${repo}.`);
      return;
    }

    if (outputFormat === "table") {
      console.log(`\nCollaborators for **${owner}/${repo}**\n`);
      console.log(toMarkdownTable(collaborators));
    } else {
      // Default: JSON
      console.log(JSON.stringify(collaborators, null, 2));
    }
  } catch (err) {
    handleError(err);
  }
})();

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * Handles HTTP and network errors from Octokit and exits with a non-zero
 * status code.
 *
 * @param {Error} err
 */
function handleError(err) {
  const status = err.status;

  if (status === 401) {
    console.error(
      "Error 401 – Unauthorized: Your GITHUB_TOKEN is missing or invalid.\n" +
        "Make sure the token has the required scopes (e.g. `repo`)."
    );
  } else if (status === 403) {
    // Could be forbidden access or rate-limit
    const rateLimitRemaining = err.response?.headers?.["x-ratelimit-remaining"];
    if (rateLimitRemaining === "0") {
      const resetTime = err.response?.headers?.["x-ratelimit-reset"];
      const resetDate = resetTime
        ? new Date(Number(resetTime) * 1000).toLocaleTimeString()
        : "unknown";
      console.error(
        `Error 403 – Rate limit exceeded. Your rate limit resets at ${resetDate}.`
      );
    } else {
      console.error(
        "Error 403 – Forbidden: Your token does not have the required permissions " +
          "to list collaborators for this repository."
      );
    }
  } else if (status === 404) {
    console.error(
      `Error 404 – Not Found: The repository "${owner}/${repo}" was not found.\n` +
        "Check that the owner and repository name are correct and that your token " +
        "has access to it."
    );
  } else {
    console.error(`Unexpected error: ${err.message}`);
  }

  process.exit(1);
}
