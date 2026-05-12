
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return await response.json();
}

function setActiveNav() {
  const file = location.pathname.split("/").pop() || "index.html";
  $$(".site-nav a").forEach(a => {
    if (a.getAttribute("href") === file) a.style.color = "var(--accent-dark)";
  });
}

function setupNav() {
  const toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", () => document.body.classList.toggle("nav-open"));
}

function renderResearchCards(themes, selector, limit = themes.length) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = themes.slice(0, limit).map(t => `
    <article class="card">
      <h3>${t.title}</h3>
      <p>${t.short}</p>
      <div class="tag-row">${t.keywords.slice(0,3).map(k => `<span class="tag">${k}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderResearchList(themes) {
  const el = $("#research-list");
  if (!el) return;
  el.innerHTML = themes.map(t => `
    <article class="research-item">
      <div>
        <p class="eyebrow">${t.id.replaceAll("-", " ")}</p>
        <h2>${t.title}</h2>
        <p>${t.body}</p>
      </div>
      <div class="tag-row">${t.keywords.map(k => `<span class="tag">${k}</span>`).join("")}</div>
    </article>
  `).join("");
}

function personMatchesPublication(person, pub) {
  const text = `${pub.authors} ${pub.venue}`.toLowerCase();
  return (person.aliases || [person.name]).some(alias => text.includes(alias.toLowerCase()));
}

function shortBio(bio) {
  if (!bio) return "Bio coming soon.";
  return bio.length > 145 ? bio.slice(0, 142) + "…" : bio;
}

function renderPeople(people) {
  const grid = $("#people-grid");
  if (!grid) return;
  const search = $("#people-search");
  function draw() {
    const q = (search?.value || "").toLowerCase().trim();
    const filtered = people.filter(p => `${p.name} ${p.role} ${p.bio}`.toLowerCase().includes(q));
    grid.innerHTML = filtered.map(p => `
      <a class="person-card" href="person.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.image}" alt="">
        <div>
          <h3>${p.name}</h3>
          <p><strong>${p.role}</strong></p>
          <p>${shortBio(p.bio)}</p>
        </div>
      </a>
    `).join("");
  }
  search?.addEventListener("input", draw);
  draw();
}

function renderHomePeople(people) {
  const el = $("#home-people");
  if (!el) return;
  el.innerHTML = people.slice(0,6).map(p => `
    <div class="mini-person">
      <strong>${p.name}</strong><br>
      <span>${p.role}</span>
    </div>
  `).join("");
}

function cleanTitle(title) {
  return (title || "").replace(/,$/, "");
}

function renderPublication(pub) {
  const year = pub.year ? `<span class="tag">${pub.year}</span>` : "";
  const link = pub.url ? `<a href="${pub.url}" target="_blank" rel="noopener">Link</a>` : "";
  return `
    <article class="publication">
      <div class="tag-row">${year}</div>
      <h3>${cleanTitle(pub.title)}</h3>
      <p>${pub.authors}</p>
      <p>${pub.venue}</p>
      ${link}
    </article>
  `;
}

function renderPublications(publications) {
  const list = $("#publication-list");
  if (!list) return;
  const search = $("#pub-search");
  const yearSelect = $("#pub-year");
  const years = [...new Set(publications.map(p => p.year).filter(Boolean))];
  years.sort((a,b) => String(b).localeCompare(String(a)));
  yearSelect.innerHTML += years.map(y => `<option value="${y}">${y}</option>`).join("");

  function draw() {
    const q = (search.value || "").toLowerCase();
    const y = yearSelect.value;
    const filtered = publications.filter(p => {
      const text = `${p.title} ${p.authors} ${p.venue} ${p.year}`.toLowerCase();
      return (!q || text.includes(q)) && (!y || String(p.year) === y);
    });
    list.innerHTML = filtered.map(renderPublication).join("");
  }
  search.addEventListener("input", draw);
  yearSelect.addEventListener("change", draw);
  draw();
}

function renderPersonPage(people, publications) {
  const container = $("#person-profile");
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "fred";
  const person = people.find(p => p.id === id) || people[0];

  document.title = `${person.name} | Quantum Technology Group`;
  container.innerHTML = `
    <img class="person-photo" src="${person.image}" alt="">
    <div class="person-meta">
      <p class="eyebrow">${person.role}</p>
      <h1>${person.name}</h1>
      ${person.email ? `<p><strong>Email:</strong> <a href="mailto:${person.email}">${person.email}</a></p>` : ""}
      <p>${person.bio || "Bio coming soon."}</p>
    </div>
  `;

  $("#person-pub-heading").textContent = `Publications with ${person.name}`;
  const matches = publications.filter(pub => personMatchesPublication(person, pub));
  $("#person-publications").innerHTML = matches.length
    ? matches.map(renderPublication).join("")
    : `<p>No matched publications yet. Add aliases in <code>data/people.json</code> to improve automatic matching.</p>`;
}

function renderNews(news) {
  const preview = $("#news-preview");
  if (preview) {
    preview.innerHTML = news.slice(0,3).map(n => `
      <article class="card">
        <p class="eyebrow">${n.date}</p>
        <h3>${n.title}</h3>
        <p>${n.body}</p>
      </article>
    `).join("");
  }
  const list = $("#news-list");
  if (list) {
    list.innerHTML = news.map(n => `
      <article class="news-item">
        <p class="eyebrow">${n.date}</p>
        <h3>${n.title}</h3>
        <p>${n.body}</p>
      </article>
    `).join("");
  }
}

async function main() {
  setupNav();
  setActiveNav();

  const [people, publications, research, news] = await Promise.all([
    loadJSON("data/people.json"),
    loadJSON("data/publications.json"),
    loadJSON("data/research.json"),
    loadJSON("data/news.json")
  ]);

  renderResearchCards(research, "#research-preview", 5);
  renderResearchList(research);
  renderPeople(people);
  renderHomePeople(people);
  renderPublications(publications);
  renderPersonPage(people, publications);
  renderNews(news);
}

main().catch(err => {
  console.error(err);
  const mainEl = document.querySelector("main");
  if (mainEl) {
    const warning = document.createElement("div");
    warning.className = "section";
    warning.innerHTML = `<div class="content-card"><h2>Loading issue</h2><p>The site loaded, but one of the data files could not be read. This usually happens when previewing locally by double-clicking HTML files. Upload to GitHub Pages or run a local server to preview dynamic data.</p></div>`;
    mainEl.prepend(warning);
  }
});
