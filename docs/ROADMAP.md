# Roadmap and product requirements

This document records the binding product requirements for all future work and the agreed order of
milestones. Milestone 1 is implemented (pull request #1). Later milestones are **proposals**: none of
them is started until explicitly approved.

## Product requirements (constraints for every milestone)

### Customer space

- Free for all website visitors.
- No customer registration or login required.
- Customers will upload their storefront photo, select the sign area, choose templates, customise
  designs, and generate mockups when those capabilities are implemented.
- Template names and the relevant colours must update instantly in previews.
- Never claim planned functionality already works.

### Professional Studio

- A genuine professional workspace with manual editing.
- Future capabilities: accurate dimensions, 2D/3D designs, materials, lighting, mounting structures,
  technical drawings, and fabrication exports.
- Customer projects must be able to transfer into the Professional Studio.

### Admin space

- One shared login page for Admin and Pro members.
- Admin is redirected to the Admin Space after authentication; Pro members to the Professional Studio.
- Admin always has access to the Professional Studio.
- Only the Admin can grant or revoke Pro membership and manage protected global website settings.
- Admin permissions must be securely enforced on the server.
- Customers do not need accounts.

### Cost and safety

- Target zero mandatory operating costs.
- No automatic paid fallback for AI services.
- AI generation must have enforceable free-usage limits.
- Never expose secrets or API keys.

## Milestone order

| #   | Milestone                                                                      | Status                 |
| --- | ------------------------------------------------------------------------------ | ---------------------- |
| 1   | Product interface: landing page, working customer demo, pro workspace entry    | Implemented (PR #1)    |
| 2   | Customer template and customisation foundation (local, free, instant previews) | Proposed — not started |
| 3   | Storefront photo upload and sign-area selection (client-side)                  | Later                  |
| 4   | Mockup generation with enforceable free-usage limits (no paid fallback)        | Later                  |
| 5   | Shared Admin/Pro authentication with server-enforced roles                     | Later                  |
| 6   | Project transfer into the Professional Studio; pro editing tools               | Later                  |

Each later milestone keeps every earlier capability working and keeps the honesty rules of the
architecture: only working controls are interactive, planned capabilities are labelled, and nothing
implies AI output is fabrication-accurate.
