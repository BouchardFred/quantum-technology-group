# Publication list workflow

The live website currently uses:

`data/publications.json`

This file is the baseline publication list recovered from the old WordPress website.

The automated publication fetcher writes candidates to:

`data/publications.generated.json`

That candidate file is intentionally not used live yet. Review it before replacing or merging with the baseline list, because automated metadata sources can miss older papers or split an author's publications across multiple author profiles.

Current automation source:

- Frédéric Bouchard ORCID: 0000-0003-4137-6250

Recommended long-term workflow:

1. Keep `data/publications.json` as the trusted live list.
2. Run the GitHub Action manually or weekly.
3. Compare `data/publications.generated.json` against the live list.
4. Merge genuinely new papers into `data/publications.json`.
