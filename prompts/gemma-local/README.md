# Local Gemma Prompt Pack

These Markdown files are loaded by `lib/gemma.ts` and concatenated into the system prompt for the local llama.cpp Gemma server.

- `SYSTEM.md`: schema, role, and output contract.
- `SKILL.md`: multilingual civic-analysis workflow.
- `MEMORY.md`: Kolkata seasonal and language memory.
- `SOUL.md`: ParaReport tone, safety posture, and product values.

The files are intentionally plain Markdown so the prompt can be tuned without changing application code. If a file is missing at runtime, the app logs a warning and continues with the remaining prompt sections plus the built-in fallback.
