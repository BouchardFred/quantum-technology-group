# Quantum Technology Group website prototype

This is a plain static website prototype for GitHub Pages.

## Files

- `index.html` — home page
- `research.html` — research themes
- `people.html` — team page
- `person.html?id=fred` — individual person profile template
- `publications.html` — publication list
- `positions.html` — positions page
- `news.html` — news page
- `style.css` — site design
- `script.js` — renders people, publications, research themes, and news from JSON
- `data/people.json` — people database
- `data/publications.json` — publication database
- `data/research.json` — research themes
- `data/news.json` — news items
- `assets/img/` — placeholder images

## GitHub Pages upload

1. Open `https://github.com/BouchardFred/quantum-technology-group`
2. Click **Add file → Upload files**
3. Drag all files and folders from this package into the repository
4. Click **Commit changes**
5. Go to **Settings → Pages**
6. Use **Deploy from a branch**
7. Select `main` and `/root`
8. The staging URL should be:

`https://BouchardFred.github.io/quantum-technology-group/`

## Editing without coding

Most content lives in the JSON files under `data/`.

For example, to add a person:
- edit `data/people.json`
- copy an existing object
- change name, role, email, bio, image, aliases

For publication automation later:
- replace `data/publications.json` with data generated from a Zotero or BibTeX export
- the publication page and person pages will update automatically


## Publication automation note

This version still renders publications from `data/publications.json`. A later step can add a scheduled GitHub Action that queries reliable metadata sources such as ORCID, Crossref, arXiv, Semantic Scholar, or OpenAlex for the permanent staff scientists. Google Scholar is not ideal as an automated source because it does not provide a stable official publications API.

## People photos

Replace `assets/img/placeholder-person.svg` by adding headshots to `assets/img/people/` and updating the `image` field for each person in `data/people.json`.


## Publication automation: what I need next

To start automated publication updates, please provide at least one stable author identifier for each permanent staff scientist:
- ORCID iD (preferred)
- OpenAlex author ID
- Semantic Scholar author ID

Fill `data/publication-sources.template.json` and rename it to `data/publication-sources.json`. Once those IDs are available, a GitHub Action can fetch updated publications and rebuild `data/publications.json`.


## People photos in v4

This version uses the newly uploaded headshots and keeps card sizes consistent on the People page.
If any headshots need to be swapped to a different person, send the corrections and they can be updated quickly in one pass.


## v5 corrections

- Corrected the photo assignments based on user feedback.
- Removed unused `extra-1.jpg` and `extra-2.jpg`.
- Made all people cards the same size across staff, postdocs, and students.
- Fixed individual profile pages to use dark cards.
- Enlarged individual profile photos.
- Simplified the person-page publication heading to "Publications".
- Numbered publication lists.


## v6 updates

- Added Guillaume Thekkadath photo.
- Added real images for the supplied news stories.
- Restored visible role/title text on People cards.
- Updated roles to: staff scientist, postdoc, graduate student, undergraduate student as requested.


## v7 group-life photos

Added a subtle "Outside the lab" mosaic to the People page, plus a small homepage strip linking to it.
Images are stored in `assets/img/group/`.
