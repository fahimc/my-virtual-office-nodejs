# Agency Architecture

This app keeps the virtual office as the front-end experience and runs a modular agency system underneath it.

## Runtime Flow

Browser UI calls `/api/agency/*` routes in `server.js`.
Those routes use `src/agency/createAgencySystem.ts`, which wires:

- `AgentRuntime` for registered agents and status reporting
- `WorkflowRuntime` for resumable workflow runs and typed events
- `MemoryStore` for local JSON persistence
- `ToolRegistry` for auditable tool execution and approval checks
- `ModelRouter` for provider-agnostic LLM calls

The first production-style flow is:

1. `intakeWorkflow` starts Reception.
2. Customer type and email are collected.
3. New customers submit the customer details form.
4. Brief Agent structures the free-text brief.
5. User approves or edits the structured brief.
6. `websiteBuildWorkflow` runs planning, design, copy, build, QA, and preview in the local job queue.
7. Preview approval pauses the workflow.
8. Deployment approval is a separate explicit gate.

## Company OS Layer

`src/agency/company/companyOS.ts` composes the company-level services:

- task board and assignment/dependency services
- email drafts and send-approval flow
- Codex task runner abstraction
- GitHub branch/PR/issue/project abstractions
- preview/deployment services
- notifications
- audit and approval stores
- scheduler, retry policy, server-side secrets provider, and tool execution runtime

The new `/api/company/*` routes expose this layer for task board, email, Codex, GitHub, preview/deployment, approvals, audit, and workflow status.

## Task Board

Task board records live in `data/agency-store.json` under `companyTasks`.
Planner-created tasks use these statuses:

`backlog`, `ready`, `assigned`, `in_progress`, `blocked`, `review`, `changes_needed`, `approved`, `done`, `failed`, `cancelled`.

The website build workflow now creates internal tasks for planning, design, copy, coding, QA, preview, deployment, and completion email. Agents claim and complete tasks as workflow stages run.

## Codex

Codex is treated as a coding worker, not the company brain.

`CodexToolService` creates `CodexTask` records with:

- repo path
- branch name
- focused task prompt
- allowed/disallowed command policy
- changed files/test/build result fields

By default `CODEX_ENABLE_EXEC` is off, so Codex runs in safe stub mode. Set `CODEX_ENABLE_EXEC=1` and `CODEX_EXECUTABLE=codex` to allow `codex exec`.

## Developer Studio

Before Builder Agent hands work to Codex, `DeveloperPlanningService` inspects the repo for an existing design system, component library, styling system, templates, reusable sections, Storybook, and approved prior patterns.

The implementation plan records:

- detected design system/component library/styling system
- selected website template and reason
- reusable components found
- components and sections to create or adapt
- Designer Agent tokens to apply
- accessibility and responsive strategy
- files to modify or avoid
- validation commands and Codex task rules

Current repo detection treats DaisyUI on Tailwind CSS as the approved component library. The app is still Express plus static HTML/CSS, so generated client previews use DaisyUI HTML classes, internal design-system tokens, reusable section definitions, and template adapters rather than React components.

Codex prompts now include a task mode such as `build_page_from_template`, `apply_design_tokens`, `create_reusable_component`, `adapt_existing_component`, or `fix_qa_design_issues`. Codex must inspect existing components first, avoid duplicates, preserve the selected design system, and use Designer Agent handoff tokens as source of truth.

## GitHub

GitHub abstractions are provider-shaped and currently local/stubbed:

- branch records
- pull request records
- issue/project sync stubs
- webhook handler stub

The Builder Agent can create branches and PRs through the workflow. Merge approval is separate and uses `merge_pull_request`.

## Email Approval

Agents can create drafts without approval. Sending an external email requires a `send_email` approval.

After explicit deployment approval, Client Success drafts a completion email and the app creates an email-send approval. The draft is not sent until approved.

## Adding An Agent

1. Create `src/agency/agents/newAgent.ts`.
2. Export an `AgentDefinition` with id, name, role, description, allowed tools, memory scope, schemas, system prompt, task type, and `execute()`.
3. Register it in `src/agency/createAgencySystem.ts`.
4. Call it from a workflow through `agentRuntime.execute(agentId, input, context)`.

Agent outputs should be structured and saved as task/artifact/memory records by the workflow.

## Adding A Tool

1. Create `src/agency/tools/newTool.ts`.
2. Export a `ToolDefinition` with input/output schemas, permission level, approval requirement, and `execute()`.
3. Register it in `src/agency/createAgencySystem.ts`.
4. Dangerous tools must use `approvalRequired: true` and an `approvalType`.

All tool calls through `ToolRegistry.execute()` are audit logged.

## Configuring Models

Model task routing lives in `src/agency/models/modelConfig.ts`.

Default routes use Ollama:

- `OLLAMA_BASE_URL`, default `http://127.0.0.1:11434`
- `OLLAMA_MODEL`, default `gemma4:e4b`
- `OLLAMA_TIMEOUT_MS`, default `5000`
- `OLLAMA_NUM_PREDICT`, default `220`

To add OpenAI, Gemini, Claude, llama.cpp, or another provider, extend `ModelRouter` provider handling while keeping the `generateText()`, `generateStructuredObject()`, `streamText()`, and `runToolLoop()` interface stable.

## Persistence

Local persistence is stored in `data/agency-store.json`, which is gitignored. The memory abstractions are intentionally small so they can later be backed by Postgres, Supabase, Qdrant, pgvector, or another vector store.

## Current Stubs

- Browser/search research
- Screenshot capture
- GitHub commit tool
- Deployment publish tool
- External email tool
- Vector memory embeddings

The approval, audit, workflow, memory, and API boundaries are in place so these can be replaced with real services later.
