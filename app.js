/* Suivi MLDS – widget Grist (pilotage, jeunes suivis, agenda).
   Lit les tables du document « Suivi MLDS Nouvelle-Aquitaine » et y écrit les nouvelles actions.
   Hors de Grist, s'affiche en mode démonstration avec des données fictives (demo.js). */

let DEMO = false;
let D = null;                 // données normalisées
let VUE = "pilotage";
let PERIODE = "annee";        // "annee" | "annee-1" | "12m"
let CHEMIN = [];              // descente : [{niv:"aca",id}, {niv:"dep",id}, {niv:"etab",id}]
let FILTRE_J = "en_cours", RECH = "", FAMILLE = "", OUVERTS = new Set(), JEUNE_OUVERT = null;
let ORIGINE = null;           // écran d'où l'on vient quand on ouvre la fiche d'un jeune

/* ---------- navigation : chaque écran est une étape de l'historique (bouton Retour du navigateur) ---------- */
function etat() {
  return { VUE, CHEMIN: CHEMIN.map(c => ({ ...c })), FILTRE_J, RECH, FAMILLE, JEUNE_OUVERT, ORIGINE,
    R: typeof R_TYPE !== "undefined" ? { R_TYPE, R_ANNEE, R_TRIM, R_TERR, R_ACTION, R_ETAB } : null };
}
function appliquer(e) {
  if (!e) return;
  ({ VUE, FILTRE_J, RECH, FAMILLE, JEUNE_OUVERT, ORIGINE } = e); CHEMIN = (e.CHEMIN || []).map(c => ({ ...c }));
  if (e.R) ({ R_TYPE, R_ANNEE, R_TRIM, R_TERR, R_ACTION, R_ETAB } = e.R);
}
function naviguer(changer) {
  changer();
  try { history.pushState(etat(), "", "#" + VUE); } catch (err) { /* historique indisponible */ }
  rendre(); window.scrollTo(0, 0);
}
window.addEventListener("popstate", ev => { if (ev.state) { appliquer(ev.state); rendre(); } });
let SEMAINE = lundi(aujourdhui()), AGENT_CAL = "";

const AXE_COUL = { "Suivi individuel": "var(--suivi)", "Pédagogie": "var(--peda)", "Ingénierie technique": "var(--inge)",
  "Formation dispensée": "var(--form)", "Formation suivie": "var(--autre)", "Gestion": "var(--autre)" };
const AXES = Object.keys(AXE_COUL);
const SORTIES_POS = DEVENIRS.filter(d => d[1] === "Positive").map(d => d[0]);
const SORTIES = DEVENIRS.map(d => d[0]);
const ABANDON = "Abandon en cours d'action, injoignables";
const PARTENAIRES = ["Mission locale", "E2C", "Epide", "CFA", "Greta", "Collectivité", "Services sociaux", "PJJ", "CIO", "Entreprise", "Association", "Autre"];
const NIVEAUX = ["EPLE", "District / bassin", "Départemental", "Académique", "Régional"];
const STATUTS = ["Scolarisé - en risque", "Scolarisé - absentéiste", "Sorti sans solution", "Sans affectation", "En action MLDS", "Autre"];
const ALERTE_LIB = {
  aucune: ["Aucune action depuis l'entrée", "ko"], silence: ["Sans action récente", "warn"],
  cumul: ["Cumul de difficultés", "warn"], perdu: ["Abandon / injoignable", "ko"] };

