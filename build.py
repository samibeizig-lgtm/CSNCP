#!/usr/bin/env python3
"""Générateur du site CSNCP (stdlib uniquement).

Sources :
  src/layout.html        gabarit commun (en-tête, pied de page)
  src/pages/<slug>.html  contenu de chaque page
  src/i18n/<lang>.json   textes traduits (fr, ar, en)
  src/data/*.json        annuaire, actualités, chiffres clés

Sortie : /<lang>/<slug>.html et /<lang>/actualites/<id>.html à la racine du dépôt.

Syntaxe des gabarits :
  {{ cle.sous_cle }}   texte traduit (HTML autorisé)
  {{ @variable }}      variable calculée (lang, dir, root, ...)
"""
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
LANGS = ["fr", "ar", "en"]
PAGES = [
    "index",
    "la-chambre",
    "annuaire",
    "espace-patient",
    "actualites",
    "presse",
    "medecine-de-voyage",
    "contact",
]
NAV = ["la-chambre", "annuaire", "espace-patient", "actualites", "presse", "medecine-de-voyage"]
SITE_URL = "https://www.csncp.tn"

TOKEN = re.compile(r"\{\{\s*(@?[\w.\-]+)\s*\}\}")


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def lookup(tr, key):
    node = tr
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            raise KeyError(key)
        node = node[part]
    return node


def render(tpl, tr, variables, where):
    def sub(m):
        key = m.group(1)
        if key.startswith("@"):
            if key[1:] not in variables:
                raise KeyError(f"{where}: variable inconnue {key}")
            return str(variables[key[1:]])
        try:
            return str(lookup(tr, key))
        except KeyError:
            raise KeyError(f"{where}: traduction manquante '{key}' ({variables['lang']})")

    # Deux passes : une traduction peut contenir {{ @root }}.
    return TOKEN.sub(sub, TOKEN.sub(sub, tpl))


def fmt_date(iso, lang, tr):
    y, m, d = iso.split("-")
    month = tr["months"][int(m) - 1]
    return f"{int(d)} {month} {y}"


def news_cards(items, lang, tr, prefix, limit=None):
    out = []
    for it in items[:limit] if limit else items:
        loc = it[lang]
        out.append(
            f'<article class="card news-card" data-type="{it["type"]}">'
            f'<p class="eyebrow"><span class="tag tag-{it["type"]}">{tr["news"]["types"][it["type"]]}</span>'
            f'<time datetime="{it["date"]}">{fmt_date(it["date"], lang, tr)}</time></p>'
            f'<h3><a href="{prefix}actualites/{it["id"]}.html">{html.escape(loc["title"])}</a></h3>'
            f"<p>{html.escape(loc['summary'])}</p>"
            f"</article>"
        )
    return "\n".join(out)


def figures_html(figures, lang):
    return "\n".join(
        f'<div class="figure"><strong>{html.escape(f["value"])}</strong><span>{html.escape(f[lang])}</span></div>'
        for f in figures
    )


def board_html(board, lang):
    return "\n".join(
        f'<li class="member"><span class="avatar" aria-hidden="true">{html.escape(b["initials"])}</span>'
        f'<span><strong>{html.escape(b["name"][lang])}</strong><em>{html.escape(b["role"][lang])}</em></span></li>'
        for b in board
    )


def nav_html(lang, tr, current, root):
    items = []
    for slug in NAV:
        cur = ' aria-current="page"' if slug == current else ""
        items.append(f'<li><a href="{root}{lang}/{slug}.html"{cur}>{tr["nav"][slug]}</a></li>')
    return "\n".join(items)


def lang_switch(lang, slug_path, root):
    labels = {"fr": ("FR", "Français"), "ar": ("ع", "العربية"), "en": ("EN", "English")}
    out = []
    for l in LANGS:
        short, full = labels[l]
        cur = ' aria-current="true"' if l == lang else ""
        out.append(
            f'<a href="{root}{l}/{slug_path}" hreflang="{l}" lang="{l}" title="{full}"{cur}>{short}</a>'
        )
    return "\n".join(out)


