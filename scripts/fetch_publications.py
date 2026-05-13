#!/usr/bin/env python3
"""
Fetch publication metadata for Quantum Technology Group authors.

Recommended workflow:
1. Fill data/publication-sources.json using stable author identifiers:
   - ORCID iD when available
   - OpenAlex author ID
   - Semantic Scholar author ID
2. Run this script locally or via GitHub Actions.
3. Review data/publications.generated.json before replacing data/publications.json.

This scaffold intentionally writes to publications.generated.json so that new
metadata can be reviewed before going live.
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "data" / "publication-sources.json"
OUT = ROOT / "data" / "publications.generated.json"

def get_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "quantum-technology-group-site/0.1 (mailto:frederic.bouchard@nrc-cnrc.gc.ca)"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))

def normalize_openalex_work(work: dict[str, Any]) -> dict[str, Any]:
    authors = []
    for a in work.get("authorships", []):
        name = a.get("author", {}).get("display_name")
        if name:
            authors.append(name)
    primary = work.get("primary_location") or {}
    source = (primary.get("source") or {}).get("display_name") or ""
    biblio = work.get("biblio") or {}
    volume = biblio.get("volume") or ""
    first_page = biblio.get("first_page") or ""
    last_page = biblio.get("last_page") or ""
    pages = ""
    if first_page and last_page:
        pages = f"{first_page}-{last_page}"
    elif first_page:
        pages = first_page
    venue_bits = [x for x in [source, volume, pages, str(work.get("publication_year") or "")] if x]
    return {
        "title": work.get("display_name") or "",
        "authors": ", ".join(authors),
        "venue": ", ".join(venue_bits),
        "year": work.get("publication_year") or "",
        "url": work.get("doi") or work.get("id") or "",
        "source": "OpenAlex"
    }

def fetch_openalex(author_id: str) -> list[dict[str, Any]]:
    # author_id can be "A123..." or full URL. Use OpenAlex filter author.id.
    author_id = author_id.strip()
    if not author_id:
        return []
    if not author_id.startswith("https://openalex.org/"):
        author_id = "https://openalex.org/" + author_id
    cursor = "*"
    works: list[dict[str, Any]] = []
    for _ in range(10):
        url = (
            "https://api.openalex.org/works?"
            + urllib.parse.urlencode({
                "filter": f"author.id:{author_id}",
                "per-page": "200",
                "cursor": cursor,
                "sort": "publication_date:desc",
            })
        )
        data = get_json(url)
        works.extend(normalize_openalex_work(w) for w in data.get("results", []))
        next_cursor = data.get("meta", {}).get("next_cursor")
        if not next_cursor or next_cursor == cursor:
            break
        cursor = next_cursor
        time.sleep(0.2)
    return works

def main() -> None:
    if not SOURCES.exists():
        raise SystemExit("Missing data/publication-sources.json. Copy publication-sources.template.json and fill author IDs.")

    sources = json.loads(SOURCES.read_text(encoding="utf-8"))
    all_pubs: dict[str, dict[str, Any]] = {}

    for slug, src in sources.items():
        for pub in fetch_openalex(src.get("openalex_author_id", "")):
            key = (pub.get("title") or "").lower().strip()
            if not key:
                continue
            all_pubs[key] = pub

    pubs = sorted(all_pubs.values(), key=lambda p: str(p.get("year", "")), reverse=True)
    OUT.write_text(json.dumps(pubs, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(pubs)} publications to {OUT}")

if __name__ == "__main__":
    main()
