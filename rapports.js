/* Rapports officiels MLDS générés à partir des parcours :
   - synthèse trimestrielle (tableaux 1 à 5) ;
   - tableaux par action (information-sensibilisation, remobilisation, micro-lycée) ;
   - prévention : profils et motifs par établissement.
   Dépend de app.js (D, esc, fmt, liste, toast, aujourdhui, anneeScolaire). */

let R_TYPE = "synthese", R_ANNEE = null, R_TRIM = "T1", R_TERR = "", R_ACTION = "", R_ETAB = "";

const DEVENIRS = [
  ["Reprise de formation sous statut scolaire", "Positive"], ["Reprise de formation sous statut d'apprenti", "Positive"],
  ["Reprise de formation sous statut stagiaire de la formation professionnelle", "Positive"],
  ["Reprise de formation dans une structure de retour à l'école", "Positive"], ["Service civique à temps plein", "Positive"],
  ["Emploi", "Positive"], ["Pris en charge dans un dispositif hors EN (partenaire PSAD)", "Positive"],
  ["Poursuite de parcours dans une action MLDS (remobilisation, repréparation à l'examen)", "Poursuite"],
  ["En recherche ou en attente de solution", "Sans solution"], ["Abandon en cours d'action, injoignables", "Sans solution"]];
const LIGNES_T4 = [["3ème générale", "4ème et 3ème SEGPA", "3ème prépa métiers", "Autres 1er cycle"], "Sous-total 1er cycle",
  ["1ère CAP", "Terminales CAP", "2nde PRO", "1ère PRO", "Terminale PRO", "Apprentissage niveau 3 (CAP)"], "Sous-total voie professionnelle",
  ["2nde GT", "1ère GT"], "Sous-total voie générale", ["PAPS / Autres"]];
const LIGNES_T5 = ["Démission en cours/fin d'année", "Vœu de recensement en fin d'année", "Non affecté", "Refus d'affectation",
  "Rupture de contrat d'alternance", "Exclusion (conseil de discipline)", "Suite GPDS / Foquale", "Autre motif"];
const TRANCHES = ["Moins de 16 ans", "16 ans", "17 ans", "18 ans et plus"];

function ageA(naiss, date) {
  if (!naiss || !date) return null;
  const n = new Date(naiss * 1000), d = new Date(date * 1000);
  return d.getUTCFullYear() - n.getUTCFullYear() - ((d.getUTCMonth() < n.getUTCMonth() || (d.getUTCMonth() === n.getUTCMonth() && d.getUTCDate() < n.getUTCDate())) ? 1 : 0);
}
function periode(s) { if (!s) return ""; const m = new Date(s * 1000).getUTCMonth() + 1; return m >= 9 ? "sept-dec" : m <= 4 ? "janv-avr" : "mai-août"; }
function tranche(a) { return a == null ? "" : a < 16 ? TRANCHES[0] : a === 16 ? TRANCHES[1] : a === 17 ? TRANCHES[2] : TRANCHES[3]; }

// appelé par preparer() dans app.js
function preparerParcours(d, b) {
  const idx = arr => new Map((arr || []).map(r => [r.id, r]));
  d.dispositifs = idx(b.Dispositifs); d.motifsEntree = idx(b.Motifs_entree); d.classes = idx(b.Classes_origine); d.zaps = idx(b.Bassins);
  const parJeune = new Map(d.jeunes.map(j => [j.id, j]));
  d.parcours = (b.Parcours || []).map(p => {
    const j = parJeune.get(p.Jeune) || null;
    p.jeune = j; p.disp = d.dispositifs.get(p.Dispositif) || {}; p.motifE = d.motifsEntree.get(p.Motif_entree) || {};
    p.etabP = p.Etablissement || (j ? j.etab : 0);
    p.depId = (d.etab.get(p.etabP) || {}).Departement || (j ? j.depId : 0);
    p.acaId = (d.dep.get(p.depId) || {}).Academie || 0;
    p.zapId = (d.etab.get(p.etabP) || {}).Bassin || 0;
    p.age = ageA(j && j.Date_naissance, p.Date_entree);
    return p;
  });
  d.jeunes.forEach(j => {
    j.classe = d.classes.get(j.Classe_origine) || null;
    j.profils = liste(j.Profils).map(m => d.motifs.get(m)).filter(Boolean);
    j.parcours = d.parcours.filter(p => p.jeune === j).sort((a, b) => (b.Date_entree || 0) - (a.Date_entree || 0));
    j.age = ageA(j.Date_naissance, aujourdhui());
  });
}

