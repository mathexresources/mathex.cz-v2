Písma podmnožená na latinku a češtinu, self-hostovaná přes `next/font/local` s preloadem.

- `archivo-expanded.woff2` – Archivo (Omnibus-Type), řez s šířkou 125 % (expanded), tloušťka 600–800. Jen nadpisy.
- `atkinson-hyperlegible-next.woff2` – Atkinson Hyperlegible Next (Braille Institute), proměnná tloušťka 200–800. Text a ovládání.

Obě písma jsou pod licencí SIL Open Font License 1.1.

Jak vznikly: soubory latin + latin-ext z balíčků `@fontsource-variable/*` sloučí
`scripts/fonts/merge_font.py`; Archivo se pak zúží na šířku 125 % přes
`fontTools.varLib.instancer` (`{'wdth': 125, 'wght': (600, 800)}`).
