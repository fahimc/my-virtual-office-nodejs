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
