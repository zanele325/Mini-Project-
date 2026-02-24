"use client";

import { useState, useEffect, useRef } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useCart } from '@/src/Context/CartContext';
import { useAuth } from '@/src/Context/AuthContext';
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Upload, Calendar, Globe2, Camera,
  Sparkles, TrendingUp, Tag, Scissors, Brain, Users,
  ArrowRight, X, RotateCcw, Check,
} from "lucide-react";

// ── identical logic helpers ───────────────────────────────────────────────────
async function getAIRecommendations(occasion, products) {
  const res = await fetch("/api/recommendations", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ occasion, products }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error||"API error"); }
  return res.json();
}

const CULT_BG   = { Xhosa:"#E8F4F8",Zulu:"#F8F4E8",Sotho:"#F4F8E8",Ndebele:"#F8E8F4",Tswana:"#E8F8F4",Venda:"#F4E8F8",Tsonga:"#F8F8E8",Pedi:"#E8E8F8" };
const CULT_TXT  = { Xhosa:"#2C5C6F",Zulu:"#8B6A3D",Sotho:"#5C6F2C",Ndebele:"#6F2C5C",Tswana:"#2C6F5C",Venda:"#5C2C6F",Tsonga:"#6F5C2C",Pedi:"#2C5C6F" };
const CAT_EMOJI = { Jewellery:"💎",Clothing:"👗",Headwear:"👑",Accessories:"👜",Footwear:"👞" };
const cultBg  = c => CULT_BG[c]  || "#F8F4E8";
const cultTxt = c => CULT_TXT[c] || "#8B6A3D";
const catEmoji = p => CAT_EMOJI[p?.category] || "🎁";

