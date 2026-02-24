"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from "firebase/firestore";
import {
  Calendar, Globe2, Users, ArrowRight, Sparkles,
  Heart, Music, Gift, Search, Filter, MapPin,
  TrendingUp, Book, ChevronRight, Star
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  ink:     "#1A110A",
  clay:    "#C4622D",
  gold:    "#E8A045",
  straw:   "#F5E6C8",
  cream:   "#FAF6EF",
  sand:    "#EDE0CC",
  forest:  "#2D5016",
  indigo:  "#1B2A4A",
  white:   "#FFFFFF",
  muted:   "#7A6855",
};

/* ─── Geometric SVG pattern (Ndebele-inspired) ──────────────────── */
function NdebeleStripe({ color = T.clay, opacity = 0.12 }) {
  return (
    <svg width="100%" height="8" style={{ display: "block" }}>
      <defs>
        <pattern id={`ndebele-${color.replace("#","")}`} x="0" y="0" width="40" height="8" patternUnits="userSpaceOnUse">
          <rect x="0"  y="0" width="8"  height="8" fill={color} opacity={opacity * 2} />
          <rect x="8"  y="0" width="8"  height="8" fill={color} opacity={opacity} />
          <rect x="16" y="0" width="8"  height="8" fill={color} opacity={opacity * 2} />
          <rect x="24" y="0" width="8"  height="8" fill={color} opacity={opacity} />
          <rect x="32" y="0" width="8"  height="8" fill={color} opacity={opacity * 2} />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill={`url(#ndebele-${color.replace("#","")})`} />
    </svg>
  );
}

/* ─── Geometric accent block ─────────────────────────────────────── */
function GeometricAccent({ style }) {
  return (
    <div style={{ position: "relative", width: 48, height: 48, ...style }}>
      <div style={{ position: "absolute", inset: 0, background: T.clay, transform: "rotate(45deg)", opacity: 0.15 }} />
      <div style={{ position: "absolute", inset: 8, background: T.gold, transform: "rotate(45deg)", opacity: 0.25 }} />
    </div>
  );
}

