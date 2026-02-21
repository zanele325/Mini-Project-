"use client";

import { useState, useEffect, useRef } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useAuth } from '@/src/Context/AuthContext';
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  Upload, 
  Calendar, 
  Globe2, 
  Camera,
  Sparkles,
  TrendingUp,
  Tag,
  Check,
  Scissors,
  Brain,
  Users,
  Mail,
  ArrowRight,
  X,
  RotateCcw,
} from "lucide-react";

// ─── AI Recommendation Helpers ───────────────────────────────────────────────

async function getAIRecommendations(occasion, products) {
  const response = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ occasion, products }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "API request failed");
  }

  return response.json();
}

// ─── Recommendation Card ─────────────────────────────────────────────────────

function RecommendationCard({ product, reason, onAddToCart, index }) {
  const [added, setAdded] = useState(false);

  const getCultureColor = (c) => ({ Xhosa:"#E8F4F8",Zulu:"#F8F4E8",Sotho:"#F4F8E8",Ndebele:"#F8E8F4",Tswana:"#E8F8F4",Venda:"#F4E8F8" }[c] || "#FFF9F0");
  const getTextColor   = (c) => ({ Xhosa:"#2C5C6F",Zulu:"#8B6A3D",Sotho:"#5C6F2C",Ndebele:"#6F2C5C",Tswana:"#2C6F5C",Venda:"#5C2C6F" }[c] || "#8B6A3D");
  const emoji = { Jewellery:"💎", Clothing:"👗", Headwear:"👑", Accessories:"👜", Footwear:"👞" }[product.category] || "🎁";

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{
      background:"white", borderRadius:"16px", overflow:"hidden",
      boxShadow:"0 4px 20px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0",
      animation:`cardFadeIn 0.5s ease-out ${index * 0.1}s both`,
      display:"flex", flexDirection:"column"
    }}>
      <div style={{ position:"relative", height:"160px", overflow:"hidden" }}>
  {product.imageUrl ? (
    <img 
      src={product.imageUrl} 
      alt={product.name}
      style={{
        width:"100%",
        height:"100%",
        objectFit:"cover",
        objectPosition:"center",
        display:"block"
      }}
      onError={(e) => {
        e.target.style.display = 'none';
        const fallback = e.target.parentElement.querySelector('.image-fallback');
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  ) : null}
  
  <div 
    className="image-fallback"
    style={{ 
      background:getCultureColor(product.culture), 
      height:"100%", 
      width:"100%",
      display: product.imageUrl ? "none" : "flex", 
      alignItems:"center", 
      justifyContent:"center", 
      position: product.imageUrl ? "absolute" : "static",
      top:0,
      left:0,
      fontSize:"52px" 
    }}
  >
    {emoji}
  </div>
        <div style={{ position:"absolute", top:"10px", left:"10px", background:"rgba(255,255,255,0.9)", color:getTextColor(product.culture), padding:"3px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:"700" }}>
          {product.culture || "Traditional"}
        </div>
        {product.onPromotion && (
          <div style={{ position:"absolute", top:"10px", right:"10px", background:"linear-gradient(135deg,#E74C3C,#C0392B)", color:"white", padding:"3px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:"700" }}>
            SALE
          </div>
        )}
      </div>

      <div style={{ padding:"16px", flex:1, display:"flex", flexDirection:"column", gap:"10px" }}>
        <div>
          <h4 style={{ margin:"0 0 2px", fontSize:"15px", fontWeight:"700", color:"#1A1A1A" }}>{product.name}</h4>
          <p style={{ margin:0, fontSize:"12px", color:"#999" }}>{product.category}</p>
        </div>

        <div style={{ background:"linear-gradient(135deg,#FFF9F0,#FFF5E6)", border:"1px solid #f0e6d6", borderRadius:"8px", padding:"10px 12px", display:"flex", gap:"8px", alignItems:"flex-start" }}>
          <Sparkles size={13} color="#B38B59" style={{ flexShrink:0, marginTop:"1px" }} />
          <p style={{ margin:0, fontSize:"12px", color:"#6B4E2A", lineHeight:"1.5" }}>{reason}</p>
        </div>

        <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"12px", borderTop:"1px solid #f5f5f5" }}>
          <div>
            {product.onPromotion && product.originalPrice && (
              <div style={{ textDecoration:"line-through", color:"#bbb", fontSize:"11px" }}>R {product.originalPrice.toFixed(2)}</div>
            )}
            <div style={{ fontSize:"19px", fontWeight:"800", color:"#1A1A1A" }}>R {product.price?.toFixed(2) || "0.00"}</div>
          </div>
          <button
            onClick={handleAdd}
            style={{
              background: added ? "linear-gradient(135deg,#2E8B57,#228B4A)" : "linear-gradient(135deg,#B38B59,#8B6A3D)",
              color:"white", border:"none", padding:"10px 16px", borderRadius:"10px",
              fontSize:"13px", fontWeight:"700", cursor:"pointer",
              display:"flex", alignItems:"center", gap:"6px", transition:"all 0.3s"
            }}
          >
            {added ? <>✓ Added</> : <><ShoppingCart size={13} />Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Modal ────────────────────────────────────────────────────────────────

function AIRecommendationsModal({ isOpen, onClose, searchQuery, allProducts, onAddToCart }) {
  const [phase, setPhase] = useState("idle");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const overlayRef = useRef(null);

  useEffect(() => { if (searchQuery) setLocalQuery(searchQuery); }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => { setPhase("idle"); setResults(null); setErrorMsg(""); }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSearch = async () => {
    if (!localQuery.trim()) return;
    setPhase("loading");
    setErrorMsg("");
    try {
      const aiResult = await getAIRecommendations(localQuery, allProducts);
      const enriched = (aiResult.recommendations || [])
        .map((rec) => {
          const product = allProducts.find((p) => p.id === rec.id);
          return product ? { ...product, aiReason: rec.reason } : null;
        })
        .filter(Boolean);
      setResults({ ...aiResult, enrichedProducts: enriched });
      setPhase("results");
    } catch (err) {
      console.error("AI recommendation error:", err);
      setErrorMsg("Couldn't get recommendations. Please try again.");
      setPhase("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position:"fixed", inset:0,
        background:"rgba(0,0,0,0.65)",
        backdropFilter:"blur(8px)",
        zIndex:2000,
        display:"flex", alignItems:"flex-start", justifyContent:"center",
        padding:"24px 16px",
        overflowY:"auto"
      }}
    >
      <div style={{
        background:"white", borderRadius:"24px",
        width:"100%", maxWidth:"880px",
        boxShadow:"0 40px 100px rgba(0,0,0,0.3)",
        animation:"modalSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        overflow:"hidden", position:"relative"
      }}>
        {/* Header */}
        <div style={{
          background:"linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 100%)",
          padding:"28px 32px",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start"
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
              <div style={{ width:"34px", height:"34px", background:"linear-gradient(135deg,#B38B59,#8B6A3D)", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Sparkles size={17} color="white" />
              </div>
              <h2 style={{ margin:0, fontSize:"22px", fontWeight:"800", color:"white", fontFamily:"'Crimson Pro', serif" }}>
                AI Attire Advisor
              </h2>
            </div>
            <p style={{ margin:0, fontSize:"14px", color:"rgba(255,255,255,0.6)" }}>
              Describe your occasion and get culturally appropriate attire recommendations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"10px", padding:"8px", cursor:"pointer", color:"white", display:"flex" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"32px" }}>
          {/* Input */}
          <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:"#666", marginBottom:"8px", letterSpacing:"0.6px", textTransform:"uppercase" }}>
            Tell us about your occasion
          </label>
          <textarea
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSearch(); }}
            placeholder="E.g. I'm a guest at a Zulu traditional wedding next month and need to dress respectfully as an outsider..."
            style={{
              width:"100%", minHeight:"100px", padding:"16px", fontSize:"15px",
              border:"2px solid #e8e8e8", borderRadius:"14px",
              fontFamily:"inherit", resize:"vertical", outline:"none",
              color:"#1A1A1A", lineHeight:"1.6", transition:"border-color 0.2s",
              boxSizing:"border-box", marginBottom:"6px"
            }}
            onFocus={(e) => (e.target.style.borderColor = "#B38B59")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
          />
          <p style={{ margin:"0 0 16px", fontSize:"12px", color:"#aaa" }}>Include your role, the culture, and event type · Ctrl+Enter to search</p>

          <button
            onClick={handleSearch}
            disabled={phase === "loading" || !localQuery.trim()}
            style={{
              width:"100%",
              background: phase === "loading" || !localQuery.trim() ? "#ddd" : "linear-gradient(135deg,#B38B59 0%,#8B6A3D 100%)",
              color: phase === "loading" || !localQuery.trim() ? "#aaa" : "white",
              border:"none", padding:"16px", borderRadius:"14px",
              fontSize:"16px", fontWeight:"700",
              cursor: phase === "loading" ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"12px",
              transition:"all 0.2s",
              boxShadow: phase === "loading" || !localQuery.trim() ? "none" : "0 4px 16px rgba(179,139,89,0.3)"
            }}
          >
            {phase === "loading" ? (
              <>
                <div style={{ width:"20px", height:"20px", border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spinAI 0.8s linear infinite" }} />
                Analysing your occasion...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Get AI Recommendations
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Loading pulse */}
          {phase === "loading" && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ fontSize:"52px", marginBottom:"16px", animation:"pulseSlow 1.5s ease-in-out infinite" }}>🧵</div>
              <p style={{ margin:"0 0 6px", fontSize:"16px", fontWeight:"600", color:"#1A1A1A" }}>Consulting cultural knowledge...</p>
              <p style={{ margin:0, fontSize:"14px", color:"#888" }}>Finding the most appropriate attire for your occasion</p>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div style={{ marginTop:"24px", background:"#FFF3CD", border:"1px solid #FFEAA7", borderRadius:"12px", padding:"20px", textAlign:"center" }}>
              <p style={{ margin:"0 0 12px", color:"#856404", fontSize:"15px" }}>{errorMsg}</p>
              <button onClick={handleSearch} style={{ background:"#B38B59", color:"white", border:"none", padding:"10px 20px", borderRadius:"8px", cursor:"pointer", fontSize:"14px", fontWeight:"600", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                <RotateCcw size={14} />Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {phase === "results" && results && (
            <div style={{ marginTop:"32px" }}>
              {/* Cultural summary */}
              <div style={{ background:"linear-gradient(135deg,#1A1A1A,#2D2D2D)", borderRadius:"16px", padding:"24px", marginBottom:"28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                  <Sparkles size={15} color="#B38B59" />
                  <span style={{ fontSize:"12px", fontWeight:"700", color:"#B38B59", letterSpacing:"0.6px", textTransform:"uppercase" }}>Cultural Guidance</span>
                </div>
                <p style={{ margin:"0 0 16px", fontSize:"15px", color:"rgba(255,255,255,0.9)", lineHeight:"1.7" }}>{results.summary}</p>
                {results.dressTips?.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {results.dressTips.map((tip, i) => (
                      <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                        <div style={{ width:"20px", height:"20px", background:"#B38B59", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:"white", fontWeight:"700", flexShrink:0, marginTop:"1px" }}>{i + 1}</div>
                        <p style={{ margin:0, fontSize:"13px", color:"rgba(255,255,255,0.75)", lineHeight:"1.5" }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product grid */}
              <h3 style={{ margin:"0 0 20px", fontSize:"20px", fontWeight:"700", color:"#1A1A1A", fontFamily:"'Crimson Pro', serif" }}>
                {results.enrichedProducts.length > 0 ? `${results.enrichedProducts.length} Recommended Items` : "Recommendations"}
              </h3>

              {results.enrichedProducts.length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:"20px" }}>
                  {results.enrichedProducts.map((product, i) => (
                    <RecommendationCard key={product.id} product={product} reason={product.aiReason} onAddToCart={onAddToCart} index={i} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"40px", background:"#FAFAFA", borderRadius:"16px", border:"2px dashed #e0e0e0" }}>
                  <p style={{ color:"#888", fontSize:"15px", margin:"0 0 6px" }}>No exact matches found in our current inventory.</p>
                  <p style={{ color:"#aaa", fontSize:"13px", margin:0 }}>Try browsing our full catalogue or adjusting your description.</p>
                </div>
              )}

              <div style={{ marginTop:"28px", textAlign:"center" }}>
                <button
                  onClick={() => { setPhase("idle"); setResults(null); setLocalQuery(""); }}
                  style={{ background:"none", border:"2px solid #e0e0e0", padding:"12px 24px", borderRadius:"12px", cursor:"pointer", fontSize:"14px", fontWeight:"600", color:"#555", display:"inline-flex", alignItems:"center", gap:"8px", transition:"all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor="#B38B59"; e.currentTarget.style.color="#B38B59"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor="#e0e0e0"; e.currentTarget.style.color="#555"; }}
                >
                  <RotateCcw size={14} />Search for another occasion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredItems, setFeaturedItems] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);

  const { addToCart, getCartCount } = useCart();
  const { user } = useAuth();
  const cartCount = getCartCount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, "products");
        const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));
        const productsSnapshot = await getDocs(productsQuery);
        const allProds = [];
        productsSnapshot.forEach((doc) => { allProds.push({ id: doc.id, ...doc.data() }); });

        setAllProducts(allProds);
        setFeaturedItems(allProds.slice(0, 4));
        setTopSellingProducts(allProds.filter(p => p.salesCount > 0).sort((a,b)=>(b.salesCount||0)-(a.salesCount||0)).slice(0,4));
        setPromotionProducts(allProds.filter(p => p.onPromotion === true).slice(0, 4));

        const occ = new Set();
        allProds.forEach(p => (p.occasions || []).forEach(o => occ.add(o)));
        setOccasions(Array.from(occ).slice(0, 5));

        const cul = new Set();
        allProds.forEach(p => { if (p.culture) cul.add(p.culture); });
        setCultures(Array.from(cul).slice(0, 6));

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageUploadClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        sessionStorage.setItem('searchImage', event.target.result);
        sessionStorage.setItem('searchImageName', file.name);
        sessionStorage.setItem('searchImageType', file.type);
        router.push('/image-search');
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    const notification = document.createElement('div');
    notification.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><div style="width:20px;height:20px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span>Added "${item.name}" to cart</span></div>`;
    notification.style.cssText = `position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#2E8B57 0%,#228B4A 100%);color:white;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(46,139,87,0.3);z-index:3000;animation:slideIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.animation='slideOut 0.3s ease-in'; setTimeout(()=>notification.remove(),300); }, 3000);
  };

  const getProductEmoji = (product) => ({ Jewellery:'💎',Clothing:'👗',Headwear:'👑',Accessories:'👜',Footwear:'👞' }[product.category] || '🎁');
  const getCultureColor = (c) => ({ Xhosa:'#E8F4F8',Zulu:'#F8F4E8',Sotho:'#F4F8E8',Ndebele:'#F8E8F4',Tswana:'#E8F8F4',Venda:'#F4E8F8',Tsonga:'#F8F8E8',Pedi:'#E8E8F8' }[c] || '#F8F4E8');
  const getTextColor   = (c) => ({ Xhosa:'#2C5C6F',Zulu:'#8B6A3D',Sotho:'#5C6F2C',Ndebele:'#6F2C5C',Tswana:'#2C6F5C',Venda:'#5C2C6F',Tsonga:'#6F5C2C',Pedi:'#2C5C6F' }[c] || '#8B6A3D');

  const ProductGrid = ({ products, title, subtitle, icon: Icon }) => (
    <section style={{ padding:'80px 0', background:'#FAFAFA' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 24px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            {Icon && <Icon size={24} color="#B38B59" />}
            <h2 style={{ fontSize:'32px', fontWeight:'700', color:'#1A1A1A', margin:0 }}>{title}</h2>
          </div>
          {subtitle && <p style={{ fontSize:'16px', color:'#666', maxWidth:'600px', margin:'0 auto' }}>{subtitle}</p>}
        </div>
        {products.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'24px' }}>
            {products.map((item) => (
              <div key={item.id} style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all 0.3s ease', cursor:'pointer', border:'1px solid #f0f0f0' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ position:'relative', height:'240px', overflow:'hidden' }}>
  {item.imageUrl ? (
    <img 
      src={item.imageUrl} 
      alt={item.name}
      style={{
        width:'100%',
        height:'100%',
        objectFit:'cover',
        objectPosition:'center',
        display:'block'
      }}
      onError={(e) => {
        e.target.style.display = 'none';
        const fallback = e.target.parentElement.querySelector('.product-image-fallback');
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  ) : null}
  
  <div 
    className="product-image-fallback"
    style={{ 
      backgroundColor:getCultureColor(item.culture),
      color:getTextColor(item.culture),
      height:'100%',
      width:'100%',
      display: item.imageUrl ? 'none' : 'flex',
      alignItems:'center',
      justifyContent:'center',
      position: item.imageUrl ? 'absolute' : 'static',
      top:0,
      left:0
    }}
  >
    <div style={{ fontSize:'64px' }}>{getProductEmoji(item)}</div>
  </div>
                  {item.onPromotion && (
                    <div style={{ position:'absolute', top:'12px', right:'12px', background:'linear-gradient(135deg,#E74C3C,#C0392B)', color:'white', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', letterSpacing:'0.5px', boxShadow:'0 4px 12px rgba(231,76,60,0.3)' }}>SALE</div>
                  )}
                </div>
                <div style={{ padding:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <span style={{ background:getCultureColor(item.culture), color:getTextColor(item.culture), padding:'4px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'600' }}>{item.culture || "Traditional"}</span>
                    {item.occasions?.length > 0 && (
                      <div style={{ display:'flex', gap:'4px' }}>
                        {item.occasions.slice(0,2).map((_, idx) => <Check key={idx} size={16} color="#2E8B57" strokeWidth={3} />)}
                      </div>
                    )}
                  </div>
                  <h4 style={{ fontSize:'18px', fontWeight:'600', color:'#1A1A1A', margin:'0 0 8px', lineHeight:'1.4' }}>{item.name || "Traditional Item"}</h4>
                  <p style={{ fontSize:'14px', color:'#666', lineHeight:'1.5', margin:'0 0 16px', height:'42px', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {item.description || item.note || "Culturally significant traditional attire"}
                  </p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'16px', borderTop:'1px solid #f0f0f0' }}>
                    <div>
                      {item.onPromotion && item.originalPrice && (
                        <div style={{ textDecoration:'line-through', color:'#999', fontSize:'13px', marginBottom:'2px' }}>R {item.originalPrice.toFixed(2)}</div>
                      )}
                      <div style={{ fontSize:'22px', fontWeight:'700', color:'#1A1A1A' }}>R {item.price ? item.price.toFixed(2) : "0.00"}</div>
                    </div>
                    <button onClick={() => handleAddToCart(item)}
                      style={{ background:'linear-gradient(135deg,#2E8B57,#228B4A)', color:'white', border:'none', padding:'12px 24px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', transition:'all 0.2s ease', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 12px rgba(46,139,87,0.2)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(46,139,87,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,139,87,0.2)'; }}
                    >
                      <ShoppingCart size={16} />Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#999', background:'white', borderRadius:'16px', border:'2px dashed #e0e0e0' }}>
            <p style={{ fontSize:'16px', margin:0 }}>No products available in this category yet.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spinAI { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.96) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulseSlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ minHeight: '100vh' }}>
        {/* Loading */}
        {loading && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:'60px', height:'60px', border:'4px solid #f3f3f3', borderTop:'4px solid #B38B59', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 24px' }}></div>
              <p style={{ color:'#666', fontSize:'16px', fontWeight:'500' }}>Loading products...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background:'#FFF3CD', color:'#856404', padding:'20px', borderRadius:'12px', textAlign:'center', border:'1px solid #FFEAA7', maxWidth:'600px', margin:'24px auto' }}>
            <p style={{ margin:'0 0 12px', fontSize:'15px', fontWeight:'500' }}>{error}</p>
            <a href="/admin/products/add" style={{ color:'#007bff', textDecoration:'underline', fontSize:'14px' }}>Add products to Firebase first</a>
          </div>
        )}

        {/* Hero */}
        <section style={{ background:'linear-gradient(165deg,#1A1A1A 0%,#2D2D2D 100%)', color:'white', padding:'100px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, right:0, width:'600px', height:'600px', background:'radial-gradient(circle,rgba(179,139,89,0.1) 0%,transparent 70%)', borderRadius:'50%', transform:'translate(30%,-30%)' }}></div>
          <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
            <div style={{ maxWidth:'700px', animation:'fadeInUp 0.8s ease-out' }}>
              <h1 style={{ fontSize:'56px', fontWeight:'700', lineHeight:'1.15', marginBottom:'24px', fontFamily:"'Crimson Pro', serif" }}>
                Find the right traditional attire — for the right occasion
              </h1>
              <p style={{ fontSize:'20px', lineHeight:'1.6', color:'rgba(255,255,255,0.85)', marginBottom:'48px', fontWeight:'400' }}>
                Culturally appropriate clothing and jewellery for Southern African ceremonies
              </p>

              {/* Search Box */}
              <div style={{ background:'white', borderRadius:'16px', padding:'32px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', animation:'fadeInUp 0.8s ease-out 0.2s both' }}>
                <label style={{ display:'block', color:'#1A1A1A', fontSize:'15px', fontWeight:'600', marginBottom:'12px' }}>
                  Tell us about your occasion
                </label>
                <textarea
                  placeholder="I'm attending a Xhosa wedding as a guest and need something respectful..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width:'100%', minHeight:'100px', padding:'16px', fontSize:'15px', border:'2px solid #e0e0e0', borderRadius:'12px', fontFamily:'inherit', resize:'vertical', transition:'border-color 0.2s', outline:'none', marginBottom:'16px', boxSizing:'border-box' }}
                  onFocus={(e) => (e.target.style.borderColor='#B38B59')}
                  onBlur={(e) => (e.target.style.borderColor='#e0e0e0')}
                />

                {/* ← CHANGED: now opens AI modal instead of redirecting */}
                <button
                  onClick={() => setShowAIModal(true)}
                  style={{ width:'100%', background:'linear-gradient(135deg,#B38B59 0%,#8B6A3D 100%)', color:'white', border:'none', padding:'16px 32px', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', transition:'all 0.2s ease', boxShadow:'0 4px 16px rgba(179,139,89,0.3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(179,139,89,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(179,139,89,0.3)'; }}
                >
                  <Sparkles size={20} />
                  Find Recommendations
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Entry Points */}
        <section style={{ padding:'80px 24px', background:'white' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'24px' }}>
              {/* Browse by Occasion */}
              <div style={{ background:'linear-gradient(135deg,#FFF9F0,#FFF5E6)', padding:'32px', borderRadius:'20px', border:'1px solid #f0e6d6', transition:'all 0.3s ease', cursor:'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(179,139,89,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#B38B59,#8B6A3D)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px', boxShadow:'0 4px 16px rgba(179,139,89,0.25)' }}>
                  <Calendar size={28} color="white" />
                </div>
                <h3 style={{ fontSize:'24px', fontWeight:'700', color:'#1A1A1A', marginBottom:'12px', fontFamily:"'Crimson Pro', serif" }}>Browse by Occasion</h3>
                <p style={{ fontSize:'15px', color:'#666', lineHeight:'1.6', marginBottom:'20px' }}>Find attire specifically chosen for different ceremonies and events</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px' }}>
                  {occasions.length > 0 ? occasions.map((o) => (
                    <span key={o} style={{ background:'white', color:'#8B6A3D', padding:'6px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'1px solid #f0e6d6' }}>{o}</span>
                  )) : <span style={{ background:'white', color:'#999', padding:'6px 14px', borderRadius:'8px', fontSize:'13px' }}>Loading...</span>}
                </div>
                <a href="/shop?filter=occasion" style={{ color:'#B38B59', fontSize:'15px', fontWeight:'600', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'8px' }}>
                  Explore occasions <ArrowRight size={18} />
                </a>
              </div>

              {/* Browse by Culture */}
              <div style={{ background:'linear-gradient(135deg,#F0F8FF,#E6F3FF)', padding:'32px', borderRadius:'20px', border:'1px solid #d6e9f7', transition:'all 0.3s ease', cursor:'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(44,92,111,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#2C5C6F,#1E4250)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px', boxShadow:'0 4px 16px rgba(44,92,111,0.25)' }}>
                  <Globe2 size={28} color="white" />
                </div>
                <h3 style={{ fontSize:'24px', fontWeight:'700', color:'#1A1A1A', marginBottom:'12px', fontFamily:"'Crimson Pro', serif" }}>Browse by Culture</h3>
                <p style={{ fontSize:'15px', color:'#666', lineHeight:'1.6', marginBottom:'20px' }}>Explore authentic attire from specific cultural traditions</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px' }}>
                  {cultures.length > 0 ? cultures.map((c) => (
                    <span key={c} style={{ background:'white', color:'#2C5C6F', padding:'6px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', border:'1px solid #d6e9f7' }}>{c}</span>
                  )) : <span style={{ background:'white', color:'#999', padding:'6px 14px', borderRadius:'8px', fontSize:'13px' }}>Loading...</span>}
                </div>
                <a href="/shop?filter=culture" style={{ color:'#2C5C6F', fontSize:'15px', fontWeight:'600', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'8px' }}>
                  Explore cultures <ArrowRight size={18} />
                </a>
              </div>

              {/* Image Upload */}
              <div style={{ background:'linear-gradient(135deg,#F5F0FF,#EBE6FF)', padding:'32px', borderRadius:'20px', border:'1px solid #e0d6f7', transition:'all 0.3s ease', cursor:'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(111,44,92,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#6F2C5C,#571E47)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px', boxShadow:'0 4px 16px rgba(111,44,92,0.25)' }}>
                  <Camera size={28} color="white" />
                </div>
                <h3 style={{ fontSize:'24px', fontWeight:'700', color:'#1A1A1A', marginBottom:'12px', fontFamily:"'Crimson Pro', serif" }}>Image Upload Search</h3>
                <p style={{ fontSize:'15px', color:'#666', lineHeight:'1.6', marginBottom:'20px' }}>Have a photo or pattern? Upload an image to find similar attire</p>
                <div onClick={handleImageUploadClick} style={{ background:'white', border:'2px dashed #d6c7e9', borderRadius:'12px', padding:'32px 24px', textAlign:'center', cursor:'pointer', transition:'all 0.2s ease', marginBottom:'12px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor='#6F2C5C'; e.currentTarget.style.background='#FAFAFA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor='#d6c7e9'; e.currentTarget.style.background='white'; }}
                >
                  <Upload size={32} color="#6F2C5C" style={{ marginBottom:'12px' }} />
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#6F2C5C' }}>Click to upload image</div>
                </div>
                <p style={{ fontSize:'13px', color:'#999', textAlign:'center' }}>JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product sections */}
        {promotionProducts.length > 0 && <ProductGrid products={promotionProducts} title="Special Offers" subtitle="Limited time promotions on authentic traditional attire" icon={Tag} />}
        {topSellingProducts.length > 0 && <ProductGrid products={topSellingProducts} title="Popular Choices" subtitle="Most loved items by our community" icon={TrendingUp} />}
        <ProductGrid products={featuredItems} title="Recommended for Common Ceremonies" subtitle={featuredItems.length > 0 ? `Showing ${featuredItems.length} culturally appropriate items for specific events` : "Loading featured products..."} icon={Sparkles} />

        {/* Trust Section */}
        <section style={{ padding:'80px 24px', background:'linear-gradient(180deg,#FAFAFA 0%,white 100%)' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'40px' }}>
              {[
                { icon:Scissors, color:"#B38B59", bg:"linear-gradient(135deg,#FFF9F0,#FFE8CC)", shadow:"rgba(179,139,89,0.1)", title:"Authentic Design", text:"Carefully curated attire and beadwork inspired by real cultural practices and made by authentic artisans" },
                { icon:Brain, color:"#2C5C6F", bg:"linear-gradient(135deg,#F0F8FF,#CCE5FF)", shadow:"rgba(44,92,111,0.1)", title:"Smart Recommendations", text:"Our AI helps you choose attire that is culturally appropriate for your specific event and role" },
                { icon:Users, color:"#2E8B57", bg:"linear-gradient(135deg,#F0FFF4,#CCFFDC)", shadow:"rgba(46,139,87,0.1)", title:"Community Focused", text:"Supporting local artisans and preserving cultural heritage through ethical commerce" },
              ].map(({ icon: Icon, color, bg, shadow, title, text }) => (
                <div key={title} style={{ textAlign:'center' }}>
                  <div style={{ width:'80px', height:'80px', background:bg, borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:`0 4px 20px ${shadow}` }}>
                    <Icon size={36} color={color} />
                  </div>
                  <h4 style={{ fontSize:'22px', fontWeight:'700', color:'#1A1A1A', marginBottom:'12px', fontFamily:"'Crimson Pro', serif" }}>{title}</h4>
                  <p style={{ fontSize:'15px', color:'#666', lineHeight:'1.7' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background:'linear-gradient(180deg,#1A1A1A 0%,#000000 100%)', color:'white', padding:'60px 24px 24px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'48px', marginBottom:'48px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                  <div style={{ width:'44px', height:'44px', background:'linear-gradient(135deg,#B38B59,#8B6A3D)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', fontFamily:"'Crimson Pro', serif" }}>iS</div>
                  <div>
                    <div style={{ fontSize:'20px', fontWeight:'700', fontFamily:"'Crimson Pro', serif" }}>iSiko Studio</div>
                    <div style={{ fontSize:'11px', color:'#B38B59', fontWeight:'500', letterSpacing:'0.5px' }}>CULTURAL HERITAGE</div>
                  </div>
                </div>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', lineHeight:'1.6', marginBottom:'12px' }}>Culturally respectful traditional attire for Southern African ceremonies</p>
              </div>
              <div>
                <h4 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'white' }}>Quick Links</h4>
                <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                  {['Home','Shop','About Us','Image Search'].map(link => (
                    <li key={link} style={{ marginBottom:'12px' }}>
                      <a href={`/${link.toLowerCase().replace(' ','-')}`} style={{ color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'14px' }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'white' }}>Support</h4>
                <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                  {['Contact Us','FAQs','Shipping & Returns','Privacy Policy'].map(link => (
                    <li key={link} style={{ marginBottom:'12px' }}>
                      <a href="#" style={{ color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'14px' }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'20px', color:'white' }}>Stay Connected</h4>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', marginBottom:'16px', lineHeight:'1.6' }}>Subscribe for cultural insights and new arrivals</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <input type="email" placeholder="Your email" style={{ flex:1, padding:'12px 16px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', color:'white', fontSize:'14px', outline:'none' }} />
                  <button style={{ background:'linear-gradient(135deg,#B38B59,#8B6A3D)', border:'none', padding:'12px 20px', borderRadius:'10px', cursor:'pointer' }}>
                    <Mail size={18} color="white" />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'24px', textAlign:'center' }}>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:0 }}>
                © 2024 iSiko Studio. All rights reserved. "iSiko" means "Culture" in several Southern African languages.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* ← AI Recommendations Modal */}
      <AIRecommendationsModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        searchQuery={searchQuery}
        allProducts={allProducts}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}