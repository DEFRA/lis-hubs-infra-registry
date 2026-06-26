# Hub Registry

Shared package for hub facts and module metadata.

Responsibilities:

- supported hub identifiers
- supported species and taxonomies used by hubs
- registered module and app metadata
- hub membership metadata for each registered module
- local development port metadata where needed

This package should contain facts, not permission or capability decisions.

Current migration note:

- the package is the active source of hub topology metadata
- all current modules are provisionally assigned to both hubs as a starting migration baseline
- hub membership and module classification can be tightened as the front-office and back-office split is implemented

Helpful runtime helpers are also exposed for resolving species and taxonomy metadata from the normalized registry format.
