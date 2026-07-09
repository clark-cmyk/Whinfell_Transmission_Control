agents.md

Project: Whinfell Transmission Control
Core Philosophy

The Ark is the single source of truth for all data in the system.
Only ark.js is allowed to load raw data files. This rule is absolute.
All other modules must request data through The Ark.

Engineering Standards

Never drop, simplify, or "just get working" any feature listed in the current phase.
Implement features exactly as specified — do not take shortcuts.
All code must be modular, small, single-purpose functions (Lego principle).
Prioritize clarity and readability over clever or compact code.
Keep functions short and easy to understand.
Use clear, descriptive names for all functions and variables.
If something is complex, add comments explaining why.

Behavior Rules

Always work in the exact order of the numbered phases.
Do not jump ahead to later phases.
If something is unclear, ask for clarification instead of making assumptions.
Maintain clean separation between data logic and UI logic.