/* ---------- dates (Grist : secondes depuis 1970, minuit UTC) ---------- */
function aujourdhui() { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 1000; }
function jour(s) { return s ? Math.floor(s / 86400) : null; }
function jours(a, b) { return jour(a) - jour(b); }
function fmt(s, court) {
  if (!s) return "–";
  const d = new Date(s * 1000);
  return d.toLocaleDateString("fr-FR", court ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}
function lundi(s) { const d = new Date(s * 1000); const w = (d.getUTCDay() + 6) % 7; return s - w * 86400; }
function anneeScolaire(s) { const d = new Date(s * 1000); const y = d.getUTCFullYear(); return d.getUTCMonth() >= 8 ? y : y - 1; }
function bornes() {
  const t = aujourdhui(), a = anneeScolaire(t);
  if (PERIODE === "12m") return [t - 365 * 86400, t, "12 derniers mois"];
  const y = PERIODE === "annee-1" ? a - 1 : a;
  return [Date.UTC(y, 8, 1) / 1000, Date.UTC(y + 1, 7, 31) / 1000, `année scolaire ${y}-${y + 1}`];
}

/* ---------- utilitaires ---------- */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const liste = v => Array.isArray(v) ? v.filter(x => x !== "L") : (v ? [v] : []);
const pct = x => x == null ? "–" : Math.round(x * 100) + " %";
const dec = x => x == null ? "–" : String(Math.round(x * 10) / 10).replace(".", ",");
const ent = x => x == null ? "–" : Math.round(x).toLocaleString("fr-FR");
function lignes(t) {
  if (!t || !t.id) return [];
  const cols = Object.keys(t);
  return t.id.map((_, i) => { const o = {}; cols.forEach(c => o[c] = t[c][i]); return o; });
}
function toast(m) { const e = document.createElement("div"); e.className = "toast"; e.textContent = m; document.body.appendChild(e); setTimeout(() => e.remove(), 2600); }

/* ---------- chargement ---------- */
const TABLES = ["Academies", "Departements", "Bassins", "Etablissements", "Agents", "Motifs", "Types_activite", "Seuils", "Jeunes", "Activites",
  "Parcours", "Dispositifs", "Motifs_entree", "Classes_origine"];

async function charger() {
  try {
    const res = await Promise.all(TABLES.map(t => grist.docApi.fetchTable(t).catch(() => null)));
    const brut = {}; TABLES.forEach((t, i) => brut[t] = lignes(res[i]));
    if (!brut.Jeunes.length && !brut.Activites.length && !brut.Departements.length) throw new Error("tables introuvables");
    DEMO = false; preparer(brut); rendre();
  } catch (e) {
    document.getElementById("bandeau").innerHTML = `<div class="err">Lecture du document impossible (${esc(e.message)}). Vérifiez que le widget a l'accès complet au document.</div>`;
  }
}

function preparer(b) {
  const idx = arr => new Map(arr.map(r => [r.id, r]));
  const d = {
    aca: idx(b.Academies), dep: idx(b.Departements), etab: idx(b.Etablissements), agents: idx(b.Agents),
    motifs: idx(b.Motifs), types: idx(b.Types_activite), seuils: b.Seuils[0] || {},
    jeunes: b.Jeunes, acts: b.Activites,
  };
  const s = d.seuils;
  s.Sans_premiere_action_j ??= 15; s.Sans_action_j ??= 30; s.Cumul_motifs ??= 3; s.Jeunes_sans_GPDS ??= 10;
  s.Part_attention ??= 0.2; s.Baisse_activite ??= -0.2; s.Agent_sans_saisie_j ??= 15;
  const t = aujourdhui();
  const agentDep = a => (d.agents.get(a) || {}).Departement || 0;
  const depAca = dp => (d.dep.get(dp) || {}).Academie || 0;
  // jeunes
  const parJeune = new Map();
  d.jeunes.forEach(j => {
    j.etab = j.Etablissement || 0;
    j.depId = (d.etab.get(j.etab) || {}).Departement || agentDep(j.Agent_referent);
    j.acaId = depAca(j.depId);
    j.motif = d.motifs.get(j.Motif_principal) || null;
    j.secondaires = liste(j.Motifs_secondaires).map(m => d.motifs.get(m)).filter(Boolean);
    j.nbMotifs = (j.motif ? 1 : 0) + j.secondaires.length + liste(j.Profils).length;
    j.actions = [];
    parJeune.set(j.id, j);
  });
  // activités
  d.acts.forEach(a => {
    a.type = d.types.get(a.Type) || {};
    a.axe = a.type.Axe || "Gestion";
    const j = parJeune.get(a.Jeune);
    a.etabEff = a.Etablissement || (j ? j.etab : 0);
    a.depId = (d.etab.get(a.etabEff) || {}).Departement || (j ? j.depId : 0) || agentDep(a.Agent);
    a.acaId = depAca(a.depId);
    if (j) j.actions.push(a);
  });
  d.jeunes.forEach(j => {
    j.actions.sort((x, y) => (y.Date || 0) - (x.Date || 0));
    j.dernier = j.actions.length ? j.actions[0].Date : null;
    j.premier = j.actions.length ? j.actions[j.actions.length - 1].Date : null;
    j.enCours = !j.Date_sortie_suivi;
    j.delai = j.premier && j.Date_entree_suivi ? jours(j.premier, j.Date_entree_suivi) : null;
    j.sansAction = j.enCours && j.Date_entree_suivi ? jours(t, j.dernier || j.Date_entree_suivi) : null;
    j.alertes = [];
    if (j.enCours && !j.actions.length && j.Date_entree_suivi && jours(t, j.Date_entree_suivi) > s.Sans_premiere_action_j) j.alertes.push("aucune");
    else if (j.sansAction != null && j.sansAction > s.Sans_action_j) j.alertes.push("silence");
    if (j.nbMotifs >= s.Cumul_motifs) j.alertes.push("cumul");
    if (j.Situation_sortie === ABANDON) j.alertes.push("perdu");
  });
  // agents : dernière saisie
  d.agents.forEach(a => { a.derniere = null; });
  d.acts.forEach(a => { const ag = d.agents.get(a.Agent); if (ag && a.Date && (!ag.derniere || a.Date > ag.derniere)) ag.derniere = a.Date; });
  preparerParcours(d, b);
  D = d;
}

/* ---------- indicateurs pour un territoire ---------- */
function filtreTerritoire(niv, id) {
  if (!niv) return () => true;
  if (niv === "etab") return x => (x.etabEff ?? x.etab) === id;
  const k = niv === "aca" ? "acaId" : "depId";
  return x => x[k] === id;
}
function indicateurs(niv, id) {
  const [deb, fin] = bornes(), f = filtreTerritoire(niv, id), s = D.seuils;
  const jeunes = D.jeunes.filter(j => f(j) && j.Date_entree_suivi && j.Date_entree_suivi <= fin && (!j.Date_sortie_suivi || j.Date_sortie_suivi >= deb));
  const acts = D.acts.filter(a => f(a) && a.Date >= deb && a.Date <= fin);
  const actsJ = acts.filter(a => a.Jeune);
  const sorties = jeunes.filter(j => j.Date_sortie_suivi && j.Date_sortie_suivi >= deb && j.Date_sortie_suivi <= fin);
  const delais = jeunes.map(j => j.delai).filter(x => x != null);
  const attention = jeunes.filter(j => j.alertes.length);
  // évolution : 90 derniers jours vs même période un an plus tôt
  const t = aujourdhui();
  const recent = D.acts.filter(a => f(a) && a.Date && jours(t, a.Date) >= 0 && jours(t, a.Date) < 90).length;
  const avant = D.acts.filter(a => f(a) && a.Date && jours(t, a.Date) >= 365 && jours(t, a.Date) < 455).length;
  const commissions = acts.filter(a => ["IF_GPDS", "IF_COMM", "IF_PSAD", "IF_AFFECT"].includes(a.type.Code));
  const r = {
    jeunes, acts, nbJeunes: jeunes.length, enCours: jeunes.filter(j => j.enCours).length,
    nbActs: acts.length, heures: acts.reduce((x, a) => x + (a.Duree_h || 0), 0),
    actsParJeune: jeunes.length ? actsJ.length / jeunes.length : null,
    delai: delais.length ? delais.reduce((x, y) => x + y, 0) / delais.length : null,
    attention, partAttention: jeunes.length ? attention.length / jeunes.length : 0,
    sorties: sorties.length, sortiesPos: sorties.length ? sorties.filter(j => SORTIES_POS.includes(j.Situation_sortie)).length / sorties.length : null,
    evol: avant ? (recent - avant) / avant : null,
    commissions: commissions.length, situations: acts.reduce((x, a) => x + (a.Nb_situations_examinees || 0), 0),
    hStagiaires: acts.filter(a => a.axe === "Formation dispensée").reduce((x, a) => x + (a.Duree_h || 0) * (a.Nb_participants || 0), 0),
    gpds: acts.filter(a => a.type.Code === "IF_GPDS").length,
  };
  r.signaux = [];
  if (r.nbJeunes && r.partAttention > s.Part_attention) r.signaux.push(["Jeunes en attention", "ko"]);
  if (r.actsParJeune != null && r.actsParJeune < 2.5 && r.nbJeunes >= 5) r.signaux.push(["Peu d'actions par jeune", "warn"]);
  if (r.evol != null && r.evol < s.Baisse_activite) r.signaux.push(["Activité en baisse", "ko"]);
  if (niv === "etab" && r.nbJeunes >= s.Jeunes_sans_GPDS && r.gpds === 0) r.signaux.push(["Aucun GPDS", "ko"]);
  return r;
}

/* ---------- rendu ---------- */
function rendre() {
  if (!D) return;
  const [, , lib] = bornes();
  document.getElementById("bandeau").innerHTML = DEMO ? `<div class="demo">Mode démonstration : données fictives (le widget n'est pas ouvert dans Grist).</div>` : "";
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.v === VUE));
  const v = document.getElementById("vue");
  if (VUE === "pilotage") v.innerHTML = vuePilotage(lib);
  else if (VUE === "jeunes") v.innerHTML = vueJeunes();
  else if (VUE === "rapports") v.innerHTML = vueRapports();
  else v.innerHTML = vueAgenda();
}

function nomTerritoire(niv, id) {
  if (!niv) return "Région académique Nouvelle-Aquitaine";
  if (niv === "aca") return "Académie de " + ((D.aca.get(id) || {}).Academie || "?");
  if (niv === "dep") { const d = D.dep.get(id) || {}; return `${d.Departement || "?"} (${d.Code || ""})`; }
  return (D.etab.get(id) || {}).Nom || "Sans établissement";
}

