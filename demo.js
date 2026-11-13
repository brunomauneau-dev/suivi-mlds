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
  const MOTIFS = [["P_MDPH", "MDPH (situation de handicap)", "Profil", 10, "Profil"], ["P_PSY", "Psychologique", "Profil", 18, "Profil"], ["P_MED", "Médical", "Profil", 10, "Profil"],
    ["P_EDUC", "Éducatif", "Profil", 30, "Profil"], ["P_PJJ", "PJJ", "Profil", 4, "Profil"], ["P_ASE", "ASE", "Profil", 6, "Profil"], ["P_SOC", "Social", "Profil", 22, "Profil"],
    ["M_MOTIV", "Motivation scolaire", "Assiduité & motivation", 22, "Motif"], ["M_RUPT_CFA", "Rupture CFA", "Orientation & parcours", 6, "Motif"],
    ["M_ABS", "Absentéisme", "Assiduité & motivation", 28, "Motif"], ["M_MAL_ETRE", "Mal-être", "Santé & bien-être", 8, "Motif"], ["M_LANGUE", "Langue", "Langue", 3, "Motif"],
    ["M_ORIENT", "Orientation", "Orientation & parcours", 12, "Motif"], ["M_DIFF_SCOL", "Difficultés scolaires", "Apprentissages", 10, "Motif"],
    ["M_RSA", "RSA", "Social", 1, "Motif"], ["M_PROJET", "Travail de projet", "Orientation & parcours", 4, "Motif"], ["M_ESTIME", "Estime de soi", "Santé & bien-être", 6, "Motif"]];
  const Motifs = MOTIFS.map((m, i) => ({ id: i + 1, Code: m[0], Libelle: m[1], Famille: m[2], Nature: m[4] }));
  const idsMotifs = MOTIFS.map((m, i) => [i + 1, m]).filter(x => x[1][4] === "Motif"), idsProfils = MOTIFS.map((m, i) => [i + 1, m]).filter(x => x[1][4] === "Profil");
  const CLASSES = [["6e-5e", "Autres 1er cycle", 2], ["4e Générale", "Autres 1er cycle", 6], ["3e Générale", "3ème générale", 18], ["4e et 3e SEGPA", "4ème et 3ème SEGPA", 5],
    ["3e PREPA METIER", "3ème prépa métiers", 4], ["1re année CAP", "1ère CAP", 10], ["Terminale CAP", "Terminales CAP", 4], ["2nde professionnelle", "2nde PRO", 18],
    ["1re professionnelle", "1ère PRO", 8], ["Terminale professionnelle", "Terminale PRO", 3], ["Apprentissage niveau III (CAP)", "Apprentissage niveau 3 (CAP)", 5],
    ["2nde GT", "2nde GT", 10], ["1re GT", "1ère GT", 4], ["Autres LP", "PAPS / Autres", 2]];
  const Classes_origine = CLASSES.map((c, i) => ({ id: i + 1, Classe: c[0], Ligne_synthese: c[1] }));
  const DISP = [["PREV_ENT", "Entretiens de prévention", "Prévention", "", "Entretiens de prévention"], ["GPDS", "Suivi GPDS", "Prévention", "", "Suivis GPDS"],
    ["INFO_SAS", "Action d'information et sensibilisation (SAS)", "Information et sensibilisation", "1 - Actions information et sensibilisation", ""],
    ["PAPS_TP", "PAPS temps plein", "Remobilisation", "2 - Actions remobilisation et remise à niveau", "PAPS temps plein"],
    ["PAFI_POLES", "Parcours modulaire – PAFI (pôles)", "Remobilisation", "2 - Actions remobilisation et remise à niveau", "Parcours modulaires - PAFI (pôles)"],
    ["PAFI_COORD", "PAFI suivi par la coordination", "Remobilisation", "2 - Actions remobilisation et remise à niveau", "PAFI suivis par la coordination"],
    ["REMOB", "Action de remobilisation et remise à niveau", "Remobilisation", "2 - Actions remobilisation et remise à niveau", ""],
    ["MICRO", "Micro-lycée – remobilisation premières", "Retour à l'école", "2 - Micro-lycée remobilisation premières", ""],
    ["CAND_PAPS", "Candidature PAPS", "Candidature", "", "Candidatures PAPS"], ["FSE", "Action FSE", "Remobilisation", "", "Actions FSE"]];
  const Dispositifs = DISP.map((d, i) => ({ id: i + 1, Code: d[0], Libelle: d[1], Famille: d[2], Rapport: d[3], Ligne_synthese: d[4] }));
  const disp = Object.fromEntries(DISP.map((d, i) => [d[0], i + 1]));
  const ME = [["Démission / rupture en cours d'année", "Démission en cours/fin d'année", "rupture en cours d'année"], ["Non affecté (Affelnet)", "Non affecté", "non affecté par Affelnet"],
    ["Refus d'affectation", "Refus d'affectation", "affectation refusée"], ["Rupture de contrat d'apprentissage", "Rupture de contrat d'alternance", "rupture apprentissage"],
    ["Vœu de recensement en fin d'année", "Vœu de recensement en fin d'année", "non affecté par Affelnet"], ["Exclusion (conseil de discipline)", "Exclusion (conseil de discipline)", "rupture en cours d'année"],
    ["Suite GPDS / Foquale", "Suite GPDS / Foquale", "rupture en cours d'année"], ["Autre motif", "Autre motif ", "non scolarisé(e) "]];
  const Motifs_entree = ME.map((m, i) => ({ id: i + 1, Motif: m[0], Ligne_synthese: m[1], Motif_inscription: m[2] }));
  const Parcours = [];
  const DEV = DEVENIRS.map(d => d[0]);
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
      const tm = () => pondere(idsMotifs.map(x => x[0]), idsMotifs.map(x => x[1][3])), tp = () => pondere(idsProfils.map(x => x[0]), idsProfils.map(x => x[1][3]));
      const mp = tm();
      const sec = [...new Set(Array.from({ length: choix([0, 0, 0, 1, 1, 2]) }, tm))].filter(x => x !== mp);
      const prof = [...new Set(Array.from({ length: choix([0, 0, 0, 1, 1, 2]) }, tp))];
      const classe = pondere(Classes_origine.map(c => c.id), CLASSES.map(c => c[2]));
      let sortie = null, sit = null;
      const age = (T - entree) / J;
      if (age > 120 && rnd() < .8) { sortie = ouvre(entree + ent(60, Math.min(age - 1, 300)) * J); sit = pondere(DEV, [30, 20, 4, 6, 6, 5, 8, 8, 6, 7]); }
      const etab = rnd() > .15 ? choix(etabs) : 0;
      const j = { id: Jeunes.length + 1, Identifiant: `J-${new Date(entree * 1000).getUTCFullYear()}-${String(Jeunes.length + 1).padStart(4, "0")}`, Nom: choix(NOMS).toUpperCase(), Prenom: choix(PRENOMS),
        Niveau: choix(["4e", "3e", "2nde pro", "1re pro", "2nde GT", "CAP 1", "Sans affectation"]), Etablissement: etab, Statut: choix(["Scolarisé - en risque", "Scolarisé - absentéiste", "En action MLDS"]),
        Motif_principal: mp, Motifs_secondaires: sec.length ? ["L", ...sec] : null, Agent_referent: ag.id, Date_entree_suivi: entree, Date_sortie_suivi: sortie, Situation_sortie: sit,
        Sexe: choix(["F", "M"]), Date_naissance: entree - (pondere([14, 15, 16, 17, 18], [8, 22, 34, 26, 10]) * 365.25 + ent(0, 360)) * J,
        Classe_origine: classe, Type_etab_origine: classe <= 5 ? choix(["CLG", "CLG", "SEGPA"]) : classe <= 11 ? choix(["LP", "LP", "LPO", "CFA"]) : choix(["LGT", "LPO"]),
        Diplome: pondere(["aucun", "CFG", "DNB", "CAP"], [55, 10, 30, 5]), Profils: prof.length ? ["L", ...prof] : null };
      Jeunes.push(j);
      const dsp = etab ? pondere(["PREV_ENT", "GPDS", "INFO_SAS"], [55, 30, 15]) : pondere(["PAPS_TP", "PAFI_POLES", "PAFI_COORD", "REMOB", "MICRO", "FSE"], [30, 20, 15, 20, 8, 7]);
      if (!etab && rnd() < .25) Parcours.push({ id: Parcours.length + 1, Jeune: j.id, Dispositif: disp.CAND_PAPS, Etablissement: 0, Date_entree: entree, Date_sortie: entree, Motif_entree: ent(1, 5) });
      const pe = ouvre(entree + ent(0, 20) * J), exam = ["REMOB", "MICRO", "PAPS_TP"].includes(dsp) && rnd() < .4 ? choix(["CAP", "DNB", "Bac Pro"]) : null;
      Parcours.push({ id: Parcours.length + 1, Jeune: j.id, Dispositif: disp[dsp], Etablissement: etab || choix(etabs), Date_entree: pe,
        Date_sortie: sortie && sortie >= pe ? sortie : null, Motif_entree: etab ? choix([6, 7, 8]) : ent(1, 5), Modalites: choix(["entretiens individuels", "tutorat, stage", "remise à niveau", "ateliers collectifs"]),
        Examen_prepare: exam, Admis: exam && sortie ? choix(["O", "O", "N"]) : null, Devenir: sortie && sortie >= pe ? sit : null,
        Classe_reprise: sit && /statut scolaire/.test(sit) ? choix(["2NDPRO", "1CAP2", "2GT"]) : null });
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
  return { Academies, Departements, Bassins: [], Etablissements, Agents, Motifs, Types_activite, Parcours, Dispositifs, Motifs_entree, Classes_origine,
    Seuils: [{ Sans_premiere_action_j: 15, Sans_action_j: 30, Cumul_motifs: 3, Jeunes_sans_GPDS: 10, Part_attention: .2, Baisse_activite: -.2, Agent_sans_saisie_j: 15 }],
    Jeunes, Activites };
}
