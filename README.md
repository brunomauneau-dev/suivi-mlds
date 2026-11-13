# Suivi MLDS — widget Grist

Tableau de bord et outil de saisie des agents de la MLDS (région académique Nouvelle-Aquitaine),
branché sur le document Grist *Suivi MLDS Nouvelle-Aquitaine*.

Trois onglets :
- **Pilotage** : indicateurs de la région, puis par académie, département et établissement (on descend en cliquant),
  points d'attention, tendance mensuelle comparée à l'année précédente, nature des actions selon le référentiel CPIF (BO n° 29 du 21-7-2016) ;
- **Jeunes suivis** : jeunes regroupés par établissement, recherche, filtres, fiche avec l'historique des actions, clôture du suivi ;
- **Agenda** : semaine de l'agent, clic dans une journée pour saisir une action.

Boutons « + Action », « + Jeune » (écriture dans Grist) et « ⤓ Excel » (indicateurs de tous les territoires + liste des jeunes).

## Installation dans Grist

Ajouter → Ajouter une page → Widget personnalisé → URL personnalisée → coller l'adresse GitHub Pages du dépôt,
données : table *Activites*, accès : **accès complet au document**.

Le widget respecte les règles d'accès du document : un agent ne voit que ses jeunes et ses actions,
un pilote son territoire, le DRAIO toute la région.

Hors de Grist, la page s'affiche en mode démonstration (données fictives, `demo.js`).

## Fichiers

- `index.html` : page et styles ;
- `app.js` : lecture des tables, calcul des indicateurs, vues, saisie ;
- `demo.js` : jeu de données fictives du mode démonstration ;
- `lib/xlsx.full.min.js` : SheetJS (licence Apache 2.0) pour l'export Excel.
