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

Le site est généré dans `dist/` (non versionné) : pages `fr/`, `ar/`, `en/`, `assets/`, `sitemap.xml` et les fichiers de `src/static/` (`index.html` qui redirige vers la langue du navigateur, `404.html`, `_headers`, `robots.txt`).

Aperçu local : `python3 build.py && cd dist && python3 -m http.server` puis http://localhost:8000.

## Mise en ligne sur Cloudflare Pages

### Option 1 — connexion au dépôt GitHub (recommandée)

Chaque `git push` redéploie automatiquement le site.

1. Cloudflare → **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**.
2. Choisir le dépôt `CSNCP` et la branche de production (`main`).
3. Paramètres de build :
   - Framework preset : **None**
   - Build command : `python3 build.py`
   - Build output directory : `dist`
4. **Save and Deploy**. Le site est disponible sur `csncp.pages.dev`.
5. Onglet **Custom domains** → ajouter `csncp.tn` et `www.csncp.tn`.

Les autres branches obtiennent une URL de prévisualisation (`<branche>.csncp.pages.dev`).

### Option 2 — déploiement manuel en ligne de commande

```sh
python3 build.py
npx wrangler login
npx wrangler pages deploy dist --project-name csncp
```

`wrangler.toml` indique déjà le dossier de sortie (`dist`).

### Fichiers Cloudflare

- `src/static/_headers` : en-têtes de sécurité et durée de cache des images, CSS et JS.
- `src/static/404.html` : page d'erreur trilingue.

## À compléter avant mise en ligne

- Liste officielle des cliniques adhérentes (les données actuelles sont **fictives**).
- Composition du bureau exécutif, dates de l'historique, statuts et règlement intérieur (PDF dans `assets/docs/`).
- Chiffres clés (actuellement `XX`), adresse, téléphone et e-mails définitifs.
- URL des pages Facebook, Instagram et LinkedIn (`src/layout.html`).
- Nom de domaine (`SITE_URL` dans `build.py`, `src/static/robots.txt`, `src/static/index.html`).
- Formulaire de contact : actuellement en `mailto:` ; à brancher sur un service d'envoi (Formspree, Netlify Forms…) si besoin.
- Relecture juridique de l'Espace patient (CNAM, droits, recours).
