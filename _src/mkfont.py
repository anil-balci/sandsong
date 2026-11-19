"""_src/mkfont.py: Jost (OFL) for the site: Latin subset, weight axis limited to 300-500, WOFF.
usage: python3 -P _src/mkfont.py <Jost[wght].ttf from github.com/google/fonts/ofl/jost> fonts/jost-latin-300-500.woff"""
import sys, io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
uni = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2039, 0x203A, 0x2192, 0x2190, 0x00B7, 0x2122, 0x20AC]
opts = subset.Options()
opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "tnum", "lnum", "case"]
opts.name_IDs = ["*"]; opts.name_legacy = True; opts.name_languages = ["*"]
opts.notdef_outline = True
opts.drop_tables += ["DSIG"]
s = subset.Subsetter(opts); s.populate(unicodes=uni); s.subset(f)
buf = io.BytesIO(); f.save(buf); buf.seek(0)
f = instancer.instantiateVariableFont(TTFont(buf), {"wght": (300, 500)})
f.flavor = "woff"
f.save(out)
