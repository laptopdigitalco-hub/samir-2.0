# Blueprint: Client Onboarding
**ID:** COB-001  
**Status:** Active  
**Trigger:** Manual — run when a proposal is signed and a client is confirmed  
**Last updated:** 2026-05-05

---

## Objective

Take a newly signed client from Won to fully onboarded: CRM updated, welcome email drafted, kick-off call scheduled, Drive folder created, Notion page set up.

---

## Source Documents

| Source | Drive ID | Purpose |
|--------|----------|---------|
| Leads & Pipeline | `1Vxlq5so-SioJydpe3HssccVuq2Vs2Ndl0nx5ga8FK9U` | Client data: name, contact, email, package, deal value |
| Business Identity | `14eV2HrpYxAHFne0I3F0RwIFfB_rOpxiY3R92nWco8a0` | fttah's contact details, entity info |

---

## Inputs Required Before Running

Stop and confirm these with fttah if any are missing:

| Input | Where to find it | Example |
|-------|-----------------|---------|
| Company name | Pipeline sheet | Sahel Cafe Group |
| Contact name + role | Pipeline sheet | Omar Khouri, COO |
| Contact email | Pipeline sheet | omar.k@sahelcafe.com |
| Package name | Pipeline sheet | Growth |
| Kick-off date preference | Ask fttah | Week of 2026-05-12 |
| Signed proposal date | fttah confirms | 2026-05-05 |

---

## Execution Steps

### Step 1 — Update CRM
- Open Leads & Pipeline sheet
- Change client row stage from `Won` to `Active`
- Log the signed date in the notes column
- Report: "Pipeline updated — [Company] moved to Active."

### Step 2 — Create shared Drive folder
- Create a new folder in Drive named: `[Company Name] — [Package] Package`
- Place it inside the main clients folder
- Share with fttah only at this stage — do not share with client yet
- Report the folder URL to fttah

### Step 3 — Create Notion client page
- Create a new Notion page for the client with the following sections:

```
# [Company Name]
**Package:** [Package]
**Contact:** [Name] · [Role] · [Email]
**Status:** Active
**Start date:** [Signed date]
**Kick-off date:** TBC

---

## Overview
[Brief context from pipeline notes]

## Deliverables
[Workflows confirmed in proposal]

## Timeline
[From proposal]

## Notes
[Empty — to be filled during kick-off]
```

- Report the Notion page URL to fttah

### Step 4 — Draft welcome email
Draft only — do not send. Show fttah first.

**Subject:** Welcome to Arabic AI Agents — [Company Name]

**Body:**

---

Hi [Contact first name],

Really glad to have you on board.

Here's what happens next:

- We'll schedule a kick-off call to walk through the project together — I'll send a calendar invite shortly.
- Before the call, I'd love to know: are there any tools, systems, or workflows you'd like us to prioritise first?
- If anything comes up in the meantime, you can reach me directly at fttah.whm@gmail.com.

Looking forward to getting started.

fttah  
Arabic AI Agents

---

Ask fttah: "Here's the welcome email draft. Want to edit anything before I save it as a Gmail draft?"  
Wait for approval, then save to Gmail drafts — do not send.

### Step 5 — Schedule kick-off call
- Check fttah's Google Calendar for availability in the confirmed week
- Propose 2–3 slots to fttah: "Here are open slots for kick-off — which works?"
- Once fttah picks a slot, create the calendar event:
  - **Title:** Kick-off Call — [Company Name]
  - **Duration:** 60 minutes
  - **Attendees:** fttah + client contact email
  - **Description:** "Kick-off call for [Package] package. We'll walk through deliverables, timeline, and first priorities."
- Do not send the invite until fttah confirms

### Step 6 — Final report
Summarise what was completed:

```
Onboarding complete — [Company Name]

✓ Pipeline → Active
✓ Drive folder created: [URL]
✓ Notion page created: [URL]
✓ Welcome email saved as draft
✓ Kick-off call: [Date, Time] — invite ready to send

Pending fttah:
- Review and send welcome email draft
- Confirm kick-off invite to [Contact email]
```

---

## Decision Rules

- **Kick-off date not known?** → Leave TBC in Notion, flag in final report
- **Client has multiple contacts?** → Ask fttah who gets the welcome email
- **Package not confirmed in pipeline?** → Stop. Confirm with fttah before creating any docs
- **Client outside UAE?** → Note in Notion — may affect VAT and contract terms

---

## Improvement Log

| Date | Change |
|------|--------|
| 2026-05-05 | Blueprint created (COB-001) |
