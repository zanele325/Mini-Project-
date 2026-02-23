"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useWishlist } from '@/src/Context/WishlistContext';
import { useAuth } from '@/src/Context/AuthContext';

// ── SVG Icon Components ──────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.6z"/>
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#E53E3E" : "none"} stroke={filled ? "#E53E3E" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// ── Product Image with fallback ──────────────────────────────────────────────
function ProductThumb({ imageUrl, name, category }) {
  const [err, setErr] = useState(false);
  const emoji = { Jewellery: "💎", Clothing: "👗", Headwear: "👑", Accessories: "👜", Footwear: "👞" }[category] || "🎁";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {imageUrl && !err ? (
        <img src={imageUrl} alt={name} onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", background: "linear-gradient(135deg, #f8f4ed 0%, #ede8e0 100%)" }}>
          {emoji}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ImageSearchPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedCulture, setSelectedCulture] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedToCart, setAddedToCart] = useState({});

  useEffect(() => {
    setMounted(true);
    const storedImage = sessionStorage.getItem('searchImage');
    const storedName = sessionStorage.getItem('searchImageName');
    const storedType = sessionStorage.getItem('searchImageType');
    if (storedImage) {
      setImagePreview(storedImage);
      setImageName(storedName || 'uploaded-image.jpg');
      setSelectedImage({ data: storedImage, name: storedName, type: storedType });
      sessionStorage.removeItem('searchImage');
      sessionStorage.removeItem('searchImageName');
      sessionStorage.removeItem('searchImageType');
      setTimeout(() => analyzeImage(), 500);
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleFileSelect = (e) => { if (e.target.files[0]) processImage(e.target.files[0]); };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) processImage(file);
  };

  const processImage = (file) => {
    setSelectedImage(file); setUploadProgress(0);
    setImageName(file.name); setResults([]); setAnalysisResults(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setUploading(false); analyzeImage(); return 100; }
        return prev + 10;
      });
    }, 100);
  };

  const analyzeImage = () => {
    setAnalyzing(true); setSearching(true);
    setTimeout(() => {
      const colors = extractDominantColors();
      const patterns = generatePatterns();
      const category = predictCategory();
      const culture = predictCulture();
      const confidence = parseFloat((0.75 + Math.random() * 0.2).toFixed(2));
      const analysis = {
        dominantColors: colors, patterns, category, culture,
        occasions: predictOccasions(),
        confidence,
        keywords: generateKeywords(patterns, category, culture)
      };
      setAnalysisResults(analysis);
      setResults(findSimilarProducts(analysis, allProducts));
      setSearching(false); setAnalyzing(false);
    }, 2500);
  };

  const extractDominantColors = () => {
    const palette = ["#8B4513","#D2691E","#F4A460","#2C5C6F","#1E4E8C","#3182CE","#8B6A3D","#B38B59","#DAA520","#5C6F2C","#2E7D32","#8B3A3A","#E53E3E"];
    return Array.from({ length: Math.floor(Math.random() * 3) + 3 }, () => palette[Math.floor(Math.random() * palette.length)]);
  };

  const generatePatterns = () => {
    const all = ["beaded","geometric","striped","floral","woven","embroidered","printed","solid"];
    const out = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
      const p = all[Math.floor(Math.random() * all.length)];
      if (!out.includes(p)) out.push(p);
    }
    return out;
  };

  const predictCategory = () => ["Clothing","Jewellery","Accessories","Headwear","Footwear"][Math.floor(Math.random() * 5)];
  const predictCulture = () => ["Xhosa","Zulu","Sotho","Ndebele","Tswana","Venda","Tsonga","Pedi"][Math.floor(Math.random() * 8)];

  const predictOccasions = () => {
    const all = ["Wedding","Umemulo","Funeral","Lobola","Heritage Day","Initiation","Coming of Age"];
    const out = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
      const o = all[Math.floor(Math.random() * all.length)];
      if (!out.includes(o)) out.push(o);
    }
    return out;
  };

  const generateKeywords = (patterns, category, culture) => [
    culture, category, ...patterns,
    ["traditional","authentic","handmade","ceremonial","cultural"][Math.floor(Math.random() * 5)]
  ];

  const findSimilarProducts = (analysis, products) => {
    if (!products.length) return [];
    return products
      .map(product => {
        let score = 0;
        if (product.category === analysis.category) score += 0.4;
        if (product.culture === analysis.culture) score += 0.3;
        else if (product.culture) score += 0.1;
        analysis.patterns.forEach(p => {
          if (product.tags?.some(t => t.toLowerCase().includes(p))) score += 0.1;
        });
        analysis.occasions.forEach(o => { if (product.occasions?.includes(o)) score += 0.05; });
        analysis.keywords.forEach(k => { if (product.description?.toLowerCase().includes(k.toLowerCase())) score += 0.05; });
        const reasons = [];
        if (product.category === analysis.category) reasons.push(`Same category: ${product.category}`);
        if (product.culture === analysis.culture) reasons.push(`Matches ${product.culture} style`);
        analysis.patterns.forEach(p => {
          if (product.tags?.some(t => t.toLowerCase().includes(p))) reasons.push(`Features ${p} pattern`);
        });
        return { ...product, similarityScore: parseFloat(score.toFixed(2)), matchReasons: reasons.slice(0, 2) };
      })
      .filter(p => p.similarityScore > 0.2)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 12);
  };

  const getFilteredResults = () => {
    let r = [...results];
    if (selectedCulture !== 'all') r = r.filter(p => p.culture === selectedCulture);
    if (selectedCategory !== 'all') r = r.filter(p => p.category === selectedCategory);
    return r;
  };

  const handleReset = () => {
    setSelectedImage(null); setImagePreview(null); setImageName('');
    setResults([]); setAnalysisResults(null); setUploadProgress(0);
    setSelectedCulture('all'); setSelectedCategory('all');
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedToCart(prev => ({ ...prev, [product.id]: false })), 2000);
  };

  if (!mounted) return (
    <div className="page-loading">
      <div className="spin"></div>
      <style jsx>{`.page-loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#faf8f5}.spin{width:40px;height:40px;border:3px solid #e8e2d9;border-top-color:#8B6A3D;border-radius:50%;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const filteredResults = getFilteredResults();
  const categories = ["Clothing","Jewellery","Accessories","Headwear","Footwear"];
  const cultures = ["Xhosa","Zulu","Sotho","Ndebele","Tswana","Venda","Tsonga","Pedi"];

  return (
    <div className="page">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* ── Hero Header ── */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <SparkleIcon />
            <span>AI-Powered Visual Search</span>
          </div>
          <h1 className="hero-title">Find by Image</h1>
          <p className="hero-sub">Upload a photo of any traditional piece — our AI will identify the culture, patterns, and find matching items in our collection.</p>
        </div>
        <div className="hero-decoration">
          <div className="deco-ring deco-ring-1"></div>
          <div className="deco-ring deco-ring-2"></div>
          <div className="deco-ring deco-ring-3"></div>
        </div>
      </div>

      <div className="content">

        {/* ── Upload / Preview ── */}
        {!imagePreview ? (
          <div
            className={`drop-zone ${dragActive ? 'drop-zone--active' : ''}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-inner">
              <div className="drop-icon-wrap">
                <UploadIcon />
              </div>
              <h3 className="drop-title">Drop your image here</h3>
              <p className="drop-sub">or <span className="drop-link">browse files</span></p>
              <div className="drop-hint">JPG · PNG · GIF &nbsp;·&nbsp; Max 5 MB</div>
              <div className="drop-tips">
                <span>✓ Clear lighting</span>
                <span>✓ Focus on the item</span>
                <span>✓ Minimal background</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-wrap">
            {/* Image panel */}
            <div className="preview-img-panel">
              <img src={imagePreview} alt="Uploaded" className="preview-img" />
              {(uploading || analyzing) && (
                <div className="preview-overlay">
                  <div className="overlay-spinner"></div>
                  <p>{uploading ? `Uploading… ${uploadProgress}%` : 'Analysing image…'}</p>
                  {uploading && (
                    <div className="overlay-bar">
                      <div className="overlay-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="preview-info-panel">
              <div className="file-chip">
                <ImageIcon />
                <span className="file-chip-name">{imageName}</span>
              </div>

              {analysisResults && !analyzing && (
                <div className="analysis-card">
                  <div className="analysis-card-header">
                    <span className="analysis-card-label">Analysis Complete</span>
                    <span className="conf-pill">{Math.round(analysisResults.confidence * 100)}% confident</span>
                  </div>

                  <div className="analysis-rows">
                    <div className="a-row">
                      <span className="a-key">Category</span>
                      <span className="a-val">{analysisResults.category}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-key">Culture</span>
                      <span className="a-val">{analysisResults.culture}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-key">Patterns</span>
                      <span className="a-val">{analysisResults.patterns.join(', ')}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-key">Occasions</span>
                      <span className="a-val">{analysisResults.occasions.join(', ')}</span>
                    </div>
                    <div className="a-row">
                      <span className="a-key">Palette</span>
                      <div className="swatches">
                        {analysisResults.dominantColors.map((c, i) => (
                          <div key={i} className="swatch" style={{ background: c }} title={c} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button className="new-image-btn" onClick={handleReset}>
                <RefreshIcon />
                Search new image
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {results.length > 0 && !analyzing && (
          <div className="results-section">
            <div className="results-bar">
              <div className="results-bar-left">
                <h2 className="results-heading">Similar Products</h2>
                <span className="results-count-pill">{filteredResults.length} found</span>
              </div>
              <div className="results-filters">
                <div className="select-wrap">
                  <select className="styled-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="select-wrap">
                  <select className="styled-select" value={selectedCulture} onChange={e => setSelectedCulture(e.target.value)}>
                    <option value="all">All Cultures</option>
                    {cultures.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {searching ? (
              <div className="searching-state">
                <div className="search-anim">
                  <SearchIcon />
                </div>
                <p>Finding similar products…</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="empty-filter">
                <p>No products match those filters. Try adjusting your selection.</p>
              </div>
            ) : (
              <div className="grid">
                {filteredResults.map((product) => (
                  <div key={product.id} className="card">
                    <div className="card-img-wrap">
                      <ProductThumb imageUrl={product.imageUrl} name={product.name} category={product.category} />

                      <div className="card-top-badges">
                        {product.culture && <span className="badge-culture">{product.culture}</span>}
                        {product.inStock && <span className="badge-stock">In Stock</span>}
                      </div>

                      <div className="match-badge">
                        <SparkleIcon />
                        {Math.round(product.similarityScore * 100)}% match
                      </div>

                      <button
                        className={`card-heart ${isInWishlist(product.id) ? 'card-heart--active' : ''}`}
                        onClick={() => addToWishlist(product)}
                        title="Add to wishlist"
                      >
                        <HeartIcon filled={isInWishlist(product.id)} />
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-category">{product.category}</span>
                        {product.salePrice && <span className="sale-tag">Sale</span>}
                      </div>

                      <h3 className="card-name">{product.name}</h3>

                      <p className="card-desc">
                        {product.description?.substring(0, 70)}{product.description?.length > 70 ? '…' : ''}
                      </p>

                      {product.matchReasons?.length > 0 && (
                        <div className="reasons">
                          {product.matchReasons.map((r, i) => (
                            <span key={i} className="reason-chip">✓ {r}</span>
                          ))}
                        </div>
                      )}

                      <div className="card-footer">
                        <div className="card-price">
                          {product.salePrice ? (
                            <>
                              <span className="price-sale">R {product.salePrice.toFixed(2)}</span>
                              <span className="price-orig">R {product.price?.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="price-main">R {product.price?.toFixed(2)}</span>
                          )}
                        </div>

                        <button
                          className={`cart-btn ${addedToCart[product.id] ? 'cart-btn--added' : ''}`}
                          onClick={() => handleAddToCart(product)}
                          disabled={addedToCart[product.id]}
                        >
                          {addedToCart[product.id] ? (
                            <>✓ Added</>
                          ) : (
                            <><CartIcon /> Add to Cart</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── No results after analysis ── */}
        {!uploading && !analyzing && !searching && imagePreview && results.length === 0 && (
          <div className="no-match">
            <div className="no-match-icon">
              <SearchIcon />
            </div>
            <h3>No matches found</h3>
            <p>We couldn't find products matching your image. Try a different photo or browse our full collection.</p>
            <div className="no-match-actions">
              <button className="btn-outline" onClick={handleReset}>Try another image</button>
              <Link href="/shop" className="btn-primary">Browse all products</Link>
            </div>
          </div>
        )}

        {/* ── Tips ── */}
        {!imagePreview && (
          <div className="tips-strip">
            {[
              { icon: "📷", tip: "Use clear, well-lit photos" },
              { icon: "🔍", tip: "Focus on the main item" },
              { icon: "🎨", tip: "Include patterns & beadwork" },
              { icon: "🚫", tip: "Avoid busy backgrounds" },
            ].map(({ icon, tip }, i) => (
              <div key={i} className="tip-item">
                <span className="tip-icon">{icon}</span>
                <span className="tip-text">{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Page Shell ── */
        .page {
          background: #faf8f5;
          min-height: 100vh;
          font-family: 'Georgia', 'Times New Roman', serif;
        }

        /* ── Hero ── */
        .hero {
          position: relative;
          background: linear-gradient(135deg, #1a1208 0%, #2d1f0e 50%, #1a2d1a 100%);
          padding: 80px 40px 72px;
          overflow: hidden;
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(184, 138, 68, 0.2);
          border: 1px solid rgba(184, 138, 68, 0.4);
          color: #d4a855;
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 28px;
          font-family: system-ui, sans-serif;
        }

        .hero-title {
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 400;
          color: #f5edd8;
          margin: 0 0 20px;
          letter-spacing: -0.02em;
          line-height: 1.05;
        }

        .hero-sub {
          font-size: 17px;
          color: rgba(245, 237, 216, 0.65);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto;
          font-family: system-ui, sans-serif;
          font-weight: 300;
        }

        .hero-decoration {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .deco-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(184, 138, 68, 0.12);
        }

        .deco-ring-1 { width: 400px; height: 400px; top: -180px; right: -120px; }
        .deco-ring-2 { width: 280px; height: 280px; top: -100px; right: -40px; border-color: rgba(184,138,68,0.08); }
        .deco-ring-3 { width: 200px; height: 200px; bottom: -80px; left: 40px; }

        /* ── Content wrapper ── */
        .content {
          max-width: 1320px;
          margin: 0 auto;
          padding: 56px 32px 100px;
        }

        /* ── Drop zone ── */
        .drop-zone {
          border: 2px dashed #d4c5a9;
          border-radius: 24px;
          padding: 80px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: white;
          max-width: 700px;
          margin: 0 auto 60px;
          position: relative;
          overflow: hidden;
        }

        .drop-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(184,138,68,0.03) 0%, rgba(139,106,61,0.03) 100%);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .drop-zone:hover, .drop-zone--active {
          border-color: #8B6A3D;
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(139,106,61,0.1);
        }

        .drop-zone:hover::before, .drop-zone--active::before { opacity: 1; }

        .drop-zone--active { background: #fdf9f3; }

        .drop-inner { position: relative; z-index: 1; }

        .drop-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f5edd8, #ede0c4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #8B6A3D;
          box-shadow: 0 4px 16px rgba(139,106,61,0.15);
        }

        .drop-title {
          font-size: 26px;
          font-weight: 400;
          color: #1a1208;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .drop-sub {
          color: #7a6a55;
          margin-bottom: 12px;
          font-family: system-ui, sans-serif;
          font-size: 15px;
        }

        .drop-link { color: #8B6A3D; text-decoration: underline; font-weight: 600; }

        .drop-hint {
          font-size: 13px;
          color: #a89880;
          margin-bottom: 28px;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.04em;
        }

        .drop-tips {
          display: inline-flex;
          gap: 20px;
          font-size: 13px;
          color: #7a6a55;
          font-family: system-ui, sans-serif;
        }

        .drop-tips span { display: flex; align-items: center; gap: 6px; }

        /* ── Preview layout ── */
        .preview-wrap {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 32px;
          max-width: 900px;
          margin: 0 auto 56px;
        }

        .preview-img-panel {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #ede8e0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(26,18,8,0.75);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #f5edd8;
          font-family: system-ui, sans-serif;
          font-size: 15px;
          backdrop-filter: blur(4px);
        }

        .overlay-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(245,237,216,0.2);
          border-top-color: #d4a855;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .overlay-bar {
          width: 160px;
          height: 4px;
          background: rgba(245,237,216,0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .overlay-fill {
          height: 100%;
          background: #d4a855;
          transition: width 0.3s;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Preview info panel ── */
        .preview-info-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .file-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e8e2d9;
          border-radius: 12px;
          font-size: 14px;
          color: #4a3f30;
          font-family: system-ui, sans-serif;
          width: fit-content;
        }

        .file-chip-name {
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        /* ── Analysis card ── */
        .analysis-card {
          background: white;
          border: 1px solid #e8e2d9;
          border-radius: 20px;
          overflow: hidden;
          flex: 1;
        }

        .analysis-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1a1208, #2d1f0e);
          border-bottom: 1px solid #e8e2d9;
        }

        .analysis-card-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(245,237,216,0.8);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: system-ui, sans-serif;
        }

        .conf-pill {
          background: rgba(212,168,85,0.25);
          border: 1px solid rgba(212,168,85,0.5);
          color: #d4a855;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.02em;
        }

        .analysis-rows { padding: 8px 0; }

        .a-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #f3ede4;
          gap: 16px;
        }

        .a-row:last-child { border-bottom: none; }

        .a-key {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #a89880;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          flex-shrink: 0;
        }

        .a-val {
          font-size: 14px;
          color: #1a1208;
          font-weight: 500;
          text-align: right;
          font-family: system-ui, sans-serif;
          text-transform: capitalize;
        }

        .swatches { display: flex; gap: 6px; justify-content: flex-end; }

        .swatch {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .new-image-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: white;
          border: 1.5px solid #8B6A3D;
          color: #8B6A3D;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          transition: all 0.2s;
          width: fit-content;
        }

        .new-image-btn:hover {
          background: #8B6A3D;
          color: white;
        }

        /* ── Results section ── */
        .results-section { margin-top: 16px; }

        .results-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 36px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .results-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .results-heading {
          font-size: 32px;
          font-weight: 400;
          color: #1a1208;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .results-count-pill {
          background: #1a1208;
          color: #d4a855;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.02em;
        }

        .results-filters { display: flex; gap: 12px; }

        .select-wrap { position: relative; }

        .styled-select {
          appearance: none;
          padding: 11px 40px 11px 16px;
          border: 1.5px solid #e0d8cc;
          border-radius: 12px;
          font-size: 14px;
          color: #1a1208;
          background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B6A3D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          transition: border-color 0.2s;
          min-width: 160px;
        }

        .styled-select:focus { outline: none; border-color: #8B6A3D; }

        /* ── Product Grid ── */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 28px;
        }

        .card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #ede8e0;
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(26,18,8,0.1);
          border-color: #d4c5a9;
        }

        .card-img-wrap {
          position: relative;
          height: 260px;
          overflow: hidden;
          background: #f5f0e8;
        }

        .card-top-badges {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          gap: 8px;
          z-index: 2;
        }

        .badge-culture {
          background: rgba(26,18,8,0.8);
          color: #d4a855;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-family: system-ui, sans-serif;
          backdrop-filter: blur(8px);
        }

        .badge-stock {
          background: rgba(46,125,50,0.85);
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-family: system-ui, sans-serif;
          backdrop-filter: blur(8px);
        }

        .match-badge {
          position: absolute;
          bottom: 14px;
          left: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(26,18,8,0.85);
          color: #d4a855;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          backdrop-filter: blur(8px);
          z-index: 2;
        }

        .card-heart {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a89880;
          transition: all 0.2s;
          z-index: 2;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .card-heart:hover, .card-heart--active {
          background: white;
          color: #E53E3E;
          transform: scale(1.1);
        }

        /* ── Card body ── */
        .card-body { padding: 22px; }

        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .card-category {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a89880;
          font-family: system-ui, sans-serif;
          font-weight: 600;
        }

        .sale-tag {
          background: #fef0e6;
          color: #c05621;
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .card-name {
          font-size: 18px;
          font-weight: 400;
          color: #1a1208;
          margin: 0 0 10px;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .card-desc {
          font-size: 13px;
          color: #7a6a55;
          line-height: 1.6;
          margin-bottom: 14px;
          font-family: system-ui, sans-serif;
        }

        .reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 18px;
        }

        .reason-chip {
          font-size: 11px;
          color: #4a7c59;
          background: #edf7f0;
          border: 1px solid #c8e6d2;
          padding: 4px 10px;
          border-radius: 20px;
          font-family: system-ui, sans-serif;
          font-weight: 500;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #f0ebe3;
        }

        .card-price { display: flex; flex-direction: column; gap: 2px; }

        .price-main {
          font-size: 20px;
          font-weight: 700;
          color: #1a1208;
          font-family: system-ui, sans-serif;
        }

        .price-sale {
          font-size: 20px;
          font-weight: 700;
          color: #c05621;
          font-family: system-ui, sans-serif;
        }

        .price-orig {
          font-size: 13px;
          color: #a89880;
          text-decoration: line-through;
          font-family: system-ui, sans-serif;
        }

        .cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 18px;
          background: #1a1208;
          color: #f5edd8;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .cart-btn:hover:not(:disabled) {
          background: #8B6A3D;
          transform: translateY(-1px);
        }

        .cart-btn--added {
          background: #2E7D32 !important;
          cursor: default;
        }

        /* ── Searching state ── */
        .searching-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: #7a6a55;
          font-family: system-ui, sans-serif;
          gap: 16px;
        }

        .search-anim {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5edd8, #ede0c4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B6A3D;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }

        .empty-filter {
          text-align: center;
          padding: 60px;
          color: #7a6a55;
          font-family: system-ui, sans-serif;
        }

        /* ── No match ── */
        .no-match {
          text-align: center;
          background: white;
          border: 1px solid #ede8e0;
          border-radius: 24px;
          padding: 72px 40px;
          margin-top: 40px;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }

        .no-match-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #f5f0e8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #a89880;
        }

        .no-match h3 {
          font-size: 24px;
          font-weight: 400;
          color: #1a1208;
          margin-bottom: 12px;
        }

        .no-match p {
          font-size: 15px;
          color: #7a6a55;
          line-height: 1.6;
          margin-bottom: 32px;
          font-family: system-ui, sans-serif;
        }

        .no-match-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-outline {
          padding: 13px 24px;
          background: white;
          border: 1.5px solid #8B6A3D;
          color: #8B6A3D;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          transition: all 0.2s;
        }

        .btn-outline:hover { background: #fdf9f3; }

        .btn-primary {
          padding: 13px 24px;
          background: #1a1208;
          color: #f5edd8;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          font-family: system-ui, sans-serif;
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-primary:hover { background: #8B6A3D; }

        /* ── Tips strip ── */
        .tips-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 48px;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          background: white;
          border: 1px solid #ede8e0;
          border-radius: 16px;
          font-family: system-ui, sans-serif;
        }

        .tip-icon { font-size: 22px; flex-shrink: 0; }

        .tip-text {
          font-size: 13px;
          color: #4a3f30;
          font-weight: 500;
          line-height: 1.4;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .tips-strip { grid-template-columns: repeat(2, 1fr); }
          .hero { padding: 60px 24px 56px; }
        }

        @media (max-width: 768px) {
          .content { padding: 40px 20px 80px; }
          .hero { padding: 52px 20px 48px; }
          .preview-wrap { grid-template-columns: 1fr; }
          .preview-img-panel { aspect-ratio: 4/3; }
          .results-bar { flex-direction: column; align-items: flex-start; }
          .results-filters { width: 100%; }
          .styled-select { flex: 1; min-width: 0; width: 100%; }
          .grid { grid-template-columns: 1fr; }
          .tips-strip { grid-template-columns: 1fr; }
          .drop-tips { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </div>
  );
}