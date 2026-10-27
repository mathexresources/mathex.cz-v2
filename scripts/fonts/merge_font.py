"""Sloučí latin + latin-ext podmnožinu variabilního písma (fontsource) do jednoho souboru."""
import sys
from fontTools.ttLib import TTFont
from fontTools import subset

base_path, ext_path, out_path = sys.argv[1:4]
base, ext = TTFont(base_path), TTFont(ext_path)
# načíst tabulky dřív, než se změní pořadí glyfů
for f in (base, ext):
    for tag in ('glyf', 'gvar', 'hmtx', 'cmap', 'GSUB', 'GPOS', 'GDEF'):
        f[tag]
order = list(base.getGlyphOrder())
have = set(order)
ext_glyf, ext_gvar, ext_hmtx = ext['glyf'], ext['gvar'], ext['hmtx']

# glyfy včetně komponent, které v základu chybí
added = []
for name in ext.getGlyphOrder():
    if name in have:
        continue
    g = ext_glyf[name]
    base['glyf'][name] = g
    base['hmtx'][name] = ext_hmtx[name]
    base['gvar'].variations[name] = ext_gvar.variations.get(name, [])
    order.append(name)
    have.add(name)
    added.append(name)
base.setGlyphOrder(order)
base['glyf'].glyphOrder = order

for table in base['cmap'].tables:
    if table.isUnicode():
        for cp, name in ext.getBestCmap().items():
            table.cmap.setdefault(cp, name)

# HVAR by pro nové glyfy neměl záznamy – šířky se pak spočítají z gvar
if 'HVAR' in base:
    del base['HVAR']
base['maxp'].numGlyphs = len(order)

# podmnožina: latinka, čeština/slovenština a běžná typografie
text = ''.join(chr(c) for c in range(0x20, 0x7F)) + ''.join(chr(c) for c in range(0xA0, 0x180)) + '–—‘’‚“”„…•€™←→↑↓′″'
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(text=text)
sub.subset(base)
base.flavor = 'woff2'
base.save(out_path)
print(out_path, 'added', len(added), 'glyphs')