def hreflang(slug_path):
    links = [f'<link rel="alternate" hreflang="{l}" href="{SITE_URL}/{l}/{slug_path}">' for l in LANGS]
    links.append(f'<link rel="alternate" hreflang="x-default" href="{SITE_URL}/fr/{slug_path}">')
    return "\n".join(links)


def build():
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    clinics = load_json(SRC / "data" / "cliniques.json")
    news = sorted(load_json(SRC / "data" / "actualites.json"), key=lambda n: n["date"], reverse=True)
    figures = load_json(SRC / "data" / "chiffres.json")
    board = load_json(SRC / "data" / "bureau.json")
    article_tpl = (SRC / "article.html").read_text(encoding="utf-8")

    count = 0
    for lang in LANGS:
        tr = load_json(SRC / "i18n" / f"{lang}.json")
        out_dir = ROOT / lang
        if out_dir.exists():
            shutil.rmtree(out_dir)
        (out_dir / "actualites").mkdir(parents=True)

        def page(slug, body_tpl, depth, title, description, slug_path, extra=None):
            root = "../" * depth
            prefix = root + lang + "/"
            v = {
                "lang": lang,
                "dir": "rtl" if lang == "ar" else "ltr",
                "root": root,
                "prefix": prefix,
                "slug": slug,
                "nav": nav_html(lang, tr, slug, root),
                "lang_switch": lang_switch(lang, slug_path, root),
                "hreflang": hreflang(slug_path),
                "canonical": f"{SITE_URL}/{lang}/{slug_path}",
                "year": "2026",
                "news_latest": news_cards(news, lang, tr, prefix, 3),
                "news_all": news_cards(news, lang, tr, prefix),
                "news_press": news_cards([n for n in news if n["type"] == "communique"], lang, tr, prefix),
                "figures": figures_html(figures, lang),
                "board": board_html(board, lang),
                "clinics_json": json.dumps(clinics, ensure_ascii=False).replace("</", "<\\/"),
                "i18n_json": json.dumps(tr["directory"], ensure_ascii=False).replace("</", "<\\/"),
            }
            v.update(extra or {})
            body = render(body_tpl, tr, v, slug)
            v["content"] = body
            v["title"] = title
            v["description"] = description
            return render(layout, tr, v, slug)

        for slug in PAGES:
            tpl = (SRC / "pages" / f"{slug}.html").read_text(encoding="utf-8")
            meta = tr["meta"][slug]
            title = meta["title"] if slug == "index" else f'{meta["title"]} · {tr["site"]["short"]}'
            html_out = page(slug, tpl, 1, title, meta["description"], f"{slug}.html")
            (out_dir / f"{slug}.html").write_text(html_out, encoding="utf-8")
            count += 1

        for it in news:
            loc = it[lang]
            paragraphs = "\n".join(f"<p>{html.escape(p)}</p>" for p in loc["body"])
            extra = {
                "a_title": html.escape(loc["title"]),
                "a_type": tr["news"]["types"][it["type"]],
                "a_type_key": it["type"],
                "a_date": fmt_date(it["date"], lang, tr),
                "a_iso": it["date"],
                "a_body": paragraphs,
            }
            html_out = page(
                "actualites",
                article_tpl,
                2,
                f'{loc["title"]} · {tr["site"]["short"]}',
                loc["summary"],
                f'actualites/{it["id"]}.html',
                extra,
            )
            (out_dir / "actualites" / f'{it["id"]}.html').write_text(html_out, encoding="utf-8")
            count += 1

    # Plan du site
    urls = [f"{SITE_URL}/{l}/{s}.html" for l in LANGS for s in PAGES]
    urls += [f"{SITE_URL}/{l}/actualites/{n['id']}.html" for l in LANGS for n in news]
    sitemap = "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{sitemap}\n</urlset>\n",
        encoding="utf-8",
    )
    print(f"{count} pages générées ({', '.join(LANGS)}).")


if __name__ == "__main__":
    build()
