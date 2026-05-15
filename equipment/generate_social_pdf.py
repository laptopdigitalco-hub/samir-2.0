"""
generate_social_pdf.py
One job: read .tmp/social_posts.json, write a formatted PDF to reports/

Usage:
    python equipment/generate_social_pdf.py

Input:  .tmp/social_posts.json
Output: reports/social-posts-YYYY-MM-DD.pdf

Dependencies:
    pip install fpdf2
"""

import json
import os
from fpdf import FPDF, XPos, YPos

INPUT_FILE = ".tmp/social_posts.json"
OUTPUT_DIR = "reports"

BRAND = "Arabic AI Agents"
WEBSITE = "arabicaiagents.com"
ACCENT = (30, 80, 160)
TEXT = (30, 30, 30)
MUTED = (120, 120, 120)
WHITE = (255, 255, 255)
LM = 15

_CHAR_MAP = str.maketrans({
    "—": "-", "–": "-",   # em dash, en dash
    "‘": "'", "’": "'",   # curly single quotes
    "“": '"', "”": '"',   # curly double quotes
    "·": "|",                   # middle dot
    "…": "...",                 # ellipsis
    " ": " ",                   # non-breaking space
})


def sanitize(text: str) -> str:
    return text.translate(_CHAR_MAP)


def load_data(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class SocialPDF(FPDF):
    def __init__(self):
        super().__init__()
        self._pg = 0

    def footer(self):
        self._pg += 1
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*MUTED)
        self.set_x(self.l_margin)
        self.cell(85, 5, f"{BRAND}  |  {WEBSITE}", align="L",
                  new_x=XPos.RIGHT, new_y=YPos.LAST)
        self.cell(85, 5, f"Page {self._pg}", align="R",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def section_header(pdf: FPDF, platform: str):
    pdf.set_fill_color(*ACCENT)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_x(LM)
    pdf.cell(0, 9, f"  {platform}", align="L", fill=True,
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)


def post_body(pdf: FPDF, text: str):
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*TEXT)
    pdf.set_x(LM)
    pdf.multi_cell(0, 6, sanitize(text), align="L",
                   new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def build_pdf(data: dict) -> FPDF:
    pdf = SocialPDF()
    pdf.set_left_margin(LM)
    pdf.set_right_margin(LM)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    date_str = sanitize(data.get("date", ""))
    topic = sanitize(data.get("topic", ""))
    linkedin = data.get("linkedin", "")
    facebook = data.get("facebook", "")
    instagram = data.get("instagram", "")
    hashtags = [sanitize(h) for h in data.get("hashtags", [])]

    # ── Cover block ────────────────────────────────────────────────────────────
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*ACCENT)
    pdf.set_x(LM)
    pdf.multi_cell(0, 10, BRAND, align="L",
                   new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(*MUTED)
    pdf.set_x(LM)
    pdf.cell(0, 7, "Social Media Content", align="L",
              new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(LM)
    pdf.cell(0, 6, f"Topic: {topic}", align="L",
              new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(LM)
    pdf.cell(0, 6, f"Date: {date_str}", align="L",
              new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(4)
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.5)
    pdf.line(LM, pdf.get_y(), LM + 170, pdf.get_y())
    pdf.ln(10)

    # ── LinkedIn ───────────────────────────────────────────────────────────────
    section_header(pdf, "LinkedIn")
    post_body(pdf, linkedin)
    pdf.ln(10)

    # ── Facebook ───────────────────────────────────────────────────────────────
    section_header(pdf, "Facebook")
    post_body(pdf, facebook)
    pdf.ln(10)

    # ── Instagram ──────────────────────────────────────────────────────────────
    section_header(pdf, "Instagram")
    post_body(pdf, instagram)

    if hashtags:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*ACCENT)
        pdf.set_x(LM)
        pdf.multi_cell(0, 5, "  ".join(hashtags), align="L",
                       new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    return pdf


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found. Write the JSON file before running.")
        raise SystemExit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    data = load_data(INPUT_FILE)
    date_str = data.get("date", "unknown-date")

    pdf = build_pdf(data)
    output_path = os.path.join(OUTPUT_DIR, f"social-posts-{date_str}.pdf")
    pdf.output(output_path)
    print(f"Social posts saved to {output_path}")


if __name__ == "__main__":
    main()