// ── Recommendation Card ───────────────────────────────────────────────────────
function RecCard({ product, reason, onAddToCart, index }) {
  const [added, setAdded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const add = () => { onAddToCart(product); setAdded(true); setTimeout(()=>setAdded(false),2000); };

  return (
    <div className="rec-card" style={{ background:"white", borderRadius:"16px", overflow:"hidden",
      border:"1px solid #ede8df", animation:`cardUp 0.45s ease ${index*0.08}s both` }}>
      <div style={{ height:"188px", overflow:"hidden", background:cultBg(product.culture),
        position:"relative" }}>
        {product.imageUrl && !imgErr
          ? <img src={product.imageUrl} alt={product.name} className="ri"
              style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"transform 0.4s" }}
              onError={()=>setImgErr(true)}/>
          : <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"50px" }}>
              {catEmoji(product)}
            </div>}
        <div style={{ position:"absolute",top:"10px",left:"10px",background:"rgba(10,8,4,0.72)",
          color:"#d4a855",padding:"4px 11px",borderRadius:"20px",fontSize:"11px",
          fontWeight:"600",backdropFilter:"blur(8px)",fontFamily:"var(--body)" }}>
          {product.culture||"Traditional"}
        </div>
      </div>
      <div style={{ padding:"16px 18px" }}>
        <p style={{ margin:"0 0 2px",fontSize:"10px",color:"#a89070",textTransform:"uppercase",
          letterSpacing:"0.09em",fontFamily:"var(--body)",fontWeight:"700" }}>{product.category}</p>
        <h4 style={{ margin:"0 0 8px",fontSize:"16px",fontWeight:"400",color:"#1a1208",
          lineHeight:"1.3",fontFamily:"var(--display)" }}>{product.name}</h4>
        <p style={{ margin:"0 0 14px",fontSize:"13px",color:"#7a6a55",lineHeight:"1.55",
          minHeight:"40px",fontFamily:"var(--body)" }}>{reason}</p>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
          paddingTop:"12px",borderTop:"1px solid #f0ebe3" }}>
          <span style={{ fontSize:"19px",fontWeight:"400",color:"#1a1208",fontFamily:"var(--display)" }}>
            R {product.price?.toFixed(2)||"0.00"}
          </span>
          <button onClick={add} className="btn-sm" style={{
            background:added?"#2E7D32":"#1a1208", color:added?"white":"#d4a855" }}>
            {added?"✓ Added":"Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Modal ──────────────────────────────────────────────────────────────────
function AIModal({ isOpen, onClose, searchQuery, allProducts, onAddToCart }) {
  const [phase, setPhase] = useState("idle");
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [q, setQ] = useState(searchQuery||"");
  const ref = useRef(null);

  useEffect(()=>{ if(searchQuery) setQ(searchQuery); },[searchQuery]);
  useEffect(()=>{ if(!isOpen) setTimeout(()=>{ setPhase("idle"); setResults(null); setErrorMsg(""); },300); },[isOpen]);
  useEffect(()=>{ document.body.style.overflow=isOpen?"hidden":""; return()=>{ document.body.style.overflow=""; }; },[isOpen]);

  const search = async () => {
    if(!q.trim()) return;
    setPhase("loading"); setErrorMsg("");
    try {
      const ai = await getAIRecommendations(q, allProducts);
      const enriched = (ai.recommendations||[]).map(r=>{ const p=allProducts.find(x=>x.id===r.id); return p?{...p,aiReason:r.reason}:null; }).filter(Boolean);
      setResults({...ai,enrichedProducts:enriched}); setPhase("results");
    } catch { setErrorMsg("Couldn't get recommendations. Please try again."); setPhase("error"); }
  };

  if(!isOpen) return null;
  return (
    <div ref={ref} onClick={e=>{ if(e.target===ref.current) onClose(); }}
      style={{ position:"fixed",inset:0,background:"rgba(8,5,2,0.87)",backdropFilter:"blur(14px)",
        zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"center",
        padding:"28px 16px",overflowY:"auto" }}>
      <div style={{ background:"#faf8f4",borderRadius:"22px",width:"100%",maxWidth:"700px",
        overflow:"hidden",animation:"modalIn 0.4s cubic-bezier(0.16,1,0.3,1)",
        boxShadow:"0 40px 80px rgba(0,0,0,0.5)" }}>

        {/* header */}
        <div style={{ background:"linear-gradient(135deg,#1a1208,#2d1f0e)",padding:"28px 30px",
          display:"flex",justifyContent:"space-between",alignItems:"center",
          borderBottom:"2px solid #8B6A3D" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"32px",height:"32px",background:"linear-gradient(135deg,#d4a855,#8B6A3D)",
              borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Sparkles size={16} color="white"/>
            </div>
            <div>
              <h2 style={{ margin:0,fontSize:"20px",fontWeight:"400",color:"#f5edd8",fontFamily:"var(--display)" }}>
                AI Attire Advisor
              </h2>
              <p style={{ margin:0,fontSize:"12px",color:"rgba(245,237,216,0.5)",fontFamily:"var(--body)" }}>
                Culturally appropriate recommendations
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:"9px",width:"32px",height:"32px",display:"flex",alignItems:"center",
            justifyContent:"center",cursor:"pointer" }}>
            <X size={15} color="#d4a855"/>
          </button>
        </div>

        <div style={{ padding:"30px" }}>
          <label style={{ display:"block",fontSize:"11px",fontWeight:"700",color:"#8B6A3D",
            textTransform:"uppercase",letterSpacing:"0.09em",fontFamily:"var(--body)",marginBottom:"9px" }}>
            Describe your occasion
          </label>
          <textarea value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) search(); }}
            placeholder="E.g. I'm a guest at a Zulu traditional wedding and need to dress respectfully…"
            style={{ width:"100%",minHeight:"92px",padding:"13px 15px",fontSize:"15px",lineHeight:"1.6",
              border:"1.5px solid #e0d8cc",borderRadius:"11px",fontFamily:"var(--body)",resize:"vertical",
              outline:"none",color:"#1a1208",background:"white",boxSizing:"border-box",marginBottom:"7px",
              transition:"border-color 0.2s" }}
            onFocus={e=>e.target.style.borderColor="#8B6A3D"}
            onBlur={e=>e.target.style.borderColor="#e0d8cc"}/>
          <p style={{ margin:"0 0 15px",fontSize:"11px",color:"#a89880",fontFamily:"var(--body)" }}>
            Include your role, the culture, and event type · Ctrl+Enter to search
          </p>
          <button onClick={search} disabled={phase==="loading"||!q.trim()}
            style={{ width:"100%",padding:"14px",fontSize:"15px",fontWeight:"600",
              background:phase==="loading"||!q.trim()?"#e0d8cc":"linear-gradient(135deg,#1a1208,#2d1f0e)",
              color:phase==="loading"||!q.trim()?"#a89880":"#d4a855",border:"none",borderRadius:"11px",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              fontFamily:"var(--body)",transition:"all 0.2s" }}>
            {phase==="loading"
              ? <><div className="spin"/>Analysing occasion…</>
              : <><Sparkles size={17}/>Get Recommendations<ArrowRight size={15}/></>}
          </button>

          {phase==="loading" && (
            <div style={{ textAlign:"center",padding:"48px 0 28px" }}>
              <div style={{ fontSize:"44px",marginBottom:"14px",animation:"pulse 1.5s ease-in-out infinite" }}>🧵</div>
              <p style={{ margin:"0 0 5px",fontSize:"16px",color:"#1a1208",fontFamily:"var(--display)" }}>
                Consulting cultural knowledge…
              </p>
              <p style={{ margin:0,fontSize:"13px",color:"#a89880",fontFamily:"var(--body)" }}>
                Finding appropriate attire for your occasion
              </p>
            </div>
          )}

          {phase==="error" && (
            <div style={{ marginTop:"22px",background:"#fffbeb",border:"1px solid #f0d878",
              borderRadius:"12px",padding:"18px",textAlign:"center" }}>
              <p style={{ margin:"0 0 10px",color:"#92400e",fontFamily:"var(--body)",fontSize:"14px" }}>{errorMsg}</p>
              <button onClick={search} className="btn-sm" style={{ background:"#1a1208",color:"#d4a855",
                display:"inline-flex",alignItems:"center",gap:"6px" }}>
                <RotateCcw size={12}/>Try Again
              </button>
            </div>
          )}

          {phase==="results" && results && (
            <div style={{ marginTop:"28px" }}>
              <div style={{ background:"linear-gradient(135deg,#1a1208,#2d1f0e)",borderRadius:"14px",
                padding:"22px",marginBottom:"26px",border:"1px solid rgba(139,106,61,0.3)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"7px",marginBottom:"10px" }}>
                  <Sparkles size={12} color="#d4a855"/>
                  <span style={{ fontSize:"10px",fontWeight:"700",color:"#d4a855",
                    letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"var(--body)" }}>Cultural Guidance</span>
                </div>
                <p style={{ margin:"0 0 14px",fontSize:"14px",color:"rgba(245,237,216,0.9)",
                  lineHeight:"1.75",fontFamily:"var(--body)" }}>{results.summary}</p>
                {results.dressTips?.length>0 && (
                  <div style={{ display:"flex",flexDirection:"column",gap:"7px" }}>
                    {results.dressTips.map((tip,i)=>(
                      <div key={i} style={{ display:"flex",gap:"9px",alignItems:"flex-start" }}>
                        <div style={{ width:"17px",height:"17px",background:"#8B6A3D",borderRadius:"50%",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:"9px",color:"white",fontWeight:"700",flexShrink:0,marginTop:"2px" }}>{i+1}</div>
                        <p style={{ margin:0,fontSize:"12px",color:"rgba(245,237,216,0.7)",
                          lineHeight:"1.55",fontFamily:"var(--body)" }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <h3 style={{ margin:"0 0 18px",fontSize:"20px",fontWeight:"400",color:"#1a1208",fontFamily:"var(--display)" }}>
                {results.enrichedProducts.length>0?`${results.enrichedProducts.length} Recommended Items`:"Recommendations"}
              </h3>
              {results.enrichedProducts.length>0 ? (
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"18px" }}>
                  {results.enrichedProducts.map((p,i)=>(
                    <RecCard key={p.id} product={p} reason={p.aiReason} onAddToCart={onAddToCart} index={i}/>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center",padding:"36px",background:"white",borderRadius:"14px",border:"2px dashed #e0d8cc" }}>
                  <p style={{ color:"#a89880",fontSize:"14px",margin:0,fontFamily:"var(--body)" }}>
                    No exact matches in current inventory.
                  </p>
                </div>
              )}
              <div style={{ marginTop:"26px",textAlign:"center" }}>
                <button onClick={()=>{ setPhase("idle"); setResults(null); setQ(""); }}
                  style={{ background:"none",border:"1.5px solid #e0d8cc",borderRadius:"10px",
                    padding:"10px 20px",cursor:"pointer",fontSize:"13px",fontWeight:"600",color:"#7a6a55",
                    display:"inline-flex",alignItems:"center",gap:"7px",fontFamily:"var(--body)",transition:"all 0.18s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#8B6A3D"; e.currentTarget.style.color="#8B6A3D"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e0d8cc"; e.currentTarget.style.color="#7a6a55"; }}>
                  <RotateCcw size={12}/>Search another occasion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function PCard({ item, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const add = () => { onAddToCart(item); setAdded(true); setTimeout(()=>setAdded(false),2000); };

  return (
    <div className="pcard">
      <div style={{ position:"relative",height:"260px",overflow:"hidden",background:cultBg(item.culture) }}>
        {item.imageUrl && !imgErr
          ? <img src={item.imageUrl} alt={item.name} className="pcard-img"
              style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block" }}
              onError={()=>setImgErr(true)}/>
          : <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"68px" }}>
              {catEmoji(item)}
            </div>}
        <div style={{ position:"absolute",top:"13px",left:"13px",background:"rgba(10,8,4,0.76)",
          color:"#d4a855",padding:"5px 13px",borderRadius:"20px",fontSize:"11px",fontWeight:"600",
          letterSpacing:"0.05em",backdropFilter:"blur(10px)",fontFamily:"var(--body)" }}>
          {item.culture||"Traditional"}
        </div>
        {item.onPromotion && (
          <div style={{ position:"absolute",top:"13px",right:"13px",background:"#b83c2b",
            color:"white",padding:"5px 12px",borderRadius:"20px",fontSize:"10px",
            fontWeight:"700",letterSpacing:"0.06em",fontFamily:"var(--body)" }}>SALE</div>
        )}
      </div>
      <div style={{ padding:"22px 24px" }}>
        <p style={{ margin:"0 0 5px",fontSize:"10px",fontWeight:"700",color:"#a89070",
          textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"var(--body)" }}>{item.category}</p>
        <h4 style={{ margin:"0 0 8px",fontSize:"19px",fontWeight:"400",color:"#1a1208",
          lineHeight:"1.3",fontFamily:"var(--display)" }}>{item.name||"Traditional Item"}</h4>
        <p style={{ margin:"0 0 18px",fontSize:"13px",color:"#7a6a55",lineHeight:"1.6",
          height:"42px",overflow:"hidden",fontFamily:"var(--body)" }}>
          {item.description||"Culturally significant traditional attire"}
        </p>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
          paddingTop:"16px",borderTop:"1px solid #f0ebe3" }}>
          <div>
            {item.onPromotion && item.originalPrice && (
              <div style={{ textDecoration:"line-through",color:"#a89880",fontSize:"12px",marginBottom:"2px",fontFamily:"var(--body)" }}>
                R {item.originalPrice.toFixed(2)}
              </div>
            )}
            <div style={{ fontSize:"22px",fontWeight:"400",color:"#1a1208",fontFamily:"var(--display)" }}>
              R {item.price?item.price.toFixed(2):"0.00"}
            </div>
          </div>
          <button onClick={add} className="btn-sm" style={{
            background:added?"#2E7D32":"#1a1208", color:added?"white":"#d4a855",
            display:"flex",alignItems:"center",gap:"7px",padding:"11px 20px" }}>
            {added ? "✓ Added" : <><ShoppingCart size={14}/>Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Section ───────────────────────────────────────────────────────────
function ProductSection({ products, title, eyebrow, icon:Icon, bg="#faf8f4" }) {
  return (
    <section style={{ padding:"96px 0",background:bg }}>
      <div style={{ maxWidth:"1260px",margin:"0 auto",padding:"0 40px" }}>
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",
          marginBottom:"52px",flexWrap:"wrap",gap:"14px" }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"9px" }}>
              {Icon && <Icon size={15} color="#8B6A3D"/>}
              <span style={{ fontSize:"11px",fontWeight:"700",color:"#8B6A3D",textTransform:"uppercase",
                letterSpacing:"0.12em",fontFamily:"var(--body)" }}>{eyebrow}</span>
            </div>
            <h2 style={{ margin:0,fontSize:"clamp(26px,3.5vw,40px)",fontWeight:"400",color:"#1a1208",
              fontFamily:"var(--display)",letterSpacing:"-0.02em" }}>{title}</h2>
          </div>
          <a href="/shop" style={{ display:"inline-flex",alignItems:"center",gap:"6px",color:"#8B6A3D",
            textDecoration:"none",fontSize:"13px",fontWeight:"600",fontFamily:"var(--body)",
            borderBottom:"1px solid #d4c5a9",paddingBottom:"2px" }}>
            View all <ArrowRight size={13}/>
          </a>
        </div>
        {products.length>0 ? (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"24px" }}>
            {products.map(item=><PCard key={item.id} item={item} onAddToCart={()=>{}}/>)}
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"56px",color:"#a89880",background:"white",
            borderRadius:"16px",border:"1px dashed #e0d8cc",fontFamily:"var(--body)" }}>
            No products available yet.
          </div>
        )}
      </div>
    </section>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ icon, title, body, tags, tagColor, tagBg, tagBorder, cta, href, accentFrom, accentTo, onClick }) {
  return (
    <div className="ecard" onClick={onClick}
      style={{ borderRadius:"20px",overflow:"hidden",border:"1px solid #ede8df",
        background:"white",cursor:onClick?"pointer":"default",transition:"all 0.3s ease" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-7px)"; e.currentTarget.style.boxShadow="0 24px 56px rgba(26,18,8,0.1)"; e.currentTarget.style.borderColor="#d4c5a9"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#ede8df"; }}>
      <div style={{ height:"3px",background:`linear-gradient(90deg,${accentFrom},${accentTo})` }}/>
      <div style={{ padding:"34px" }}>
        <div style={{ width:"46px",height:"46px",background:"#1a1208",borderRadius:"12px",
          display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px" }}>
          {icon}
        </div>
        <h3 style={{ fontSize:"21px",fontWeight:"400",color:"#1a1208",marginBottom:"10px",
          fontFamily:"var(--display)" }}>{title}</h3>
        <p style={{ fontSize:"14px",color:"#7a6a55",lineHeight:"1.7",marginBottom:"20px",
          fontFamily:"var(--body)" }}>{body}</p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"24px" }}>
          {tags.map(t=>(
            <span key={t} style={{ background:tagBg,color:tagColor,padding:"4px 12px",
              borderRadius:"20px",fontSize:"11px",fontWeight:"500",border:`1px solid ${tagBorder}`,
              fontFamily:"var(--body)" }}>{t}</span>
          ))}
        </div>
        <a href={href||"#"} style={{ display:"inline-flex",alignItems:"center",gap:"6px",
          color:tagColor,textDecoration:"none",fontSize:"13px",fontWeight:"600",fontFamily:"var(--body)" }}>
          {cta} <ArrowRight size={13}/>
        </a>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredItems, setFeaturedItems] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [promos, setPromos] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { addToCart, getCartCount } = useCart();
  const cartCount = getCartCount();

  useEffect(()=>{
    const fn = ()=>setNavScrolled(window.scrollY>50);
    window.addEventListener("scroll",fn); return ()=>window.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        setLoading(true);
        const snap = await getDocs(query(collection(db,"products"),orderBy("createdAt","desc")));
        const prods = snap.docs.map(d=>({id:d.id,...d.data()}));
        setAllProducts(prods);
        setFeaturedItems(prods.slice(0,4));
        setTopSelling(prods.filter(p=>p.salesCount>0).sort((a,b)=>(b.salesCount||0)-(a.salesCount||0)).slice(0,4));
        setPromos(prods.filter(p=>p.onPromotion===true).slice(0,4));
        const occ=new Set(); prods.forEach(p=>(p.occasions||[]).forEach(o=>occ.add(o)));
        setOccasions([...occ].slice(0,5));
        const cul=new Set(); prods.forEach(p=>{ if(p.culture) cul.add(p.culture); });
        setCultures([...cul].slice(0,8));
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    })();
  },[]);

  const handleImgUpload = ()=>{
    const fi=document.createElement("input"); fi.type="file"; fi.accept="image/*";
    fi.onchange=e=>{
      const file=e.target.files[0]; if(!file) return;
      if(file.size>5*1024*1024){ alert("Max 5MB"); return; }
      const r=new FileReader();
      r.onload=ev=>{ sessionStorage.setItem("searchImage",ev.target.result); sessionStorage.setItem("searchImageName",file.name); sessionStorage.setItem("searchImageType",file.type); router.push("/image-search"); };
      r.readAsDataURL(file);
    }; fi.click();
  };

  const handleAddToCart = (item)=>{
    addToCart(item);
    const n=document.createElement("div");
    n.textContent=`✓ "${item.name}" added to cart`;
    n.style.cssText=`position:fixed;bottom:28px;right:28px;background:#1a1208;color:#d4a855;padding:13px 20px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.35);z-index:3000;font-family:system-ui,sans-serif;font-size:13px;font-weight:500;border:1px solid #8B6A3D;animation:slideR 0.35s ease;`;
    document.body.appendChild(n);
    setTimeout(()=>{ n.style.opacity="0"; n.style.transition="opacity 0.3s"; setTimeout(()=>n.remove(),300); },2800);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        :root {
          --display:'Cormorant Garamond',Georgia,serif;
          --body:'DM Sans',system-ui,sans-serif;
          --gold:#d4a855; --gold2:#8B6A3D; --dark:#1a1208;
          --cream:#f5edd8; --muted:#a89880; --bg:#faf8f4;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;}
        body{font-family:var(--body);background:var(--bg);-webkit-font-smoothing:antialiased;}

        /* shared buttons */
        .btn-sm{border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;
          font-family:var(--body);padding:10px 19px;transition:all 0.18s;}
        .btn-sm:hover{opacity:0.85;transform:translateY(-1px);}

        /* product card */
        .pcard{background:white;border-radius:20px;overflow:hidden;border:1px solid #ede8df;transition:all 0.3s ease;}
        .pcard:hover{transform:translateY(-6px);box-shadow:0 24px 56px rgba(26,18,8,0.1);border-color:#d4c5a9;}
        .pcard:hover .pcard-img{transform:scale(1.04);}
        .pcard-img{transition:transform 0.45s ease;}

        /* rec card */
        .rec-card{transition:all 0.25s ease;}
        .rec-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,18,8,0.1);}
        .rec-card:hover .ri{transform:scale(1.03);}
        .ri{transition:transform 0.4s;}

        /* spinner */
        .spin{width:16px;height:16px;border:2px solid rgba(212,168,85,0.2);
          border-top-color:#d4a855;border-radius:50%;animation:spinA 0.75s linear infinite;}

        @keyframes spinA{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes cardUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.96)translateY(14px)}to{opacity:1;transform:scale(1)translateY(0)}}
        @keyframes heroIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes imgFade{from{opacity:0}to{opacity:1}}

        @media(max-width:820px){
          .nav-links{display:none!important;}
          .hero-content{max-width:100%!important;}
          .entry-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      <div style={{ minHeight:"100vh" }}>

        {/* loader */}
        {loading && (
          <div style={{ position:"fixed",inset:0,background:"rgba(250,248,244,0.97)",
            backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",
            justifyContent:"center" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:"42px",height:"42px",border:"3px solid #e8e2d9",
                borderTopColor:"#8B6A3D",borderRadius:"50%",animation:"spinA 1s linear infinite",
                margin:"0 auto 18px" }}/>
              <p style={{ color:"#a89880",fontSize:"14px",fontFamily:"var(--body)" }}>
                Loading iSiko Studio…
              </p>
            </div>
          </div>
        )}

     

        {/* ══════════════════════════════════════════════════════════════════
            HERO — full-bleed photo backdrop
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ position:"relative",minHeight:"100vh",display:"flex",
          alignItems:"center",overflow:"hidden" }}>

          {/* ── Background photo ── */}
          <div style={{ position:"absolute",inset:0,zIndex:0 }}>
            {/* Warm fallback while photo loads */}
            <div style={{ position:"absolute",inset:0,
              background:"linear-gradient(135deg,#1a1208 0%,#2d1f0e 60%,#3d2510 100%)" }}/>

            
            <img
              src="https://i.pinimg.com/originals/3b/93/16/3b931692cec9bf04bf08a71ce98831c4.jpg"
              alt="Vibrant Southern African beadwork and traditional textiles"
              onLoad={()=>setImgLoaded(true)}
              style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                objectPosition:"center 40%",display:"block",
                opacity:imgLoaded?1:0, transition:"opacity 1.4s ease" }}
            />

            {/* Gradient stack for text legibility */}
            {/* Layer 1 — primary left dark */}
            <div style={{ position:"absolute",inset:0,
              background:"linear-gradient(105deg, rgba(6,3,1,0.93) 0%, rgba(12,7,2,0.82) 35%, rgba(10,6,2,0.45) 62%, rgba(8,5,1,0.18) 100%)" }}/>
            {/* Layer 2 — bottom vignette */}
            <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"280px",
              background:"linear-gradient(to top, rgba(6,3,1,0.72), transparent)" }}/>
            {/* Layer 3 — subtle gold radial tint from left */}
            <div style={{ position:"absolute",inset:0,
              background:"radial-gradient(ellipse at 10% 60%, rgba(139,106,61,0.1) 0%, transparent 50%)" }}/>
          </div>

          {/* Decorative concentric rings — top right */}
          <div style={{ position:"absolute",right:"-8%",top:"50%",transform:"translateY(-50%)",
            width:"540px",height:"540px",zIndex:1,opacity:0.07,pointerEvents:"none" }}>
            <svg viewBox="0 0 540 540" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="270" cy="270" r="268" stroke="#d4a855" strokeWidth="0.8"/>
              <circle cx="270" cy="270" r="210" stroke="#d4a855" strokeWidth="0.5"/>
              <circle cx="270" cy="270" r="150" stroke="#d4a855" strokeWidth="0.8"/>
              <circle cx="270" cy="270" r="90"  stroke="#d4a855" strokeWidth="0.5"/>
              <line x1="2"   y1="270" x2="538" y2="270" stroke="#d4a855" strokeWidth="0.5"/>
              <line x1="270" y1="2"   x2="270" y2="538" stroke="#d4a855" strokeWidth="0.5"/>
              <line x1="80"  y1="80"  x2="460" y2="460" stroke="#d4a855" strokeWidth="0.5"/>
              <line x1="460" y1="80"  x2="80"  y2="460" stroke="#d4a855" strokeWidth="0.5"/>
            </svg>
          </div>

          {/* ── Hero text ── */}
          <div style={{ position:"relative",zIndex:2,maxWidth:"1260px",margin:"0 auto",
            padding:"124px 40px 84px",width:"100%" }}>
            <div className="hero-content" style={{ maxWidth:"600px",animation:"heroIn 0.95s ease 0.2s both" }}>

              {/* eyebrow */}
              <div style={{ display:"inline-flex",alignItems:"center",gap:"9px",
                background:"rgba(212,168,85,0.09)",border:"1px solid rgba(212,168,85,0.26)",
                borderRadius:"40px",padding:"6px 17px",marginBottom:"30px" }}>
                <div style={{ width:"5px",height:"5px",borderRadius:"50%",background:"#d4a855" }}/>
                <span style={{ fontSize:"10px",fontWeight:"600",color:"#d4a855",
                  letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"var(--body)" }}>
                  Southern African Heritage
                </span>
              </div>

              {/* headline */}
              <h1 style={{ fontSize:"clamp(44px,6.5vw,82px)",fontWeight:"400",lineHeight:"1.06",
                marginBottom:"24px",color:"#f5edd8",fontFamily:"var(--display)",
                letterSpacing:"-0.025em" }}>
                The right attire,{" "}
                <em style={{ color:"#d4a855",fontStyle:"italic" }}>for every<br/>occasion</em>
              </h1>

              <p style={{ fontSize:"17px",lineHeight:"1.8",color:"rgba(245,237,216,0.62)",
                marginBottom:"50px",fontWeight:"300",fontFamily:"var(--body)",maxWidth:"480px" }}>
                Culturally appropriate clothing and jewellery for Southern African ceremonies — guided by tradition, matched by AI.
              </p>

              {/* ── Search card ── */}
              <div style={{ background:"rgba(250,248,244,0.97)",borderRadius:"18px",
                padding:"26px 28px",backdropFilter:"blur(20px)",
                border:"1px solid rgba(212,168,85,0.16)",
                boxShadow:"0 28px 72px rgba(0,0,0,0.48)",
                animation:"heroIn 0.95s ease 0.45s both" }}>

                <label style={{ display:"block",fontSize:"10px",fontWeight:"700",color:"#8B6A3D",
                  textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"var(--body)",marginBottom:"11px" }}>
                  Describe your occasion
                </label>

                <textarea
                  placeholder="I'm attending a Zulu wedding as a guest and need something culturally respectful…"
                  value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  style={{ width:"100%",minHeight:"86px",padding:"12px 15px",fontSize:"15px",
                    border:"1.5px solid #e0d8cc",borderRadius:"11px",fontFamily:"var(--body)",
                    resize:"none",outline:"none",color:"#1a1208",lineHeight:"1.6",
                    transition:"border-color 0.2s",boxSizing:"border-box",marginBottom:"14px",background:"white" }}
                  onFocus={e=>e.target.style.borderColor="#8B6A3D"}
                  onBlur={e=>e.target.style.borderColor="#e0d8cc"}/>

                <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:"10px" }}>
                  <button onClick={()=>setShowAI(true)}
                    style={{ background:"linear-gradient(135deg,#1a1208,#2d1f0e)",color:"#d4a855",
                      border:"none",padding:"13px 20px",borderRadius:"11px",fontSize:"14px",fontWeight:"600",
                      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"9px",
                      fontFamily:"var(--body)",transition:"all 0.2s",letterSpacing:"0.01em" }}
                    onMouseEnter={e=>e.currentTarget.style.background="linear-gradient(135deg,#8B6A3D,#6b5030)"}
                    onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,#1a1208,#2d1f0e)"}>
                    <Sparkles size={16}/>Get AI Recommendations<ArrowRight size={14}/>
                  </button>
                  <button onClick={handleImgUpload}
                    style={{ background:"white",color:"#1a1208",border:"1.5px solid #e0d8cc",
                      borderRadius:"11px",padding:"13px 16px",cursor:"pointer",fontFamily:"var(--body)",
                      fontSize:"13px",fontWeight:"600",display:"flex",alignItems:"center",gap:"6px",
                      whiteSpace:"nowrap",transition:"all 0.2s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="#8B6A3D"; e.currentTarget.style.color="#8B6A3D"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e0d8cc"; e.currentTarget.style.color="#1a1208"; }}>
                    <Camera size={14}/>Image
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <div style={{ position:"absolute",bottom:"30px",left:"50%",transform:"translateX(-50%)",
            zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:"7px",
            animation:"heroIn 1s ease 1.2s both",opacity:0.45 }}>
            <span style={{ fontSize:"9px",color:"#d4a855",letterSpacing:"0.17em",
              textTransform:"uppercase",fontFamily:"var(--body)" }}>scroll</span>
            <div style={{ width:"1px",height:"42px",background:"linear-gradient(to bottom,#d4a855,transparent)" }}/>
          </div>
        </section>

        {/* ── stats bar ── */}
        <div style={{ background:"#1a1208",borderBottom:"1px solid rgba(139,106,61,0.18)" }}>
          <div style={{ maxWidth:"1260px",margin:"0 auto",padding:"0 40px",
            display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))" }}>
            {[
              { val:cultures.length||"8+", label:"Cultures" },
              { val:occasions.length||"10+", label:"Occasions" },
              { val:allProducts.length||"100+", label:"Authentic items" },
              { val:"AI", label:"Smart matching" },
            ].map(({ val, label })=>(
              <div key={label} style={{ padding:"20px 24px",textAlign:"center",
                borderRight:"1px solid rgba(139,106,61,0.13)" }}>
                <div style={{ fontSize:"24px",fontWeight:"400",color:"#d4a855",
                  fontFamily:"var(--display)",marginBottom:"2px" }}>{val}</div>
                <div style={{ fontSize:"10px",color:"rgba(245,237,216,0.38)",
                  fontFamily:"var(--body)",letterSpacing:"0.05em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ENTRY POINTS ── */}
        <section style={{ padding:"104px 0",background:"white" }}>
          <div style={{ maxWidth:"1260px",margin:"0 auto",padding:"0 40px" }}>
            <div style={{ textAlign:"center",marginBottom:"60px" }}>
              <span style={{ fontSize:"10px",fontWeight:"700",color:"#8B6A3D",textTransform:"uppercase",
                letterSpacing:"0.14em",fontFamily:"var(--body)" }}>How to discover</span>
              <h2 style={{ margin:"10px 0 0",fontSize:"clamp(28px,4vw,48px)",fontWeight:"400",
                color:"#1a1208",fontFamily:"var(--display)",letterSpacing:"-0.02em" }}>
                Find your perfect piece
              </h2>
            </div>

            <div className="entry-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"22px" }}>
              <EntryCard
                icon={<Calendar size={21} color="#d4a855"/>}
                accentFrom="#d4a855" accentTo="#8B6A3D"
                title="Browse by Occasion"
                body="Ceremonies, weddings, initiations — attire chosen for the specific event and your role in it."
                tags={occasions.length>0?occasions:["Wedding","Umemulo","Lobola"]}
                tagColor="#8B6A3D" tagBg="#fdf8f0" tagBorder="#ede0cc"
                cta="Explore occasions" href="/shop?filter=occasion"
              />
              <EntryCard
                icon={<Globe2 size={21} color="#2C5C6F"/>}
                accentFrom="#2C5C6F" accentTo="#1E4250"
                title="Browse by Culture"
                body="Explore authentic attire and jewellery from specific cultural traditions across Southern Africa."
                tags={cultures.length>0?cultures:["Xhosa","Zulu","Sotho","Ndebele"]}
                tagColor="#2C5C6F" tagBg="#f0f8ff" tagBorder="#c8def0"
                cta="Explore cultures" href="/shop?filter=culture"
              />
              {/* Image search card */}
              <div className="ecard" onClick={handleImgUpload}
                style={{ borderRadius:"20px",overflow:"hidden",border:"1.5px dashed #d4c5a9",
                  background:"linear-gradient(145deg,#fdf9f2,#faf5ea)",cursor:"pointer",
                  transition:"all 0.3s ease" }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-7px)"; e.currentTarget.style.boxShadow="0 24px 56px rgba(26,18,8,0.1)"; e.currentTarget.style.borderColor="#8B6A3D"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#d4c5a9"; }}>
                <div style={{ height:"3px",background:"linear-gradient(90deg,#8B6A3D,#d4a855)" }}/>
                <div style={{ padding:"34px" }}>
                  <div style={{ width:"46px",height:"46px",background:"#1a1208",borderRadius:"12px",
                    display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px" }}>
                    <Camera size={21} color="#d4a855"/>
                  </div>
                  <h3 style={{ fontSize:"21px",fontWeight:"400",color:"#1a1208",marginBottom:"10px",
                    fontFamily:"var(--display)" }}>Search by Image</h3>
                  <p style={{ fontSize:"14px",color:"#7a6a55",lineHeight:"1.7",marginBottom:"22px",
                    fontFamily:"var(--body)" }}>
                    Have a photo of a pattern or piece you love? Upload it and our AI will find similar items.
                  </p>
                  <div style={{ border:"1.5px dashed #d4c5a9",borderRadius:"13px",padding:"26px",
                    textAlign:"center",background:"white",marginBottom:"22px" }}>
                    <Upload size={25} color="#8B6A3D" style={{ display:"block",margin:"0 auto 9px" }}/>
                    <div style={{ fontSize:"14px",fontWeight:"600",color:"#8B6A3D",marginBottom:"3px",fontFamily:"var(--body)" }}>
                      Click to upload
                    </div>
                    <div style={{ fontSize:"11px",color:"#a89880",fontFamily:"var(--body)" }}>JPG, PNG · Max 5MB</div>
                  </div>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:"6px",color:"#8B6A3D",
                    fontSize:"13px",fontWeight:"600",fontFamily:"var(--body)" }}>
                    Try visual search <ArrowRight size={13}/>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product sections ── */}
        {promos.length>0 && <ProductSection products={promos} title="Special Offers" eyebrow="Limited time" icon={Tag} bg="#faf8f4"/>}
        {topSelling.length>0 && <ProductSection products={topSelling} title="Most Loved" eyebrow="Popular choices" icon={TrendingUp} bg="white"/>}
        <ProductSection products={featuredItems} title="Featured Collection" eyebrow="Curated for you" icon={Sparkles} bg="#faf8f4"/>

        {/* ── TRUST ── */}
        <section style={{ padding:"104px 0",background:"#1a1208" }}>
          <div style={{ maxWidth:"1260px",margin:"0 auto",padding:"0 40px" }}>
            <div style={{ textAlign:"center",marginBottom:"60px" }}>
              <h2 style={{ margin:0,fontSize:"clamp(28px,4vw,48px)",fontWeight:"400",color:"#f5edd8",
                fontFamily:"var(--display)",letterSpacing:"-0.02em" }}>Why iSiko Studio</h2>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:"2px",
              border:"1px solid rgba(139,106,61,0.18)",borderRadius:"18px",overflow:"hidden" }}>
              {[
                { icon:Scissors, title:"Authentic Design",
                  body:"Carefully curated attire inspired by real cultural practices, made by artisans across Southern Africa." },
                { icon:Brain, title:"AI Recommendations",
                  body:"Our AI understands cultural context to help you choose attire that is respectful, appropriate, and beautiful." },
                { icon:Users, title:"Community Focused",
                  body:"Every purchase supports local artisans and contributes to preserving cultural heritage for future generations." },
              ].map(({ icon:Icon, title, body }, i)=>(
                <div key={title} style={{ padding:"46px 38px",
                  background:i===1?"rgba(139,106,61,0.09)":"transparent",
                  borderRight:i<2?"1px solid rgba(139,106,61,0.14)":"none" }}>
                  <div style={{ width:"42px",height:"42px",border:"1px solid rgba(212,168,85,0.22)",
                    borderRadius:"11px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px" }}>
                    <Icon size={19} color="#d4a855"/>
                  </div>
                  <h4 style={{ fontSize:"19px",fontWeight:"400",color:"#f5edd8",marginBottom:"11px",
                    fontFamily:"var(--display)" }}>{title}</h4>
                  <p style={{ fontSize:"13px",color:"rgba(245,237,216,0.52)",lineHeight:"1.8",fontFamily:"var(--body)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background:"#0d0902",color:"white",padding:"64px 40px 26px",
          borderTop:"1px solid rgba(139,106,61,0.12)" }}>
          <div style={{ maxWidth:"1260px",margin:"0 auto" }}>
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.5fr",gap:"44px",marginBottom:"52px" }}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:"11px",marginBottom:"18px" }}>
                  <div style={{ width:"36px",height:"36px",background:"linear-gradient(135deg,#d4a855,#8B6A3D)",
                    borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",
                    color:"white",fontSize:"13px",fontFamily:"var(--display)",fontWeight:"500" }}>iS</div>
                  <div>
                    <div style={{ fontSize:"16px",fontWeight:"500",fontFamily:"var(--display)" }}>iSiko Studio</div>
                    <div style={{ fontSize:"8px",color:"#8B6A3D",letterSpacing:"0.2em",
                      textTransform:"uppercase",fontFamily:"var(--body)",marginTop:"-2px" }}>Cultural Heritage</div>
                  </div>
                </div>
                <p style={{ color:"rgba(255,255,255,0.35)",fontSize:"13px",lineHeight:"1.75",
                  fontFamily:"var(--body)",maxWidth:"250px" }}>
                  Culturally respectful traditional attire for Southern African ceremonies. "iSiko" means "Culture."
                </p>
              </div>
              {[
                { heading:"Explore", links:["Shop","Occasions","Cultures","Image Search","About Us"] },
                { heading:"Support", links:["Contact Us","FAQs","Shipping","Returns","Privacy"] },
              ].map(({ heading, links })=>(
                <div key={heading}>
                  <h4 style={{ fontSize:"10px",fontWeight:"700",marginBottom:"18px",color:"rgba(255,255,255,0.45)",
                    textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"var(--body)" }}>{heading}</h4>
                  <ul style={{ listStyle:"none",padding:0 }}>
                    {links.map(l=>(
                      <li key={l} style={{ marginBottom:"10px" }}>
                        <a href="#" style={{ color:"rgba(255,255,255,0.32)",textDecoration:"none",
                          fontSize:"13px",fontFamily:"var(--body)",transition:"color 0.18s" }}
                          onMouseEnter={e=>e.currentTarget.style.color="#d4a855"}
                          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.32)"}>
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h4 style={{ fontSize:"10px",fontWeight:"700",marginBottom:"18px",color:"rgba(255,255,255,0.45)",
                  textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"var(--body)" }}>Newsletter</h4>
                <p style={{ color:"rgba(255,255,255,0.32)",fontSize:"13px",marginBottom:"15px",
                  lineHeight:"1.65",fontFamily:"var(--body)" }}>
                  Cultural insights and new arrivals, monthly.
                </p>
                <div style={{ display:"flex",gap:"8px" }}>
                  <input type="email" placeholder="Your email"
                    style={{ flex:1,padding:"11px 13px",borderRadius:"10px",
                      border:"1px solid rgba(139,106,61,0.22)",background:"rgba(255,255,255,0.03)",
                      color:"white",fontSize:"13px",outline:"none",fontFamily:"var(--body)" }}/>
                  <button style={{ background:"linear-gradient(135deg,#d4a855,#8B6A3D)",border:"none",
                    padding:"11px 14px",borderRadius:"10px",cursor:"pointer" }}>
                    <ArrowRight size={14} color="white"/>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:"20px",
              display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px" }}>
              <p style={{ color:"rgba(255,255,255,0.18)",fontSize:"12px",margin:0,fontFamily:"var(--body)" }}>
                © 2024 iSiko Studio. All rights reserved.
              </p>
              <p style={{ color:"rgba(255,255,255,0.18)",fontSize:"12px",margin:0,fontFamily:"var(--body)" }}>
                Made with care for Southern African heritage
              </p>
            </div>
          </div>
        </footer>
      </div>

      <AIModal isOpen={showAI} onClose={()=>setShowAI(false)}
        searchQuery={searchQuery} allProducts={allProducts} onAddToCart={handleAddToCart}/>
    </>
  );
}