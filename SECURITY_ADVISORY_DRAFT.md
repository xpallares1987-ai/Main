# GitHub Security Advisory Draft

## Summary
The project was alerted by Dependabot regarding a vulnerability in the `nanoid` package (GHSA-m84f-8p9j-m59p) affecting versions prior to 3.3.8.

## Analysis
The vulnerability involved a potential lack of randomness in specific non-secure hardware environments. In the 'Control Tower' project, `nanoid` was used as a transitive dependency through `vite`, `next`, and `postcss`.

## Mitigation
We have performed a full dependency audit and synchronized the `package-lock.json`. 
- **Current Version:** All project workspaces are now using `nanoid@3.3.11` (or higher), which includes the fix for the reported issue.
- **Verification:** Ran `npm list nanoid --all` to confirm no legacy versions remain in the dependency tree.

## Impact
No direct exploitation was possible within the scope of this project as it primarily operates in secure browser/server environments. The update was performed as a preventive measure to maintain 100% security compliance.

---
*Status: Resolved*
*Date: May 2026*
