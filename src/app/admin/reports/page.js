"use client";

import { useState, useEffect } from "react";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  FileText, Download, Filter, TrendingUp, DollarSign,
  ShoppingBag, Package, AlertCircle, Activity,
  Printer, RefreshCw, ChevronUp, ChevronDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) { return (n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtInt(n) { return (n || 0).toLocaleString("en-ZA"); }

function StatusPill({ status }) {
  const map = {
    "In Stock":     { bg: "#ecfdf5", color: "#065f46" },
    "Low Stock":    { bg: "#fffbeb", color: "#92400e" },
    "Out of Stock": { bg: "#fef2f2", color: "#991b1b" },
    "completed":    { bg: "#ecfdf5", color: "#065f46" },
    "pending":      { bg: "#fffbeb", color: "#92400e" },
    "cancelled":    { bg: "#fef2f2", color: "#991b1b" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
      background: s.bg, color: s.color, textTransform: "capitalize", fontFamily: "system-ui, sans-serif" }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "20px",
      padding: "24px", display: "flex", flexDirection: "column", gap: "12px",
      borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#a89880",
          textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui, sans-serif" }}>
          {label}
        </p>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px",
          background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={accent} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "30px", fontWeight: "400", color: "#1a1208",
        fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: "12px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const [dateRange, setDateRange]       = useState("30");
  const [reportType, setReportType]     = useState("overview");
  const [selectedCulture, setSelectedCulture]   = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortCol, setSortCol]   = useState(null);
  const [sortDir, setSortDir]   = useState("desc");

  const [reportData, setReportData] = useState({ summary: {}, sales: [], inventory: [], cultural: [], performance: [], recentOrders: [] });
  const [cultures, setCultures]     = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (products.length > 0 || orders.length > 0) generateReport();
  }, [dateRange, reportType, selectedCulture, selectedCategory, products, orders]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true);

      // Products
      const prodSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prods);

      const cultSet = new Set(), catSet = new Set();
      prods.forEach(p => { if (p.culture) cultSet.add(p.culture); if (p.category) catSet.add(p.category); });
      setCultures([...cultSet]);
      setCategories([...catSet]);

      // Orders — graceful fallback if collection missing
      try {
        const ordSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setOrders([]); }

      setLastRefreshed(new Date());
    } catch (e) {
      console.error("fetchData error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Report generation ─────────────────────────────────────────────────────

  const generateReport = () => {
    // Date cutoff
    const now = new Date();
    const days = dateRange === "all" ? Infinity : parseInt(dateRange);
    const cutoff = days === Infinity ? new Date(0) : new Date(now - days * 86400000);

    // Filter orders by date
    const filteredOrders = orders.filter(o => {
      // Support Firestore Timestamp, ISO string, or epoch ms
      let d;
      if (o.createdAt?.toDate) d = o.createdAt.toDate();
      else if (o.createdAt?.seconds) d = new Date(o.createdAt.seconds * 1000);
      else if (o.createdAt) d = new Date(o.createdAt);
      else d = new Date(0);
      return d >= cutoff;
    });

    // Filter products
    let filteredProds = [...products];
    if (selectedCulture !== "all") filteredProds = filteredProds.filter(p => p.culture === selectedCulture);
    if (selectedCategory !== "all") filteredProds = filteredProds.filter(p => p.category === selectedCategory);

    // Build a product-id → units-sold map from real order line items
    // Supports orders with an `items` array like [{ productId, quantity, price }]
    const salesMap = {};   // productId → { units, revenue }
    filteredOrders.forEach(order => {
      const items = order.items || order.lineItems || order.products || [];
      items.forEach(item => {
        const pid = item.productId || item.id;
        if (!pid) return;
        if (!salesMap[pid]) salesMap[pid] = { units: 0, revenue: 0 };
        const qty = item.quantity || item.qty || 1;
        const price = item.price || item.unitPrice || 0;
        salesMap[pid].units += qty;
        salesMap[pid].revenue += qty * price;
      });
    });

    // Real revenue: sum order totals (handle various field names)
    const totalRevenue = filteredOrders.reduce((s, o) => {
      return s + (o.total || o.totalAmount || o.orderTotal || o.amount || 0);
    }, 0);

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Real units sold across all products from orders
    const totalUnitsSold = Object.values(salesMap).reduce((s, v) => s + v.units, 0);

    // Stock — field is `stockCount` in your products schema
    const lowStock   = filteredProds.filter(p => {
      const s = p.stockCount ?? p.stock ?? 0;
      return s > 0 && s < 5;
    }).length;
    const outOfStock = filteredProds.filter(p => (p.stockCount ?? p.stock ?? 0) === 0).length;
    const onSale     = filteredProds.filter(p => p.salePrice).length;

    const summary = { totalRevenue, totalOrders, totalProducts: filteredProds.length, avgOrderValue, totalUnitsSold, lowStock, outOfStock, onSale };

    // Sales table — merge product data + real order data
    const sales = filteredProds.map(p => {
      const sd = salesMap[p.id] || { units: 0, revenue: 0 };
      const stock = p.stockCount ?? p.stock ?? 0;
      return {
        id: p.id,
        name: p.name || "—",
        culture: p.culture || "Various",
        category: p.category || "Uncategorized",
        price: p.salePrice || p.price || 0,
        units: sd.units,
        revenue: sd.revenue || sd.units * (p.salePrice || p.price || 0),
        stock,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Inventory table
    const inventory = filteredProds.map(p => {
      const stock = p.stockCount ?? p.stock ?? 0;
      const status = stock === 0 ? "Out of Stock" : stock < 5 ? "Low Stock" : "In Stock";
      return { id: p.id, name: p.name || "—", culture: p.culture || "Various", category: p.category || "Uncategorized", stock, price: p.price || 0, salePrice: p.salePrice || null, status };
    });

    // Cultural breakdown
    const cultMap = {};
    filteredProds.forEach(p => {
      const cult = p.culture || "Various";
      if (!cultMap[cult]) cultMap[cult] = { name: cult, count: 0, units: 0, revenue: 0 };
      cultMap[cult].count++;
      const sd = salesMap[p.id] || { units: 0, revenue: 0 };
      cultMap[cult].units += sd.units;
      cultMap[cult].revenue += sd.revenue;
    });
    const cultural = Object.values(cultMap).sort((a, b) => b.revenue - a.revenue);

    // Category performance
    const catMap = {};
    filteredProds.forEach(p => {
      const cat = p.category || "Uncategorized";
      if (!catMap[cat]) catMap[cat] = { name: cat, count: 0, units: 0, revenue: 0 };
      catMap[cat].count++;
      const sd = salesMap[p.id] || { units: 0, revenue: 0 };
      catMap[cat].units += sd.units;
      catMap[cat].revenue += sd.revenue;
    });
    Object.values(catMap).forEach(c => { c.avgPrice = c.units > 0 ? c.revenue / c.units : 0; });
    const performance = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);

    // Recent orders for overview
    const recentOrders = filteredOrders.slice(0, 10).map(o => {
      let d;
      if (o.createdAt?.toDate) d = o.createdAt.toDate();
      else if (o.createdAt?.seconds) d = new Date(o.createdAt.seconds * 1000);
      else if (o.createdAt) d = new Date(o.createdAt);
      else d = null;
      return {
        id: o.id,
        ref: o.orderNumber || o.ref || o.id?.slice(0, 8).toUpperCase(),
        total: o.total || o.totalAmount || o.orderTotal || o.amount || 0,
        status: o.status || "pending",
        items: (o.items || o.lineItems || o.products || []).length,
        date: d ? d.toLocaleDateString("en-ZA") : "—",
        customer: o.customerName || o.userName || o.email || "Guest",
      };
    });

    setReportData({ summary, sales, inventory, cultural, performance, recentOrders });
  };

  // ── Sorting helper ────────────────────────────────────────────────────────

  const sortData = (data, col) => {
    if (!col) return data;
    return [...data].sort((a, b) => {
      const av = a[col], bv = b[col];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const SortTh = ({ col, children, right }) => (
    <th onClick={() => handleSort(col)} style={{ padding: "14px 16px", textAlign: right ? "right" : "left",
      fontSize: "12px", fontWeight: "700", color: "#a89880", textTransform: "uppercase",
      letterSpacing: "0.06em", fontFamily: "system-ui, sans-serif", cursor: "pointer",
      userSelect: "none", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {children}
        {sortCol === col
          ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronDown size={12} color="#d4c5a9" />}
      </span>
    </th>
  );

  // ── CSV download ──────────────────────────────────────────────────────────

  const downloadCSV = () => {
    setGenerating(true);
    setTimeout(() => {
      let rows = [];
      if (reportType === "sales") {
        rows = [["Name","Culture","Category","Price","Units Sold","Revenue","Stock"],
          ...reportData.sales.map(i => [i.name, i.culture, i.category, i.price, i.units, i.revenue.toFixed(2), i.stock])];
      } else if (reportType === "inventory") {
        rows = [["Name","Culture","Category","Stock","Price","Sale Price","Status"],
          ...reportData.inventory.map(i => [i.name, i.culture, i.category, i.stock, i.price, i.salePrice || "", i.status])];
      } else if (reportType === "cultural") {
        rows = [["Culture","Products","Units Sold","Revenue"],
          ...reportData.cultural.map(i => [i.name, i.count, i.units, i.revenue.toFixed(2)])];
      } else if (reportType === "performance") {
        rows = [["Category","Products","Units Sold","Revenue","Avg Price"],
          ...reportData.performance.map(i => [i.name, i.count, i.units, i.revenue.toFixed(2), i.avgPrice.toFixed(2)])];
      } else {
        rows = [["Metric","Value"],
          ["Total Revenue", `R ${fmt(reportData.summary.totalRevenue)}`],
          ["Total Orders", reportData.summary.totalOrders],
          ["Total Products", reportData.summary.totalProducts],
          ["Avg Order Value", `R ${fmt(reportData.summary.avgOrderValue)}`],
          ["Units Sold", reportData.summary.totalUnitsSold],
          ["Low Stock", reportData.summary.lowStock],
          ["Out of Stock", reportData.summary.outOfStock],
        ];
      }
      const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `isiko-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, 400);
  };

  // ── Table shared styles ───────────────────────────────────────────────────

  const tdStyle = (right) => ({ padding: "15px 16px", fontSize: "14px", color: "#1a1208",
    textAlign: right ? "right" : "left", fontFamily: "system-ui, sans-serif", borderBottom: "1px solid #f0ebe3" });

  const trStyle = { transition: "background 0.15s" };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)",
        padding: "48px 40px 44px", borderBottom: "3px solid #8B6A3D" }}>
        <div style={{ maxWidth: "1380px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #d4a855, #8B6A3D)",
              borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "400", color: "#f5edd8",
                fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
                Reports Dashboard
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(245,237,216,0.55)",
                fontFamily: "system-ui, sans-serif" }}>
                Real-time data from Firestore
                {lastRefreshed && ` · Last updated ${lastRefreshed.toLocaleTimeString("en-ZA")}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "50vh", gap: "20px" }}>
          <div style={{ width: "44px", height: "44px", border: "3px solid #e8e2d9",
            borderTopColor: "#8B6A3D", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#a89880", fontFamily: "system-ui, sans-serif" }}>Loading live data…</p>
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "40px 32px 80px" }}>

          {/* ── Config bar ── */}
          <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "20px",
            padding: "28px 32px", marginBottom: "32px", display: "flex", gap: "20px",
            flexWrap: "wrap", alignItems: "flex-end" }}>

            {[
              { label: "Report Type", val: reportType, set: setReportType, opts: [
                ["overview","Overview"], ["sales","Sales"], ["inventory","Inventory"],
                ["cultural","Cultural"], ["performance","Category Performance"],
              ]},
              { label: "Date Range", val: dateRange, set: setDateRange, opts: [
                ["7","Last 7 days"], ["30","Last 30 days"], ["90","Last 90 days"],
                ["365","Last year"], ["all","All time"],
              ]},
              { label: "Culture", val: selectedCulture, set: setSelectedCulture,
                opts: [["all","All cultures"], ...cultures.map(c => [c, c])] },
              { label: "Category", val: selectedCategory, set: setSelectedCategory,
                opts: [["all","All categories"], ...categories.map(c => [c, c])] },
            ].map(({ label, val, set, opts }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 180px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#a89880",
                  textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui, sans-serif" }}>
                  {label}
                </label>
                <select value={val} onChange={e => set(e.target.value)}
                  style={{ padding: "10px 14px", border: "1.5px solid #e0d8cc", borderRadius: "10px",
                    fontSize: "14px", color: "#1a1208", background: "white", cursor: "pointer",
                    fontFamily: "system-ui, sans-serif" }}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexShrink: 0, alignItems: "flex-end" }}>
              <button onClick={downloadCSV} disabled={generating}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 20px",
                  background: "#1a1208", color: "#f5edd8", border: "none", borderRadius: "10px",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif", opacity: generating ? 0.6 : 1 }}>
                <Download size={15} />
                {generating ? "Exporting…" : "CSV"}
              </button>
              <button onClick={() => window.print()}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 16px",
                  background: "white", color: "#1a1208", border: "1.5px solid #e0d8cc",
                  borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif" }}>
                <Printer size={15} />
                Print
              </button>
              <button onClick={fetchData}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 16px",
                  background: "white", color: "#8B6A3D", border: "1.5px solid #d4c5a9",
                  borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif" }}>
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>
          </div>

          {/* ── Report panel ── */}
          <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "20px",
            padding: "40px", boxShadow: "0 4px 24px rgba(26,18,8,0.04)" }}>

            {/* Report title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: "36px", paddingBottom: "24px", borderBottom: "1px solid #f0ebe3" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: "400", color: "#1a1208",
                  fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
                  {{ overview:"Business Overview", sales:"Sales Performance", inventory:"Inventory Status",
                     cultural:"Cultural Distribution", performance:"Category Performance" }[reportType]} Report
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                  {dateRange === "all" ? "All time" : `Last ${dateRange} days`}
                  {selectedCulture !== "all" && ` · ${selectedCulture}`}
                  {selectedCategory !== "all" && ` · ${selectedCategory}`}
                  {" · "}{new Date().toLocaleDateString("en-ZA", { day:"numeric", month:"long", year:"numeric" })}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "600", color: "#8B6A3D",
                  fontFamily: "'Georgia', serif" }}>iSiko Studio</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                  Cultural Heritage Shop
                </p>
              </div>
            </div>

            {/* ── OVERVIEW ── */}
            {reportType === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                  <StatCard label="Total Revenue" value={`R ${fmt(reportData.summary.totalRevenue)}`}
                    sub={`Across ${fmtInt(reportData.summary.totalOrders)} orders`}
                    icon={DollarSign} accent="#2E7D32" />
                  <StatCard label="Total Orders" value={fmtInt(reportData.summary.totalOrders)}
                    sub={`Avg R ${fmt(reportData.summary.avgOrderValue)}`}
                    icon={ShoppingBag} accent="#8B6A3D" />
                  <StatCard label="Units Sold" value={fmtInt(reportData.summary.totalUnitsSold)}
                    sub="From order line items"
                    icon={Activity} accent="#1E4E8C" />
                  <StatCard label="Products Listed" value={fmtInt(reportData.summary.totalProducts)}
                    sub={`${reportData.summary.onSale} on sale`}
                    icon={Package} accent="#6F2C5C" />
                  <StatCard label="Low Stock" value={fmtInt(reportData.summary.lowStock)}
                    sub="Fewer than 5 units"
                    icon={AlertCircle} accent="#D97706" />
                  <StatCard label="Out of Stock" value={fmtInt(reportData.summary.outOfStock)}
                    sub="Needs restocking"
                    icon={TrendingUp} accent="#DC2626" />
                </div>

                {/* Recent orders table */}
                {reportData.recentOrders.length > 0 && (
                  <div>
                    <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "400", color: "#1a1208",
                      fontFamily: "'Georgia', serif" }}>Recent Orders</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#faf8f5", borderBottom: "2px solid #e8e2d9" }}>
                            {["Order Ref","Customer","Date","Items","Total","Status"].map(h => (
                              <th key={h} style={{ padding: "13px 16px", textAlign: h === "Total" || h === "Items" ? "right" : "left",
                                fontSize: "12px", fontWeight: "700", color: "#a89880",
                                textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui, sans-serif" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.recentOrders.map(o => (
                            <tr key={o.id} style={trStyle}>
                              <td style={tdStyle()}><span style={{ fontWeight: "700", color: "#8B6A3D" }}>#{o.ref}</span></td>
                              <td style={tdStyle()}>{o.customer}</td>
                              <td style={tdStyle()}>{o.date}</td>
                              <td style={tdStyle(true)}>{o.items}</td>
                              <td style={{ ...tdStyle(true), fontWeight: "700", color: "#2E7D32" }}>R {fmt(o.total)}</td>
                              <td style={tdStyle()}><StatusPill status={o.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {reportData.recentOrders.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#a89880",
                    fontFamily: "system-ui, sans-serif", fontSize: "14px",
                    background: "#faf8f5", borderRadius: "12px" }}>
                    No orders found in this date range. Order data is pulled live from Firestore.
                  </div>
                )}
              </div>
            )}

            {/* ── SALES ── */}
            {reportType === "sales" && (
              <div style={{ overflowX: "auto" }}>
                <div style={{ marginBottom: "16px", fontSize: "13px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                  Revenue is calculated from real order line items. Click column headers to sort.
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#faf8f5", borderBottom: "2px solid #e8e2d9" }}>
                      <SortTh col="name">Product</SortTh>
                      <SortTh col="culture">Culture</SortTh>
                      <SortTh col="category">Category</SortTh>
                      <SortTh col="price" right>Price</SortTh>
                      <SortTh col="units" right>Units Sold</SortTh>
                      <SortTh col="revenue" right>Revenue</SortTh>
                      <SortTh col="stock" right>Stock</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(reportData.sales, sortCol).map(item => (
                      <tr key={item.id} style={trStyle}>
                        <td style={{ ...tdStyle(), fontWeight: "600" }}>{item.name}</td>
                        <td style={tdStyle()}><span style={{ fontSize: "12px", background: "#f0ebe3",
                          padding: "3px 10px", borderRadius: "20px", color: "#4a3f30" }}>{item.culture}</span></td>
                        <td style={tdStyle()}>{item.category}</td>
                        <td style={{ ...tdStyle(true) }}>R {fmt(item.price)}</td>
                        <td style={{ ...tdStyle(true), color: item.units > 0 ? "#8B6A3D" : "#a89880", fontWeight: item.units > 0 ? "700" : "400" }}>
                          {fmtInt(item.units)}
                        </td>
                        <td style={{ ...tdStyle(true), fontWeight: "700", color: item.revenue > 0 ? "#2E7D32" : "#a89880" }}>
                          R {fmt(item.revenue)}
                        </td>
                        <td style={{ ...tdStyle(true), color: item.stock === 0 ? "#DC2626" : item.stock < 5 ? "#D97706" : "#2E7D32", fontWeight: "700" }}>
                          {fmtInt(item.stock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#faf8f5", borderTop: "2px solid #e8e2d9" }}>
                      <td colSpan={4} style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700",
                        color: "#1a1208", fontFamily: "system-ui, sans-serif" }}>Totals</td>
                      <td style={{ ...tdStyle(true), fontWeight: "700", borderBottom: "none" }}>
                        {fmtInt(reportData.sales.reduce((s, i) => s + i.units, 0))}
                      </td>
                      <td style={{ ...tdStyle(true), fontWeight: "800", color: "#2E7D32", borderBottom: "none", fontSize: "15px" }}>
                        R {fmt(reportData.sales.reduce((s, i) => s + i.revenue, 0))}
                      </td>
                      <td style={{ borderBottom: "none" }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ── INVENTORY ── */}
            {reportType === "inventory" && (
              <div style={{ overflowX: "auto" }}>
                <div style={{ marginBottom: "16px", fontSize: "13px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                  Stock levels pulled from <code>stockCount</code> field in Firestore. Click column headers to sort.
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#faf8f5", borderBottom: "2px solid #e8e2d9" }}>
                      <SortTh col="name">Product</SortTh>
                      <SortTh col="culture">Culture</SortTh>
                      <SortTh col="category">Category</SortTh>
                      <SortTh col="stock" right>Stock</SortTh>
                      <SortTh col="price" right>Price</SortTh>
                      <th style={{ padding: "14px 16px", fontSize: "12px", fontWeight: "700", color: "#a89880",
                        textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui, sans-serif" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(reportData.inventory, sortCol).map(item => (
                      <tr key={item.id} style={trStyle}>
                        <td style={{ ...tdStyle(), fontWeight: "600" }}>{item.name}</td>
                        <td style={tdStyle()}><span style={{ fontSize: "12px", background: "#f0ebe3",
                          padding: "3px 10px", borderRadius: "20px", color: "#4a3f30" }}>{item.culture}</span></td>
                        <td style={tdStyle()}>{item.category}</td>
                        <td style={{ ...tdStyle(true), fontWeight: "700",
                          color: item.stock === 0 ? "#DC2626" : item.stock < 5 ? "#D97706" : "#2E7D32" }}>
                          {fmtInt(item.stock)}
                        </td>
                        <td style={tdStyle(true)}>
                          {item.salePrice
                            ? <><span style={{ fontWeight: "700", color: "#c05621" }}>R {fmt(item.salePrice)}</span>
                                <span style={{ fontSize: "12px", color: "#a89880", textDecoration: "line-through", marginLeft: "6px" }}>R {fmt(item.price)}</span></>
                            : `R ${fmt(item.price)}`}
                        </td>
                        <td style={tdStyle()}><StatusPill status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CULTURAL ── */}
            {reportType === "cultural" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#faf8f5", borderBottom: "2px solid #e8e2d9" }}>
                      <SortTh col="name">Culture</SortTh>
                      <SortTh col="count" right>Products</SortTh>
                      <SortTh col="units" right>Units Sold</SortTh>
                      <SortTh col="revenue" right>Revenue</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(reportData.cultural, sortCol).map((item, i) => (
                      <tr key={item.name} style={trStyle}>
                        <td style={{ ...tdStyle(), fontWeight: "600", fontSize: "15px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%",
                              background: ["#8B6A3D","#2C5C6F","#6F2C5C","#2E7D32","#D97706","#DC2626","#1E4E8C","#047857"][i % 8],
                              flexShrink: 0, display: "inline-block" }} />
                            {item.name}
                          </span>
                        </td>
                        <td style={tdStyle(true)}>{fmtInt(item.count)}</td>
                        <td style={{ ...tdStyle(true), color: "#8B6A3D", fontWeight: "600" }}>{fmtInt(item.units)}</td>
                        <td style={{ ...tdStyle(true), fontWeight: "700", color: "#2E7D32", fontSize: "15px" }}>R {fmt(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#faf8f5", borderTop: "2px solid #e8e2d9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: "700", fontSize: "13px", fontFamily: "system-ui, sans-serif" }}>Total</td>
                      <td style={{ ...tdStyle(true), fontWeight: "700", borderBottom: "none" }}>
                        {fmtInt(reportData.cultural.reduce((s, i) => s + i.count, 0))}
                      </td>
                      <td style={{ ...tdStyle(true), fontWeight: "700", borderBottom: "none" }}>
                        {fmtInt(reportData.cultural.reduce((s, i) => s + i.units, 0))}
                      </td>
                      <td style={{ ...tdStyle(true), fontWeight: "800", color: "#2E7D32", borderBottom: "none", fontSize: "15px" }}>
                        R {fmt(reportData.cultural.reduce((s, i) => s + i.revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ── PERFORMANCE ── */}
            {reportType === "performance" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#faf8f5", borderBottom: "2px solid #e8e2d9" }}>
                      <SortTh col="name">Category</SortTh>
                      <SortTh col="count" right>Products</SortTh>
                      <SortTh col="units" right>Units Sold</SortTh>
                      <SortTh col="revenue" right>Revenue</SortTh>
                      <SortTh col="avgPrice" right>Avg Unit Price</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {sortData(reportData.performance, sortCol).map((item, i) => (
                      <tr key={item.name} style={trStyle}>
                        <td style={{ ...tdStyle(), fontWeight: "700", fontSize: "15px" }}>{item.name}</td>
                        <td style={tdStyle(true)}>{fmtInt(item.count)}</td>
                        <td style={{ ...tdStyle(true), fontWeight: "600", color: "#8B6A3D" }}>{fmtInt(item.units)}</td>
                        <td style={{ ...tdStyle(true), fontWeight: "700", color: "#2E7D32", fontSize: "15px" }}>R {fmt(item.revenue)}</td>
                        <td style={tdStyle(true)}>R {fmt(item.avgPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#faf8f5", borderTop: "2px solid #e8e2d9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: "700", fontSize: "13px", fontFamily: "system-ui, sans-serif" }}>Total</td>
                      <td style={{ ...tdStyle(true), fontWeight: "700", borderBottom: "none" }}>
                        {fmtInt(reportData.performance.reduce((s, i) => s + i.count, 0))}
                      </td>
                      <td style={{ ...tdStyle(true), fontWeight: "700", borderBottom: "none" }}>
                        {fmtInt(reportData.performance.reduce((s, i) => s + i.units, 0))}
                      </td>
                      <td style={{ ...tdStyle(true), fontWeight: "800", color: "#2E7D32", borderBottom: "none", fontSize: "15px" }}>
                        R {fmt(reportData.performance.reduce((s, i) => s + i.revenue, 0))}
                      </td>
                      <td style={{ borderBottom: "none" }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "56px", paddingTop: "20px", borderTop: "1px solid #f0ebe3",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                Generated by iSiko Studio Analytics · {new Date().toLocaleString("en-ZA")}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                admin@isikostudio.co.za
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}