function vuePilotage(lib) {
  const cur = CHEMIN[CHEMIN.length - 1] || {};
  const I = indicateurs(cur.niv, cur.id), s = D.seuils;
  const crumb = [`<button data-go="0">Région académique</button>`].concat(CHEMIN.map((c, i) =>
    i === CHEMIN.length - 1 ? `<b>${esc(nomTerritoire(c.niv, c.id))}</b>` : `<button data-go="${i + 1}">${esc(nomTerritoire(c.niv, c.id))}</button>`));
  if (!CHEMIN.length) crumb[0] = `<b>Région académique Nouvelle-Aquitaine</b>`;
  const kpi = (v, l, cls = "", em = "") => `<div class="kpi ${cls}"><b>${v}</b><span>${l}</span>${em ? `<em>${em}</em>` : ""}</div>`;
  const evol = I.evol == null ? "" : `<span class="${I.evol < s.Baisse_activite ? "koc" : ""}">${I.evol >= 0 ? "+" : ""}${Math.round(I.evol * 100)} % sur 3 mois vs N-1</span>`;
  // sous-territoires
  const sousNiv = !cur.niv ? "aca" : cur.niv === "aca" ? "dep" : cur.niv === "dep" ? "etab" : null;
  let sous = "";
  if (sousNiv) {
    let ids;
    if (sousNiv === "aca") ids = [...D.aca.keys()];
    else if (sousNiv === "dep") ids = [...D.dep.values()].filter(x => x.Academie === cur.id).map(x => x.id);
    else ids = [...D.etab.values()].filter(x => x.Departement === cur.id).map(x => x.id);
    const rows = ids.map(id => ({ id, I: indicateurs(sousNiv, id) })).filter(r => r.I.nbJeunes || r.I.nbActs)
      .sort((a, b) => b.I.partAttention - a.I.partAttention || b.I.nbJeunes - a.I.nbJeunes);
    const libNiv = { aca: "Académies", dep: "Départements", etab: "Établissements" }[sousNiv];
    sous = `<div class="card"><h2>${libNiv}<small>du plus au moins préoccupant · cliquer pour descendre</small></h2><div class="scroll"><table class="tbl">
      <thead><tr><th>${libNiv.slice(0, -1)}</th><th class="n">Jeunes suivis</th><th class="n">Actions / jeune</th><th class="n">Délai 1re action</th>
      <th class="n">En point d'attention</th><th class="n">Sorties positives</th>${sousNiv === "etab" ? '<th class="n">GPDS</th>' : '<th class="n">Évol. 3 mois</th>'}<th>Signal</th></tr></thead><tbody>
      ${rows.map(({ id, I: r }) => `<tr class="click" data-niv="${sousNiv}" data-id="${id}">
        <td class="name"><b>${esc(nomTerritoire(sousNiv, id))}</b></td>
        <td class="n">${r.nbJeunes}</td>
        <td class="n ${r.actsParJeune != null && r.actsParJeune < 2.5 ? "warnc" : ""}">${dec(r.actsParJeune)}</td>
        <td class="n ${r.delai > 15 ? "warnc" : ""}">${r.delai == null ? "–" : Math.round(r.delai) + " j"}</td>
        <td class="n"><span class="meter ${r.partAttention > s.Part_attention ? "ko" : r.partAttention > s.Part_attention / 2 ? "warn" : ""}">${r.attention.length} · ${pct(r.partAttention)}<i><u style="width:${Math.min(100, r.partAttention * 200)}%"></u></i></span></td>
        <td class="n ${r.sortiesPos != null && r.sortiesPos < .5 ? "warnc" : ""}">${pct(r.sortiesPos)}</td>
        ${sousNiv === "etab" ? `<td class="n ${r.gpds === 0 && r.nbJeunes >= s.Jeunes_sans_GPDS ? "koc" : ""}">${r.gpds}</td>` : `<td class="n ${r.evol != null && r.evol < s.Baisse_activite ? "koc" : ""}">${r.evol == null ? "–" : (r.evol >= 0 ? "+" : "") + Math.round(r.evol * 100) + " %"}</td>`}
        <td>${r.signaux.map(([l, c]) => `<span class="tag ${c}">${l}</span>`).join("") || '<span class="tag ok">RAS</span>'}</td></tr>`).join("") || `<tr><td colspan="8" class="vide">Aucune donnée sur la période.</td></tr>`}
      </tbody></table></div></div>`;
  } else {
    sous = `<div class="card"><h2>Jeunes suivis<small>${esc(nomTerritoire(cur.niv, cur.id))}</small></h2>${tableJeunes(I.jeunes)}</div>`;
  }
  // points d'attention
  const cpt = k => I.jeunes.filter(j => j.alertes.includes(k)).length;
  const agentsMuets = [...D.agents.values()].filter(a => a.Role_Grist === "Agent" && (!cur.niv || (cur.niv === "aca" ? (D.dep.get(a.Departement) || {}).Academie === cur.id : cur.niv === "dep" ? a.Departement === cur.id : false))
    && (!a.derniere || jours(aujourdhui(), a.derniere) > s.Agent_sans_saisie_j));
  const al = [
    ["aucune", cpt("aucune"), "jeunes sans aucune action depuis leur entrée", `entrés depuis plus de ${s.Sans_premiere_action_j} jours`, "ko"],
    ["silence", cpt("silence"), "jeunes sans action récente", `plus de ${s.Sans_action_j} jours sans action`, "warn"],
    ["perdu", cpt("perdu"), "abandons ou jeunes injoignables", "à la sortie du suivi", "ko"],
    ["cumul", cpt("cumul"), "jeunes cumulant plusieurs difficultés", `${s.Cumul_motifs} motifs ou plus`, "warn"],
  ].filter(x => x[1]);
  const alertes = `<div class="card"><h2>Points d'attention</h2>${al.length || agentsMuets.length ? `<ul class="alerts">
    ${al.map(([k, n, l, sm, c]) => `<li class="${c}" data-alerte="${k}"><b>${n}</b><span>${l}<small>${sm}</small></span></li>`).join("")}
    ${agentsMuets.length ? `<li class="warn" title="${esc(agentsMuets.map(a => `${a.Prenom} ${a.Nom}`).join(", "))}"><b>${agentsMuets.length}</b><span>agent(s) sans saisie depuis ${s.Agent_sans_saisie_j} jours<small>les chiffres de leur secteur sont sous-estimés</small></span></li>` : ""}
    </ul>` : `<p class="vide">Aucun point d'attention.</p>`}</div>`;
  return `
    <div class="crumb">${CHEMIN.length ? `<button class="btn sec retour" data-go="${CHEMIN.length - 1}">← Remonter</button>` : ""}${crumb.join('<span class="sep">›</span>')}<span class="sep">·</span><span style="color:var(--muted)">${esc(lib)}</span></div>
    <div class="kpis">
      ${kpi(I.nbJeunes, "jeunes suivis", "", `${I.enCours} en cours`)}
      ${kpi(ent(I.nbActs), "actions menées", "", `${ent(I.heures)} h · ${evol}`)}
      ${kpi(dec(I.actsParJeune), "actions par jeune", I.actsParJeune != null && I.actsParJeune < 2.5 ? "warn" : "")}
      ${kpi(I.delai == null ? "–" : Math.round(I.delai) + " j", "délai moyen avant la 1re action", I.delai > 15 ? "warn" : "")}
      ${kpi(pct(I.sortiesPos), "sorties positives", I.sortiesPos != null && I.sortiesPos < .5 ? "warn" : "ok", `${I.sorties} sortie(s)`)}
      ${kpi(I.attention.length, "jeunes en point d'attention", I.partAttention > s.Part_attention ? "ko" : "", pct(I.partAttention))}
    </div>
    <div class="grid2">${sous}${alertes}</div>
    <div class="grid2b">
      <div class="card"><h2>Tendance<small>actions par mois, comparées à l'année précédente</small></h2>${courbe(cur)}</div>
      <div class="card"><h2>Nature des actions<small>heures par axe</small></h2>${barresAxes(I.acts)}
        <h2 style="margin-top:18px">Profil des jeunes<small>motif principal</small></h2>${barresMotifs(I.jeunes)}</div>
    </div>
    <div class="grid2b">
      <div class="card"><h2>Commissions et formation</h2>
        <table class="tbl"><tbody>
          <tr><td>Commissions (GPDS, PSAD, affectation…)</td><td class="n"><b>${I.commissions}</b></td></tr>
          <tr><td>Situations examinées</td><td class="n"><b>${ent(I.situations)}</b></td></tr>
          <tr><td>Heures-stagiaires de formation dispensée</td><td class="n"><b>${ent(I.hStagiaires)}</b></td></tr>
        </tbody></table></div>
      <div class="card"><h2>Lecture selon le référentiel CPIF<small>BO n° 29 du 21-7-2016</small></h2>${barresDomaines(I.acts)}</div>
    </div>`;
}