/* ---------- période et territoire ---------- */
function bornesRapport() {
  const y = R_ANNEE ?? anneeScolaire(aujourdhui());
  const B = { T1: [Date.UTC(y, 8, 1), Date.UTC(y, 11, 31)], T2: [Date.UTC(y + 1, 0, 1), Date.UTC(y + 1, 3, 30)],
    T3: [Date.UTC(y + 1, 4, 1), Date.UTC(y + 1, 7, 31)], A: [Date.UTC(y, 8, 1), Date.UTC(y + 1, 7, 31)] }[R_TRIM];
  const lib = { T1: "Trimestre 1 (sept.-déc.)", T2: "Trimestre 2 (janv.-avr.)", T3: "Trimestre 3 (mai-août)", A: "Année complète" }[R_TRIM];
  return [B[0] / 1000, B[1] / 1000, `${y}-${y + 1} · ${lib}`, y];
}
function dansTerritoire(p) {
  if (!R_TERR) return true;
  const [niv, id] = R_TERR.split(":"); return niv === "aca" ? p.acaId === Number(id) : niv === "zap" ? p.zapId === Number(id) : p.depId === Number(id);
}
function etabDansTerritoire(e) {
  if (!R_TERR) return true;
  const [niv, id] = R_TERR.split(":"), dep = D.dep.get(e.Departement) || {};
  return niv === "aca" ? dep.Academie === Number(id) : niv === "zap" ? e.Bassin === Number(id) : e.Departement === Number(id);
}
function parcoursPeriode(filtreDisp) {
  const [deb, fin] = bornesRapport();
  return D.parcours.filter(p => p.jeune && p.Date_entree && p.Date_entree <= fin && (!p.Date_sortie || p.Date_sortie >= deb) && dansTerritoire(p) && (!filtreDisp || filtreDisp(p.disp)));
}
function nomTerr() {
  if (!R_TERR) return "Région académique Nouvelle-Aquitaine";
  const [niv, id] = R_TERR.split(":");
  return niv === "aca" ? "Académie de " + (D.aca.get(Number(id)) || {}).Academie : niv === "zap" ? "ZAP " + ((D.zaps.get(Number(id)) || {}).Bassin || "") : (D.dep.get(Number(id)) || {}).Departement;
}

