# Project Constitution

## North Star
Intelligent Test Planning Agent Web Application that fetches Jira Issues and generates comprehensive test plans based on a provided template, using an LLM (Ollama/Grok).

## Data Schemas
*To be defined once discovery questions are answered.*

## Behavioral Rules
1. The app UI must support both Light and Dark mode.
2. The UI must follow a 4-Step flow: Setup -> Fetch Issues -> Review -> Test Plan.
3. Step 1 (Setup) must iteratively prompt the user to establish necessary API connections before proceeding:
   - First prompt: LLM connection (Ollama / Grok).
   - Second prompt: Requirement source (Jira).
4. Do not proceed to subsequent steps until valid connections exist.

## Architectural Invariants
*To be defined.*
