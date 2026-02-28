"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/src/Context/AuthContext';
import { db } from '@/src/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import {
  Package, Star, ChevronDown, ChevronUp, Search,
  Filter, ArrowLeft, Truck, CheckCircle, Clock,
  XCircle, RotateCcw, MessageSquare, Eye, ShoppingBag,
  MapPin, Calendar, CreditCard, ChevronRight, Sparkles,
  ThumbsUp, Heart, AlertCircle
} from "lucide-react";

/* ── Status config ─────────────────────────────────────────────── */
const STATUS = {
  pending:    { label: "Processing",  color: "#E8A045", bg: "#FEF6E7", icon: Clock,        step: 1 },
  confirmed:  { label: "Confirmed",   color: "#1B2A4A", bg: "#E8ECF4", icon: CheckCircle,  step: 2 },
  shipped:    { label: "Shipped",     color: "#2D5016", bg: "#EAF0E4", icon: Truck,        step: 3 },
  delivered:  { label: "Delivered",   color: "#C4622D", bg: "#FBF0E8", icon: CheckCircle,  step: 4 },
  cancelled:  { label: "Cancelled",   color: "#E74C3C", bg: "#FEF2F2", icon: XCircle,      step: 0 },
  returned:   { label: "Returned",    color: "#7A6855", bg: "#F5F0E8", icon: RotateCcw,    step: 0 },
};

const STEPS = ["Order Placed", "Confirmed", "Shipped", "Delivered"];