/* ---------- 1. synthèse trimestrielle ---------- */
function syntheseTableaux() {
  const ps = parcoursPeriode(d => d.Ligne_synthese);
  const parLigne = l => ps.filter(p => p.disp.Ligne_synthese === l);
  const L1 = ["PAPS temps plein", "Parcours modulaires - PAFI (pôles)", "PAFI suivis par la coordination", "Suivis GPDS", "Entretiens de prévention", "Candidatures PAPS", "Actions FSE"];
  const t1 = L1.map(l => [l, parLigne(l).length]); t1.push(["Total", ps.length]);
  const g = (arr, s) => arr.filter(p => p.jeune.Sexe === s).length;
  const ligneG = (lib, arr) => [lib, g(arr, "F"), g(arr, "M"), arr.length];
  const pafi = [...parLigne(L1[1]), ...parLigne(L1[2])];
  const t2 = [ligneG("PAPS temps plein", parLigne(L1[0])), ligneG("Parcours modulaires - PAFI (pôles)", parLigne(L1[1])),
    ligneG("PAFI suivis extérieurs (Coordination)", parLigne(L1[2])), ligneG("Total PAFI", pafi), ligneG("Suivis GPDS", parLigne(L1[3])),
    ligneG("Entretiens de prévention", parLigne(L1[4])), ligneG("Candidatures PAPS", parLigne(L1[5])), ligneG("Actions FSE", parLigne(L1[6])),
    ligneG("TOTAL GENERAL", ps)];
  const t3 = [["PAPS temps plein", parLigne(L1[0])], ["Parcours modulaires - PAFI", parLigne(L1[1])], ["PAFI suivis extérieurs", parLigne(L1[2])]]
    .map(([l, a]) => [l, ...TRANCHES.map(t => a.filter(p => tranche(p.age) === t).length), a.length]);
  const paps = parLigne(L1[0]);
  const lig = p => (p.jeune.classe || {}).Ligne_synthese || "PAPS / Autres";
  const t4 = [];
  LIGNES_T4.forEach(x => {
    if (Array.isArray(x)) x.forEach(l => t4.push([l, paps.filter(p => lig(p) === l).length, pafi.filter(p => lig(p) === l).length]));
    else { const prev = LIGNES_T4[LIGNES_T4.indexOf(x) - 1]; t4.push([x, paps.filter(p => prev.includes(lig(p))).length, pafi.filter(p => prev.includes(lig(p))).length, true]); }
  });
  t4.push(["TOTAL", paps.length, pafi.length, true]);
  const t5 = LIGNES_T5.map(l => [l, paps.filter(p => (p.motifE.Ligne_synthese || "Autre motif").trim() === l.trim()).length]);
  t5.push(["Total", paps.length]);
  return [
    { titre: "TABLEAU 1 : Actions", tete: ["Action", bornesRapport()[2]], lignes: t1 },
    { titre: "TABLEAU 2 : Synthèse par action et genre", tete: ["Action", "Filles", "Garçons", "Total"], lignes: t2 },
    { titre: "TABLEAU 3 : Répartition par âge à l'entrée par action", tete: ["Action / Dispositif", ...TRANCHES, "Total"], lignes: t3 },
    { titre: "TABLEAU 4 : Origine scolaire des élèves par action", tete: ["Origine scolaire", "PAPS temps plein", "PAFI"], lignes: t4 },
    { titre: "TABLEAU 5 : Motifs d'entrée dans l'action", tete: ["Motif d'entrée", "PAPS temps plein"], lignes: t5 },
  ];
}

