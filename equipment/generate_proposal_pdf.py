"""
generate_proposal_pdf.py
One job: create a proposal Google Doc, export it as PDF, upload PDF to Drive.

Usage:
    python equipment/generate_proposal_pdf.py

Requirements:
    pip install google-auth google-auth-oauthlib google-api-python-client

Auth:
    Place credentials.json (OAuth 2.0 Desktop App) in the project root.
    First run opens a browser for Google sign-in. Token saved to token.json.
"""

import io
import os
import json
from datetime import date, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

# ── Config ────────────────────────────────────────────────────────────────────

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
]

CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.json"
PARENT_FOLDER_ID = "1uz6Kbew8313FJIcAb7iQ5DCWQXJ-BeOR"  # fttah's Drive folder

# ── Proposal data ─────────────────────────────────────────────────────────────

PROPOSAL = {
    "company": "Najim Travel",
    "contact_name": "Layla Al Mahri",
    "contact_role": "Ops Director",
    "contact_email": "layla@najimtravel.com",
    "package": "Starter",
    "workflows": 1,
    "base_aed": 9500,
    "vat_rate": 0.05,           # set to 0 for non-UAE clients
    "proposal_date": date(2026, 5, 5),
    "kickoff_date": date(2026, 5, 10),
    "ref": "AAA-2026-NT-001",
    "context": "Boutique travel agency in Dubai specialising in tailored itineraries.",
}

# ── Business identity ─────────────────────────────────────────────────────────

