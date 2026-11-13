/* Données fictives du mode démonstration (aucune donnée réelle). */
function donneesDemo() {
  let graine = 2026;
  const rnd = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  const ent = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const choix = arr => arr[Math.floor(rnd() * arr.length)];
  const pondere = (arr, w) => { let x = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < arr.length; i++) { x -= w[i]; if (x < 0) return arr[i]; } return arr[arr.length - 1]; };
  const J = 86400, t0 = new Date(), T = Date.UTC(t0.getFullYear(), t0.getMonth(), t0.getDate()) / 1000;
  const ouvre = s => { let d = new Date(s * 1000); while (d.getUTCDay() === 0 || d.getUTCDay() === 6 || d.getUTCMonth() === 6 || d.getUTCMonth() === 7) { s += J; d = new Date(s * 1000); } return s; };

  const Academies = [{ id: 1, Academie: "Bordeaux" }, { id: 2, Academie: "Limoges" }, { id: 3, Academie: "Poitiers" }];
  const DEPS = [["16", "Charente", 3, "Angoulême", "Cognac", 3], ["17", "Charente-Maritime", 3, "La Rochelle", "Rochefort", 4], ["19", "Corrèze", 2, "Tulle", "Brive-la-Gaillarde", 2],
    ["23", "Creuse", 2, "Guéret", "Aubusson", 1], ["24", "Dordogne", 1, "Périgueux", "Bergerac", 3], ["33", "Gironde", 1, "Bordeaux", "Mérignac", 9],
    ["40", "Landes", 1, "Mont-de-Marsan", "Dax", 2], ["47", "Lot-et-Garonne", 1, "Agen", "Villeneuve-sur-Lot", 3], ["64", "Pyrénées-Atlantiques", 1, "Pau", "Bayonne", 4],
    ["79", "Deux-Sèvres", 3, "Niort", "Bressuire", 2], ["86", "Vienne", 3, "Poitiers", "Châtellerault", 3], ["87", "Haute-Vienne", 2, "Limoges", "Saint-Junien", 4]];
  const Departements = DEPS.map((d, i) => ({ id: i + 1, Code: d[0], Departement: d[1], Academie: d[2] }));
  const Etablissements = [], Agents = [];
  const PRENOMS = ["Camille", "Dominique", "Alex", "Sacha", "Morgan", "Charlie", "Lou", "Noa", "Eden", "Maël", "Inès", "Yanis", "Jade", "Lucas", "Manon", "Enzo", "Chloé", "Hugo", "Léna", "Théo", "Emma", "Rayan", "Zoé", "Ethan", "Sarah", "Adam", "Lina", "Tom", "Nina", "Liam"];
  const NOMS = ["Fictif", "Exemple", "Démo", "Essai", "Modèle", "Témoin", "Factice", "Test", "Maquette", "Prototype"];
  const MODELES = [["Collège", "Collège fictif"], ["Lycée professionnel", "Lycée professionnel fictif"], ["Collège", "Collège fictif"], ["Lycée polyvalent", "Lycée polyvalent fictif"], ["Lycée professionnel", "Lycée professionnel fictif"], ["Collège", "Collège fictif"], ["Collège", "Collège fictif"]];
  DEPS.forEach((d, i) => {
    const n = 2 + Math.floor(d[5] / 2);
    for (let k = 0; k < n; k++) { const v = k % 2 ? d[4] : d[3]; Etablissements.push({ id: Etablissements.length + 1, Nom: `${MODELES[k][1]} ${String.fromCharCode(65 + k)} – ${v}`, Type: MODELES[k][0], Commune: v, Departement: i + 1 }); }
    const na = 1 + (d[5] >= 4) + (d[5] >= 9);
    for (let k = 0; k < na; k++) Agents.push({ id: Agents.length + 1, Prenom: PRENOMS[(i * 3 + k) % PRENOMS.length], Nom: NOMS[(i + k) % NOMS.length].toUpperCase(), Departement: i + 1, Role_Grist: "Agent" });
  });
  Agents.push({ id: Agents.length + 1, Prenom: "Draio", Nom: "RÉGION", Departement: 0, Role_Grist: "Superviseur régional" });
  const MOTIFS = [["ABS", "Absentéisme / assiduité", "Assiduité & décrochage", 30], ["RISQ", "Signaux faibles / risque de décrochage", "Assiduité & décrochage", 14],
    ["DEC", "Décrochage avéré (sorti sans solution)", "Assiduité & décrochage", 12], ["ORIENT", "Orientation subie / sans affectation", "Orientation & parcours", 10],
    ["SANTE", "Santé / santé mentale / phobie scolaire", "Handicap & santé", 8], ["COMP", "Troubles du comportement / conduites à risque", "Comportement", 7],
    ["FAM", "Difficultés familiales / sociales", "Social & familial", 5], ["HAND", "Situation de handicap (PPS / MDPH)", "Handicap & santé", 4],
    ["HARC", "Harcèlement (victime ou auteur)", "Climat scolaire", 3], ["ALLO", "Élève allophone / EANA / EFIV", "Orientation & parcours", 2]];
  const Motifs = MOTIFS.map((m, i) => ({ id: i + 1, Code: m[0], Libelle: m[1], Famille: m[2] }));
  const TYPES = [["ACC_POS", "Entretien de positionnement / analyse de situation", "Accompagnement personnalisé", "Suivi individuel", 1],
    ["ACC_ENT", "Entretien de suivi / bilan avec le jeune", "Accompagnement personnalisé", "Suivi individuel", 1],
    ["ACC_FAM", "Rencontre famille / éducateur / référent partenaire", "Accompagnement personnalisé", "Suivi individuel", 1],
    ["ACC_DEM", "Accompagnement dans les démarches (stage, visite, inscription)", "Accompagnement personnalisé", "Suivi individuel", 1],
    ["PED_SEQ", "Séquence pédagogique avec un groupe de jeunes", "Activité pédagogique", "Pédagogie", 0],
    ["CP_REU", "Réunion de concertation / régulation d'équipe", "Coordination pédagogique", "Ingénierie technique", 0],
    ["IF_GPDS", "Participation à un GPDS", "Ingénierie de formation", "Ingénierie technique", 0],
    ["IF_COMM", "Autre commission (absentéisme, ESS, cellule de veille…)", "Ingénierie de formation", "Ingénierie technique", 0],
    ["IF_PSAD", "Réunion PSAD / réseau Foquale", "Ingénierie de formation", "Ingénierie technique", 0],
    ["IF_FORMGPDS", "Formation des référents décrochage / membres GPDS", "Ingénierie de formation", "Formation dispensée", 0],
    ["IF_PART", "Réunion de partenaires (ML, E2C, Epide, CFA, Greta…)", "Ingénierie de formation", "Ingénierie technique", 0],
    ["IF_AFFECT", "Commission de positionnement / affectation des décrocheurs", "Ingénierie de formation", "Ingénierie technique", 0],
    ["HR_FORMS", "Formation suivie par l'agent", "Hors référentiel", "Formation suivie", 0],
    ["HR_ADMIN", "Gestion administrative / déplacements", "Hors référentiel", "Gestion", 0]];
  const Types_activite = TYPES.map((t, i) => ({ id: i + 1, Code: t[0], Libelle: t[1], Domaine_BO: t[2], Axe: t[3], Jeune_requis: !!t[4] }));
  const typ = Object.fromEntries(TYPES.map((t, i) => [t[0], i + 1]));
  const Jeunes = [], Activites = [];
  const act = (date, code, agent, extra) => { if (date <= T) Activites.push({ id: Activites.length + 1, Date: date, Heure_debut: choix(["08:30", "09:00", "10:00", "11:00", "13:30", "14:00", "15:00", "16:00"]), Duree_h: 1, Type: typ[code], Agent: agent, Jeune: 0, Etablissement: 0, ...extra }); };
  const DEBUT = Date.UTC(2025, 0, 6) / 1000;
  const muet = Agents.find(a => a.Departement === 8).id;   // Lot-et-Garonne : agent sans saisie récente
  Agents.filter(a => a.Role_Grist === "Agent").forEach(ag => {
    const d = DEPS[ag.Departement - 1], etabs = Etablissements.filter(e => e.Departement === ag.Departement).map(e => e.id);
    const intensite = d[0] === "23" ? .5 : d[0] === "86" ? .8 : 1;
    for (let n = d[0] === "23" ? 14 : ent(18, 26); n > 0; n--) {
      const entree = ouvre(DEBUT + ent(0, Math.floor((T - DEBUT) / J) - 3) * J);
      const mp = pondere(MOTIFS.map((_, i) => i + 1), MOTIFS.map(m => m[3]));
      const sec = [...new Set(Array.from({ length: choix([0, 0, 0, 0, 1, 1, 1, 2]) }, () => pondere(MOTIFS.map((_, i) => i + 1), MOTIFS.map(m => m[3]))))].filter(x => x !== mp);
      let sortie = null, sit = null;
      const age = (T - entree) / J;
      if (age > 120 && rnd() < .8) { sortie = ouvre(entree + ent(60, Math.min(age - 1, 300)) * J); sit = pondere(["Retour en formation initiale", "Apprentissage", "Emploi", "Service civique", "Autre dispositif (E2C, Epide…)", "Déménagement", "Perdu de vue", "Autre"], [34, 22, 6, 6, 8, 6, 12, 6]); }
      const etab = rnd() > .15 ? choix(etabs) : 0;
      const j = { id: Jeunes.length + 1, Identifiant: `J-${new Date(entree * 1000).getUTCFullYear()}-${String(Jeunes.length + 1).padStart(4, "0")}`, Nom: choix(NOMS).toUpperCase(), Prenom: choix(PRENOMS),
        Niveau: choix(["4e", "3e", "2nde pro", "1re pro", "2nde GT", "CAP 1", "Sans affectation"]), Etablissement: etab, Statut: choix(["Scolarisé - en risque", "Scolarisé - absentéiste", "En action MLDS"]),
        Motif_principal: mp, Motifs_secondaires: sec.length ? ["L", ...sec] : null, Agent_referent: ag.id, Date_entree_suivi: entree, Date_sortie_suivi: sortie, Situation_sortie: sit };
      Jeunes.push(j);
      if (rnd() < .03 && !sortie) continue;
      let x = ouvre(entree + ent(2, 18) * J);
      act(x, "ACC_POS", ag.id, { Jeune: j.id, Compte_rendu: "Analyse de la situation, souhaits du jeune recueillis" });
      const silence = rnd() < .035, fin = sortie || T;
      for (;;) {
        x = ouvre(x + Math.floor(ent(7, 20) / intensite) * J);
        if (x > fin || (silence && (T - x) / J < 45)) break;
        if (ag.id === muet && (T - x) / J < 22) break;
        const code = pondere(["ACC_ENT", "ACC_FAM", "ACC_DEM"], [60, 22, 18]);
        act(x, code, ag.id, { Jeune: j.id, Duree_h: choix([.5, 1, 1, 1.5, 2]), Compte_rendu: choix(["Point d'étape, engagement tenu", "Assiduité en progrès", "Famille mobilisée", "Visite d'un CFA", "Difficultés persistantes, à revoir"]) });
      }
    }
    for (let w = DEBUT; w <= T; w += 7 * J) {
      const m = new Date(w * 1000).getUTCMonth(); if (m === 6 || m === 7) continue;
      for (let k = ent(1, 3); k > 0; k--) {
        const x = ouvre(w + ent(0, 4) * J);
        if (ag.id === muet && (T - x) / J < 22) continue;
        const code = pondere(["IF_GPDS", "IF_COMM", "IF_PSAD", "IF_PART", "IF_FORMGPDS", "PED_SEQ", "CP_REU", "IF_AFFECT", "HR_FORMS", "HR_ADMIN"], [18, 8, 10, 8, 4, 9, 5, 4, 3, 10]);
        act(x, code, ag.id, { Etablissement: ["IF_GPDS", "IF_COMM", "PED_SEQ"].includes(code) ? choix(etabs) : 0, Duree_h: code === "IF_FORMGPDS" ? 3 : choix([1, 1.5, 2]),
          Nb_participants: ["IF_FORMGPDS", "PED_SEQ", "IF_GPDS"].includes(code) ? ent(6, 18) : null,
          Nb_situations_examinees: ["IF_GPDS", "IF_COMM", "IF_PSAD", "IF_AFFECT"].includes(code) ? ent(2, 12) : null, Intitule: TYPES[typ[code] - 1][1] });
      }
    }
  });
  return { Academies, Departements, Bassins: [], Etablissements, Agents, Motifs, Types_activite,
    Seuils: [{ Sans_premiere_action_j: 15, Sans_action_j: 30, Cumul_motifs: 3, Jeunes_sans_GPDS: 10, Part_attention: .2, Baisse_activite: -.2, Agent_sans_saisie_j: 15 }],
    Jeunes, Activites };
}