/* ---------- 2. tableaux par action ---------- */
function rapportsAction() { return [...new Set([...D.dispositifs.values()].map(d => d.Rapport).filter(Boolean))].sort(); }
function actionDonnees() {
  const rap = R_ACTION || rapportsAction()[0] || "";
  const ps = parcoursPeriode(d => d.Rapport === rap).filter(p => !R_ETAB || String(p.etabP) === R_ETAB);
  const info = /information/i.test(rap), micro = /micro/i.test(rap);
  const tete = ["Nom-Prénom (ou initiales)", "- 16a", "OF 16/18", "type etab origine", "classe d'origine", "période d'entrée", "période de sortie",
    info ? "Motif d'accompagnement" : micro ? "Difficultés majeures observées" : "Motif d'inscription", ...(info ? ["Modalité(s) d'accompagnement"] : []), "Diplôme possédé",
    "Examen ou concours préparé : type", "admis O/N", "Type de solution", "Si statut scolaire ou apprentissage, indiquer la classe", "Commentaire"];
  const ligne = p => { const j = p.jeune; return [`${(j.Nom || "").toUpperCase()} ${j.Prenom || ""}`.trim(), p.age != null && p.age < 16 ? "OUI" : "NON",
    p.age != null && p.age >= 16 && p.age < 18 ? "OUI" : "NON", j.Type_etab_origine || "", (j.classe || {}).Classe || "", periode(p.Date_entree), periode(p.Date_sortie),
    info ? (p.motifE.Motif || "") : micro ? (p.Difficultes || "") : (p.motifE.Motif_inscription || p.motifE.Motif || ""), ...(info ? [p.Modalites || ""] : []), j.Diplome || "",
    p.Examen_prepare || "", p.Admis || "", p.Devenir || "", p.Classe_reprise || "", p.Commentaire || ""]; };
  const tri = (a, b) => (a.jeune.Nom || "").localeCompare(b.jeune.Nom || "");
  const filles = ps.filter(p => p.jeune.Sexe === "F").sort(tri), garcons = ps.filter(p => p.jeune.Sexe !== "F").sort(tri);
  // tableau de synthèse (1re feuille du modèle) : classe d'origine × devenir, en F / G / T, avec sous-totaux par voie
  const fgt = arr => { const f = arr.filter(p => p.jeune.Sexe === "F").length; return [f, arr.length - f, arr.length]; };
  const ligneMat = (lib, arr, tot) => {
    const dev = DEVENIRS.flatMap(([dv]) => fgt(arr.filter(p => p.Devenir === dv)));
    const avec = fgt(arr.filter(p => p.Devenir)), sans = arr.length - avec[2];
    return { lib, tot, cells: [...fgt(arr), ...dev, ...avec], controle: arr.length ? (sans ? `${sans} sans devenir` : "OK") : "" };
  };
  const GROUPES = [["1er cycle", "Total collège"], ["Voie professionnelle", "Total lycée professionnel"], ["Voie générale et technologique", "Total lycée général et technologique"], ["Autres", null]];
  const mat = [];
  GROUPES.forEach(([cycle, libTot]) => {
    const cls = [...D.classes.values()].filter(c => c.Cycle === cycle);
    cls.forEach(c => mat.push(ligneMat(c.Classe, ps.filter(p => p.jeune.classe === c))));
    if (libTot) mat.push(ligneMat(libTot, ps.filter(p => p.jeune.classe && p.jeune.classe.Cycle === cycle), true));
  });
  const sansClasse = ps.filter(p => !p.jeune.classe);
  if (sansClasse.length) mat.push(ligneMat("Classe d'origine non renseignée", sansClasse));
  mat.push(ligneMat("TOTAL", ps, true));
  const etabs = [...new Set(parcoursPeriode(d => d.Rapport === rap).map(p => p.etabP))].map(id => D.etab.get(id)).filter(Boolean).sort((a, b) => a.Nom.localeCompare(b.Nom));
  const etab = R_ETAB ? (D.etab.get(Number(R_ETAB)) || {}) : null;
  const coord = [...new Set(ps.map(p => D.agents.get(p.Agent)).filter(Boolean).map(a => `${a.Prenom || ""} ${a.Nom || ""}`.trim()))].join(", ");
  const entete = [["Etablissement :", etab ? etab.Nom : "Toutes les structures porteuses"], ["Ville :", etab ? (etab.Commune || "") : ""],
    ["Coordonnateur/trice MLDS :", coord], ["Date :", fmt(aujourdhui())], ["Signature du chef d'établissement :", ""]];
  return { rap, tete, filles: filles.map(ligne), garcons: garcons.map(ligne), mat, etabs, nb: ps.length, entete,
    nbF: filles.length, nbG: garcons.length };
}

/* ---------- 3. prévention : profils et motifs ---------- */
function preventionDonnees() {
  const ps = parcoursPeriode(d => d.Famille === "Prévention");
  const pafi = parcoursPeriode(d => /PAFI/i.test(d.Code || "") || /PAFI/i.test(d.Libelle || ""));
  const profils = [...D.motifs.values()].filter(m => m.Nature === "Profil"), motifs = [...D.motifs.values()].filter(m => m.Nature !== "Profil");
  const compter = js => [js.length, ...[...profils, ...motifs].map(m => js.filter(j => j.profils.includes(m) || j.motif === m || j.secondaires.includes(m)).length)];
  const uniques = arr => [...new Set(arr.map(p => p.jeune))];
  const code = t => ({ "Collège": "CLG", "Lycée professionnel": "LP", "Lycée général et technologique": "LGT", "Lycée polyvalent": "LPO", "EREA": "EREA" }[t] || t || "");
  const lignes = [...D.etab.values()].filter(etabDansTerritoire)
    .map(e => [code(e.Type), (e.Commune || "").toUpperCase(), e.Nom || "", ...compter(uniques(ps.filter(p => p.etabP === e.id)))])
    .sort((x, y) => x[1].localeCompare(y[1]) || x[2].localeCompare(y[2]));
  const horsEtab = uniques(ps.filter(p => !p.etabP || !D.etab.has(p.etabP)));
  if (horsEtab.length) lignes.push(["", "", "Sans établissement", ...compter(horsEtab)]);
  const lignePafi = ["PAFI - PAFI-TDO", "", "", ...compter(uniques(pafi))];
  const toutes = [...lignes, lignePafi];
  const tot = ["", "", "TOTAL", ...toutes[0].slice(3).map((_, i) => toutes.reduce((s, l) => s + l[i + 3], 0))];
  // ZAP et PAPS du territoire choisi
  const zaps = R_TERR.startsWith("zap:") ? [D.zaps.get(Number(R_TERR.split(":")[1]))].filter(Boolean)
    : [...new Set([...D.etab.values()].filter(etabDansTerritoire).map(e => e.Bassin))].map(id => D.zaps.get(id)).filter(Boolean);
  const zap = zaps.length === 1 ? zaps[0].Bassin : zaps.length ? `${zaps.length} ZAP` : "";
  const paps = [...new Set(zaps.map(z => z.PAPS).filter(Boolean))].join(", ");
  return { tete: ["CODE", "VILLE", "ETABLISSEMENT", "SUIVIS INDIV", ...profils.map(m => m.Libelle.toUpperCase()), ...motifs.map(m => m.Libelle.toUpperCase())],
    nbProfils: profils.length, nbMotifs: motifs.length, lignes, lignePafi, tot, zap, paps };
}