/* ── Star Rating Component ─────────────────────────────────────── */
function StarRating({ value, onChange, readonly = false, size = 22 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: "none", border: "none", cursor: readonly ? "default" : "pointer",
            padding: 0, lineHeight: 1,
            transform: (!readonly && hovered >= n) ? "scale(1.2)" : "scale(1)",
            transition: "transform 0.15s",
          }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={(hovered || value) >= n ? "#E8A045" : "none"}
              stroke={(hovered || value) >= n ? "#E8A045" : "#D0C4B0"}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ── Review Modal ──────────────────────────────────────────────── */
function ReviewModal({ item, orderId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const TAGS = ["True to size", "Great quality", "Beautiful colour", "Fast shipping",
                "Culturally authentic", "Worth the price", "Would gift this", "Exceeded expectations"];

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await onSubmit({ rating, review, tags, itemId: item.id, orderId });
    setSubmitting(false);
    onClose();
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(26,17,10,0.82)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}>
      <div style={{
        background: "#FAF6EF", borderRadius: 20, width: "100%", maxWidth: 520,
        overflow: "hidden", animation: "modalIn 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1A110A,#2d1f0e)",
          padding: "24px 28px",
          borderBottom: "2px solid #8B6A3D",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Sparkles size={16} color="#E8A045"/>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#E8A045",
              fontFamily: "'DM Sans',sans-serif" }}>RATE YOUR PURCHASE</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: "#F5EDD8",
            fontFamily: "'Cormorant Garamond',serif" }}>{item.name}</h3>
        </div>

        <div style={{ padding: "28px" }}>
          {/* Product preview */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, alignItems: "center" }}>
            <div style={{
              width: 68, height: 68, borderRadius: 12, overflow: "hidden",
              background: "#EDE0CC", flexShrink: 0,
            }}>
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28 }}>🎁</div>}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, color: "#7A6855", fontFamily: "'DM Sans',sans-serif" }}>
                How would you rate this item?
              </p>
              <div style={{ marginTop: 8 }}>
                <StarRating value={rating} onChange={setRating} size={28}/>
              </div>
              {rating > 0 && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#C4622D",
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                  {["","Poor","Fair","Good","Great","Excellent!"][rating]}
                </p>
              )}
            </div>
          </div>

          {/* Quick tags */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#8B6A3D",
              letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
              Quick tags
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TAGS.map(t => (
                <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t])}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${tags.includes(t) ? "#C4622D" : "#EDE0CC"}`,
                    background: tags.includes(t) ? "#FBF0E8" : "white",
                    color: tags.includes(t) ? "#C4622D" : "#7A6855",
                    cursor: "pointer", transition: "all 0.18s",
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                  {tags.includes(t) ? "✓ " : ""}{t}
                </button>
              ))}
            </div>
          </div>

          {/* Written review */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#8B6A3D",
              letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
              Your review (optional)
            </p>
            <textarea value={review} onChange={e => setReview(e.target.value)}
              placeholder="Tell others what you loved about this piece…"
              style={{
                width: "100%", minHeight: 90, padding: "12px 14px", fontSize: 14,
                border: "1.5px solid #EDE0CC", borderRadius: 12,
                fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none",
                color: "#1A110A", lineHeight: 1.6, boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#C4622D"}
              onBlur={e => e.target.style.borderColor = "#EDE0CC"}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose}
              style={{
                flex: 1, padding: "13px", border: "1.5px solid #EDE0CC",
                borderRadius: 12, background: "white", color: "#7A6855",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!rating || submitting}
              style={{
                flex: 2, padding: "13px",
                background: !rating ? "#EDE0CC" : "linear-gradient(135deg,#1A110A,#2d1f0e)",
                color: !rating ? "#A89880" : "#E8A045",
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: !rating ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans',sans-serif", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}>
              {submitting ? "Submitting…" : <><ThumbsUp size={15}/>Submit Review</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Order Progress Bar ────────────────────────────────────────── */
function OrderProgress({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  if (status === "cancelled" || status === "returned") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 10,
        background: cfg.bg, color: cfg.color, fontSize: 13, fontWeight: 600,
        fontFamily: "'DM Sans',sans-serif",
      }}>
        <cfg.icon size={15}/> {cfg.label}
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STEPS.map((step, i) => {
          const done = cfg.step > i;
          const active = cfg.step === i + 1;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length-1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: done || active ? "#C4622D" : "#EDE0CC",
                  border: active ? "3px solid #E8A045" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: active ? "0 0 0 4px rgba(232,160,69,0.2)" : "none",
                  transition: "all 0.3s",
                }}>
                  {done ? <CheckCircle size={14} color="white"/> : (
                    <div style={{ width: 8, height: 8, borderRadius: "50%",
                      background: active ? "white" : "#A89880" }}/>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: active || done ? 700 : 400,
                  color: active ? "#C4622D" : done ? "#1A110A" : "#A89880",
                  whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: 0.3,
                }}>{step}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: "0 4px",
                  marginBottom: 18,
                  background: done ? "#C4622D" : "#EDE0CC",
                  transition: "background 0.3s",
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Order Card ────────────────────────────────────────────────── */
function OrderCard({ order, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState(order.reviews || {});
  const cfg = STATUS[order.status] || STATUS.pending;
  const StatusIcon = cfg.icon;

  const date = order.createdAt?.toDate?.() || new Date(order.createdAt?.seconds * 1000) || new Date();
  const dateStr = date.toLocaleDateString("en-ZA", { day:"numeric", month:"short", year:"numeric" });

  return (
    <div style={{
      background: "white", borderRadius: 18,
      border: "1px solid #EDE0CC",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(26,17,10,0.04)",
      transition: "box-shadow 0.25s",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,17,10,0.09)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,17,10,0.04)"}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 22px",
        background: "linear-gradient(135deg,#FAF6EF,#F5EDD8)",
        borderBottom: "1px solid #EDE0CC",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 10, color: "#A89880", fontWeight: 700,
              letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
              Order
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A110A",
              fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.3 }}>
              #{order.id?.slice(-8).toUpperCase()}
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: "#EDE0CC" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7A6855",
            fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            <Calendar size={13}/> {dateStr}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7A6855",
            fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            <Package size={13}/> {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5,
          }}>
            <StatusIcon size={12}/> {cfg.label}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1A110A",
            fontFamily: "'Cormorant Garamond',serif" }}>
            R {(order.total || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Items preview */}
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {(order.items || []).slice(0, 4).map((item, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                width: 68, height: 68, borderRadius: 12, overflow: "hidden",
                border: "1.5px solid #EDE0CC", background: "#FBF0E8",
                flexShrink: 0,
              }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name}
                      style={{ width:"100%",height:"100%",objectFit:"cover" }}
                      onError={e => { e.target.style.display="none"; }}/>
                  : <div style={{ height:"100%",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:26 }}>
                      {{"Jewellery":"💎","Clothing":"👗","Headwear":"👑","Accessories":"👜","Footwear":"👞"}[item.category]||"🎁"}
                    </div>}
              </div>
              {/* Reviewed badge */}
              {reviews[item.id] && (
                <div style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#2D5016", borderRadius: "50%",
                  width: 18, height: 18, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  border: "2px solid white",
                }}>
                  <Star size={9} color="white" fill="white"/>
                </div>
              )}
            </div>
          ))}
          {(order.items || []).length > 4 && (
            <div style={{
              width: 68, height: 68, borderRadius: 12,
              background: "#F5EDD8", border: "1.5px solid #EDE0CC",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#8B6A3D",
              fontFamily: "'DM Sans',sans-serif",
            }}>
              +{order.items.length - 4}
            </div>
          )}
        </div>

        {/* Progress */}
        <OrderProgress status={order.status}/>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 16, display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#C4622D", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif", padding: 0,
          }}>
          {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
          {expanded ? "Hide details" : "View details & rate items"}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{
          borderTop: "1px solid #EDE0CC",
          padding: "22px",
          animation: "fadeIn 0.25s ease",
        }}>
          {/* Delivery info */}
          {order.shippingAddress && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "14px 16px", borderRadius: 12, background: "#FAF6EF",
              marginBottom: 20, border: "1px solid #EDE0CC",
            }}>
              <MapPin size={16} color="#C4622D" style={{ marginTop: 2, flexShrink: 0 }}/>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#8B6A3D",
                  letterSpacing: 1.5, textTransform: "uppercase",
                  fontFamily: "'DM Sans',sans-serif", marginBottom: 3 }}>Delivery address</p>
                <p style={{ margin: 0, fontSize: 14, color: "#1A110A",
                  fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          )}

          {/* Items list with rating */}
          <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#8B6A3D",
            letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
            Items in this order
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(order.items || []).map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 14,
                border: "1px solid #EDE0CC", background: "#FDFAF5",
                flexWrap: "wrap",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 10, overflow: "hidden",
                  background: "#FBF0E8", flexShrink: 0,
                }}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name}
                        style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                    : <div style={{ height:"100%",display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:22 }}>🎁</div>}
                </div>

                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1A110A",
                    fontFamily: "'DM Sans',sans-serif" }}>{item.name}</p>
                  {item.culture && (
                    <span style={{
                      fontSize: 11, color: "#C4622D", background: "#FBF0E8",
                      padding: "2px 8px", borderRadius: 8, fontWeight: 500,
                      fontFamily: "'DM Sans',sans-serif", display: "inline-block", marginTop: 4,
                    }}>{item.culture}</span>
                  )}
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7A6855",
                    fontFamily: "'DM Sans',sans-serif" }}>
                    Qty: {item.quantity} · R {((item.salePrice || item.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Rate button / existing rating */}
                <div style={{ flexShrink: 0 }}>
                  {reviews[item.id] ? (
                    <div style={{ textAlign: "center" }}>
                      <StarRating value={reviews[item.id].rating} readonly size={16}/>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#2D5016",
                        fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Reviewed ✓</p>
                    </div>
                  ) : order.status === "delivered" ? (
                    <button onClick={() => onReview(item, order.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 10,
                        background: "linear-gradient(135deg,#1A110A,#2d1f0e)",
                        color: "#E8A045", border: "none",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif", transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      <Star size={13}/> Rate Item
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#A89880",
                      fontFamily: "'DM Sans',sans-serif" }}>
                      Delivered to rate
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div style={{
            marginTop: 20, padding: "16px 18px", borderRadius: 12,
            background: "#F5EDD8", border: "1px solid #EDE0CC",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { label: "Subtotal", val: `R ${(order.subtotal||0).toFixed(2)}` },
                  { label: "Shipping", val: order.shipping === 0 ? "Free" : `R ${(order.shipping||0).toFixed(2)}` },
                  { label: "Tax", val: `R ${(order.tax||0).toFixed(2)}` },
                ].map(row => (
                  <div key={row.label}>
                    <p style={{ margin: 0, fontSize: 10, color: "#A89880",
                      textTransform: "uppercase", letterSpacing: 1,
                      fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{row.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 14, color: "#1A110A",
                      fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{row.val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: "#A89880",
                  textTransform: "uppercase", letterSpacing: 1,
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Total</p>
                <p style={{ margin: "2px 0 0", fontSize: 20, color: "#C4622D",
                  fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" }}>
                  R {(order.total||0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null); // { item, orderId }

  /* ── Fetch orders ─────────────────────────────────────────────── */
  useEffect(() => {
  if (!user) { router.push("/login?redirect=/orders"); return; }

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, (err) => {
    console.error(err);
    setLoading(false);
  });

  return () => unsubscribe();
}, [user]);
  /* ── Submit review ────────────────────────────────────────────── */
  const handleReviewSubmit = async ({ rating, review, tags, itemId, orderId }) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderData = orders.find(o => o.id === orderId);
      const updatedReviews = { ...(orderData?.reviews || {}), [itemId]: { rating, review, tags, date: new Date() } };
      await updateDoc(orderRef, { reviews: updatedReviews });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, reviews: updatedReviews } : o));
    } catch (e) { console.error(e); }
  };

  /* ── Filter ───────────────────────────────────────────────────── */
  const filtered = orders.filter(o => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch = !search || o.id?.toLowerCase().includes(search.toLowerCase()) ||
      (o.items || []).some(i => i.name?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  /* ── Stats ────────────────────────────────────────────────────── */
  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending: orders.filter(o => ["pending","confirmed","shipped"].includes(o.status)).length,
    spent: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0),
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #FAF6EF; }

        @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes modalIn  { from { opacity:0; transform:scale(0.94)translateY(14px) } to { opacity:1; transform:scale(1)translateY(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        .spin { animation: spin 0.9s linear infinite; }

        .filter-pill {
          padding: 9px 20px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid transparent; transition: all 0.18s;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.5px; white-space: nowrap;
        }
        .filter-pill:hover { opacity: 0.85; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#FAF6EF" }}>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ position:"fixed",inset:0,background:"rgba(250,246,239,0.97)",
            zIndex:1000,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:16 }}>
            <div className="spin" style={{ width:44,height:44,border:"3px solid #EDE0CC",
              borderTopColor:"#C4622D",borderRadius:"50%" }}/>
            <p style={{ color:"#A89880",fontSize:14,fontFamily:"'DM Sans',sans-serif" }}>
              Loading your orders…
            </p>
          </div>
        )}

        {/* ── Hero header ── */}
        <div style={{
          background: "linear-gradient(135deg,#1A110A 0%,#2d1f0e 60%,#3d2510 100%)",
          padding: "48px 40px 40px",
          position: "relative", overflow: "hidden",
        }}>
          {/* decorative rings */}
          <div style={{ position:"absolute",right:-80,top:-80,width:320,height:320,
            borderRadius:"50%",border:"1px solid rgba(232,160,69,0.1)",pointerEvents:"none" }}/>
          <div style={{ position:"absolute",right:-40,top:-40,width:200,height:200,
            borderRadius:"50%",border:"1px solid rgba(232,160,69,0.07)",pointerEvents:"none" }}/>

          <div style={{ maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1 }}>
            <button onClick={() => router.back()}
              style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",
                color:"rgba(245,237,216,0.5)",fontSize:13,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",marginBottom:20,padding:0 }}>
              <ArrowLeft size={14}/> Back
            </button>

            <div style={{ display:"flex",alignItems:"flex-end",
              justifyContent:"space-between",flexWrap:"wrap",gap:20 }}>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                  <ShoppingBag size={14} color="#E8A045"/>
                  <span style={{ fontSize:11,fontWeight:700,letterSpacing:2,
                    color:"#E8A045",fontFamily:"'DM Sans',sans-serif" }}>MY ORDERS</span>
                </div>
                <h1 style={{ fontSize:"clamp(32px,4vw,52px)",fontWeight:400,
                  color:"#F5EDD8",fontFamily:"'Cormorant Garamond',serif",lineHeight:1.1 }}>
                  Order History
                </h1>
                <p style={{ marginTop:8,fontSize:14,color:"rgba(245,237,216,0.5)",
                  fontFamily:"'DM Sans',sans-serif" }}>
                  Track, review and manage your cultural purchases
                </p>
              </div>

              {/* Stats pills */}
              <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                {[
                  { val: stats.total, label: "Orders" },
                  { val: stats.delivered, label: "Delivered" },
                  { val: stats.pending, label: "In Progress" },
                  { val: `R ${stats.spent.toFixed(0)}`, label: "Total Spent" },
                ].map(s => (
                  <div key={s.label} style={{
                    background:"rgba(255,255,255,0.06)",border:"1px solid rgba(232,160,69,0.18)",
                    borderRadius:12,padding:"12px 20px",textAlign:"center",
                    backdropFilter:"blur(8px)",
                  }}>
                    <div style={{ fontSize:22,fontWeight:400,color:"#E8A045",
                      fontFamily:"'Cormorant Garamond',serif" }}>{s.val}</div>
                    <div style={{ fontSize:10,color:"rgba(245,237,216,0.4)",
                      fontFamily:"'DM Sans',sans-serif",fontWeight:600,
                      letterSpacing:1,marginTop:2 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          background:"white",borderBottom:"1px solid #EDE0CC",
          position:"sticky",top:0,zIndex:100,
          boxShadow:"0 4px 16px rgba(26,17,10,0.05)",
        }}>
          <div style={{ maxWidth:1100,margin:"0 auto",padding:"16px 40px",
            display:"flex",gap:16,alignItems:"center",flexWrap:"wrap" }}>

            {/* Search */}
            <div style={{ position:"relative",flex:"1 1 220px",maxWidth:320 }}>
              <Search size={14} color="#A89880" style={{ position:"absolute",left:12,
                top:"50%",transform:"translateY(-50%)" }}/>
              <input type="text" placeholder="Search orders…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width:"100%",padding:"10px 12px 10px 36px",
                  border:"1.5px solid #EDE0CC",borderRadius:10,fontSize:13,
                  fontFamily:"'DM Sans',sans-serif",outline:"none",
                  color:"#1A110A",background:"#FAF6EF",transition:"border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor="#C4622D"}
                onBlur={e => e.target.style.borderColor="#EDE0CC"}
              />
            </div>

            {/* Pills */}
            <div style={{ display:"flex",gap:8,overflowX:"auto",paddingBottom:2 }}>
              {[
                { key:"all",      label:"All Orders" },
                { key:"pending",  label:"Processing" },
                { key:"shipped",  label:"Shipped" },
                { key:"delivered",label:"Delivered" },
                { key:"cancelled",label:"Cancelled" },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className="filter-pill"
                  style={{
                    background: filter === f.key ? "#1A110A" : "transparent",
                    color: filter === f.key ? "#E8A045" : "#7A6855",
                    borderColor: filter === f.key ? "#1A110A" : "#EDE0CC",
                  }}>
                  {f.label}
                  {f.key !== "all" && (
                    <span style={{ marginLeft:6,fontSize:10,opacity:0.7 }}>
                      ({orders.filter(o => f.key === "all" || o.status === f.key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Orders list ── */}
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"40px 40px 80px" }}>

          {!loading && filtered.length === 0 ? (
            /* Empty state */
            <div style={{
              textAlign:"center",padding:"80px 24px",
              background:"white",borderRadius:20,border:"2px dashed #EDE0CC",
            }}>
              <div style={{ width:72,height:72,background:"#FBF0E8",borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 20px",fontSize:32 }}>📦</div>
              <h3 style={{ fontSize:26,fontWeight:400,color:"#1A110A",
                fontFamily:"'Cormorant Garamond',serif",marginBottom:10 }}>
                {search || filter !== "all" ? "No orders match your filters" : "No orders yet"}
              </h3>
              <p style={{ fontSize:14,color:"#A89880",marginBottom:28,
                fontFamily:"'DM Sans',sans-serif" }}>
                {search || filter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Your cultural wardrobe journey starts here"}
              </p>
              <button onClick={() => router.push("/shop")}
                style={{
                  background:"linear-gradient(135deg,#1A110A,#2d1f0e)",
                  color:"#E8A045",border:"none",padding:"14px 32px",borderRadius:12,
                  fontSize:14,fontWeight:600,cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  display:"inline-flex",alignItems:"center",gap:8,
                }}>
                <ShoppingBag size={16}/> Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              {filtered.map((order, i) => (
                <div key={order.id}
                  style={{ animation:`fadeUp 0.5s ease ${i * 0.06}s both` }}>
                  <OrderCard
                    order={order}
                    onReview={(item, orderId) => setReviewTarget({ item, orderId })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Review modal ── */}
      {reviewTarget && (
        <ReviewModal
          item={reviewTarget.item}
          orderId={reviewTarget.orderId}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
}