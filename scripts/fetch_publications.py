#!/usr/bin/env python3
"""
Merge the trusted baseline publication list with new candidates found from ORCID/OpenAlex.

Live file:
  data/publications.json

Manual baseline:
  data/publications.manual.json

The script starts from the manual baseline, fetches works from OpenAlex using ORCID/OpenAlex
author identifiers in data/publication-sources.json, deduplicates by normalized title, and
writes the merged list to data/publications.json.
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "data" / "publication-sources.json"
MANUAL = ROOT / "data" / "publications.manual.json"
OUT = ROOT / "data" / "publications.json"

def get_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "quantum-technology-group-site/0.1 (mailto:frederic.bouchard@nrc-cnrc.gc.ca)"}
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))

def norm_title(title: str) -> str:
    title = (title or "").lower()
    title = re.sub(r"[^a-z0-9]+", " ", title)
    return re.sub(r"\s+", " ", title).strip()

def openalex_short_id(openalex_id: str) -> str:
    openalex_id = (openalex_id or "").strip()
    if not openalex_id:
        return ""
    return openalex_id.rstrip("/").split("/")[-1]

def find_openalex_author_id_from_orcid(orcid: str) -> str:
    orcid = (orcid or "").strip().replace("https://orcid.org/", "").replace("http://orcid.org/", "")
    if not orcid:
        return ""
    url = "https://api.openalex.org/authors?" + urllib.parse.urlencode({
        "filter": f"orcid:{orcid}",
        "per-page": "10"
    })
    data = get_json(url)
    results = data.get("results", [])
    if not results:
        return ""
    return openalex_short_id(results[0].get("id", ""))

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
    issue = biblio.get("issue") or ""
    first_page = biblio.get("first_page") or ""
    last_page = biblio.get("last_page") or ""
    pages = f"{first_page}-{last_page}" if first_page and last_page else first_page

    venue_parts = []
    if source:
        venue_parts.append(source)
    if volume:
        venue_parts.append(str(volume))
    if issue:
        venue_parts.append(f"({issue})")
    if pages:
        venue_parts.append(str(pages))
    if work.get("publication_year"):
        venue_parts.append(str(work.get("publication_year")))

    return {
        "title": work.get("display_name") or "",
        "authors": ", ".join(authors),
        "venue": ", ".join(venue_parts),
        "year": work.get("publication_year") or "",
        "url": work.get("doi") or work.get("id") or "",
        "source": "OpenAlex"
    }

def fetch_openalex_works(author_id: str) -> list[dict[str, Any]]:
    author_id = openalex_short_id(author_id)
    if not author_id:
        return []
    cursor = "*"
    works: list[dict[str, Any]] = []
    for _ in range(20):
        url = "https://api.openalex.org/works?" + urllib.parse.urlencode({
            "filter": f"author.id:{author_id}",
            "per-page": "200",
            "cursor": cursor,
            "sort": "publication_date:desc",
        })
        data = get_json(url)
        works.extend(normalize_openalex_work(w) for w in data.get("results", []))
        next_cursor = data.get("meta", {}).get("next_cursor")
        if not next_cursor or next_cursor == cursor:
            break
        cursor = next_cursor
        time.sleep(0.25)
    return works

def publication_year(pub: dict[str, Any]) -> int:
    try:
        return int(pub.get("year") or 0)
    except Exception:
        return 0

def main() -> None:
    manual = json.loads(MANUAL.read_text(encoding="utf-8")) if MANUAL.exists() else []
    sources = json.loads(SOURCES.read_text(encoding="utf-8")) if SOURCES.exists() else {}

    merged: dict[str, dict[str, Any]] = {}
    for pub in manual:
        key = norm_title(pub.get("title", ""))
        if key:
            merged[key] = pub

    for slug, src in sources.items():
        author_id = openalex_short_id(src.get("openalex_author_id", ""))
        if not author_id and src.get("orcid"):
            author_id = find_openalex_author_id_from_orcid(src["orcid"])

        if not author_id:
            print(f"No OpenAlex author ID found for {src.get('name', slug)}")
            continue

        print(f"Fetching OpenAlex works for {src.get('name', slug)} ({author_id})")
        for pub in fetch_openalex_works(author_id):
            key = norm_title(pub.get("title", ""))
            if key and key not in merged:
                merged[key] = pub

    pubs = sorted(merged.values(), key=lambda p: (publication_year(p), p.get("title", "")), reverse=True)
    OUT.write_text(json.dumps(pubs, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(pubs)} merged publications to {OUT}")

if __name__ == "__main__":
    main()