/* ---------- rendu ---------- */
function tableHtml(tete, lignes, opts = {}) {
  return `<div class="scroll"><table class="tbl rap"><thead>${opts.sur || ""}<tr>${tete.map((h, i) => `<th class="${i >= (opts.num ?? 1) ? "n" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>
    ${lignes.map(l => `<tr class="${l[l.length - 1] === true || /^(Total|TOTAL|Sous-total)/.test(l[0]) || l[2] === "TOTAL" ? "tot" : ""}">${l.filter(x => x !== true).map((c, i) => `<td class="${i >= (opts.num ?? 1) ? "n" : ""}">${c === 0 ? '<span class="zero">0</span>' : esc(c)}</td>`).join("")}</tr>`).join("")
    || `<tr><td colspan="${tete.length}" class="vide">Aucun jeune sur la période.</td></tr>`}</tbody></table></div>`;
}
const NOTES_DEVENIR = ["(1) rescolarisation, droit au retour, droit au maintien, mention complémentaire",
  "(2) contrat d'apprentissage (CFA public ou privé), contrat de professionnalisation. Dispositif GRETA",
  "(3) dispositif régional de formation (qualifiant ou préqualifiant), dispositif GRETA",
  "(4) structure de retour à l'école (micro collège, micro lycée, lycée nouvelle chance…)",
  "(5) ne pas comptabiliser ici les jeunes pris en charge en service civique alterné/combiné (onglet diversification des parcours)",
  "(6) CDD, CDI, etc", "(7) E2C, EPIDE, Service militaire volontaire (SMV), Mission Locale, etc",
  "Élèves allophones : nouvellement arrivés (EANA)", "Enseignement privé s/s contrat : englobe collèges & lycées privés s/s contrat"];
const RENVOIS = ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "", "", ""];
function matriceHtml(mat) {
  const groupes = [["Nombre de jeunes pris en charge", ""], ...DEVENIRS.map((d, i) => [d[0], RENVOIS[i]]), ["Total (devenirs renseignés)", ""]];
  return `<div class="scroll"><table class="tbl rap mat"><thead>
    <tr><th rowspan="2">Classe d'origine</th>${groupes.map(([g, r]) => `<th colspan="3" class="grp">${esc(g)} ${r ? `<sup>${r}</sup>` : ""}</th>`).join("")}<th rowspan="2">Contrôle saisie</th></tr>
    <tr>${groupes.map(() => '<th class="n">F</th><th class="n">G</th><th class="n">T</th>').join("")}</tr></thead><tbody>
    ${mat.map(l => `<tr class="${l.tot ? "tot" : ""}"><td>${esc(l.lib)}</td>${l.cells.map((c, i) => `<td class="n ${i % 3 === 2 ? "t" : ""}">${c ? c : '<span class="zero">·</span>'}</td>`).join("")}
      <td class="${l.controle === "OK" ? "okc" : l.controle ? "warnc" : ""}">${esc(l.controle)}</td></tr>`).join("")}</tbody></table></div>`;
}
function vueRapports() {
  const [, , lib] = bornesRapport(), a0 = anneeScolaire(aujourdhui());
  if (R_ANNEE == null) R_ANNEE = a0;
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`;
  const terr = [opt("", "Région académique", R_TERR), ...[...D.aca.values()].map(a => opt("aca:" + a.id, "Académie de " + a.Academie, R_TERR)),
    ...[...D.dep.values()].sort((a, b) => a.Code.localeCompare(b.Code)).map(d => opt("dep:" + d.id, `${d.Departement} (${d.Code})`, R_TERR)),
    ...(D.zaps.size ? [`<optgroup label="ZAP">${[...D.zaps.values()].sort((a, b) => (a.Bassin || "").localeCompare(b.Bassin || "")).map(z => opt("zap:" + z.id, z.Bassin, R_TERR)).join("")}</optgroup>`] : [])].join("");
  const chip = (k, l) => `<button class="chip ${R_TYPE === k ? "on" : ""}" data-rtype="${k}">${l}</button>`;
  let corps = "";
  if (R_TYPE === "synthese") {
    corps = syntheseTableaux().map(t => `<div class="card"><h2>${esc(t.titre)}</h2>${tableHtml(t.tete, t.lignes)}</div>`).join("") +
      `<p class="vide">Comptage : jeunes présents dans l'action pendant la période (entrés avant la fin de la période et non sortis avant son début).</p>`;
  } else if (R_TYPE === "action") {
    const A = actionDonnees();
    const enTete = `<dl class="f entete">${A.entete.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v) || "&nbsp;"}</dd>`).join("")}</dl>`;
    corps = `<div class="bar"><select id="r-action">${rapportsAction().map(r => opt(r, r, A.rap)).join("")}</select>
        <select id="r-etab">${opt("", "Toutes les structures porteuses", R_ETAB)}${A.etabs.map(e => opt(e.id, e.Nom, R_ETAB)).join("")}</select>
        <span class="vide">${A.nb} jeune(s) · ${A.nbF} fille(s) · ${A.nbG} garçon(s)</span></div>
      <div class="card"><h2>${esc(A.rap)}<small>${esc(lib)}</small></h2>${enTete}
        <h2 style="margin-top:14px">Nombre de jeunes pris en charge et devenir à l'issue de l'action<small>F = filles · G = garçons · T = total</small></h2>
        ${matriceHtml(A.mat)}
        <ol class="notes">${NOTES_DEVENIR.map(n => `<li>${esc(n)}</li>`).join("")}</ol></div>
      <div class="card"><h2>Filles<small>${A.nbF}</small></h2>${tableHtml(A.tete, A.filles, { num: 99 })}</div>
      <div class="card"><h2>Garçons<small>${A.nbG}</small></h2>${tableHtml(A.tete, A.garcons, { num: 99 })}</div>`;
  } else {
    const P = preventionDonnees();
    const sur = `<tr><th colspan="3"></th><th class="n">INDIV</th><th colspan="${P.nbProfils}" class="grp">PROFILS</th><th colspan="${P.nbMotifs}" class="grp">MOTIFS</th></tr>`;
    corps = `<div class="card"><h2>PRÉVENTION<small>suivis individuels, profils et motifs par établissement</small></h2>
      <dl class="f entete"><dt>ZAP :</dt><dd>${esc(P.zap) || "&nbsp;"}</dd><dt>PAPS :</dt><dd>${esc(P.paps) || "<span class='vide'>à renseigner dans la table Bassins / ZAP</span>"}</dd></dl>
      ${tableHtml(P.tete, [...P.lignes, P.lignePafi, P.tot], { num: 3, sur })}
      <p class="vide">Un même jeune peut avoir plusieurs profils et plusieurs motifs : les colonnes ne s'additionnent pas.</p></div>`;
  }
  return `<div class="bar">${chip("synthese", "Synthèse trimestrielle")}${chip("action", "Tableaux par action")}${chip("prevention", "Prévention – profils")}
      <select id="r-annee">${[a0, a0 - 1, a0 - 2].map(y => opt(y, `${y}-${y + 1}`, R_ANNEE)).join("")}</select>
      <select id="r-trim">${[["T1", "Trimestre 1"], ["T2", "Trimestre 2"], ["T3", "Trimestre 3"], ["A", "Année complète"]].map(([k, l]) => opt(k, l, R_TRIM)).join("")}</select>
      <select id="r-terr">${terr}</select>
      <button class="btn" id="r-export">⤓ Exporter ce rapport (Excel)</button></div>
    <div class="crumb"><b>${esc(nomTerr())}</b><span class="sep">·</span><span style="color:var(--muted)">${esc(lib)}</span></div>
    ${corps}`;
}

