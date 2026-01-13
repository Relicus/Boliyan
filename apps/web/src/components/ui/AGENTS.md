# UI COMPONENT KNOWLEDGE BASE

**Context:** Shadcn UI + Radix Primitives.

## RULE: TREAT AS EXTERNAL LIBRARY
These components are copy-pasted dependencies.

## CONVENTIONS
- **Modification**: Style changes only (className, variants).
- **Logic**: DO NOT add business logic here.
- **Updates**: Manual copy-paste from Shadcn docs.

## ANTI-PATTERNS
- **DO NOT** import domain stores/logic into these components.
- **DO NOT** change component API props unless necessary for accessibility.