/* ─── Floating ink dot decoration ───────────────────────────────── */
function DotGrid({ rows = 4, cols = 6, color = T.clay, opacity = 0.1 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 10px)`, gap: 8 }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} style={{
          width: 3, height: 3, borderRadius: "50%",
          background: color, opacity: opacity + (i % 3) * 0.04
        }} />
      ))}
    </div>
  );
}

/* ─── Occasion category config ───────────────────────────────────── */
const CAT_CONFIG = {
  Ceremony:    { accent: "#C4622D", bg: "#FBF0E8", label: "CEREMONY",    icon: "◈" },
  Festival:    { accent: "#2D5016", bg: "#EAF0E4", label: "FESTIVAL",    icon: "◉" },
  Ritual:      { accent: "#1B2A4A", bg: "#E8ECF4", label: "RITUAL",      icon: "◎" },
  Celebration: { accent: "#8B4513", bg: "#F5EDE0", label: "CELEBRATION", icon: "◇" },
};

/* ─── Helper fns (unchanged logic) ──────────────────────────────── */
function getOccasionCategory(occasion) {
  const low = occasion.toLowerCase();
  if (["wedding","lobola","umembeso","initiation","umemulo"].some(w => low.includes(w))) return "Ceremony";
  if (["heritage","festival","carnival","celebration","diwali"].some(w => low.includes(w))) return "Festival";
  if (["imbeleko","ritual","ceremony","domba"].some(w => low.includes(w))) return "Ritual";
  return "Celebration";
}

function generateOccasionDescription(name, culture) {
  const map = {
    wedding:    `A ${culture} wedding ceremony celebrating the sacred union of two families.`,
    lobola:     "Traditional bride price negotiation — families meet to honour customs and forge lasting bonds.",
    heritage:   "A celebration of South African diversity and unity through living tradition.",
    kitchen:    "Women gather to shower the bride-to-be with gifts, wisdom, and blessings.",
    graduation: "Marking academic achievement and the dawn of new possibilities.",
    birthday:   "Honouring life and gathering family in the warmth of cultural tradition.",
  };
  const key = Object.keys(map).find(k => name.toLowerCase().includes(k));
  return map[key] || `A meaningful ${culture} occasion celebrating community and heritage.`;
}

function generateAttire(culture) {
  const specific = {
    Zulu:    ["Isidwaba (leather skirt)", "Beaded jewellery", "Traditional headdress", "Animal skins"],
    Xhosa:   ["White traditional wear", "Ochre body paint", "Beaded accessories", "Traditional blanket"],
    Ndebele: ["Beaded necklaces", "Beaded apron", "Brass rings", "Geometric patterns"],
  };
  return (specific[culture] || ["Traditional dress", "Beaded jewellery", "Cultural accessories", "Formal wear"])
    .map(name => ({ name }));
}

const TRENDING_STORIES = [
  { date: "Feb 2026", category: "Wedding Trends",
    title: "Modern Meets Traditional",
    excerpt: "How young South Africans are blending contemporary aesthetics with time-honoured ceremonies." },
  { date: "Feb 2026", category: "Fashion",
    title: "Heritage Fashion Renaissance",
    excerpt: "Traditional fabrics and beadwork taking centre stage in mainstream fashion worldwide." },
  { date: "Jan 2026", category: "Technology",
    title: "Culture Goes Digital",
    excerpt: "Communities using technology to preserve and share traditional knowledge across generations." },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function OccasionsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const heroRef = useRef(null);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "products"));
        const occasionsMap = new Map();
        const culturesSet = new Set();

        snap.forEach(doc => {
          const d = doc.data();
          if (d.culture) culturesSet.add(d.culture);
          if (Array.isArray(d.occasions)) {
            d.occasions.forEach(occ => {
              if (!occasionsMap.has(occ)) {
                occasionsMap.set(occ, {
                  name: occ, culture: d.culture || "Various",
                  region: d.region || "National", products: []
                });
              }
              occasionsMap.get(occ).products.push({ id: doc.id, ...d });
            });
          }
        });

        const arr = Array.from(occasionsMap.values()).map(o => ({
          id: o.name.toLowerCase().replace(/\s+/g, "-"),
          title: o.name,
          culture: o.culture,
          region: o.region,
          category: getOccasionCategory(o.name),
          productCount: o.products.length,
          description: generateOccasionDescription(o.name, o.culture),
          attire: generateAttire(o.culture),
          shopLink: `/shop?occasion=${encodeURIComponent(o.name)}`,
          trending: Math.random() > 0.65,
          imageId: o.name.toLowerCase().replace(/\s+/g, ""),
        }));

        setOccasions(arr);
        setCultures(Array.from(culturesSet));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* ── Filter ─────────────────────────────────────────────────────── */
  const filtered = occasions.filter(o => {
    const matchCat = selectedCategory === "all" || o.category === selectedCategory;
    const matchSearch = !searchQuery ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.culture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:    ${T.ink};
          --clay:   ${T.clay};
          --gold:   ${T.gold};
          --straw:  ${T.straw};
          --cream:  ${T.cream};
          --sand:   ${T.sand};
          --forest: ${T.forest};
          --muted:  ${T.muted};
        }

        .occ-page { background: var(--cream); font-family: 'DM Sans', sans-serif; }

        /* Loading */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 52px; height: 52px;
          border: 3px solid var(--sand);
          border-top-color: var(--clay);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        /* Staggered fade-in */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.22s; }
        .delay-3 { animation-delay: 0.34s; }
        .delay-4 { animation-delay: 0.46s; }
        .delay-5 { animation-delay: 0.58s; }

        /* Marquee */
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }

        /* Category pill */
        .cat-pill {
          padding: 10px 22px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          border: 1.5px solid transparent;
        }
        .cat-pill:hover { opacity: 0.85; }

        /* Occasion card */
        .occ-card {
          background: white;
          border: 1px solid var(--sand);
          transition: transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1),
                      box-shadow 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
          cursor: pointer;
          overflow: hidden;
        }
        .occ-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 24px 60px rgba(26,17,10,0.13);
        }

        /* Story card */
        .story-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .story-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(26,17,10,0.10);
        }

        /* Search input */
        .search-input:focus { outline: none; border-color: var(--clay) !important; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--cream); }
        ::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 3px; }

        /* Attire tag */
        .attire-tag {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 2px;
          letter-spacing: 0.3px;
        }

        /* CTA button */
        .cta-btn {
          width: 100%;
          border: none;
          padding: 16px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s;
          font-family: 'DM Sans', sans-serif;
          border-radius: 2px;
        }
        .cta-btn:hover { filter: brightness(1.08); transform: scale(1.01); }
      `}</style>

      <div className="occ-page">

        {/* ── Loading overlay ── */}
        {loading && (
          <div style={{
            position: "fixed", inset: 0,
            background: T.cream,
            zIndex: 9999,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 20
          }}>
            <div className="spinner" />
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15, color: T.muted, letterSpacing: 1 }}>
              Loading cultural occasions…
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section ref={heroRef} style={{
          background: T.ink,
          color: T.white,
          padding: "0 0 0",
          position: "relative",
          overflow: "hidden",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}>

          {/* Background texture pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: `repeating-linear-gradient(45deg, ${T.gold} 0, ${T.gold} 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px",
          }} />

          {/* Large geometric shapes */}
          <div style={{
            position: "absolute", right: -120, top: -120,
            width: 520, height: 520,
            background: `radial-gradient(circle, ${T.clay}22 0%, transparent 70%)`,
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", left: -60, bottom: -60,
            width: 340, height: 340,
            background: `radial-gradient(circle, ${T.gold}18 0%, transparent 70%)`,
            borderRadius: "50%",
          }} />

          {/* Vertical rule */}
          <div style={{
            position: "absolute", top: 0, left: "50%",
            width: 1, height: "100%",
            background: `linear-gradient(to bottom, transparent, ${T.clay}33, transparent)`,
          }} />

          {/* Main hero content */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            maxWidth: 1280, margin: "0 auto", width: "100%",
            padding: "80px 48px 60px",
            gap: 80,
            position: "relative", zIndex: 1,
          }}>
            {/* Left: Text */}
            <div style={{ flex: "0 0 55%" }}>
              <div className="fade-up" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                border: `1px solid ${T.clay}55`,
                padding: "8px 16px", borderRadius: 2,
                marginBottom: 32,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: T.gold, fontFamily: "'DM Sans', sans-serif" }}>
                  SOUTH AFRICAN CULTURAL TRADITIONS
                </span>
              </div>

              <h1 className="fade-up delay-1" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(42px, 5vw, 72px)",
                fontWeight: 900,
                lineHeight: 1.05,
                marginBottom: 28,
                letterSpacing: "-1px",
              }}>
                Every Occasion
                <br />
                <em style={{ color: T.gold, fontStyle: "italic", fontWeight: 700 }}>Tells a Story</em>
              </h1>

              <p className="fade-up delay-2" style={{
                fontSize: 17,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.72)",
                maxWidth: 480,
                marginBottom: 44,
                fontFamily: "'Libre Baskerville', serif",
              }}>
                Explore authentic ceremonies, festivals, and celebrations from across the Rainbow Nation — curated with reverence for each living tradition.
              </p>

              {/* Stats row */}
              <div className="fade-up delay-3" style={{
                display: "flex", gap: 40,
              }}>
                {[
                  { num: `${occasions.length || "–"}+`, label: "Occasions" },
                  { num: `${cultures.length || "–"}+`, label: "Cultures" },
                  { num: "100%", label: "Authentic" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 38, fontWeight: 900, color: T.gold, lineHeight: 1
                    }}>{s.num}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, fontWeight: 600, marginTop: 4 }}>
                      {s.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Decorative stacked cards preview */}
            <div className="fade-up delay-4" style={{ flex: 1, position: "relative", height: 420 }}>
              {/* Ghost cards */}
              {[
                { top: 60,  left: 40,  rot: "-6deg",  opacity: 0.25, bg: T.clay   },
                { top: 30,  left: 20,  rot: "3deg",   opacity: 0.4,  bg: T.indigo },
                { top: 0,   left: 0,   rot: "-1deg",  opacity: 1,    bg: T.white  },
              ].map((c, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: c.top, left: c.left,
                  width: "calc(100% - 40px)", height: 360,
                  background: c.bg,
                  opacity: c.opacity,
                  transform: `rotate(${c.rot})`,
                  borderRadius: 4,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }} />
              ))}
              {/* Top card content */}
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: "calc(100% - 40px)", height: 360,
                borderRadius: 4, overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              }}>
                <div style={{
                  height: "65%",
                  background: `url('https://picsum.photos/seed/lobola/600/400') center/cover`,
                }} />
                <div style={{ padding: "18px 20px", background: T.white }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 2,
                    color: T.clay, marginBottom: 6
                  }}>CEREMONY · ZULU</div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 20, fontWeight: 700, color: T.ink
                  }}>Lobola Negotiations</div>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginTop: 10
                  }}>
                    <span style={{ fontSize: 12, color: T.muted }}>KwaZulu-Natal</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      background: T.clay, color: T.white,
                      padding: "4px 10px", borderRadius: 2,
                    }}>View</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ndebele stripe at bottom */}
          <div style={{ opacity: 0.6 }}>
            <NdebeleStripe color={T.clay} opacity={0.6} />
            <NdebeleStripe color={T.gold} opacity={0.4} />
            <NdebeleStripe color={T.forest} opacity={0.5} />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            MARQUEE TICKER
        ══════════════════════════════════════════ */}
        <div style={{
          background: T.clay, color: T.white,
          overflow: "hidden", whiteSpace: "nowrap",
          padding: "14px 0",
        }}>
          <div className="marquee-track" style={{ display: "inline-flex", gap: 48 }}>
            {[...Array(2)].map((_, ri) => (
              ["Lobola", "Umembeso", "Heritage Day", "Umemulo", "Imbeleko", "Domba", "Kitchen Party", "Zulu Wedding", "Ndebele Ceremony", "Xhosa Ritual"].map(item => (
                <span key={`${ri}-${item}`} style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "2.5px",
                  display: "inline-flex", alignItems: "center", gap: 16,
                }}>
                  {item.toUpperCase()}
                  <span style={{ opacity: 0.4 }}>◆</span>
                </span>
              ))
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TRENDING STORIES (Editorial layout)
        ══════════════════════════════════════════ */}
        <section style={{ padding: "80px 48px", maxWidth: 1280, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: T.clay, marginBottom: 10 }}>
                CULTURAL PULSE
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 44, fontWeight: 900, color: T.ink, lineHeight: 1.1,
              }}>
                Trending Stories
              </h2>
            </div>
            <DotGrid rows={3} cols={5} color={T.clay} opacity={0.18} />
          </div>

          {/* Featured story (large) + two smaller */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24 }}>
            {/* Large featured */}
            <div className="story-card" style={{
              background: T.ink, color: T.white,
              borderRadius: 4, overflow: "hidden",
              gridRow: "1 / 3",
            }}>
              <div style={{
                height: 280,
                background: `url('https://picsum.photos/seed/heritage2026/800/500') center/cover`,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(to bottom, transparent 30%, ${T.ink} 100%)`,
                }} />
                <div style={{
                  position: "absolute", top: 20, left: 20,
                  background: T.clay, color: T.white,
                  fontSize: 10, fontWeight: 700, letterSpacing: 2,
                  padding: "6px 12px", borderRadius: 2,
                }}>
                  {TRENDING_STORIES[0].category.toUpperCase()}
                </div>
              </div>
              <div style={{ padding: "32px 36px 36px" }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28, fontWeight: 700, lineHeight: 1.3, marginBottom: 14,
                }}>
                  {TRENDING_STORIES[0].title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginBottom: 28 }}>
                  {TRENDING_STORIES[0].excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{TRENDING_STORIES[0].date}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.gold, fontSize: 13, fontWeight: 700 }}>
                    Read more <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Two smaller */}
            {TRENDING_STORIES.slice(1).map((story, i) => (
              <div key={i} className="story-card" style={{
                background: T.white, border: `1px solid ${T.sand}`,
                borderRadius: 4, overflow: "hidden",
              }}>
                <div style={{
                  height: 140,
                  background: `url('https://picsum.photos/seed/story${i + 2}/600/300') center/cover`,
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 14, left: 14,
                    background: T.ink, color: T.white,
                    fontSize: 9, fontWeight: 700, letterSpacing: 2,
                    padding: "4px 10px", borderRadius: 2,
                  }}>
                    {story.category.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: "22px 24px" }}>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 8, lineHeight: 1.3,
                  }}>
                    {story.title}
                  </h3>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 14 }}>
                    {story.excerpt}
                  </p>
                  <div style={{ fontSize: 11, color: T.clay, fontWeight: 700 }}>{story.date}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FILTER + SEARCH BAR
        ══════════════════════════════════════════ */}
        <div style={{ background: T.sand, padding: "0 0 1px" }}>
          <NdebeleStripe color={T.clay} opacity={0.3} />
        </div>

        <section style={{
          background: T.white,
          padding: "40px 48px",
          position: "sticky", top: 0, zIndex: 100,
          borderBottom: `1px solid ${T.sand}`,
          boxShadow: "0 4px 20px rgba(26,17,10,0.06)",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} color={T.muted} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="search-input"
                type="text"
                placeholder="Search occasions, cultures, regions…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 16px 13px 44px",
                  fontSize: 14,
                  border: `1.5px solid ${T.sand}`,
                  borderRadius: 2,
                  fontFamily: "'DM Sans', sans-serif",
                  background: T.cream,
                  color: T.ink,
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedCategory("all")}
                className="cat-pill"
                style={{
                  background: selectedCategory === "all" ? T.ink : "transparent",
                  color: selectedCategory === "all" ? T.white : T.ink,
                  borderColor: selectedCategory === "all" ? T.ink : T.sand,
                }}
              >
                ALL
              </button>
              {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="cat-pill"
                  style={{
                    background: selectedCategory === cat ? cfg.accent : "transparent",
                    color: selectedCategory === cat ? T.white : cfg.accent,
                    borderColor: selectedCategory === cat ? cfg.accent : cfg.accent + "66",
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* Count */}
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 500, marginLeft: "auto", whiteSpace: "nowrap" }}>
              {filtered.length} occasion{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            OCCASIONS GRID
        ══════════════════════════════════════════ */}
        <section style={{ padding: "64px 48px 100px", maxWidth: 1280, margin: "0 auto" }}>

          {filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 32,
            }}>
              {filtered.map((occ, idx) => {
                const cfg = CAT_CONFIG[occ.category] || CAT_CONFIG.Celebration;
                const isHovered = hoveredCard === occ.id;

                return (
                  <div
                    key={occ.id}
                    className={`occ-card fade-up delay-${Math.min(idx % 5 + 1, 5)}`}
                    onClick={() => router.push(occ.shopLink)}
                    onMouseEnter={() => setHoveredCard(occ.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ borderRadius: 4 }}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: `url('https://picsum.photos/seed/${occ.imageId}/700/500') center/cover`,
                        transform: isHovered ? "scale(1.06)" : "scale(1)",
                        transition: "transform 0.6s cubic-bezier(0.165,0.84,0.44,1)",
                      }} />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(to bottom, ${cfg.accent}22 0%, rgba(26,17,10,0.62) 100%)`,
                      }} />

                      {/* Category badge */}
                      <div style={{
                        position: "absolute", top: 18, left: 18,
                        background: cfg.accent,
                        color: T.white,
                        fontSize: 9, fontWeight: 800, letterSpacing: 2.5,
                        padding: "6px 12px", borderRadius: 2,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ fontSize: 12 }}>{cfg.icon}</span> {cfg.label}
                      </div>

                      {/* Trending badge */}
                      {occ.trending && (
                        <div style={{
                          position: "absolute", top: 18, right: 18,
                          background: T.gold,
                          color: T.ink,
                          fontSize: 9, fontWeight: 800, letterSpacing: 2,
                          padding: "6px 10px", borderRadius: 2,
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <TrendingUp size={10} /> TRENDING
                        </div>
                      )}

                      {/* Bottom info bar */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "16px 20px",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: 1, marginBottom: 4 }}>
                            {occ.culture.toUpperCase()} · {occ.region.toUpperCase()}
                          </div>
                          <h3 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 26, fontWeight: 700, color: T.white, lineHeight: 1.2,
                          }}>
                            {occ.title}
                          </h3>
                        </div>
                        <div style={{
                          background: "rgba(255,255,255,0.15)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          color: T.white,
                          fontSize: 11, fontWeight: 700,
                          padding: "8px 12px", borderRadius: 2,
                          display: "flex", alignItems: "center", gap: 6,
                          whiteSpace: "nowrap",
                        }}>
                          <Gift size={12} /> {occ.productCount}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "26px 28px 28px" }}>
                      <p style={{
                        fontSize: 14, lineHeight: 1.75, color: T.muted,
                        marginBottom: 22,
                        fontFamily: "'Libre Baskerville', serif",
                      }}>
                        {occ.description}
                      </p>

                      {/* Attire chips */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 2,
                          color: cfg.accent, marginBottom: 10,
                        }}>
                          TRADITIONAL ATTIRE
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {occ.attire.map((a, i) => (
                            <span key={i} className="attire-tag" style={{
                              background: cfg.bg,
                              color: cfg.accent,
                              border: `1px solid ${cfg.accent}33`,
                            }}>
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Divider with geometric mark */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                      }}>
                        <div style={{ flex: 1, height: 1, background: T.sand }} />
                        <div style={{ width: 6, height: 6, background: cfg.accent, transform: "rotate(45deg)", opacity: 0.5 }} />
                        <div style={{ flex: 1, height: 1, background: T.sand }} />
                      </div>

                      {/* CTA */}
                      <button
                        className="cta-btn"
                        style={{ background: cfg.accent, color: T.white }}
                        onClick={e => { e.stopPropagation(); router.push(occ.shopLink); }}
                      >
                        <Gift size={15} />
                        SHOP {occ.productCount} ITEMS
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div style={{
              textAlign: "center", padding: "100px 24px",
              background: T.white, borderRadius: 4,
              border: `2px dashed ${T.sand}`,
            }}>
              <div style={{
                width: 64, height: 64, margin: "0 auto 24px",
                background: T.straw, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Search size={28} color={T.clay} />
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26, fontWeight: 700, color: T.ink, marginBottom: 10,
              }}>
                No occasions found
              </h3>
              <p style={{ fontSize: 15, color: T.muted, marginBottom: 28 }}>
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                style={{
                  background: T.clay, color: T.white,
                  border: "none", padding: "14px 32px", borderRadius: 2,
                  fontSize: 12, fontWeight: 700, letterSpacing: 2,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                RESET FILTERS
              </button>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════
            UBUNTU CLOSING QUOTE
        ══════════════════════════════════════════ */}
        <div>
          <NdebeleStripe color={T.forest} opacity={0.5} />
          <NdebeleStripe color={T.gold}   opacity={0.4} />
          <NdebeleStripe color={T.clay}   opacity={0.6} />
        </div>

        <section style={{
          background: T.ink,
          color: T.white,
          padding: "100px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background geo pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: `repeating-linear-gradient(45deg, ${T.gold} 0, ${T.gold} 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px",
          }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", opacity: 0.1 }}>
            <DotGrid rows={2} cols={16} color={T.gold} opacity={0.4} />
          </div>

          <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 100, lineHeight: 0.6,
              color: T.clay, opacity: 0.4, marginBottom: 12,
            }}>
              "
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 700, marginBottom: 20, lineHeight: 1.3,
              fontStyle: "italic",
            }}>
              Ubuntu: I am because we are
            </h2>
            <div style={{ width: 48, height: 2, background: T.gold, margin: "0 auto 24px" }} />
            <p style={{
              fontSize: 16, lineHeight: 1.9,
              color: "rgba(255,255,255,0.65)",
              fontFamily: "'Libre Baskerville', serif",
            }}>
              Celebrating the spirit of togetherness through vibrant traditions. Each occasion connects us to our ancestors, our community, and the rich tapestry of South African culture.
            </p>
          </div>
        </section>

      </div>
    </>
  );
}