function exporterRapport() {
  if (!window.XLSX) { toast("Export indisponible"); return; }
  const wb = XLSX.utils.book_new(), [, , lib] = bornesRapport(), entete = [[nomTerr()], [lib], []];
  const propre = l => l.filter(x => x !== true);
  let nom;
  if (R_TYPE === "synthese") {
    const aoa = [...entete];
    syntheseTableaux().forEach(t => { aoa.push([t.titre], t.tete, ...t.lignes.map(propre), []); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Synthèse"); nom = "synthese-trimestrielle";
  } else if (R_TYPE === "action") {
    const A = actionDonnees();
    const ent = [[A.rap], [lib], ...A.entete, []];
    const h1 = ["Classe d'origine", "Nombre de jeunes pris en charge", "", "", ...DEVENIRS.flatMap((d, i) => [d[0] + (RENVOIS[i] ? " " + RENVOIS[i] : ""), "", ""]), "Total", "", "", "Contrôle saisie"];
    const h2 = ["", ...Array(DEVENIRS.length + 2).fill(["F", "G", "T"]).flat(), ""];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...ent, h1, h2, ...A.mat.map(l => [l.lib, ...l.cells, l.controle]), [], ...NOTES_DEVENIR.map(n => [n])]), "Synthèse");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...ent, A.tete, ...A.filles]), "Filles");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...ent, A.tete, ...A.garcons]), "Garçons");
    nom = A.rap.replace(/[^\wÀ-ÿ-]+/g, "_");
  } else {
    const P = preventionDonnees();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...entete, ["ZAP :", P.zap], ["PAPS :", P.paps], [], ["", "", "", "PRÉVENTION"],
      ["", "", "", "INDIV", "PROFILS", ...Array(P.nbProfils - 1).fill(""), "MOTIFS"], P.tete, ...P.lignes, P.lignePafi, P.tot]), "PRÉVENTION");
    nom = "prevention-profils";
  }
  XLSX.writeFile(wb, `${nom}-${lib.replace(/[^\w-]+/g, "-")}.xlsx`);
}

