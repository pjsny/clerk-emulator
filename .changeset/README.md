# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets). To
record a change for the next release, run:

```bash
npx changeset
```

and commit the generated markdown file. On `main`, the **Release** workflow opens a
"Version Packages" PR that applies the queued changesets (bumps the version and updates
`CHANGELOG.md`). Merging that PR, then pushing a `vX.Y.Z` tag, triggers the **Publish**
workflow (npm trusted publishing).
