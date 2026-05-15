"""
generate_trend_report_pdf.py
One job: read .tmp/trend_report.json, write a formatted PDF to reports/

Usage:
    python equipment/generate_trend_report_pdf.py

Input:  .tmp/trend_report.json
Output: reports/trend-report-YYYY-MM-DD.pdf

Dependencies:
    pip install fpdf2
"""

import json
import os
from fpdf import FPDF, XPos, YPos

INPUT_FILE = ".tmp/trend_report.json"
OUTPUT_DIR = "reports"

BRAND = "Arabic AI Agents"
WEBSITE = "arabicaiagents.com"
ACCENT = (30, 80, 160)
TEXT = (30, 30, 30)
MUTED = (120, 120, 120)
LM = 15  # left margin mm


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


def nl(pdf: FPDF, text: str, font: str = "Helvetica", style: str = "",
       size: int = 10, color: tuple = TEXT, h: int = 6):
    pdf.set_font(font, style, size)
    pdf.set_text_color(*color)
    pdf.set_x(LM)
    pdf.multi_cell(0, h, text, align="L",
                   new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def divider(pdf: FPDF, color: tuple = ACCENT, weight: float = 0.5):
    pdf.set_draw_color(*color)
    pdf.set_line_width(weight)
    x = pdf.l_margin
    pdf.line(x, pdf.get_y(), x + 170, pdf.get_y())


class TrendReport(FPDF):
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


def build_pdf(data: dict) -> FPDF:
    pdf = TrendReport()
    pdf.set_left_margin(LM)
    pdf.set_right_margin(LM)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    date_str = data.get("date", "")
    sources = data.get("sources", [])
    trends = data.get("trends", [])

    # ── Cover block ────────────────────────────────────────────────────────────
    pdf.ln(6)
    nl(pdf, "AI in Construction & Public Works", style="B", size=22,
       color=ACCENT, h=10)
    nl(pdf, f"Trend Report  -  {date_str}", size=14, color=MUTED, h=8)
    nl(pdf, f"Prepared by {BRAND}", style="I", size=10, color=MUTED, h=6)
    pdf.ln(4)
    divider(pdf, ACCENT, 0.5)
    pdf.ln(8)

    # ── Sources section ────────────────────────────────────────────────────────
    nl(pdf, "Sources Reviewed", style="B", size=13, color=ACCENT, h=8)
    pdf.ln(2)

    for i, s in enumerate(sources, 1):
        title = sanitize(s.get("title", ""))
        source = sanitize(s.get("source", ""))
        date = sanitize(s.get("date", ""))
        finding = sanitize(s.get("finding", ""))

        nl(pdf, f"{i}.  {title}", style="B", size=10, color=TEXT, h=6)
        nl(pdf, f"    {source}  -  {date}", size=9, color=MUTED, h=5)
        nl(pdf, f"    {finding}", style="I", size=9, color=TEXT, h=5)
        pdf.ln(2)

    # ── Trends section ─────────────────────────────────────────────────────────
    pdf.ln(4)
    nl(pdf, "Top 5 Trends", style="B", size=13, color=ACCENT, h=8)
    pdf.ln(2)
    divider(pdf, ACCENT, 0.3)
    pdf.ln(4)

    for i, t in enumerate(trends, 1):
        name = sanitize(t.get("name", ""))
        description = sanitize(t.get("description", ""))
        driver = sanitize(t.get("driver", ""))
        impact = sanitize(t.get("impact", ""))

        nl(pdf, f"{i}.  {name}", style="B", size=12, color=ACCENT, h=7)
        nl(pdf, description, size=10, color=TEXT, h=6)
        pdf.ln(1)

        # Driver label + text on same visual line using two cells
        pdf.set_x(LM)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(22, 5, "Driver:", new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*TEXT)
        pdf.multi_cell(0, 5, driver, align="L",
                       new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_x(LM)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(22, 5, "Impact:", new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*TEXT)
        pdf.multi_cell(0, 5, impact, align="L",
                       new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(5)

        if i < len(trends):
            divider(pdf, (200, 200, 200), 0.2)
            pdf.ln(4)

    return pdf


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found. Write the JSON file before running.")
        raise SystemExit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    data = load_data(INPUT_FILE)
    date_str = data.get("date", "unknown-date")

    pdf = build_pdf(data)
    output_path = os.path.join(OUTPUT_DIR, f"trend-report-{date_str}.pdf")
    pdf.output(output_path)
    print(f"Trend report saved to {output_path}")


if __name__ == "__main__":
    main()
