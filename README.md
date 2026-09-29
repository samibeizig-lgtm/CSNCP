# CSNCP — site officiel

Site web institutionnel de la **Chambre Syndicale Nationale des Cliniques Privées** (membre de l'UTICA), en arabe, français et anglais. Il applique la charte graphique de septembre 2026 (`assets/docs/CSNCP_Charte_graphique.pdf`) : bleu CSNCP `#035FCA`, six couleurs des pétales, Montserrat / Source Sans 3 / IBM Plex Sans Arabic.

## Rubriques

| Page | Fichier source |
|---|---|
| Accueil | `src/pages/index.html` |
| La Chambre (mission, bureau exécutif, statuts, historique) | `src/pages/la-chambre.html` |
| Annuaire des cliniques (recherche, filtres, carte) | `src/pages/annuaire.html` + `assets/js/annuaire.js` |
| Espace patient (droits, facture, CNAM et assurances, réclamation) | `src/pages/espace-patient.html` |
| Actualités et prises de position | `src/pages/actualites.html` |
| Espace presse (communiqués, chiffres clés, kit média, contact) | `src/pages/presse.html` |
| Médecine de voyage | `src/pages/medecine-de-voyage.html` |
| Contact | `src/pages/contact.html` |

## Modifier le contenu

- **Textes** : `src/i18n/fr.json`, `ar.json`, `en.json` (mêmes clés dans les trois langues).
- **Cliniques** : `src/data/cliniques.json` (nom, gouvernorat, coordonnées GPS, spécialités, contacts).
- **Actualités / communiqués** : `src/data/actualites.json` (`type` : `actualite`, `position` ou `communique`).
- **Chiffres clés** : `src/data/chiffres.json` · **Bureau exécutif** : `src/data/bureau.json`.

Puis régénérer le site (Python 3, aucune dépendance) :

```sh
python3 build.py
```

Les pages sont écrites dans `fr/`, `ar/`, `en/` ainsi que `sitemap.xml`. Ne pas modifier ces dossiers à la main.

Aperçu local : `python3 -m http.server` puis http://localhost:8000.

## Hébergement

Site 100 % statique : GitHub Pages (branche, dossier racine), Netlify ou tout serveur web. `index.html` à la racine redirige vers la langue du navigateur.

## À compléter avant mise en ligne

- Liste officielle des cliniques adhérentes (les données actuelles sont **fictives**).
- Composition du bureau exécutif, dates de l'historique, statuts et règlement intérieur (PDF dans `assets/docs/`).
- Chiffres clés (actuellement `XX`), adresse, téléphone et e-mails définitifs.
- URL des pages Facebook, Instagram et LinkedIn (`src/layout.html`).
- Nom de domaine (`SITE_URL` dans `build.py`, `robots.txt`).
- Formulaire de contact : actuellement en `mailto:` ; à brancher sur un service d'envoi (Formspree, Netlify Forms…) si besoin.
- Relecture juridique de l'Espace patient (CNAM, droits, recours).