/* ---------- parcours dans la fiche jeune ---------- */
function blocParcours(j) {
  return `<div style="margin-top:14px"><b style="font-size:13px">Parcours MLDS</b>
    <ul class="tl" style="margin-top:6px">${(j.parcours || []).map(p => `<li><span class="d">${fmt(p.Date_entree)}</span><span class="p" style="background:${p.Date_sortie ? "var(--grey)" : "var(--blue)"}"></span>
      <span><b>${esc(p.disp.Libelle || "Dispositif")}</b>${p.motifE.Motif ? `<small>Motif d'entrée : ${esc(p.motifE.Motif)}</small>` : ""}${p.Difficultes ? `<small>Difficultés : ${esc(p.Difficultes)}</small>` : ""}
      ${p.Date_sortie ? `<small>Sortie le ${fmt(p.Date_sortie)} : ${esc(p.Devenir || "devenir non renseigné")}</small>` : `<small><button class="btn-lien" data-clore-parcours="${p.id}">Clore ce parcours</button></small>`}</span></li>`).join("")
      || `<li><span class="d"></span><span></span><span class="vide">Aucun parcours enregistré.</span></li>`}</ul>
    <button class="btn sec" data-inscrire="${j.id}">+ Inscrire dans un dispositif</button></div>`;
}
function ouvrirInscription(jid) {
  const j = D.jeunes.find(x => x.id === jid);
  const bg = modal(`<h3>Inscrire ${esc(nomJeune(j))} dans un dispositif</h3><form class="fm" id="fi">
    <label class="full">Dispositif<select name="disp" required><option value="">Choisir…</option>${[...D.dispositifs.values()].map(d => `<option value="${d.id}">${esc(d.Libelle)}</option>`).join("")}</select></label>
    <label>Date d'entrée<input type="date" name="date" value="${isoDate(aujourdhui())}"></label>
    <label>Structure porteuse<select name="etab"><option value="">—</option>${[...D.etab.values()].sort((a, b) => (a.Nom || "").localeCompare(b.Nom || "")).map(e => `<option value="${e.id}" ${e.id === j.etab ? "selected" : ""}>${esc(e.Nom)}</option>`).join("")}</select></label>
    <label class="full">Motif d'entrée<select name="motif"><option value="">—</option>${[...D.motifsEntree.values()].map(m => `<option value="${m.id}">${esc(m.Motif)}</option>`).join("")}</select></label>
    <label class="full">Modalités d'accompagnement<input name="modal" placeholder="2 ou 3 mots"></label>
    <label class="full">Difficultés majeures observées <span class="vide">(micro-lycée)</span><textarea name="diff" rows="2"></textarea></label>
    <label>Examen préparé<select name="exam"><option value=""></option>${["Bac Gen", "Bac Pro", "Bac Tech", "BT", "CAP", "CFG", "DELF", "DNB", "DNB Pro", "Autre"].map(x => `<option>${x}</option>`).join("")}</select></label>
  </form><div class="msg" id="fi-msg"></div><div class="foot"><button class="btn sec" data-close>Annuler</button><button class="btn" id="fi-ok">Inscrire</button></div>`);
  const f = bg.querySelector("#fi");
  bg.querySelector("[data-close]").onclick = () => bg.remove();
  bg.querySelector("#fi-ok").onclick = async () => {
    if (!f.disp.value) { bg.querySelector("#fi-msg").textContent = "Choisissez le dispositif."; return; }
    const rec = { Jeune: jid, Dispositif: Number(f.disp.value), Date_entree: versDate(f.date.value), Etablissement: Number(f.etab.value) || 0,
      Motif_entree: Number(f.motif.value) || 0, Modalites: f.modal.value, Difficultes: f.diff.value, Examen_prepare: f.exam.value || null, Agent: j.Agent_referent || 0 };
    try { await ecrire([["AddRecord", "Parcours", null, rec]], () => { D.parcours.push({ id: Date.now(), ...rec }); }); bg.remove(); toast("Inscription enregistrée"); }
    catch (e) { bg.querySelector("#fi-msg").textContent = "Enregistrement refusé : " + e.message; }
  };
}
function ouvrirCloreParcours(pid) {
  const p = D.parcours.find(x => String(x.id) === String(pid));
  const bg = modal(`<h3>Clore le parcours : ${esc(p.disp.Libelle || "")}</h3><form class="fm" id="fp">
    <label>Date de sortie<input type="date" name="date" value="${isoDate(aujourdhui())}"></label>
    <label>Admis à l'examen<select name="admis"><option value=""></option><option>O</option><option>N</option></select></label>
    <label class="full">Type de solution (devenir)<select name="dev">${DEVENIRS.map(d => `<option>${esc(d[0])}</option>`).join("")}</select></label>
    <label class="full">Si statut scolaire ou apprentissage, classe<select name="classe"><option value=""></option>${["6E à 4E", "4SEGPA", "3G", "3SEGPA", "3PRE-MET", "1CAP2", "2CAP2", "2NDPRO", "1ERPRO", "TLEPRO", "2GT", "1GT", "TERGT", "SUP", "ULIS", "ET SPE"].map(x => `<option>${x}</option>`).join("")}</select></label>
  </form><div class="msg" id="fp-msg"></div><div class="foot"><button class="btn sec" data-close>Annuler</button><button class="btn" id="fp-ok">Clore le parcours</button></div>`);
  const f = bg.querySelector("#fp");
  bg.querySelector("[data-close]").onclick = () => bg.remove();
  bg.querySelector("#fp-ok").onclick = async () => {
    const champs = { Date_sortie: versDate(f.date.value), Devenir: f.dev.value, Admis: f.admis.value || null, Classe_reprise: f.classe.value || null };
    try { await ecrire([["UpdateRecord", "Parcours", p.id, champs]], () => Object.assign(p, champs)); bg.remove(); toast("Parcours clos"); }
    catch (e) { bg.querySelector("#fp-msg").textContent = "Enregistrement refusé : " + e.message; }
  };
}