function courbe(cur) {
  const f = filtreTerritoire(cur.niv, cur.id), t = new Date(aujourdhui() * 1000);
  const mois = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - i, 1)); mois.push([d.getUTCFullYear(), d.getUTCMonth()]); }
  const cle = (y, m) => y * 12 + m, n = new Map(), n1 = new Map();
  D.acts.forEach(a => { if (!a.Date || !f(a)) return; const d = new Date(a.Date * 1000); const k = cle(d.getUTCFullYear(), d.getUTCMonth()); n.set(k, (n.get(k) || 0) + 1); });
  const v = mois.map(([y, m]) => n.get(cle(y, m)) || 0), v1 = mois.map(([y, m]) => n.get(cle(y - 1, m)) || 0);
  const max = Math.max(10, ...v, ...v1), W = 520, H = 190, x0 = 36, y0 = 160;
  const X = i => x0 + i * (W - x0 - 10) / 11, Y = val => y0 - val / max * (y0 - 14);
  const pts = arr => arr.map((val, i) => `${X(i).toFixed(1)},${Y(val).toFixed(1)}`).join(" ");
  const nomsMois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const graduations = [0, .5, 1].map(r => Math.round(max * r));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Actions par mois">
    ${graduations.map(g => `<line x1="${x0}" x2="${W - 10}" y1="${Y(g)}" y2="${Y(g)}" stroke="#e5e5e5"/><text x="${x0 - 6}" y="${Y(g) + 4}" text-anchor="end">${g}</text>`).join("")}
    ${mois.map(([, m], i) => `<text x="${X(i)}" y="${H - 12}" text-anchor="middle">${nomsMois[m]}</text>`).join("")}
    ${v1.some(x => x) ? `<polyline points="${pts(v1)}" fill="none" stroke="#c9c9c9" stroke-width="2" stroke-dasharray="4 4"/>` : ""}
    <polyline points="${pts(v)}" fill="none" stroke="#000091" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${X(11)}" cy="${Y(v[11])}" r="4" fill="#000091"/>
  </svg><div class="legend"><span><i style="background:#000091"></i>12 derniers mois</span><span><i style="background:#c9c9c9"></i>année précédente</span><span>Le mois en cours est incomplet.</span></div>`;
}
function barres(items, total) {
  return items.map(([lib, val, coul]) => `<div class="hbar"><span>${esc(lib)}</span><div><i style="width:${total ? val / total * 100 : 0}%;background:${coul}"></i></div><b>${ent(val)}</b></div>`).join("") || `<p class="vide">Aucune donnée.</p>`;
}
function barresAxes(acts) {
  const h = {}; acts.forEach(a => h[a.axe] = (h[a.axe] || 0) + (a.Duree_h || 0));
  const max = Math.max(0, ...Object.values(h));
  return barres(AXES.filter(x => h[x]).map(x => [x, h[x], AXE_COUL[x]]), max);
}
function barresMotifs(jeunes) {
  const h = {}; jeunes.forEach(j => { const f = j.motif ? j.motif.Famille : "Non renseigné"; h[f] = (h[f] || 0) + 1; });
  const e = Object.entries(h).sort((a, b) => b[1] - a[1]); const max = Math.max(0, ...e.map(x => x[1]));
  return barres(e.map(([k, v]) => [k, v, "var(--blue)"]), max);
}
function barresDomaines(acts) {
  const h = {}; acts.forEach(a => { const k = a.type.Domaine_BO || "Non renseigné"; h[k] = (h[k] || 0) + (a.Duree_h || 0); });
  const e = Object.entries(h).sort((a, b) => b[1] - a[1]); const max = Math.max(0, ...e.map(x => x[1]));
  return barres(e.map(([k, v]) => [k + " (h)", v, "var(--inge)"]), max);
}

/* ---------- jeunes ---------- */
function tagsJeune(j) {
  return j.alertes.map(k => `<span class="tag ${ALERTE_LIB[k][1]}">${ALERTE_LIB[k][0]}</span>`).join("") ||
    (j.enCours ? `<span class="tag ok">Suivi régulier</span>` : `<span class="tag ${SORTIES_POS.includes(j.Situation_sortie) ? "ok" : "wait"}">${esc(j.Situation_sortie || "Sorti")}</span>`);
}
function nomJeune(j) { return `${(j.Nom || "").toUpperCase()} ${j.Prenom || ""}`.trim() || j.Identifiant; }
function tableJeunes(js) {
  if (!js.length) return `<p class="vide">Aucun jeune sur la période.</p>`;
  return `<div class="scroll"><table class="tbl"><thead><tr><th>Jeune</th><th>Motif principal</th><th class="n">Actions</th><th class="n">Dernier contact</th><th>Points d'attention</th></tr></thead><tbody>
    ${js.sort((a, b) => b.alertes.length - a.alertes.length).map(j => `<tr class="click" data-jeune="${j.id}"><td class="name"><b>${esc(nomJeune(j))}</b> <span style="color:var(--muted)">${esc(j.Identifiant)}</span></td>
      <td>${esc(j.motif ? j.motif.Libelle : "–")}</td><td class="n">${j.actions.length}</td><td class="n">${fmt(j.dernier)}</td><td>${tagsJeune(j)}</td></tr>`).join("")}
    </tbody></table></div>`;
}

function jeunesFiltres() {
  const q = RECH.trim().toLowerCase();
  return D.jeunes.filter(j => {
    if (FILTRE_J === "en_cours" && !j.enCours) return false;
    if (FILTRE_J === "attention" && !j.alertes.length) return false;
    if (FILTRE_J === "sortis" && j.enCours) return false;
    if (FAMILLE && (!j.motif || j.motif.Famille !== FAMILLE)) return false;
    if (q) {
      const etab = (D.etab.get(j.etab) || {}).Nom || "";
      const txt = [j.Nom, j.Prenom, j.Identifiant, j.INE, etab, j.Niveau].join(" ").toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });
}

function vueJeunes() {
  const js = jeunesFiltres();
  const familles = [...new Set([...D.motifs.values()].map(m => m.Famille).filter(Boolean))].sort();
  const groupes = new Map();
  js.forEach(j => { const k = j.etab || 0; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(j); });
  const ordre = [...groupes.entries()].sort((a, b) => b[1].filter(j => j.alertes.length).length - a[1].filter(j => j.alertes.length).length || b[1].length - a[1].length);
  const chip = (k, l) => `<button class="chip ${FILTRE_J === k ? "on" : ""}" data-fj="${k}">${l}</button>`;
  const ouvrirTout = !!RECH.trim() || ordre.length <= 3;
  const nomOrig = ORIGINE ? (ORIGINE.vue === "pilotage" ? "au pilotage" + (ORIGINE.chemin.length ? " · " + nomTerritoire(ORIGINE.chemin[ORIGINE.chemin.length - 1].niv, ORIGINE.chemin[ORIGINE.chemin.length - 1].id) : "") : ORIGINE.vue === "agenda" ? "à l'agenda" : "aux rapports") : "";
  const retour = ORIGINE && ORIGINE.vue !== "jeunes" ? `<div class="crumb"><button class="btn sec retour" data-retour-origine>← Retour ${esc(nomOrig)}</button>${RECH ? `<button class="btn-lien" data-effacer>Voir tous les jeunes</button>` : ""}</div>` :
    RECH ? `<div class="crumb"><button class="btn-lien" data-effacer>Effacer la recherche et voir tous les jeunes</button></div>` : "";
  return `${retour}<div class="bar">
      <input type="search" id="q" placeholder="Rechercher un jeune, un INE, un établissement…" value="${esc(RECH)}">
      ${chip("en_cours", "En cours")}${chip("attention", "En point d'attention")}${chip("sortis", "Sortis")}${chip("tous", "Tous")}
      <select id="famille"><option value="">Toutes les familles de motif</option>${familles.map(f => `<option ${f === FAMILLE ? "selected" : ""}>${esc(f)}</option>`).join("")}</select>
    </div>
    <div style="color:var(--muted);font-size:13px">${js.length} jeune(s) · ${ordre.length} établissement(s)</div>
    ${ordre.map(([eid, liste]) => {
      const e = D.etab.get(eid) || {}, dep = D.dep.get(e.Departement) || {};
      const na = liste.filter(j => j.alertes.length).length;
      const open = ouvrirTout || OUVERTS.has(eid);
      return `<div class="etab ${open ? "open" : ""}" data-etab="${eid}">
        <div class="etab-head" data-toggle-etab="${eid}"><span class="chev">▸</span>
          <div><b>${esc(e.Nom || "Sans établissement (sorti du système scolaire)")}</b> <span>${esc(dep.Departement || "")}</span></div>
          <div>${na ? `<span class="tag ko">${na} en point d'attention</span>` : ""}<span class="tag wait">${liste.length} jeune(s)</span></div></div>
        <div class="jeunes">${liste.sort((a, b) => b.alertes.length - a.alertes.length || (a.Nom || "").localeCompare(b.Nom || "")).map(ficheJeune).join("")}</div></div>`;
    }).join("") || `<p class="vide">Aucun jeune ne correspond.</p>`}`;
}

function ficheJeune(j) {
  const ag = D.agents.get(j.Agent_referent) || {};
  const motifs = [j.motif, ...j.secondaires].filter(Boolean);
  return `<div class="jeune ${JEUNE_OUVERT === j.id ? "open" : ""}" id="j${j.id}">
    <div class="jeune-head" data-toggle-jeune="${j.id}"><span class="chev">▸</span>
      <div class="nom"><b>${esc(nomJeune(j))}</b><span>${esc(j.Identifiant)} · ${esc(j.Niveau || "")}</span></div>
      <div>${motifs.map((m, i) => `<span class="tag ${i ? "wait" : "info"}">${esc(m.Libelle)}</span>`).join("")}</div>
      <div class="last">Dernier contact<br><b>${fmt(j.dernier)}</b>${j.sansAction != null ? ` · ${j.sansAction} j` : ""}</div>
      <div>${tagsJeune(j)}</div></div>
    <div class="fiche">
      <div><dl class="f">
        <dt>Statut</dt><dd>${esc(j.Statut || "–")}</dd>
        <dt>Âge</dt><dd>${j.age == null ? "–" : j.age + " ans"} · ${esc(j.Sexe || "")}</dd>
        <dt>Origine</dt><dd>${esc([j.Type_etab_origine, (j.classe || {}).Classe].filter(Boolean).join(" · ") || "–")}</dd>
        <dt>Profils</dt><dd>${(j.profils || []).map(m => `<span class="tag prof">${esc(m.Libelle)}</span>`).join("") || "–"}</dd>
        <dt>Référent</dt><dd>${esc(`${ag.Prenom || ""} ${ag.Nom || ""}`.trim() || "–")}</dd>
        <dt>Entrée</dt><dd>${fmt(j.Date_entree_suivi)}</dd>
        <dt>1re action</dt><dd>${j.delai == null ? "–" : `${fmt(j.premier)} (${j.delai} j)`}</dd>
        <dt>Actions</dt><dd>${j.actions.length} · ${dec(j.actions.reduce((x, a) => x + (a.Duree_h || 0), 0))} h</dd>
        ${j.Date_sortie_suivi ? `<dt>Sortie</dt><dd>${fmt(j.Date_sortie_suivi)} · ${esc(j.Situation_sortie || "")}</dd>` : ""}
        ${j.INE ? `<dt>INE</dt><dd>${esc(j.INE)}</dd>` : ""}
      </dl>
      <div class="btns"><button class="btn" data-ajout-jeune="${j.id}">+ Action pour ce jeune</button>
        ${j.enCours ? `<button class="btn sec" data-clore="${j.id}">Clore le suivi</button>` : ""}</div>${blocParcours(j)}</div>
      <div><ul class="tl">${j.actions.slice(0, 10).map(a => `<li><span class="d">${fmt(a.Date)}</span><span class="p" style="background:${AXE_COUL[a.axe] || "var(--autre)"}"></span>
        <span><b>${esc(a.type.Libelle || "Action")}</b>${a.Duree_h ? ` · ${dec(a.Duree_h)} h` : ""}${a.Compte_rendu || a.Intitule ? `<small>${esc(a.Compte_rendu || a.Intitule)}</small>` : ""}${a.Suite_a_donner ? `<small>Suite : ${esc(a.Suite_a_donner)}</small>` : ""}</span></li>`).join("")
        || `<li><span class="d"></span><span></span><span class="koc">Aucune action enregistrée.</span></li>`}
        ${j.actions.length > 10 ? `<li><span class="d"></span><span></span><span style="color:var(--muted)">… et ${j.actions.length - 10} action(s) plus ancienne(s)</span></li>` : ""}
        <li><span class="d">${fmt(j.Date_entree_suivi)}</span><span class="p" style="background:var(--grey)"></span><span>Entrée dans le suivi</span></li></ul></div>
    </div></div>`;
}

/* ---------- agenda ---------- */
function vueAgenda() {
  const agents = [...D.agents.values()].filter(a => D.acts.some(x => x.Agent === a.id)).sort((a, b) => (a.Nom || "").localeCompare(b.Nom || ""));
  if (agents.length === 1) AGENT_CAL = String(agents[0].id);
  const deb = SEMAINE, fin = SEMAINE + 5 * 86400, t = aujourdhui();
  const acts = D.acts.filter(a => a.Date >= deb && a.Date < fin && (!AGENT_CAL || String(a.Agent) === AGENT_CAL));
  const H0 = 8, H1 = 18, PX = 56;
  const pos = a => { const [h, m] = String(a.Heure_debut || "09:00").replace("h", ":").split(":").map(Number); return ((h || 9) + (m || 0) / 60 - H0) * PX; };
  const jours5 = [0, 1, 2, 3, 4].map(i => deb + i * 86400);
  const nomsJ = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  const tot = {}; acts.forEach(a => tot[a.axe] = (tot[a.axe] || 0) + (a.Duree_h || 0));
  return `<div class="card">
    <div class="cal-nav"><button class="btn sec" data-sem="-1">‹</button><button class="btn sec" data-sem="0">Aujourd'hui</button><button class="btn sec" data-sem="1">›</button>
      <b>Semaine du ${fmt(deb)}</b>
      <select id="agent-cal"><option value="">Tous les agents visibles</option>${agents.map(a => `<option value="${a.id}" ${String(a.id) === AGENT_CAL ? "selected" : ""}>${esc(`${a.Prenom} ${a.Nom}`)}</option>`).join("")}</select>
      <span style="color:var(--muted);font-size:12px">Cliquer dans une journée pour ajouter une action à cette heure.</span></div>
    <div class="scroll"><div class="cal">
      <div class="cal-h"></div>${jours5.map((d, i) => `<div class="cal-h ${d === t ? "today" : ""}">${nomsJ[i]}<small>${fmt(d, true)}</small></div>`).join("")}
      <div class="hours">${Array.from({ length: H1 - H0 + 1 }, (_, i) => `<div style="top:${i * PX}px">${H0 + i}h</div>`).join("")}</div>
      ${jours5.map(d => `<div class="day" data-jour="${d}">${couloirs(acts.filter(a => a.Date === d), pos, PX).map(({ a, lane, lanes }) => {
        const top = Math.max(0, pos(a)), h = Math.max(22, (a.Duree_h || 1) * PX - 2), j = D.jeunes.find(x => x.id === a.Jeune);
        const larg = 100 / lanes;
        const sous = j ? nomJeune(j) : ((D.etab.get(a.etabEff) || {}).Nom || a.Intitule || "");
        return `<div class="ev" data-act="${a.id}" style="top:${top}px;height:${h}px;left:calc(${lane * larg}% + 2px);right:auto;width:calc(${larg}% - 4px);border-color:${AXE_COUL[a.axe]};background:color-mix(in srgb, ${AXE_COUL[a.axe]} 12%, white)" title="${esc(a.type.Libelle || "")}"><b>${esc(a.Heure_debut || "")} ${esc(a.type.Libelle || "")}</b>${esc(sous)}</div>`;
      }).join("")}</div>`).join("")}
    </div></div>
    <div class="cal-tot">${AXES.filter(x => tot[x]).map(x => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${AXE_COUL[x]}"></i> ${x} <b>${dec(tot[x])} h</b></span>`).join("") || "Aucune action cette semaine."}</div>
  </div>`;
}

// répartit les actions qui se chevauchent côte à côte
function couloirs(acts, pos, PX) {
  const items = acts.map(a => ({ a, d: pos(a), f: pos(a) + Math.max(22, (a.Duree_h || 1) * PX) })).sort((x, y) => x.d - y.d);
  const out = []; let groupe = [], finGroupe = -1;
  const clore = () => { const lanes = []; groupe.forEach(it => { let l = lanes.findIndex(f => f <= it.d); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = it.f; it.lane = l; });
    groupe.forEach(it => out.push({ a: it.a, lane: it.lane, lanes: lanes.length })); groupe = []; };
  items.forEach(it => { if (it.d >= finGroupe && groupe.length) clore(); groupe.push(it); finGroupe = Math.max(finGroupe, it.f); });
  if (groupe.length) clore();
  return out;
}

/* ---------- saisie ---------- */
function modal(html) {
  const bg = document.createElement("div"); bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener("click", e => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg); return bg;
}
function optionsTypes(sel) {
  const g = {}; [...D.types.values()].forEach(t => { (g[t.Domaine_BO || "Autre"] ||= []).push(t); });
  return Object.entries(g).map(([dom, ts]) => `<optgroup label="${esc(dom)}">${ts.map(t => `<option value="${t.id}" ${t.id === sel ? "selected" : ""}>${esc(t.Libelle)}</option>`).join("")}</optgroup>`).join("");
}
function agentParDefaut() {
  try { const v = Number(localStorage.getItem("mlds-agent")); if (D.agents.has(v)) return v; } catch (e) { /* stockage indisponible */ }
  const ags = [...D.agents.values()].filter(a => a.Role_Grist === "Agent");
  return ags.length === 1 ? ags[0].id : 0;
}
function versDate(str) { const [y, m, d] = str.split("-").map(Number); return Date.UTC(y, m - 1, d) / 1000; }
function isoDate(s) { return new Date(s * 1000).toISOString().slice(0, 10); }

function ouvrirAction(pre = {}) {
  const jeunes = D.jeunes.filter(j => j.enCours || j.id === pre.jeune).sort((a, b) => nomJeune(a).localeCompare(nomJeune(b)));
  const ag = pre.agent || agentParDefaut();
  const bg = modal(`<h3>Nouvelle action</h3><form class="fm" id="fa">
    <label>Date<input type="date" name="date" required value="${isoDate(pre.date || aujourdhui())}"></label>
    <label>Heure<input type="time" name="heure" value="${pre.heure || "09:00"}"></label>
    <label class="full">Type d'activité<select name="type" required><option value="">Choisir…</option>${optionsTypes(pre.type)}</select></label>
    <label>Durée (h)<input type="number" name="duree" min="0.25" step="0.25" value="1"></label>
    <label>Agent<select name="agent">${[...D.agents.values()].filter(a => a.Role_Grist === "Agent" || a.id === ag).map(a => `<option value="${a.id}" ${a.id === ag ? "selected" : ""}>${esc(`${a.Prenom} ${a.Nom}`)}</option>`).join("")}</select></label>
    <label class="full">Jeune <span id="jeune-req"></span><select name="jeune"><option value="">— aucun (action collective) —</option>${jeunes.map(j => `<option value="${j.id}" ${j.id === pre.jeune ? "selected" : ""}>${esc(nomJeune(j))} · ${esc(j.Identifiant)}</option>`).join("")}</select></label>
    <label class="full">Établissement<select name="etab"><option value="">—</option>${[...D.etab.values()].sort((a, b) => (a.Nom || "").localeCompare(b.Nom || "")).map(e => `<option value="${e.id}">${esc(e.Nom)}</option>`).join("")}</select></label>
    <label class="full">Intitulé<input name="intitule" placeholder="ex. GPDS du lycée, entretien de bilan…"></label>
    <label>Nb participants<input type="number" name="npart" min="0"></label>
    <label>Nb situations examinées<input type="number" name="nsit" min="0"></label>
    <label>Niveau d'intervention<select name="niveau">${NIVEAUX.map(n => `<option>${n}</option>`).join("")}</select></label>
    <label>Public<input name="public" placeholder="ex. CPE, professeurs principaux"></label>
    <div class="full fm-part"><span style="font-size:12px;color:var(--muted)">Partenaires</span><div class="checks">${PARTENAIRES.map(p => `<label><input type="checkbox" name="part" value="${esc(p)}">${esc(p)}</label>`).join("")}</div></div>
    <label class="full">Compte rendu<textarea name="cr" rows="3"></textarea></label>
    <label class="full">Suite à donner<input name="suite"></label>
  </form><div class="msg" id="fa-msg"></div>
  <div class="foot"><button class="btn sec" data-close>Annuler</button><button class="btn" id="fa-ok">Enregistrer</button></div>`);
  const f = bg.querySelector("#fa");
  const majType = () => { const t = D.types.get(Number(f.type.value)) || {}; bg.querySelector("#jeune-req").textContent = t.Jeune_requis ? "(obligatoire pour ce type)" : ""; };
  f.type.addEventListener("change", majType); majType();
  bg.querySelector("[data-close]").onclick = () => bg.remove();
  bg.querySelector("#fa-ok").onclick = async () => {
    const t = D.types.get(Number(f.type.value));
    const msg = bg.querySelector("#fa-msg");
    if (!f.date.value || !t) { msg.textContent = "Indiquez au moins la date et le type d'activité."; return; }
    if (t.Jeune_requis && !f.jeune.value) { msg.textContent = "Ce type d'activité concerne un jeune : choisissez-le."; return; }
    const parts = [...f.querySelectorAll("input[name=part]:checked")].map(x => x.value);
    const rec = { Date: versDate(f.date.value), Heure_debut: f.heure.value, Duree_h: Number(f.duree.value) || 1, Type: t.id,
      Agent: Number(f.agent.value) || 0, Jeune: Number(f.jeune.value) || 0, Etablissement: Number(f.etab.value) || 0,
      Intitule: f.intitule.value, Niveau_intervention: f.niveau.value, Partenaires: parts.length ? ["L", ...parts] : null,
      Nb_participants: f.npart.value ? Number(f.npart.value) : null, Nb_situations_examinees: f.nsit.value ? Number(f.nsit.value) : null,
      Public: f.public.value, Compte_rendu: f.cr.value, Suite_a_donner: f.suite.value };
    try { localStorage.setItem("mlds-agent", String(rec.Agent)); } catch (e) { /* stockage indisponible */ }
    try { await ecrire([["AddRecord", "Activites", null, rec]], () => { D.acts.push({ id: Date.now(), ...rec }); }); bg.remove(); toast("Action enregistrée"); }
    catch (e) { msg.textContent = "Enregistrement refusé : " + e.message; }
  };
}

function ouvrirJeune() {
  const motifs = [...D.motifs.values()].filter(m => m.Nature !== "Profil"), profils = [...D.motifs.values()].filter(m => m.Nature === "Profil");
  const n = D.jeunes.length + 1, y = new Date().getFullYear();
  const bg = modal(`<h3>Nouveau jeune suivi</h3><form class="fm" id="fj">
    <label>Nom<input name="nom" required></label><label>Prénom<input name="prenom"></label>
    <label>INE<input name="ine"></label><label>Date de naissance<input type="date" name="naiss"></label>
    <label>Sexe<select name="sexe"><option>F</option><option>M</option></select></label>
    <label>Diplôme possédé<select name="dipl">${["aucun", "CFG", "DNB", "CAP", "BEP", "BAC Pro", "BAC Gén.", "BAC Techno"].map(x => `<option>${x}</option>`).join("")}</select></label>
    <label>Type d'établissement d'origine<select name="torig">${["CLG", "SEGPA", "LP", "LPO", "LGT", "CFA", "MFR", "EREA", "IME", "IMPRO", "ET SPE", "AUT"].map(x => `<option>${x}</option>`).join("")}</select></label>
    <label>Classe d'origine<select name="classe"><option value="">—</option>${[...D.classes.values()].map(c => `<option value="${c.id}">${esc(c.Classe)}</option>`).join("")}</select></label>
    <label class="full">Établissement<select name="etab"><option value="">— aucun (sorti du système scolaire) —</option>${[...D.etab.values()].sort((a, b) => (a.Nom || "").localeCompare(b.Nom || "")).map(e => `<option value="${e.id}">${esc(e.Nom)}</option>`).join("")}</select></label>
    <label>Statut<select name="statut">${STATUTS.map(s => `<option>${s}</option>`).join("")}</select></label>
    <label>Entrée en suivi<input type="date" name="entree" value="${isoDate(aujourdhui())}"></label>
    <label class="full">Motif principal<select name="motif" required><option value="">Choisir…</option>${motifs.map(m => `<option value="${m.id}">${esc(m.Libelle)} · ${esc(m.Famille || "")}</option>`).join("")}</select></label>
    <div class="full"><span style="font-size:12px;color:var(--muted)">Profils</span><div class="checks">${profils.map(m => `<label><input type="checkbox" name="prof" value="${m.id}">${esc(m.Libelle)}</label>`).join("")}</div></div>
    <div class="full"><span style="font-size:12px;color:var(--muted)">Motifs secondaires</span><div class="checks">${motifs.map(m => `<label><input type="checkbox" name="sec" value="${m.id}">${esc(m.Libelle)}</label>`).join("")}</div></div>
    <label>Agent référent<select name="agent">${[...D.agents.values()].filter(a => a.Role_Grist === "Agent").map(a => `<option value="${a.id}" ${a.id === agentParDefaut() ? "selected" : ""}>${esc(`${a.Prenom} ${a.Nom}`)}</option>`).join("")}</select></label>
  </form><div class="msg" id="fj-msg"></div>
  <div class="foot"><button class="btn sec" data-close>Annuler</button><button class="btn" id="fj-ok">Enregistrer</button></div>`);
  const f = bg.querySelector("#fj");
  bg.querySelector("[data-close]").onclick = () => bg.remove();
  bg.querySelector("#fj-ok").onclick = async () => {
    const msg = bg.querySelector("#fj-msg");
    if (!f.nom.value || !f.motif.value) { msg.textContent = "Indiquez au moins le nom et le motif principal."; return; }
    const sec = [...f.querySelectorAll("input[name=sec]:checked")].map(x => Number(x.value)).filter(x => x !== Number(f.motif.value));
    const rec = { Identifiant: `J-${y}-${String(n).padStart(4, "0")}`, Nom: f.nom.value, Prenom: f.prenom.value, INE: f.ine.value,
      Date_naissance: f.naiss.value ? versDate(f.naiss.value) : null, Sexe: f.sexe.value, Diplome: f.dipl.value, Type_etab_origine: f.torig.value,
      Classe_origine: Number(f.classe.value) || 0, Niveau: f.classe.value ? D.classes.get(Number(f.classe.value)).Classe : "",
      Profils: (p => p.length ? ["L", ...p] : null)([...f.querySelectorAll("input[name=prof]:checked")].map(x => Number(x.value))),
      Etablissement: Number(f.etab.value) || 0, Statut: f.statut.value, Motif_principal: Number(f.motif.value),
      Motifs_secondaires: sec.length ? ["L", ...sec] : null, Agent_referent: Number(f.agent.value) || 0, Date_entree_suivi: versDate(f.entree.value) };
    try { await ecrire([["AddRecord", "Jeunes", null, rec]], () => { D.jeunes.push({ id: Date.now(), ...rec }); }); bg.remove(); toast("Jeune ajouté au suivi"); }
    catch (e) { msg.textContent = "Enregistrement refusé : " + e.message; }
  };
}

function ouvrirClore(id) {
  const j = D.jeunes.find(x => x.id === id);
  const bg = modal(`<h3>Clore le suivi de ${esc(nomJeune(j))}</h3><form class="fm" id="fc">
    <label>Date de sortie<input type="date" name="date" value="${isoDate(aujourdhui())}"></label>
    <label>Situation à la sortie<select name="sit">${SORTIES.map(s => `<option>${s}</option>`).join("")}</select></label></form>
    <div class="msg" id="fc-msg"></div><div class="foot"><button class="btn sec" data-close>Annuler</button><button class="btn" id="fc-ok">Clore le suivi</button></div>`);
  const f = bg.querySelector("#fc");
  bg.querySelector("[data-close]").onclick = () => bg.remove();
  bg.querySelector("#fc-ok").onclick = async () => {
    const champs = { Date_sortie_suivi: versDate(f.date.value), Situation_sortie: f.sit.value };
    try { await ecrire([["UpdateRecord", "Jeunes", id, champs]], () => Object.assign(j, champs)); bg.remove(); toast("Suivi clos"); }
    catch (e) { bg.querySelector("#fc-msg").textContent = "Enregistrement refusé : " + e.message; }
  };
}

async function ecrire(actions, enDemo) {
  if (DEMO) { enDemo(); preparerDepuisD(); rendre(); return; }
  await grist.docApi.applyUserActions(actions);
  await charger();
}
function preparerDepuisD() {
  preparer({ Academies: [...D.aca.values()], Departements: [...D.dep.values()], Bassins: [], Etablissements: [...D.etab.values()],
    Agents: [...D.agents.values()], Motifs: [...D.motifs.values()], Types_activite: [...D.types.values()], Seuils: [D.seuils],
    Jeunes: D.jeunes, Activites: D.acts, Parcours: D.parcours, Dispositifs: [...D.dispositifs.values()],
    Motifs_entree: [...D.motifsEntree.values()], Classes_origine: [...D.classes.values()] });
}

/* ---------- export Excel ---------- */
function exporter() {
  if (!window.XLSX) { toast("Export indisponible"); return; }
  const wb = XLSX.utils.book_new(), [, , lib] = bornes();
  const ligneInd = (nom, I) => ({ "Territoire": nom, "Jeunes suivis": I.nbJeunes, "En cours": I.enCours, "Actions": I.nbActs, "Heures": Math.round(I.heures),
    "Actions par jeune": I.actsParJeune == null ? "" : Math.round(I.actsParJeune * 10) / 10, "Délai moyen 1re action (j)": I.delai == null ? "" : Math.round(I.delai),
    "Jeunes en point d'attention": I.attention.length, "% en point d'attention": Math.round(I.partAttention * 100), "Sorties": I.sorties,
    "% sorties positives": I.sortiesPos == null ? "" : Math.round(I.sortiesPos * 100), "Commissions": I.commissions, "Situations examinées": I.situations,
    "Heures-stagiaires": Math.round(I.hStagiaires), "Signaux": I.signaux.map(x => x[0]).join(", ") });
  const terr = [ligneInd("Région académique Nouvelle-Aquitaine", indicateurs())];
  D.aca.forEach(a => terr.push(ligneInd("Académie de " + a.Academie, indicateurs("aca", a.id))));
  D.dep.forEach(d => terr.push(ligneInd(`${d.Departement} (${d.Code})`, indicateurs("dep", d.id))));
  D.etab.forEach(e => terr.push(ligneInd(e.Nom, indicateurs("etab", e.id))));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(terr), "Indicateurs");
  const js = (VUE === "jeunes" ? jeunesFiltres() : D.jeunes).map(j => ({ "Identifiant": j.Identifiant, "Nom": j.Nom, "Prénom": j.Prenom,
    "Établissement": (D.etab.get(j.etab) || {}).Nom || "", "Département": (D.dep.get(j.depId) || {}).Departement || "",
    "Motif principal": j.motif ? j.motif.Libelle : "", "Famille": j.motif ? j.motif.Famille : "", "Entrée": fmt(j.Date_entree_suivi),
    "Sortie": j.Date_sortie_suivi ? fmt(j.Date_sortie_suivi) : "", "Situation de sortie": j.Situation_sortie || "", "Actions": j.actions.length,
    "Dernier contact": fmt(j.dernier), "Points d'attention": j.alertes.map(k => ALERTE_LIB[k][0]).join(", ") }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(js), "Jeunes");
  XLSX.writeFile(wb, `suivi-mlds-${lib.replace(/\s+/g, "-")}.xlsx`);
}

/* ---------- événements ---------- */
function brancher() {
  const per = document.getElementById("periode");
  const a = anneeScolaire(aujourdhui());
  per.innerHTML = `<option value="annee">Année ${a}-${a + 1}</option><option value="annee-1">Année ${a - 1}-${a}</option><option value="12m">12 derniers mois</option>`;
  per.onchange = () => { PERIODE = per.value; rendre(); };
  document.getElementById("tabs").onclick = e => { const b = e.target.closest(".tab"); if (b && b.dataset.v !== VUE) naviguer(() => { VUE = b.dataset.v; if (VUE !== "jeunes") ORIGINE = null; }); };
  document.getElementById("nouvelle-action").onclick = () => D && ouvrirAction();
  document.getElementById("nouveau-jeune").onclick = () => D && ouvrirJeune();
  document.getElementById("export").onclick = () => D && exporter();
  const vue = document.getElementById("vue");
  vue.addEventListener("click", e => {
    if (e.target.closest("#r-export")) { exporterRapport(); return; }
    const el = e.target.closest("[data-retour-origine],[data-effacer],[data-rtype],[data-inscrire],[data-clore-parcours],[data-go],[data-niv],[data-alerte],[data-jeune],[data-toggle-etab],[data-toggle-jeune],[data-ajout-jeune],[data-clore],[data-fj],[data-sem],[data-act],.day");
    if (!el) return;
    if (el.dataset.rtype) { naviguer(() => { R_TYPE = el.dataset.rtype; }); return; }
    if (el.dataset.inscrire) { ouvrirInscription(Number(el.dataset.inscrire)); return; }
    if (el.dataset.cloreParcours) { ouvrirCloreParcours(el.dataset.cloreParcours); return; }
    if (el.dataset.go !== undefined) { naviguer(() => { CHEMIN = CHEMIN.slice(0, Number(el.dataset.go)); }); }
    else if (el.dataset.niv) { naviguer(() => { CHEMIN.push({ niv: el.dataset.niv, id: Number(el.dataset.id) }); }); }
    else if (el.dataset.alerte) { naviguer(() => { ORIGINE = { vue: VUE, chemin: CHEMIN.map(c => ({ ...c })) }; FILTRE_J = "attention"; RECH = ""; JEUNE_OUVERT = null; VUE = "jeunes"; }); }
    else if (el.dataset.retourOrigine !== undefined) { naviguer(() => { VUE = ORIGINE ? ORIGINE.vue : "pilotage"; CHEMIN = ORIGINE ? ORIGINE.chemin : CHEMIN; ORIGINE = null; RECH = ""; FILTRE_J = "en_cours"; JEUNE_OUVERT = null; }); }
    else if (el.dataset.effacer !== undefined) { naviguer(() => { RECH = ""; JEUNE_OUVERT = null; }); }
    else if (el.dataset.jeune) { allerJeune(Number(el.dataset.jeune)); }
    else if (el.dataset.toggleEtab !== undefined) { const id = Number(el.dataset.toggleEtab); OUVERTS.has(id) ? OUVERTS.delete(id) : OUVERTS.add(id); el.parentElement.classList.toggle("open"); }
    else if (el.dataset.toggleJeune) { const id = Number(el.dataset.toggleJeune); JEUNE_OUVERT = JEUNE_OUVERT === id ? null : id; el.parentElement.classList.toggle("open"); }
    else if (el.dataset.ajoutJeune) { ouvrirAction({ jeune: Number(el.dataset.ajoutJeune) }); }
    else if (el.dataset.clore) { ouvrirClore(Number(el.dataset.clore)); }
    else if (el.dataset.fj) { naviguer(() => { FILTRE_J = el.dataset.fj; }); }
    else if (el.dataset.sem !== undefined) { const s = Number(el.dataset.sem); SEMAINE = s === 0 ? lundi(aujourdhui()) : SEMAINE + s * 7 * 86400; rendre(); }
    else if (el.dataset.act) { const a = D.acts.find(x => String(x.id) === el.dataset.act); if (a && a.Jeune) allerJeune(a.Jeune); else if (a) toast(`${a.type.Libelle || ""} · ${a.Intitule || ""}`); }
    else if (el.classList.contains("day")) {
      const r = el.getBoundingClientRect(), h = 8 + Math.floor((e.clientY - r.top) / 56 * 2) / 2;
      ouvrirAction({ date: Number(el.dataset.jour), heure: `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`, agent: Number(AGENT_CAL) || 0 });
    }
  });
  vue.addEventListener("input", e => { if (e.target.id === "q") { RECH = e.target.value; const pos = e.target.selectionStart; rendre(); const q = document.getElementById("q"); q.focus(); q.setSelectionRange(pos, pos); } });
  vue.addEventListener("change", e => {
    if (e.target.id === "famille") { FAMILLE = e.target.value; rendre(); }
    if (e.target.id === "agent-cal") { AGENT_CAL = e.target.value; rendre(); }
    const r = { "r-annee": v => R_ANNEE = Number(v), "r-trim": v => R_TRIM = v, "r-terr": v => R_TERR = v, "r-action": v => { R_ACTION = v; R_ETAB = ""; }, "r-etab": v => R_ETAB = v }[e.target.id];
    if (r) { r(e.target.value); rendre(); }
  });
}
function allerJeune(id) {
  const j = D.jeunes.find(x => x.id === id); if (!j) return;
  naviguer(() => { if (VUE !== "jeunes" || !ORIGINE) ORIGINE = { vue: VUE, chemin: CHEMIN.map(c => ({ ...c })) }; VUE = "jeunes"; FILTRE_J = "tous"; RECH = j.Identifiant; JEUNE_OUVERT = id; });
  const el = document.getElementById("j" + id); if (el) el.scrollIntoView({ block: "start" });
}

window.addEventListener("DOMContentLoaded", () => {
  brancher();
  try { history.replaceState(etat(), "", "#" + VUE); } catch (err) { /* historique indisponible */ }
  if (window.grist && window.self !== window.top) {
    grist.ready({ requiredAccess: "full" });
    let t = null;
    grist.onRecords(() => { clearTimeout(t); t = setTimeout(charger, 300); });
    charger();
  } else {
    DEMO = true; preparer(donneesDemo()); rendre();
  }
});
