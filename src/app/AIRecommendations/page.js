"use client";

/**
 * AI Recommendations Component for iSiko Studio
 * 
 * HOW TO INTEGRATE:
 * 1. Copy this file to your project (e.g., src/components/AIRecommendations.jsx)
 * 2. In your Home component, replace the search button's onClick with the new handler (see bottom of this file)
 * 3. Render <AIRecommendationsModal> somewhere in your JSX (see example at bottom)
 * 
 * WHAT CHANGED IN page.jsx:
 * - Import AIRecommendationsModal from this file
 * - Add state: const [showAIModal, setShowAIModal] = useState(false);
 * - Change the "Find Recommendations" button onClick to: () => setShowAIModal(true)
 * - Add <AIRecommendationsModal ... /> before the closing </> tag
 */

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, X, Sparkles, ArrowRight, RotateCcw, Loader } from "lucide-react";

// ─── Utility: call Claude API ─────────────────────────────────────────────────
async function getAIRecommendations(occasion, products) {
  const productList = products
    .slice(0, 30) // limit token usage
    .map((p, i) =>
      `${i + 1}. ID:${p.id} | ${p.name} | Culture:${p.culture || "Various"} | Category:${p.category || "N/A"} | Occasions:${(p.occasions || []).join(", ")} | Price:R${p.price} | ${p.description || ""}`
    )
    .join("\n");

  const prompt = `You are a Southern African cultural attire expert for iSiko Studio, a shop that sells traditional clothing and jewellery.

A customer says: "${occasion}"

Here are the available products:
${productList}

Based on the customer's occasion and cultural context, select the 3-4 most appropriate products. Consider:
- Cultural appropriateness for the occasion
- The customer's role (guest, family member, participant, etc.)
- Dress codes and cultural expectations
- Matching items (e.g., jewellery with clothing)

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "recommendations": [
    { "id": "PRODUCT_ID", "reason": "One sentence explaining why this is appropriate" }
  ],
  "summary": "2-3 sentence paragraph of cultural guidance for this occasion",
  "dressTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Sub-component: Recommendation Card ───────────────────────────────────────
function RecommendationCard({ product, reason, onAddToCart, index }) {
  const [added, setAdded] = useState(false);

  const getCultureColor = (culture) => {
    const map = {
      Xhosa: "#E8F4F8", Zulu: "#F8F4E8", Sotho: "#F4F8E8",
      Ndebele: "#F8E8F4", Tswana: "#E8F8F4", Venda: "#F4E8F8",
    };
    return map[culture] || "#FFF9F0";
  };

  const getTextColor = (culture) => {
    const map = {
      Xhosa: "#2C5C6F", Zulu: "#8B6A3D", Sotho: "#5C6F2C",
      Ndebele: "#6F2C5C", Tswana: "#2C6F5C", Venda: "#5C2C6F",
    };
    return map[culture] || "#8B6A3D";
  };

  const emojiMap = {
    Jewellery: "💎", Clothing: "👗", Headwear: "👑",
    Accessories: "👜", Footwear: "👞",
  };

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
        animation: `cardFadeIn 0.5s ease-out ${index * 0.1}s both`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area */}
      <div
        style={{
          background: getCultureColor(product.culture),
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: "56px",
        }}
      >
        {emojiMap[product.category] || "🎁"}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(255,255,255,0.9)",
            color: getTextColor(product.culture),
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          {product.culture || "Traditional"}
        </div>
        {product.onPromotion && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "linear-gradient(135deg, #E74C3C, #C0392B)",
              color: "white",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            SALE
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>
            {product.name}
          </h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#888", lineHeight: "1.4" }}>
            {product.category}
          </p>
        </div>

        {/* AI reason */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF9F0, #FFF5E6)",
            border: "1px solid #f0e6d6",
            borderRadius: "8px",
            padding: "10px 12px",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <Sparkles size={14} color="#B38B59" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ margin: 0, fontSize: "12px", color: "#6B4E2A", lineHeight: "1.5" }}>
            {reason}
          </p>
        </div>

        {/* Price + CTA */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid #f5f5f5",
          }}
        >
          <div>
            {product.onPromotion && product.originalPrice && (
              <div style={{ textDecoration: "line-through", color: "#bbb", fontSize: "12px" }}>
                R {product.originalPrice.toFixed(2)}
              </div>
            )}
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1A1A1A" }}>
              R {product.price?.toFixed(2) || "0.00"}
            </div>
          </div>
          <button
            onClick={handleAdd}
            style={{
              background: added
                ? "linear-gradient(135deg, #2E8B57, #228B4A)"
                : "linear-gradient(135deg, #B38B59, #8B6A3D)",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            {added ? (
              <>✓ Added</>
            ) : (
              <>
                <ShoppingCart size={14} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal Component ──────────────────────────────────────────────────────
export function AIRecommendationsModal({ isOpen, onClose, searchQuery, allProducts, onAddToCart }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | results | error
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const overlayRef = useRef(null);

  // Sync query from parent
  useEffect(() => {
    if (searchQuery) setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPhase("idle");
        setResults(null);
        setError("");
      }, 300);
    }
  }, [isOpen]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSearch = async () => {
    if (!localQuery.trim()) return;
    setPhase("loading");
    setError("");

    try {
      const aiResult = await getAIRecommendations(localQuery, allProducts);

      // Map recommended IDs back to full product objects
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
      setError("Couldn't get recommendations right now. Please try again.");
      setPhase("error");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spinAI {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 2000,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        {/* Modal */}
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "860px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
            animation: "modalSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
              padding: "28px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #B38B59, #8B6A3D)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={16} color="white" />
                </div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "white", fontFamily: "'Crimson Pro', serif" }}>
                  AI Attire Advisor
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
                Describe your occasion and we'll find culturally appropriate attire
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "10px",
                padding: "8px",
                cursor: "pointer",
                color: "white",
                display: "flex",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "32px" }}>
            {/* Search Input */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#555", marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Tell us about your occasion
              </label>
              <textarea
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="E.g. I'm a guest at a Zulu traditional wedding next month and need to dress respectfully as an outsider..."
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSearch(); }}
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "16px",
                  fontSize: "15px",
                  border: "2px solid #e8e8e8",
                  borderRadius: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  color: "#1A1A1A",
                  lineHeight: "1.6",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#B38B59")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e8e8")}
              />
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#aaa" }}>
                Tip: Include your culture, role, and event type for better results · Ctrl+Enter to search
              </p>
            </div>

            <button
              onClick={handleSearch}
              disabled={phase === "loading" || !localQuery.trim()}
              style={{
                width: "100%",
                background: phase === "loading"
                  ? "#ccc"
                  : "linear-gradient(135deg, #B38B59 0%, #8B6A3D 100%)",
                color: "white",
                border: "none",
                padding: "16px",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: phase === "loading" ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.2s",
                boxShadow: phase === "loading" ? "none" : "0 4px 16px rgba(179,139,89,0.3)",
              }}
            >
              {phase === "loading" ? (
                <>
                  <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spinAI 0.8s linear infinite" }} />
                  Analyzing your occasion...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Get AI Recommendations
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {/* ── Loading State ── */}
            {phase === "loading" && (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 1.5s ease-in-out infinite" }}>🧵</div>
                <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600", color: "#1A1A1A" }}>
                  Consulting cultural knowledge...
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
                  Finding the most appropriate attire for your occasion
                </p>
              </div>
            )}

            {/* ── Error State ── */}
            {phase === "error" && (
              <div
                style={{
                  marginTop: "24px",
                  background: "#FFF3CD",
                  border: "1px solid #FFEAA7",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 12px", color: "#856404", fontSize: "15px" }}>{error}</p>
                <button
                  onClick={handleSearch}
                  style={{
                    background: "#B38B59",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <RotateCcw size={14} />
                  Try Again
                </button>
              </div>
            )}

            {/* ── Results ── */}
            {phase === "results" && results && (
              <div style={{ marginTop: "32px" }}>
                {/* Cultural Summary */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "28px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Sparkles size={16} color="#B38B59" />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#B38B59", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      Cultural Guidance
                    </span>
                  </div>
                  <p style={{ margin: "0 0 16px", fontSize: "15px", color: "rgba(255,255,255,0.9)", lineHeight: "1.7" }}>
                    {results.summary}
                  </p>

                  {results.dressTips && results.dressTips.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {results.dressTips.map((tip, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: "20px", height: "20px", background: "#B38B59", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "white", fontWeight: "700", flexShrink: 0, marginTop: "1px" }}>
                            {i + 1}
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Grid */}
                <div>
                  <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Crimson Pro', serif" }}>
                    {results.enrichedProducts.length > 0
                      ? `${results.enrichedProducts.length} Recommended Items`
                      : "Recommendations"}
                  </h3>

                  {results.enrichedProducts.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {results.enrichedProducts.map((product, i) => (
                        <RecommendationCard
                          key={product.id}
                          product={product}
                          reason={product.aiReason}
                          onAddToCart={onAddToCart}
                          index={i}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#FAFAFA",
                        borderRadius: "16px",
                        border: "2px dashed #e0e0e0",
                      }}
                    >
                      <p style={{ color: "#888", fontSize: "15px", margin: "0 0 8px" }}>
                        No exact matches found in our current inventory.
                      </p>
                      <p style={{ color: "#aaa", fontSize: "13px", margin: 0 }}>
                        Try browsing our full catalogue or adjusting your description.
                      </p>
                    </div>
                  )}
                </div>

                {/* New search */}
                <div style={{ marginTop: "28px", textAlign: "center" }}>
                  <button
                    onClick={() => { setPhase("idle"); setResults(null); setLocalQuery(""); }}
                    style={{
                      background: "none",
                      border: "2px solid #e0e0e0",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#B38B59"; e.currentTarget.style.color = "#B38B59"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#555"; }}
                  >
                    <RotateCcw size={15} />
                    Search for another occasion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INTEGRATION INSTRUCTIONS FOR page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Add this import at the top of page.jsx:
 *    import { AIRecommendationsModal } from '@/src/components/AIRecommendations';
 *
 * 2. Add this state variable inside the Home() component:
 *    const [showAIModal, setShowAIModal] = useState(false);
 *
 * 3. Replace the "Find Recommendations" button onClick in the Hero section:
 *    BEFORE:  onClick={() => window.location.href = `/shop?search=${searchQuery}`}
 *    AFTER:   onClick={() => setShowAIModal(true)}
 *
 * 4. Add the modal just before the closing </> in the return statement:
 *
 *    <AIRecommendationsModal
 *      isOpen={showAIModal}
 *      onClose={() => setShowAIModal(false)}
 *      searchQuery={searchQuery}
 *      allProducts={[...featuredItems, ...topSellingProducts, ...promotionProducts]}
 *      onAddToCart={handleAddToCart}
 *    />
 *
 * That's it! The button will now open an AI-powered modal instead of redirecting.
 * ─────────────────────────────────────────────────────────────────────────────
 */