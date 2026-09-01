# Path Discovery

Layer 1 of the Attack Path Risk Engine.

Owner: Mohamed Abdul Baasid

## What this does
Queries the Neo4j graph Cartography already populates. Performs a
depth-bounded traversal from flagged entry points (`exposed_internet = true`,
`anonymous_access = true`) to defined sensitive targets (production data
stores, administrative roles, secrets managers). Read-only against the
graph — never modifies Cartography's own data.

## Tech
Python 3.x, Neo4j Python driver, Cypher.

## Status
🚧 Not started — study phase in progress.