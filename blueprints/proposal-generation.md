# Blueprint: Proposal Generation
**ID:** PROP-001  
**Status:** Active  
**Trigger:** Manual — run when a deal reaches Won stage and a formal proposal doc is needed  
**Last updated:** 2026-05-05

---

## Objective

Generate a professionally formatted proposal Google Doc for a Won client, populated from the pipeline sheet and Business Identity, modelled on the Sahel Cafe Group proposal.

---

## Source Documents

| Source | Drive ID | Purpose |
|--------|----------|---------|
| Leads & Pipeline | `1Vxlq5so-SioJydpe3HssccVuq2Vs2Ndl0nx5ga8FK9U` | Client data: name, contact, email, deal value, package, notes |
| Business Identity | `14eV2HrpYxAHFne0I3F0RwIFfB_rOpxiY3R92nWco8a0` | Legal entity, VAT, banking, payment terms, disclaimers |
| Proposal Template | `1Pzb_O6UBr9OvieH67JmRgFpn83XcspzFaI6WPOvqemk` | Sahel Cafe Group proposal — structural and formatting reference |

---

## Inputs Required Before Running

Stop and confirm these with fttah if any are missing:

| Input | Where to find it | Example |
|-------|-----------------|---------|
| Company name | Pipeline sheet | Sahel Cafe Group |
| Contact name + role | Pipeline sheet | Omar Khouri, COO |
| Contact email | Pipeline sheet | omar.k@sahelcafe.com |
| Package name | Pipeline sheet (notes) | Growth |
| Number of workflows | Pipeline notes or fttah | 3 |
| Deal value (AED) | Pipeline deal_value_usd — confirm currency with fttah | AED 24,500 |
| Kickoff date | Pipeline next_step or fttah | 2026-04-29 |
| Proposal date | Today's date | 2026-05-05 |
| Reference number | Format: AAA-YYYY-[CLIENT INITIALS]-[SEQ] | AAA-2026-SCG-001 |
| UAE client? (VAT applies) | Confirm with fttah | Yes → add 5% VAT |

---

## Execution Steps

### Step 1 — Read source data
- Read client row from Leads & Pipeline (filter by company name or stage = Won)
- Read Business Identity for legal entity, VAT number, banking, disclaimers
- Note: deal_value in sheet may be USD — confirm AED amount with fttah before proceeding

### Step 2 — Confirm inputs
List all inputs above and ask: "Ready to generate the proposal with these details?"  
Do not proceed until fttah confirms.

### Step 3 — Copy the template doc
- Use Google Drive `copy_file` on the Sahel proposal (`1Pzb_O6UBr9OvieH67JmRgFpn83XcspzFaI6WPOvqemk`)
- Name the new file: `Proposal — [Company Name] — [Package] Package — [YYYY-MM-DD]`
- Place it in the same parent folder (`1uz6Kbew8313FJIcAb7iQ5DCWQXJ-BeOR`)

### Step 4 — Fill the document
Update the new doc with client-specific values using `update_file` or by rewriting the content via `create_file`. Replace all placeholder fields:

**Header block**
- Date, Ref number

**Prepared for block**
- Contact name, role, company name, email

**Executive Summary**
- Number of locations / business context (from pipeline notes)
- Package name, number of workflows

**Scope of Work**
- Package name, number of workflows, deal value (AED), timeline

**Investment table**
- Base amount (AED)
- VAT (5% if UAE client, else omit)
- Total

**Payment Schedule**
- 50% upfront + VAT, 50% on delivery + VAT (exact figures)

**Bank Details**
- Pull from Business Identity (Emirates NBD, IBAN, Swift)

**Project Timeline**
- Adjust week labels to reflect actual workflow count

**Terms and Conditions**
- Quote validity = 30 days from proposal date
- Standard disclaimers from Business Identity

**Legal Entity block**
- Pull from Business Identity (trade licence, jurisdiction, VAT number)

### Step 5 — Show preview and get approval
Paste the full document content in chat.  
Ask: "Ready to save this as the final proposal?"

### Step 6 — Confirm and report
- Confirm the new doc is saved in Drive
- Share the view URL with fttah
- Do NOT email the client — save as draft only (per standing restrictions)

---

## Package Reference

| Package | Workflows | Standard Price (AED) |
|---------|-----------|----------------------|
| Starter | 1 | 9,500 |
| Growth | 3 | 24,500 |
| Scale | 5 | 42,000 |
| Retainer | Ongoing | Per agreement |

*Always confirm pricing with fttah — these are reference figures only.*

---

## Output Format

New Google Doc in Drive, named:  
`Proposal — [Company] — [Package] Package — [YYYY-MM-DD]`

Structure mirrors the Sahel Cafe Group proposal:
1. Header (branding line, contact info)
2. PROPOSAL title block + ref
3. Prepared for / Prepared by
4. Executive Summary
5. Scope of Work
6. Investment
7. Payment Schedule
8. Bank Details
9. Project Timeline
10. Terms and Conditions
11. Legal Entity
12. Sign-off line

---

## Decision Rules

- **Deal value in USD?** → Ask fttah for AED equivalent before building the doc
- **Non-UAE client?** → Remove VAT line entirely
- **Retainer deal?** → Stop. Retainer proposals have different structure — brief fttah first
- **Scope not confirmed?** → Note "Workflow details to be scoped at kickoff" in Scope section (as per Sahel precedent)

---

## Improvement Log

| Date | Change |
|------|--------|
| 2026-05-05 | Blueprint created (PROP-001) |
