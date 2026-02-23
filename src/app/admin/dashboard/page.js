"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from '@/src/lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from '@/src/Context/AuthContext';
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Users, Package,
  DollarSign, BarChart3, ShoppingCart, AlertCircle, CheckCircle,
  Clock, ArrowUpRight, Activity, Globe2, Star
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return (n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getOrderDate(o) {
  if (o.createdAt?.toDate) return o.createdAt.toDate();
  if (o.createdAt?.seconds) return new Date(o.createdAt.seconds * 1000);
  if (o.createdAt) return new Date(o.createdAt);
  return new Date(0);
}

function getOrderTotal(o) {
  return o.total || o.totalAmount || o.orderTotal || o.amount || 0;
}

function getTimeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getStatusColor(status) {
  return { pending: "#D97706", processing: "#2563EB", completed: "#2E7D32", cancelled: "#DC2626" }[status] || "#64748b";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "50vh", gap: "20px" }}>
      <div style={{ width: "44px", height: "44px", border: "3px solid #e8e2d9",
        borderTopColor: "#8B6A3D", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#a89880", fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>
        Loading live data…
      </p>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent, prefix }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "20px",
      padding: "24px", borderTop: `3px solid ${accent}`,
      display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "#a89880",
          textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "system-ui, sans-serif" }}>
          {label}
        </p>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px",
          background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={accent} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "30px", fontWeight: "400", color: "#1a1208",
        fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
        {prefix}{value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: "12px", color: "#a89880",
        fontFamily: "system-ui, sans-serif" }}>{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, accent }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "16px",
      padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "12px",
        background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={accent} />
      </div>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: "12px", color: "#a89880",
          fontFamily: "system-ui, sans-serif", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: "22px", fontWeight: "400", color: "#1a1208",
          fontFamily: "'Georgia', serif" }}>{value}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, action, onAction, children }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e2d9", borderRadius: "20px", padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "400", color: "#1a1208",
          fontFamily: "'Georgia', serif", display: "flex", alignItems: "center", gap: "8px" }}>
          {Icon && <Icon size={18} color="#8B6A3D" />}
          {title}
        </h3>
        {action && (
          <button onClick={onAction} style={{ background: "none", border: "none", color: "#8B6A3D",
            fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
            {action} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function BarRow({ label, count, total, color }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#1a1208",
          fontFamily: "system-ui, sans-serif" }}>{label}</span>
        <span style={{ fontSize: "13px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
          {count} · {pct}%
        </span>
      </div>
      <div style={{ height: "6px", background: "#f0ebe3", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color,
          borderRadius: "3px", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalProducts: 0,
    uniqueCustomers: 0, pendingOrders: 0, completedOrders: 0,
    cancelledOrders: 0, avgOrderValue: 0, lowStock: 0, outOfStock: 0,
  });

  const [recentOrders, setRecentOrders]         = useState([]);
  const [topProducts, setTopProducts]           = useState([]);
  const [recentActivity, setRecentActivity]     = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [cultureBreakdown, setCultureBreakdown]   = useState([]);

  useEffect(() => {
    if (user && !isAdmin) { router.push('/'); return; }
    if (user && isAdmin) fetchDashboardData();
  }, [user, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ── Products ──────────────────────────────────────────────────────────
      const prodSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      const products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const categoryCount = {}, cultureCount = {};
      let lowStock = 0, outOfStock = 0;

      products.forEach(p => {
        if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        if (p.culture)  cultureCount[p.culture]   = (cultureCount[p.culture]   || 0) + 1;
        const stock = p.stockCount ?? p.stock ?? 0;
        if (stock === 0) outOfStock++;
        else if (stock < 5) lowStock++;
      });

      // ── Orders ────────────────────────────────────────────────────────────
      let orders = [];
      try {
        const ordSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        orders = ordSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch { orders = []; }

      // Real revenue from order totals
      const totalRevenue = orders.reduce((s, o) => s + getOrderTotal(o), 0);

      // Unique customers — try userId, uid, email, customerId
      const customerIds = new Set();
      orders.forEach(o => {
        const id = o.userId || o.uid || o.customerId || o.email || o.customerEmail;
        if (id) customerIds.add(id);
      });

      // Order status counts
      let pendingOrders = 0, completedOrders = 0, cancelledOrders = 0;
      orders.forEach(o => {
        const s = (o.status || "").toLowerCase();
        if (s === "pending" || s === "processing") pendingOrders++;
        if (s === "completed" || s === "delivered") completedOrders++;
        if (s === "cancelled" || s === "canceled") cancelledOrders++;
      });

      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // ── Build salesMap from real order line items ─────────────────────────
      // Revenue & units per product from actual orders
      const salesMap = {}; // productId → { units, revenue }
      orders.forEach(o => {
        const items = o.items || o.lineItems || o.products || [];
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

      // Top products by real units sold from orders
      const topSelling = products
        .map(p => ({ ...p, _units: salesMap[p.id]?.units || 0, _revenue: salesMap[p.id]?.revenue || 0 }))
        .sort((a, b) => b._units - a._units)
        .slice(0, 5);

      // Recent orders (top 5)
      const recent = [...orders]
        .sort((a, b) => getOrderDate(b) - getOrderDate(a))
        .slice(0, 5);

      // ── Activity feed ─────────────────────────────────────────────────────
      const activity = [];
      recent.slice(0, 3).forEach(o => {
        const ref = o.orderNumber || o.ref || o.id?.slice(0, 8).toUpperCase();
        activity.push({
          icon: ShoppingCart, color: "#2E7D32",
          message: `New order #${ref} — R ${fmt(getOrderTotal(o))}`,
          time: getTimeAgo(getOrderDate(o)),
        });
      });
      products.slice(0, 2).forEach(p => {
        activity.push({
          icon: Package, color: "#8B6A3D",
          message: `Product "${p.name}" in catalogue`,
          time: getTimeAgo(p.createdAt?.toDate?.() || p.createdAt?.seconds
            ? new Date(p.createdAt.seconds * 1000) : new Date()),
        });
      });

      // ── Category / culture breakdown ──────────────────────────────────────
      const catArray = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const cultArray = Object.entries(cultureCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // ── Set state ─────────────────────────────────────────────────────────
      setStats({ totalRevenue, totalOrders: orders.length, totalProducts: products.length,
        uniqueCustomers: customerIds.size, pendingOrders, completedOrders, cancelledOrders,
        avgOrderValue, lowStock, outOfStock });
      setRecentOrders(recent);
      setTopProducts(topSelling);
      setRecentActivity(activity.slice(0, 5));
      setCategoryBreakdown(catArray);
      setCultureBreakdown(cultArray);
      setLastRefreshed(new Date());

    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Access guard ──────────────────────────────────────────────────────────

  if (!user || !isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#faf8f5" }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={56} color="#DC2626" style={{ marginBottom: "16px" }} />
          <h2 style={{ fontSize: "22px", color: "#1a1208", fontFamily: "'Georgia', serif" }}>Access Denied</h2>
          <p style={{ color: "#a89880", fontFamily: "system-ui, sans-serif" }}>Admin privileges required.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)",
        padding: "40px 40px 36px", borderBottom: "3px solid #8B6A3D" }}>
        <div style={{ maxWidth: "1380px", margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #d4a855, #8B6A3D)",
              borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutDashboard size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "400", color: "#f5edd8",
                fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
                Admin Dashboard
              </h1>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(245,237,216,0.5)",
                fontFamily: "system-ui, sans-serif" }}>
                Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Admin"}
                {lastRefreshed && ` · Updated ${lastRefreshed.toLocaleTimeString("en-ZA")}`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => router.push("/admin/products")}
              style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 20px",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px", color: "#f5edd8", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
              <Package size={15} /> Products
            </button>
            <button onClick={() => router.push("/admin/orders")}
              style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 20px",
                background: "linear-gradient(135deg, #d4a855, #8B6A3D)", border: "none",
                borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
              <ShoppingCart size={15} /> Orders
            </button>
            <button onClick={fetchDashboardData}
              style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 16px",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", color: "#d4a855", fontSize: "13px", fontWeight: "600",
                cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "40px 32px 80px" }}>

          {/* ── Primary stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px", marginBottom: "20px" }}>
            <StatCard label="Total Revenue" prefix="R "
              value={fmt(stats.totalRevenue)}
              sub={`${stats.totalOrders} orders · avg R ${fmt(stats.avgOrderValue)}`}
              icon={DollarSign} accent="#2E7D32" />
            <StatCard label="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              sub={`${stats.completedOrders} completed · ${stats.cancelledOrders} cancelled`}
              icon={ShoppingBag} accent="#8B6A3D" />
            <StatCard label="Unique Customers"
              value={stats.uniqueCustomers.toLocaleString()}
              sub="Distinct buyers from orders"
              icon={Users} accent="#1E4E8C" />
            <StatCard label="Products Listed"
              value={stats.totalProducts.toLocaleString()}
              sub={`${stats.outOfStock} out of stock · ${stats.lowStock} low`}
              icon={Package} accent="#6F2C5C" />
          </div>

          {/* ── Secondary stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px", marginBottom: "32px" }}>
            <MiniStat label="Pending / Processing" value={stats.pendingOrders} icon={Clock} accent="#D97706" />
            <MiniStat label="Completed Orders" value={stats.completedOrders} icon={CheckCircle} accent="#2E7D32" />
            <MiniStat label="Avg Order Value" value={`R ${fmt(stats.avgOrderValue)}`} icon={Star} accent="#1E4E8C" />
            <MiniStat label="Low Stock Items" value={stats.lowStock} icon={AlertCircle} accent="#DC2626" />
          </div>

          {/* ── Recent orders + Top products ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: "24px", marginBottom: "24px" }}>

            {/* Recent Orders */}
            <Panel title="Recent Orders" icon={ShoppingCart} action="View all" onAction={() => router.push("/admin/orders")}>
              {recentOrders.length > 0 ? recentOrders.map(order => {
                const ref = order.orderNumber || order.ref || order.id?.slice(0, 8).toUpperCase();
                const total = getOrderTotal(order);
                const date = getOrderDate(order);
                const items = (order.items || order.lineItems || order.products || []).length;
                const customer = order.customerName || order.userName || order.email || order.customerEmail || "Guest";
                return (
                  <div key={order.id} style={{ padding: "14px 16px", marginBottom: "10px",
                    background: "#faf8f5", borderRadius: "12px", border: "1px solid #f0ebe3",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#8B6A3D",
                          fontFamily: "system-ui, sans-serif" }}>#{ref}</span>
                        <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px",
                          fontWeight: "700", background: `${getStatusColor(order.status)}18`,
                          color: getStatusColor(order.status), textTransform: "capitalize",
                          fontFamily: "system-ui, sans-serif" }}>
                          {order.status || "pending"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#a89880",
                        fontFamily: "system-ui, sans-serif", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {customer} · {items} item{items !== 1 ? "s" : ""} · {getTimeAgo(date)}
                      </p>
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#2E7D32",
                      fontFamily: "'Georgia', serif", flexShrink: 0 }}>
                      R {fmt(total)}
                    </span>
                  </div>
                );
              }) : (
                <p style={{ color: "#a89880", textAlign: "center", padding: "40px 0",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>No orders yet</p>
              )}
            </Panel>

            {/* Top Products */}
            <Panel title="Top Products by Sales" icon={TrendingUp}>
              {topProducts.length > 0 ? topProducts.map((product, i) => (
                <div key={product.id} style={{ display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 0", borderBottom: i < topProducts.length - 1 ? "1px solid #f0ebe3" : "none" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: i === 0 ? "linear-gradient(135deg, #d4a855, #8B6A3D)"
                              : i === 1 ? "linear-gradient(135deg, #94a3b8, #64748b)"
                              : "linear-gradient(135deg, #d4a855aa, #8B6A3D88)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "700", fontSize: "13px", fontFamily: "system-ui, sans-serif" }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: "600", color: "#1a1208",
                      fontFamily: "system-ui, sans-serif", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#a89880", fontFamily: "system-ui, sans-serif" }}>
                      {product._units > 0
                        ? `${product._units} units sold`
                        : `R ${fmt(product.price || 0)} · stock: ${product.stockCount ?? product.stock ?? 0}`}
                    </p>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#2E7D32",
                    fontFamily: "'Georgia', serif", flexShrink: 0 }}>
                    {product._revenue > 0 ? `R ${fmt(product._revenue)}` : `R ${fmt(product.price || 0)}`}
                  </span>
                </div>
              )) : (
                <p style={{ color: "#a89880", textAlign: "center", padding: "40px 0",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>No sales data yet</p>
              )}
            </Panel>
          </div>

          {/* ── Bottom row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>

            {/* Activity */}
            <Panel title="Recent Activity" icon={Activity}>
              {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                    background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <a.icon size={18} color={a.color} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: "500", color: "#1a1208",
                      fontFamily: "system-ui, sans-serif" }}>{a.message}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#a89880",
                      fontFamily: "system-ui, sans-serif" }}>{a.time}</p>
                  </div>
                </div>
              )) : (
                <p style={{ color: "#a89880", textAlign: "center", padding: "32px 0",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>No recent activity</p>
              )}
            </Panel>

            {/* Category breakdown */}
            <Panel title="Category Breakdown" icon={BarChart3}>
              {categoryBreakdown.length > 0 ? categoryBreakdown.map((c, i) => (
                <BarRow key={c.name} label={c.name} count={c.count} total={stats.totalProducts}
                  color={["#8B6A3D","#2C5C6F","#6F2C5C","#2E7D32","#D97706","#1E4E8C"][i % 6]} />
              )) : (
                <p style={{ color: "#a89880", textAlign: "center", padding: "32px 0",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>No data</p>
              )}
            </Panel>

            {/* Culture breakdown */}
            <Panel title="Culture Distribution" icon={Globe2}>
              {cultureBreakdown.length > 0 ? cultureBreakdown.slice(0, 6).map((c, i) => (
                <BarRow key={c.name} label={c.name} count={c.count} total={stats.totalProducts}
                  color={["#2E7D32","#8B6A3D","#1E4E8C","#6F2C5C","#D97706","#047857"][i % 6]} />
              )) : (
                <p style={{ color: "#a89880", textAlign: "center", padding: "32px 0",
                  fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>No data</p>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}