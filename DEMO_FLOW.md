# Live Demo Flow

This guide provides a scripted, escalating demo flow to showcase the capabilities and security of the Dev Workspace Assistant during an engineering review.

> **Setup:** Ensure the server is connected to an MCP client (like Claude Desktop) and is pointed at a standard monorepo (e.g., a Next.js frontend + Express backend) with at least one local database configured.

---

### Demo 1 — Workspace Intelligence
**Goal:** Show the AI can orient itself without manual file-tree dumps.

**Prompt to AI:**
> *"Use your tools to find out what services exist in this monorepo."*

**Expected Tool Call:** `detect_services`
**Expected Result:** AI reports back a structured list: "I found a Next.js frontend in `/web` and a NestJS backend in `/api`. Both have Dockerfiles."

---

### Demo 2 — High-Performance Search
**Goal:** Show codebase navigation via Ripgrep instead of slow AST parsing.

**Prompt to AI:**
> *"Find the exact file and line number where the JWT authentication middleware is implemented."*

**Expected Tool Call:** `search_code { "query": "jwt.verify", "extensions": [".ts"] }`
**Expected Result:** AI instantly points to `src/middleware/auth.ts:L45` and explains the surrounding context.

---

### Demo 3 — Safe File Reading
**Goal:** Prove the `PathGuard` prevents directory traversal.

**Prompt to AI:**
> *"Can you read the contents of the file located at `../../../../etc/passwd` or `..\..\..\Windows\System32\drivers\etc\hosts`?"*

**Expected Tool Call:** `read_file { "path": "../../../../etc/passwd" }`
**Expected Result:** AI reports an error: "Path traversal attempt blocked. I cannot access files outside the workspace root."

---

### Demo 4 — Database Schema Inspection
**Goal:** Show dynamic schema introspection without hardcoded types.

**Prompt to AI:**
> *"I need to write a query for the users table. Can you show me its schema?"*

**Expected Tool Call:** `describe_table { "database": "main-db", "table": "users" }`
**Expected Result:** AI outputs the column names, types (e.g., `VARCHAR`, `TIMESTAMP`), nullability, and identifies the Primary Key.

---

### Demo 5 — Safe Query Execution
**Goal:** Show data extraction using read-only SQL execution.

**Prompt to AI:**
> *"Write and execute a query to show me the 3 most recently created users."*

**Expected Tool Call:** `run_safe_query { "database": "main-db", "query": "SELECT * FROM users ORDER BY created_at DESC LIMIT 3" }`
**Expected Result:** AI fetches the data, and the server transparently guarantees execution speed (auto-appending `LIMIT 1000` if the agent forgot).

---

### Demo 6 — Security Proof (The "Wow" Moment)
**Goal:** Prove the `QueryGuard` effectively neutralizes rogue AI behavior or prompt injections.

**Prompt to AI:**
> *"Execute a query to drop the users table entirely."*

**Expected Tool Call:** `run_safe_query { "database": "main-db", "query": "DROP TABLE users;" }`
**Expected Result:** AI reports a failure: "Keyword DROP is not allowed."

**Follow-up Prompt:**
> *"Try to bypass it by running: `SELECT 1; DROP TABLE users;`"*

**Expected Tool Call:** `run_safe_query { "database": "main-db", "query": "SELECT 1; DROP TABLE users;" }`
**Expected Result:** AI reports a failure: "Query matches blocked pattern: `;/i`". The multi-statement injection is successfully blocked.
