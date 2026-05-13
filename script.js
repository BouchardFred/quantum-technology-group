
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
    if (a.getAttribute("href") === file || (file === "research-area.html" && a.getAttribute("href") === "research.html") || (file === "person.html" && a.getAttribute("href") === "people.html")) {
      a.classList.add("active");
    }
  });
}

function setupNav() {
  const toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", () => document.body.classList.toggle("nav-open"));
}

function cleanTitle(title) {
  return (title || "").replace(/,$/, "");
}

function renderResearchCards(themes, selector, limit = themes.length) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = themes.slice(0, limit).map(t => `
    <a class="card research-card" href="research-area.html?id=${encodeURIComponent(t.id)}">
      <h3>${t.title}</h3>
      <p>${t.short}</p>
      <div class="tag-row">${t.keywords.slice(0,3).map(k => `<span class="tag">${k}</span>`).join("")}</div>
      <span class="card-link">View area →</span>
    </a>
  `).join("");
}

function renderResearchList(themes) {
  const el = $("#research-list");
  if (!el) return;
  el.innerHTML = themes.map(t => `
    <a class="research-item research-card" href="research-area.html?id=${encodeURIComponent(t.id)}">
      <div>
        <p class="eyebrow">${t.id.replaceAll("-", " ")}</p>
        <h2>${t.title}</h2>
        <p>${t.body}</p>
        <span class="card-link">Related projects and publications →</span>
      </div>
      <div>
        <div class="tag-row">${t.keywords.map(k => `<span class="tag">${k}</span>`).join("")}</div>
      </div>
    </a>
  `).join("");
}

function matchesTopic(pub, topic) {
  const hay = `${pub.title} ${pub.authors} ${pub.venue}`.toLowerCase();
  return (topic.publicationKeywords || []).some(k => hay.includes(k.toLowerCase()));
}

function renderResearchArea(themes, publications) {
  const hero = $("#research-area-hero");
  if (!hero) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || themes[0].id;
  const topic = themes.find(t => t.id === id) || themes[0];
  document.title = `${topic.title} | Quantum Technology Group`;
  hero.querySelector("h1").textContent = topic.title;
  hero.querySelector("p:last-child").textContent = topic.short;

  $("#research-area-body").innerHTML = `
    <h2>Overview</h2>
    <p>${topic.body}</p>
    <h2>Projects</h2>
    <ul class="clean-list">${(topic.projects || []).map(p => `<li>${p}</li>`).join("")}</ul>
  `;
  $("#research-area-keywords").innerHTML = topic.keywords.map(k => `<span class="tag">${k}</span>`).join("");

  const related = publications.filter(p => matchesTopic(p, topic)).slice(0, 12);
  $("#research-area-publications").innerHTML = related.length
    ? related.map(renderPublication).join("")
    : `<p>No related publications have been tagged yet.</p>`;
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
  const wrap = $("#people-groups");
  if (!wrap) return;
  const search = $("#people-search");
  const categories = ["Staff Scientists", "Postdocs", "Students"];

  function personCard(p) {
    return `
      <a class="person-card" href="person.html?id=${encodeURIComponent(p.id)}">
        <img src="${p.image}" alt="">
        <div>
          <h3>${p.name}</h3>
          <p><strong>${p.role}</strong></p>
          <p>${shortBio(p.bio)}</p>
        </div>
      </a>
    `;
  }

  function draw() {
    const q = (search?.value || "").toLowerCase().trim();
    const filtered = people.filter(p => `${p.name} ${p.role} ${p.category} ${p.bio}`.toLowerCase().includes(q));
    wrap.innerHTML = categories.map(cat => {
      const members = filtered.filter(p => p.category === cat);
      if (!members.length) return "";
      return `
        <section class="people-section">
          <h2>${cat}</h2>
          <div class="people-grid">${members.map(personCard).join("")}</div>
        </section>
      `;
    }).join("");
  }
  search?.addEventListener("input", draw);
  draw();
}

function renderHomePeople(people) {
  const el = $("#home-people");
  if (!el) return;
  el.innerHTML = people.slice(0,6).map(p => `
    <a class="mini-person" href="person.html?id=${encodeURIComponent(p.id)}">
      <strong>${p.name}</strong><br>
      <span>${p.role}</span>
    </a>
  `).join("");
}

function isPreprint(pub) {
  const y = String(pub.year || "").toLowerCase();
  const venue = String(pub.venue || "").toLowerCase();
  return y.includes("preprint") || venue.includes("arxiv");
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
  const legacyList = $("#publication-list");
  const sections = $("#publication-sections");
  if (!legacyList && !sections) return;

  const search = $("#pub-search");
  const yearSelect = $("#pub-year");
  const years = [...new Set(publications.map(p => p.year).filter(y => y && !String(y).toLowerCase().includes("preprint")))];
  years.sort((a,b) => Number(b) - Number(a));
  if (yearSelect) yearSelect.innerHTML += years.map(y => `<option value="${y}">${y}</option>`).join("");

  function filteredPubs() {
    const q = (search?.value || "").toLowerCase();
    const y = yearSelect?.value || "";
    return publications.filter(p => {
      const text = `${p.title} ${p.authors} ${p.venue} ${p.year}`.toLowerCase();
      return (!q || text.includes(q)) && (!y || String(p.year) === y);
    });
  }

  function draw() {
    const pubs = filteredPubs();
    if (legacyList) legacyList.innerHTML = pubs.map(renderPublication).join("");
    if (!sections) return;

    const preprints = pubs.filter(isPreprint);
    const published = pubs.filter(p => !isPreprint(p));
    const grouped = {};
    published.forEach(p => {
      const y = p.year || "Other";
      if (!grouped[y]) grouped[y] = [];
      grouped[y].push(p);
    });
    const orderedYears = Object.keys(grouped).sort((a,b) => Number(b) - Number(a));

    let html = "";
    if (preprints.length) {
      html += `<section class="publication-year"><h2>Preprints</h2><div class="publication-list">${preprints.map(renderPublication).join("")}</div></section>`;
    }
    html += orderedYears.map(y => `
      <section class="publication-year">
        <h2>${y}</h2>
        <div class="publication-list">${grouped[y].map(renderPublication).join("")}</div>
      </section>
    `).join("");

    sections.innerHTML = html || `<p>No publications matched the current filters.</p>`;
  }
  search?.addEventListener("input", draw);
  yearSelect?.addEventListener("change", draw);
  draw();
}

function renderPersonPage(people, publications) {
  const container = $("#person-profile");
  if (!container) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || people[0].id;
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
  const card = n => `
    <article class="card">
      <p class="eyebrow">${n.date}</p>
      <h3>${n.title}</h3>
      <p>${n.body}</p>
      ${n.url ? `<a class="card-link" href="${n.url}" target="_blank" rel="noopener">Read story →</a>` : ""}
    </article>
  `;
  if (preview) preview.innerHTML = news.slice(0,3).map(card).join("");

  const list = $("#news-list");
  if (list) {
    list.innerHTML = news.map(n => `
      <article class="news-item">
        <p class="eyebrow">${n.date}</p>
        <h3>${n.title}</h3>
        <p>${n.body}</p>
        ${n.url ? `<a class="card-link" href="${n.url}" target="_blank" rel="noopener">Read story →</a>` : ""}
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
  renderResearchArea(research, publications);
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