BUSINESS = {
    "name": "Arabic AI Agents",
    "tagline": "AI workflows that actually ship",
    "website": "arabicaiagents.com",
    "email": "fttah.whm@gmail.com",
    "phone": "+971 4 555 1234",
    "address": "Dubai Internet City, Building 1, Suite 234, Dubai, UAE",
    "legal_entity": "Arabic AI Agents FZ-LLC",
    "founder": "fttah",
    "founder_role": "Founder & Managing Director",
    "trade_licence": "DET-1234567",
    "jurisdiction": "Dubai Internet City Free Zone, UAE",
    "vat_number": "100123456700003",
    "corp_tax_trn": "100123456700003",
    "bank": "Emirates NBD",
    "iban_aed": "AE12 0260 0010 1234 5678 9012",
    "swift": "EBILAEAD",
    "payment_methods": "Bank transfer, Stripe (USD/AED), Wise",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def fmt_aed(amount: float) -> str:
    return f"AED {amount:,.2f}".replace(".00", "")


def build_proposal_text(p: dict, b: dict) -> str:
    vat_amount = round(p["base_aed"] * p["vat_rate"], 2)
    total = p["base_aed"] + vat_amount
    half_base = p["base_aed"] / 2
    half_vat = round(vat_amount / 2, 2)
    half_total = half_base + half_vat
    validity = p["proposal_date"] + timedelta(days=30)

    timeline = (
        "Week 1: Kickoff and workflow scoping\n"
        "Weeks 2–3: Build — Workflow 1\n"
        "Week 4: Integration and testing\n"
        "Week 5: Team training\n"
        "Post-launch: 60 days support"
    ) if p["workflows"] == 1 else (
        "Week 1: Kickoff and workflow scoping\n"
        + "\n".join(
            f"Weeks {2+i*2}–{3+i*2}: Build — Workflow {i+1}"
            for i in range(p["workflows"])
        )
        + "\nFinal week: Integration, testing, team training\nPost-launch: 60 days support"
    )

    vat_line = (
        f"VAT (5% — UAE clients): {fmt_aed(vat_amount)}\n"
        if p["vat_rate"] > 0 else ""
    )

    return f"""{b['name']}
{b['tagline']}
{b['website']} | {b['email']} | {b['phone']}
{b['address']}

---

PROPOSAL

{p['company']} — {p['package']} Package
Date: {p['proposal_date'].strftime('%-d %B %Y')}
Ref: {p['ref']}

---

Prepared for:
{p['contact_name']}, {p['contact_role']}
{p['company']}
{p['contact_email']}

Prepared by:
{b['founder']}
{b['founder_role']}
{b['legal_entity']}

---

EXECUTIVE SUMMARY

{p['company']} — {p['context']} This proposal confirms the scope, timeline, and investment for the {p['package']} Package — {p['workflows']} custom AI workflow{'s' if p['workflows'] > 1 else ''} built, integrated, and deployed across your operations.

---

SCOPE OF WORK

Package: {p['package']} ({p['workflows']} Workflow{'s' if p['workflows'] > 1 else ''})
Investment: {fmt_aed(p['base_aed'])} (one-off)
Timeline: 6 weeks from kickoff

Deliverables:
- {p['workflows']} AI workflow{'s' if p['workflows'] > 1 else ''} designed, built, and deployed for your operations
- All integrations with your existing tools and platforms
- Team training covering all {'workflows' if p['workflows'] > 1 else 'workflow steps'}
- 60 days post-launch support

Workflow details will be scoped during the kickoff session on {p['kickoff_date'].strftime('%-d %B %Y')}.

---

INVESTMENT

{p['package']} — {p['workflows']} Workflow{'s' if p['workflows'] > 1 else ''}: {fmt_aed(p['base_aed'])}
{vat_line}Total: {fmt_aed(total)}

---

PAYMENT SCHEDULE

Milestone 1 — Kickoff (due on signing)
50%: {fmt_aed(half_base)} + VAT {fmt_aed(half_vat)} = {fmt_aed(half_total)}

Milestone 2 — Delivery & Handover (due on final delivery)
50%: {fmt_aed(half_base)} + VAT {fmt_aed(half_vat)} = {fmt_aed(half_total)}

---

BANK DETAILS

Bank: {b['bank']}
Account name: {b['legal_entity']}
AED IBAN: {b['iban_aed']}
Swift / BIC: {b['swift']}
Accepted methods: {b['payment_methods']}

---

PROJECT TIMELINE

{timeline}

---

TERMS AND CONDITIONS

- This quote is valid for 30 days from issue date ({p['proposal_date'].strftime('%-d %B %Y')}).
- Scope changes require written approval and may adjust timeline and price.
- Deliverables remain the property of {b['legal_entity']} until full payment is received.
- Late payment: 2% per month after 14 days overdue.

---

LEGAL ENTITY

{b['legal_entity']}
Trade licence: {b['trade_licence']}
Jurisdiction: {b['jurisdiction']}
VAT number: {b['vat_number']}
Corporate tax TRN: {b['corp_tax_trn']}

---

To accept this proposal, reply to this email or sign and return.
{b['name']} — {b['tagline']}.
"""


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_credentials():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return creds


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    p = PROPOSAL
    b = BUSINESS

    print(f"Generating proposal: {p['ref']} — {p['company']}")

    creds = get_credentials()
    docs_service = build("docs", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    # Step 1: Create Google Doc
    doc_title = f"Proposal — {p['company']} — {p['package']} Package — {p['proposal_date'].strftime('%Y-%m-%d')}"
    doc = docs_service.documents().create(body={"title": doc_title}).execute()
    doc_id = doc["documentId"]
    print(f"Created Google Doc: {doc_id}")

    # Step 2: Write proposal content into the doc
    content = build_proposal_text(p, b)
    docs_service.documents().batchUpdate(
        documentId=doc_id,
        body={
            "requests": [
                {
                    "insertText": {
                        "location": {"index": 1},
                        "text": content,
                    }
                }
            ]
        },
    ).execute()

    # Step 3: Move doc to correct folder
    drive_service.files().update(
        fileId=doc_id,
        addParents=PARENT_FOLDER_ID,
        removeParents="root",
        fields="id, parents",
    ).execute()

    # Step 4: Export Google Doc as PDF
    pdf_bytes = (
        drive_service.files()
        .export(fileId=doc_id, mimeType="application/pdf")
        .execute()
    )
    print("Exported Doc as PDF.")

    # Step 5: Upload PDF to Drive
    pdf_title = f"Proposal — {p['company']} — {p['package']} Package — {p['proposal_date'].strftime('%Y-%m-%d')}.pdf"
    file_metadata = {
        "name": pdf_title,
        "parents": [PARENT_FOLDER_ID],
    }
    media = MediaIoBaseUpload(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        resumable=False,
    )
    uploaded = (
        drive_service.files()
        .create(body=file_metadata, media_body=media, fields="id, webViewLink")
        .execute()
    )

    print(f"\nDone.")
    print(f"PDF uploaded: {uploaded['webViewLink']}")
    print(f"Google Doc kept at: https://docs.google.com/document/d/{doc_id}/edit")


if __name__ == "__main__":
    main()
