# Commit Message Guidelines

This project follows the **[Conventional Commits](https://www.conventionalcommits.org)** specification with a custom rule for multi-scope support.

## **Commit Message Format**

```text
<type>(<scope>): <subject>
```

- type: Describes the category of change (e.g., feat, fix, docs).
- scope: Optional. Describes the specific part of the codebase affected.
- subject: A brief, imperative summary of the change.

---

Rule: scope-multi-enum

Our configuration allows for multiple scopes in a single commit, separated by a comma (,) or a forward slash (/).

### Allowed Scopes

Any scope used must be one of the following:
cli, docs, release, component, api, core, db, ui, server, test

### Examples Of Valid Commits

- Single Scope: feat(api): add user authentication endpoint
- Multiple Scopes (Comma): fix(ui,component): resolve button alignment issue
- Multiple Scopes (Slash): refactor(core/db): optimize query performance
- No Scope: chore: update dependencies

---

### Workflow

This linting is enforced via husky on every commit. If your commit message fails validation, the commit will be rejected.
