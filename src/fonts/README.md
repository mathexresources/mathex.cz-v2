Písmo Archivo (Omnibus-Type, SIL Open Font License 1.1), podmnožené na latinku a češtinu,
self-hostované přes `next/font/local` s preloadem.

- `archivo-expanded.woff2` – šířka 125 %, tloušťka 700–900. Velké nadpisy.
- `archivo-text.woff2` – šířka 100 %, tloušťka 400–700. Text a ovládání.

Jak vznikly: soubory latin + latin-ext z balíčku `@fontsource-variable/archivo` sloučí
`scripts/fonts/merge_font.py` a z výsledku se přes `fontTools.varLib.instancer`
vyříznou dvě instance (`{'wdth': 125, 'wght': (700, 900)}` a `{'wdth': 100, 'wght': (400, 700)}`).
