import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// 🔧 COLOCA AQUI O URL DO TEU APPS SCRIPT
// ─────────────────────────────────────────────
const SHEETS_URL = ""; // ex: "https://script.google.com/macros/s/XXXXXXX/exec"

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

const DEFAULT_MEMBERS = [
  { id:  1, nome: "Miguel Diamantino",   alcunha: "Kaiz3n"  },
  { id:  2, nome: "Filipe Lourenço",     alcunha: "Boss"    },
  { id:  3, nome: "José Pinto",          alcunha: "Bus"     },
  { id:  4, nome: "Rui Marques",         alcunha: "Popeye"  },
  { id:  5, nome: "Albertino Barata",    alcunha: "Hulk"    },
  { id:  6, nome: "Hélder Roque",        alcunha: "Shot"    },
  { id:  7, nome: "Nelson Martins",      alcunha: "Ace"     },
  { id:  8, nome: "Adérito Brito",       alcunha: "Wood"    },
  { id:  9, nome: "Luís Pereira",        alcunha: "Hunter"  },
  { id: 10, nome: "Nélson Bentes",       alcunha: "Beer"    },
  { id: 11, nome: "Flávio Ramos",        alcunha: "Thor"    },
  { id: 12, nome: "Bruno Agostinho",     alcunha: "Apache"  },
  { id: 13, nome: "Rafael Bicho",        alcunha: "Trigger" },
  { id: 14, nome: "Daniel Ramos",        alcunha: "Ghost"   },
  { id: 15, nome: "Bruno Balaia",        alcunha: "Thunder" },
  { id: 16, nome: "Pedro Garrido",       alcunha: "Bull"    },
  { id: 17, nome: "Diogo Santos",        alcunha: "Coffee"  },
  { id: 18, nome: "Edgar Veiga",         alcunha: "Celtic"  },
  { id: 19, nome: "João Azevedo",        alcunha: "Fisher"  },
  { id: 20, nome: "Filipe Fatela",       alcunha: "Sigma"   },
  { id: 21, nome: "Paulo Santos",        alcunha: "Crazy"   },
  { id: 22, nome: "António Gonçalves",   alcunha: "Kau"     },
  { id: 23, nome: "João Isidoro",        alcunha: "Csocso"  },
  { id: 24, nome: "Élia Dias",           alcunha: "Dinga"   },
  { id: 25, nome: "Tiago Martins",       alcunha: "Saigão"  },
  { id: 26, nome: "Marco Pecêgo",        alcunha: "Sneaky"  },
];

const DEFAULT_PRODUCTS = [
  { id: 1,  nome: "Super Bock 33cl",   cat: "🍺 Cerveja",      preco: 1.00,  emoji: "🍺", stockInicial: 0 },
  { id: 2,  nome: "Sagres 33cl",        cat: "🍺 Cerveja",      preco: 1.00,  emoji: "🍺", stockInicial: 0 },
  { id: 3,  nome: "Super Bock 50cl",   cat: "🍺 Cerveja",      preco: 1.50,  emoji: "🍺", stockInicial: 0 },
  { id: 4,  nome: "Coca-Cola 33cl",    cat: "🥤 Refrigerante",  preco: 1.00,  emoji: "🥤", stockInicial: 0 },
  { id: 5,  nome: "Água 50cl",          cat: "💧 Água",          preco: 0.50,  emoji: "💧", stockInicial: 0 },
  { id: 6,  nome: "Vodka Smirnoff",    cat: "🥃 Espirituosa",   preco: 15.00, emoji: "🥃", stockInicial: 0 },
  { id: 7,  nome: "Whisky J&B",        cat: "🥃 Espirituosa",   preco: 18.00, emoji: "🥃", stockInicial: 0 },
  { id: 8,  nome: "Vinho Tinto 75cl",  cat: "🍷 Vinho",         preco: 5.00,  emoji: "🍷", stockInicial: 0 },
  { id: 9,  nome: "Vinho Branco 75cl", cat: "🍷 Vinho",         preco: 5.00,  emoji: "🍷", stockInicial: 0 },
  { id: 10, nome: "Shot Vodka",         cat: "🥃 Espirituosa",   preco: 1.50,  emoji: "🥃", stockInicial: 0 },
  { id: 11, nome: "Sumo Laranja 1L",   cat: "🥤 Refrigerante",  preco: 2.00,  emoji: "🥤", stockInicial: 0 },
  { id: 12, nome: "Red Bull 25cl",     cat: "⚡ Energética",    preco: 2.00,  emoji: "⚡", stockInicial: 0 },
];

const toCSV = (registos) => {
  const header = "#,Data/Hora,ID Membro,Nome,ID Produto,Produto,Qtd,Preço Unit.,Total (€)";
  const rows = registos.map(r =>
    `${r.id},${r.dataHora},${r.membroId},"${r.membroNome}",${r.produtoId},"${r.produtoNome}",${r.qtd},${r.preco},${r.total}`
  );
  return [header, ...rows].join("\n");
};

// Envia registo para Google Sheets
const postToSheets = async (registo) => {
  if (!SHEETS_URL) return;
  try {
    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addRegisto", ...registo }),
    });
  } catch {}
};

// Lê registos do Google Sheets
const fetchFromSheets = async () => {
  if (!SHEETS_URL) return null;
  try {
    const res = await fetch(`${SHEETS_URL}?action=getRegistos`);
    const data = await res.json();
    return data.registos || null;
  } catch { return null; }
};

const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0a0e1a 0%, #0d1b2a 50%, #0f2033 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#dce8f0",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 0 80px 0",
  },
  header: {
    width: "100%",
    background: "linear-gradient(90deg, #0a1628 0%, #0d2244 50%, #0a1628 100%)",
    borderBottom: "2px solid #c9a84c",
    padding: "16px 24px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 4px 24px rgba(0,0,0,0.6)", boxSizing: "border-box",
  },
  logo: { fontSize: 20, fontWeight: 800, letterSpacing: "0.5px", color: "#c9a84c", textTransform: "uppercase" },
  subtitle: { fontSize: 11, color: "#7a9bb5", marginTop: 3, letterSpacing: 0.5 },
  adminBtn: {
    background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)",
    borderRadius: 6, padding: "6px 12px", color: "#c9a84c", fontSize: 12, cursor: "pointer",
    letterSpacing: 0.5, fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: "#7a9bb5",
    textTransform: "uppercase", letterSpacing: 2, marginBottom: 16,
    borderLeft: "3px solid #c9a84c", paddingLeft: 10,
  },
  memberGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  memberBtn: (sel) => ({
    background: sel
      ? "linear-gradient(135deg, #0d3060 0%, #1a4a8a 100%)"
      : "rgba(13,34,68,0.6)",
    border: sel ? "2px solid #c9a84c" : "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: "14px 12px",
    cursor: "pointer", textAlign: "center", transition: "all 0.2s", color: "#fff",
    boxShadow: sel ? "0 0 12px rgba(201,168,76,0.2)" : "none",
  }),
  catScroll: {
    display: "flex", gap: 8, overflowX: "auto",
    paddingBottom: 8, marginBottom: 16, scrollbarWidth: "none",
  },
  catChip: (active) => ({
    background: active ? "#0d3060" : "rgba(13,34,68,0.5)",
    border: active ? "1px solid #c9a84c" : "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: "6px 14px", fontSize: 12,
    color: active ? "#c9a84c" : "#7a9bb5", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
    fontWeight: active ? 700 : 400,
  }),
  productBtn: (sel) => ({
    background: sel ? "rgba(13,48,96,0.7)" : "rgba(13,27,42,0.6)",
    border: sel ? "1.5px solid #c9a84c" : "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, padding: "12px 16px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    color: "#fff", transition: "all 0.15s", width: "100%", marginBottom: 8,
  }),
  primaryBtn: {
    background: "linear-gradient(135deg, #0d3060, #1a4a8a)",
    border: "1px solid #c9a84c",
    borderRadius: 10, padding: "14px 24px",
    color: "#c9a84c", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 12,
    letterSpacing: 0.5,
  },
  greenBtn: {
    background: "linear-gradient(135deg, #1a3a1a, #2d5a2d)",
    border: "1px solid #4a8a4a",
    borderRadius: 8, padding: "10px 16px",
    color: "#81c784", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 24px", color: "#7a9bb5", fontSize: 14,
    cursor: "pointer", width: "100%", marginTop: 8,
  },
  dangerBtn: {
    background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.4)",
    borderRadius: 6, padding: "6px 10px", color: "#ef9a9a", fontSize: 11, cursor: "pointer",
  },
  dangerBtnConfirm: {
    background: "rgba(139,0,0,0.6)", border: "1px solid #ef5350",
    borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 11, cursor: "pointer",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 6, padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: 11, cursor: "pointer",
  },
  stockAddBtn: {
    background: "rgba(26,74,26,0.3)", border: "1px solid rgba(74,138,74,0.5)",
    borderRadius: 6, padding: "5px 10px", color: "#81c784", fontSize: 12, cursor: "pointer",
  },
  qtyBtn: {
    background: "rgba(13,48,96,0.6)", border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "50%", width: 44, height: 44, fontSize: 22, color: "#c9a84c", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  confirmBox: {
    background: "rgba(13,34,68,0.6)", border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: 12, padding: 20, marginBottom: 8,
  },
  tabRow: { display: "flex", gap: 6, marginBottom: 20 },
  tab: (active) => ({
    flex: 1, padding: "9px 4px", borderRadius: 8,
    background: active ? "#0d2244" : "rgba(13,27,42,0.6)",
    border: active ? "1px solid #c9a84c" : "1px solid rgba(255,255,255,0.07)",
    color: active ? "#c9a84c" : "rgba(255,255,255,0.4)",
    fontWeight: active ? 700 : 400, fontSize: 11, cursor: "pointer", textAlign: "center",
    letterSpacing: 0.3,
  }),
  tableWrapper: { overflowX: "auto", borderRadius: 8, border: "1px solid rgba(201,168,76,0.15)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    background: "#0a1628", padding: "10px 12px", textAlign: "left",
    fontWeight: 700, color: "#c9a84c", fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
    borderBottom: "1px solid rgba(201,168,76,0.2)",
  },
  td: (i) => ({
    padding: "10px 12px",
    background: i % 2 === 0 ? "rgba(13,27,42,0.4)" : "rgba(13,34,68,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#ccd9e0",
  }),
  input: {
    background: "rgba(13,27,42,0.7)", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14,
    width: "100%", boxSizing: "border-box", outline: "none",
  },
  smallInput: {
    background: "rgba(13,27,42,0.7)", border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 14,
    width: 80, textAlign: "center", outline: "none",
  },
  toast: (type) => ({
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: type === "success" ? "#1a3a1a" : type === "info" ? "#0a1e3a" : "#3a0a0a",
    border: `1px solid ${type === "success" ? "#4a8a4a" : type === "info" ? "#2a5a8a" : "#8a2a2a"}`,
    color: "#fff", padding: "12px 24px", borderRadius: 10,
    fontWeight: 600, fontSize: 14, zIndex: 1000,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
  }),
  formBox: {
    background: "rgba(13,27,42,0.6)", border: "1px solid rgba(201,168,76,0.15)",
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  label: { fontSize: 11, color: "#7a9bb5", marginBottom: 6, display: "block", letterSpacing: 0.5, textTransform: "uppercase" },
  syncBadge: (ok) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    background: ok ? "rgba(26,58,26,0.4)" : "rgba(40,30,10,0.4)",
    border: `1px solid ${ok ? "rgba(74,138,74,0.4)" : "rgba(201,168,76,0.3)"}`,
    borderRadius: 20, padding: "3px 10px", fontSize: 11,
    color: ok ? "#81c784" : "#c9a84c",
  }),
};

export default function BarApp() {
  const [step, setStep] = useState("member");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [filterCat, setFilterCat] = useState("Todas");
  const [registos, setRegistos] = useState([]);
  const [members,  setMembers]  = useState(DEFAULT_MEMBERS);
  const [products, setProducts] = useState(() => load("bar_products", DEFAULT_PRODUCTS));
  const [toast, setToast] = useState(null);
  const [adminView, setAdminView] = useState("consumos");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const sheetsAtivo = !!SHEETS_URL;

  // ─── Admin PIN ───────────────────────────────
  const ADMIN_PIN = "1234"; // ← altera aqui o teu PIN
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErro, setPinErro] = useState(false);

  // Persist locally
  useEffect(() => save("bar_registos", registos), [registos]);
  useEffect(() => save("bar_products", products), [products]);

  // Member form
  const [newNome, setNewNome] = useState("");
  const [newAlcunha, setNewAlcunha] = useState("");
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

  // Stock
  const [reposInput, setReposInput] = useState({});
  const [expandedStock, setExpandedStock] = useState(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);

  // Novo produto form
  const EMOJIS = ["🍺","🥤","💧","🥃","🍷","⚡","🍾","🧃","☕","🧊"];
  const [newProdNome,  setNewProdNome]  = useState("");
  const [newProdCat,   setNewProdCat]   = useState("");
  const [newProdPreco, setNewProdPreco] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdEmoji, setNewProdEmoji] = useState("🍺");

  // Filtro mês gastos
  const hoje = new Date();
  const [mesGastos, setMesGastos] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync from Sheets
  const syncFromSheets = useCallback(async () => {
    if (!sheetsAtivo) return;
    setSyncing(true);
    const dados = await fetchFromSheets();
    if (dados) {
      setRegistos(dados);
      setLastSync(new Date().toLocaleTimeString("pt-PT"));
      showToast("Sincronizado com Google Sheets ✓", "info");
    } else {
      showToast("Erro a sincronizar. A usar dados locais.", "error");
    }
    setSyncing(false);
  }, [sheetsAtivo]);

  // Auto-sync on admin consumos tab open
  useEffect(() => {
    if (step === "admin" && adminView === "consumos" && sheetsAtivo) {
      syncFromSheets();
    }
  }, [step, adminView]);

  // Derived
  const cats = ["Todas", ...new Set(products.map(p => p.cat))];
  const filteredProducts = filterCat === "Todas" ? products : products.filter(p => p.cat === filterCat);

  const stockAtual = (p) => {
    const consumido = registos.filter(r => r.produtoId === p.id).reduce((a, r) => a + r.qtd, 0);
    return (p.stockInicial || 0) - consumido;
  };

  const gastosMap = {};
  members.forEach(m => {
    const g = registos.filter(r => r.membroId === m.id);
    gastosMap[m.id] = {
      total: +g.reduce((a, r) => a + r.total, 0).toFixed(2),
      consumos: g.reduce((a, r) => a + r.qtd, 0),
    };
  });

  // Handlers
  const handleConfirm = async () => {
    const novo = {
      id: registos.length + 1,
      dataHora: new Date().toLocaleString("pt-PT"),
      membroId: selectedMember.id, membroNome: selectedMember.nome,
      produtoId: selectedProduct.id, produtoNome: selectedProduct.nome,
      qtd: qty, preco: selectedProduct.preco,
      total: +(selectedProduct.preco * qty).toFixed(2),
    };
    setRegistos(prev => [...prev, novo]);
    // Send to Sheets in background
    if (sheetsAtivo) postToSheets(novo);
    setStep("success");
  };

  const handleReset = () => {
    setSelectedMember(null); setSelectedProduct(null);
    setQty(1); setFilterCat("Todas"); setStep("member");
  };

  const handleAddMember = () => {
    if (!newNome.trim() || !newAlcunha.trim()) {
      showToast("Preenche o nome e a alcunha!", "error"); return;
    }
    const nextId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    setMembers(prev => [...prev, { id: nextId, nome: newNome.trim(), alcunha: newAlcunha.trim() }]);
    showToast(`${newAlcunha.trim()} adicionado!`);
    setNewNome(""); setNewAlcunha("");
  };

  const handleDeleteMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteMember(null);
    showToast("Membro removido.");
  };

  const handleAddProduct = () => {
    if (!newProdNome.trim() || !newProdPreco || !newProdCat.trim()) {
      showToast("Preenche nome, categoria e preço!", "error"); return;
    }
    const preco = parseFloat(newProdPreco.replace(",", "."));
    if (isNaN(preco) || preco <= 0) { showToast("Preço inválido!", "error"); return; }
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const novo = {
      id: nextId, nome: newProdNome.trim(),
      cat: `${newProdEmoji} ${newProdCat.trim()}`,
      preco, emoji: newProdEmoji,
      stockInicial: parseInt(newProdStock || "0") || 0,
    };
    setProducts(prev => [...prev, novo]);
    setNewProdNome(""); setNewProdCat(""); setNewProdPreco(""); setNewProdStock(""); setNewProdEmoji("🍺");
    showToast(`${novo.nome} adicionado!`);
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setConfirmDeleteProduct(null);
    showToast("Produto removido.");
  };

  const handleRepor = (productId) => {
    const val = parseInt(reposInput[productId] || "0", 10);
    if (!val || val <= 0) { showToast("Introduz uma quantidade válida!", "error"); return; }
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stockInicial: (p.stockInicial || 0) + val } : p
    ));
    setReposInput(prev => ({ ...prev, [productId]: "" }));
    setExpandedStock(null);
    const nome = products.find(p => p.id === productId)?.nome;
    showToast(`+${val} unid. adicionadas a ${nome}`);
  };

  const downloadCSV = () => {
    try {
      const uri = "data:text/csv;charset=utf-8," + encodeURIComponent(toCSV(registos));
      const a = document.createElement("a");
      a.href = uri;
      a.download = `bar_registos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("CSV exportado!");
    } catch(e) {
      showToast("Erro ao exportar.", "error");
    }
  };

  const BackBtn = ({ to }) => (
    <button style={{ background:"none", border:"none", color:"#7986cb", fontSize:20, cursor:"pointer", marginRight:10 }}
      onClick={() => setStep(to)}>←</button>
  );

  return (
    <div style={S.app}>
      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>🍺 Bar Lince</div>
          <div style={S.subtitle}>
            Sistema de Consumos &nbsp;
            <span style={S.syncBadge(sheetsAtivo)}>
              {sheetsAtivo ? "🟢 Sheets ativo" : "🟡 Modo local"}
            </span>
          </div>
        </div>
        <button style={S.adminBtn} onClick={() => {
          if (step === "admin") { setStep("member"); setAdminUnlocked(false); setPinInput(""); }
          else { setStep("pin"); setPinInput(""); setPinErro(false); }
        }}>
          {step === "admin" ? "← Sair" : "⚙️ Admin"}
        </button>
      </div>

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}

      <div style={{ width:"100%", maxWidth:480, padding:"20px 16px 0", boxSizing:"border-box" }}>

        {/* PIN SCREEN */}
        {step === "pin" && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🔒</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Acesso Admin</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:6 }}>Introduz o PIN para continuar</div>
            </div>

            {/* PIN dots display */}
            <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:28 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width:16, height:16, borderRadius:"50%",
                  background: pinInput.length > i ? "#e94560" : "rgba(255,255,255,0.15)",
                  border: `2px solid ${pinInput.length > i ? "#e94560" : "rgba(255,255,255,0.25)"}`,
                  transition:"all 0.15s",
                }} />
              ))}
            </div>

            {/* Numpad */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, maxWidth:260, margin:"0 auto" }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, idx) => (
                <button key={idx} style={{
                  background: k === "" ? "transparent" : "rgba(255,255,255,0.07)",
                  border: k === "" ? "none" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius:12, padding:"18px 0",
                  color:"#fff", fontSize:20, fontWeight:700, cursor: k === "" ? "default" : "pointer",
                  transition:"background 0.1s",
                  visibility: k === "" ? "hidden" : "visible",
                }}
                  onClick={() => {
                    if (k === "") return;
                    if (k === "⌫") {
                      setPinInput(p => p.slice(0,-1));
                      setPinErro(false);
                      return;
                    }
                    const novo = pinInput + String(k);
                    setPinInput(novo);
                    setPinErro(false);
                    if (novo.length === 4) {
                      if (novo === ADMIN_PIN) {
                        setAdminUnlocked(true);
                        setStep("admin");
                        setPinInput("");
                      } else {
                        setPinErro(true);
                        setTimeout(() => { setPinInput(""); setPinErro(false); }, 700);
                      }
                    }
                  }}
                >{k}</button>
              ))}
            </div>

            {pinErro && (
              <div style={{ textAlign:"center", marginTop:20, color:"#ef5350", fontWeight:700, fontSize:14 }}>
                PIN incorreto. Tenta novamente.
              </div>
            )}

            <button style={{ ...S.secondaryBtn, maxWidth:260, margin:"24px auto 0", display:"block" }}
              onClick={() => setStep("member")}>
              Cancelar
            </button>
          </div>
        )}

        {/* MEMBER SELECTION */}
        {step === "member" && (
          <div>
            <div style={{ ...S.sectionTitle, marginBottom:20 }}>👋 Quem és tu?</div>
            <div style={S.memberGrid}>
              {members.map(m => (
                <button key={m.id} style={S.memberBtn(selectedMember?.id === m.id)} onClick={() => setSelectedMember(m)}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{m.alcunha}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{m.nome}</div>
                </button>
              ))}
            </div>
            <button style={{ ...S.primaryBtn, opacity:selectedMember?1:0.4, marginTop:24 }}
              disabled={!selectedMember} onClick={() => setStep("product")}>
              Continuar →
            </button>
          </div>
        )}

        {/* PRODUCT SELECTION */}
        {step === "product" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
              <BackBtn to="member" />
              <div>
                <div style={S.sectionTitle}>O que vais tomar?</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                  {selectedMember?.alcunha} — {selectedMember?.nome}
                </div>
              </div>
            </div>
            <div style={S.catScroll}>
              {cats.map(cat => (
                <button key={cat} style={S.catChip(filterCat === cat)} onClick={() => setFilterCat(cat)}>{cat}</button>
              ))}
            </div>
            {filteredProducts.map(p => (
              <button key={p.id} style={S.productBtn(selectedProduct?.id === p.id)} onClick={() => setSelectedProduct(p)}>
                <div style={{ display:"flex", alignItems:"center" }}>
                  <span style={{ fontSize:22, marginRight:12 }}>{p.emoji}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{p.nome}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>
                      {p.cat.replace(/[^a-zA-Z ]/g, "").trim()}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:13, color:"#81c784", fontWeight:700 }}>€{p.preco.toFixed(2)}</div>
              </button>
            ))}
            <button style={{ ...S.primaryBtn, opacity:selectedProduct?1:0.4 }}
              disabled={!selectedProduct} onClick={() => setStep("confirm")}>
              Continuar →
            </button>
          </div>
        )}

        {/* CONFIRM */}
        {step === "confirm" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
              <BackBtn to="product" />
              <div style={S.sectionTitle}>Confirmar consumo</div>
            </div>
            <div style={S.confirmBox}>
              {[
                ["Pessoa",     selectedMember?.alcunha],
                ["Data/Hora",  new Date().toLocaleString("pt-PT")],
                ["Produto",    selectedProduct?.nome],
                ["Preço unit.",`€${selectedProduct?.preco.toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:14 }}>
                  <span style={{ color:"rgba(255,255,255,0.6)" }}>{l}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:14 }}>
                <span style={{ color:"rgba(255,255,255,0.6)" }}>Quantidade</span>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <button style={S.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span style={{ fontSize:24, fontWeight:800, minWidth:40, textAlign:"center" }}>{qty}</span>
                  <button style={S.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:12, marginTop:12 }}>
                <span style={{ fontSize:16, fontWeight:700 }}>Total</span>
                <span style={{ fontSize:20, fontWeight:800, color:"#81c784" }}>
                  €{(selectedProduct?.preco * qty).toFixed(2)}
                </span>
              </div>
            </div>
            <button style={S.primaryBtn} onClick={handleConfirm}>✓ Registar consumo</button>
            <button style={S.secondaryBtn} onClick={handleReset}>Cancelar</button>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div style={{ textAlign:"center", paddingTop:20 }}>
            <div style={{ fontSize:80 }}>✅</div>
            <div style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Registado!</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:14, marginBottom:6 }}>
              {selectedMember?.alcunha} — {qty}x {selectedProduct?.nome}
            </div>
            <div style={{ color:"#81c784", fontWeight:700, fontSize:18, marginBottom:24 }}>
              €{(selectedProduct?.preco * qty).toFixed(2)}
            </div>
            {sheetsAtivo && (
              <div style={{ fontSize:12, color:"#7986cb", marginBottom:16 }}>
                📊 Enviado para Google Sheets
              </div>
            )}
            <button style={S.primaryBtn} onClick={handleReset}>+ Novo registo</button>
          </div>
        )}

        {/* ADMIN */}
        {step === "admin" && (
          <div>
            <div style={S.sectionTitle}>⚙️ Painel Admin</div>
            <div style={S.tabRow}>
              {[["consumos","📋 Consumos"],["gastos","💰 Gastos"],["stock","📦 Stock"],["membros","👥 Membros"]].map(([v, l]) => (
                <button key={v} style={S.tab(adminView === v)} onClick={() => setAdminView(v)}>{l}</button>
              ))}
            </div>

            {/* CONSUMOS */}
            {adminView === "consumos" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{registos.length} registos</span>
                  <div style={{ display:"flex", gap:8 }}>
                    {sheetsAtivo && (
                      <button style={{ ...S.adminBtn, fontSize:12 }} onClick={syncFromSheets} disabled={syncing}>
                        {syncing ? "⏳" : "🔄"} {syncing ? "A sincronizar..." : "Sincronizar"}
                      </button>
                    )}
                    <button style={{ ...S.adminBtn, fontSize:12 }} onClick={downloadCSV}>⬇️ CSV</button>
                  </div>
                </div>
                {sheetsAtivo && lastSync && (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>
                    Última sincronização: {lastSync}
                  </div>
                )}
                {!sheetsAtivo && (
                  <div style={{ fontSize:11, color:"#ffd54f", background:"rgba(255,193,7,0.08)", border:"1px solid rgba(255,193,7,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                    🟡 Google Sheets não configurado — a funcionar em modo local.
                  </div>
                )}
                {registos.length === 0
                  ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:40 }}>Ainda sem registos</div>
                  : <div style={S.tableWrapper}>
                      <table style={S.table}>
                        <thead><tr>{["#","Data","Hora","Quem","Produto","Qtd","€"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {[...registos].reverse().map((r, i) => {
                            const partes = r.dataHora.split(", ");
                            const data = partes[0] || r.dataHora;
                            const hora = partes[1] || "";
                            return (
                              <tr key={r.id}>
                                <td style={S.td(i)}>{r.id}</td>
                                <td style={S.td(i)}>{data}</td>
                                <td style={{ ...S.td(i), color:"rgba(255,255,255,0.5)", fontSize:12 }}>{hora}</td>
                                <td style={S.td(i)}>{r.membroNome.split(" ")[0]}</td>
                                <td style={S.td(i)}>{r.produtoNome}</td>
                                <td style={S.td(i)}>{r.qtd}</td>
                                <td style={{ ...S.td(i), color:"#81c784", fontWeight:700 }}>€{r.total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            )}

            {/* GASTOS */}
            {adminView === "gastos" && (() => {
              // Filter registos by selected month
              const registosMes = registos.filter(r => {
                // dataHora format: "DD/MM/YYYY, HH:MM:SS" (pt-PT)
                const partes = r.dataHora.split(", ")[0].split("/");
                if (partes.length < 3) return false;
                const ano = partes[2]; const mes = partes[1].padStart(2,"0");
                return `${ano}-${mes}` === mesGastos;
              });

              const gastosMapMes = {};
              members.forEach(m => {
                const g = registosMes.filter(r => r.membroId === m.id);
                gastosMapMes[m.id] = {
                  total: +g.reduce((a,r) => a+r.total, 0).toFixed(2),
                  consumos: g.reduce((a,r) => a+r.qtd, 0),
                };
              });

              const totalMes = Object.values(gastosMapMes).reduce((a,b) => a+b.total, 0);

              // Available months from registos
              const mesesDisp = [...new Set(registos.map(r => {
                const p = r.dataHora.split(", ")[0].split("/");
                if (p.length < 3) return null;
                return `${p[2]}-${p[1].padStart(2,"0")}`;
              }).filter(Boolean))].sort().reverse();
              if (!mesesDisp.includes(mesGastos) && mesesDisp.length > 0) {
                // ensure current month always appears
              }
              const opcoesMes = [...new Set([mesGastos, ...mesesDisp])].sort().reverse();

              const [ano, mes] = mesGastos.split("-");
              const nomeMes = new Date(+ano, +mes-1, 1).toLocaleString("pt-PT", { month:"long", year:"numeric" });

              const exportarResumoMes = () => {
                try {
                  const linhas = [
                    `Resumo de Gastos — ${nomeMes}`,
                    "",
                    "Nome,Alcunha,Consumos,Total (€)",
                    ...[...members]
                      .sort((a,b) => (gastosMapMes[b.id]?.total||0)-(gastosMapMes[a.id]?.total||0))
                      .map(m => `"${m.nome}","${m.alcunha}",${gastosMapMes[m.id]?.consumos||0},${(gastosMapMes[m.id]?.total||0).toFixed(2)}`),
                    "",
                    `"TOTAL","",,${totalMes.toFixed(2)}`,
                  ];
                  const csv = linhas.join("\n");
                  const uri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                  const a = document.createElement("a");
                  a.href = uri;
                  a.download = `gastos_${mesGastos}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  showToast("Resumo exportado!");
                } catch(e) {
                  showToast("Erro ao exportar. Tenta novamente.", "error");
                }
              };

              return (
                <div>
                  {/* Seletor de mês */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <div style={{ flex:1 }}>
                      <label style={S.label}>MÊS</label>
                      <select value={mesGastos} onChange={e => setMesGastos(e.target.value)}
                        style={{ ...S.input, padding:"9px 14px", cursor:"pointer" }}>
                        {opcoesMes.map(m => {
                          const [a,mm] = m.split("-");
                          const label = new Date(+a, +mm-1, 1).toLocaleString("pt-PT", { month:"long", year:"numeric" });
                          return <option key={m} value={m}>{label.charAt(0).toUpperCase()+label.slice(1)}</option>;
                        })}
                      </select>
                    </div>
                    <div style={{ paddingTop:18 }}>
                      <button style={{ ...S.adminBtn, fontSize:12 }} onClick={exportarResumoMes}>
                        ⬇️ Exportar
                      </button>
                    </div>
                  </div>

                  {registosMes.length === 0 ? (
                    <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:40, border:"1px solid rgba(255,255,255,0.08)", borderRadius:10 }}>
                      Sem consumos registados em {nomeMes}.
                    </div>
                  ) : (
                    <>
                      <div style={S.tableWrapper}>
                        <table style={S.table}>
                          <thead>
                            <tr>{["Nome","Alcunha","Consumos","Total €"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {[...members]
                              .sort((a,b) => (gastosMapMes[b.id]?.total||0)-(gastosMapMes[a.id]?.total||0))
                              .map((m, i) => (
                              <tr key={m.id}>
                                <td style={S.td(i)}>{m.nome}</td>
                                <td style={S.td(i)}>{m.alcunha}</td>
                                <td style={S.td(i)}>{gastosMapMes[m.id]?.consumos||0}</td>
                                <td style={{ ...S.td(i), color: gastosMapMes[m.id]?.total > 0 ? "#81c784" : "rgba(255,255,255,0.3)", fontWeight:700 }}>
                                  €{(gastosMapMes[m.id]?.total||0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop:12, padding:14, background:"rgba(129,199,132,0.1)", border:"1px solid rgba(129,199,132,0.3)", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontWeight:700 }}>Total — {nomeMes.charAt(0).toUpperCase()+nomeMes.slice(1)}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{registosMes.length} registos</div>
                        </div>
                        <span style={{ color:"#81c784", fontWeight:800, fontSize:20 }}>€{totalMes.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* STOCK */}
            {adminView === "stock" && (
              <div>
                {/* Formulário novo produto */}
                <div style={S.formBox}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#7986cb", marginBottom:14, textTransform:"uppercase", letterSpacing:0.8 }}>
                    ➕ Adicionar produto
                  </div>
                  {/* Emoji picker */}
                  <div style={{ marginBottom:12 }}>
                    <label style={S.label}>ÍCONE</label>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => setNewProdEmoji(e)} style={{
                          background: newProdEmoji === e ? "rgba(233,69,96,0.3)" : "rgba(255,255,255,0.06)",
                          border: newProdEmoji === e ? "2px solid #e94560" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius:8, padding:"6px 10px", fontSize:18, cursor:"pointer",
                        }}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                    <div>
                      <label style={S.label}>NOME</label>
                      <input style={S.input} placeholder="ex: Heineken 33cl"
                        value={newProdNome} onChange={e => setNewProdNome(e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>CATEGORIA</label>
                      <input style={S.input} placeholder="ex: Cerveja"
                        value={newProdCat} onChange={e => setNewProdCat(e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>PREÇO (€)</label>
                      <input style={S.input} placeholder="ex: 1.50" type="number" min="0" step="0.10"
                        value={newProdPreco} onChange={e => setNewProdPreco(e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>STOCK INICIAL</label>
                      <input style={S.input} placeholder="ex: 24" type="number" min="0"
                        value={newProdStock} onChange={e => setNewProdStock(e.target.value)} />
                    </div>
                  </div>
                  <button style={{ ...S.primaryBtn, marginTop:4, padding:"11px 24px" }} onClick={handleAddProduct}>
                    + Adicionar produto
                  </button>
                </div>

                {/* Lista de produtos */}
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>
                  {products.length} produtos · clica "+ Repor" para reabastecer
                </div>
                <div style={S.tableWrapper}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Produto</th>
                        <th style={{ ...S.th, textAlign:"center" }}>Consumido</th>
                        <th style={{ ...S.th, textAlign:"center" }}>Stock</th>
                        <th style={{ ...S.th, textAlign:"center" }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.flatMap((p, i) => {
                        const s = stockAtual(p);
                        const baixo = s <= 5;
                        const expanded = expandedStock === p.id;
                        const rows = [
                          <tr key={p.id}>
                            <td style={S.td(i)}>
                              <div style={{ fontWeight:600 }}>{p.emoji} {p.nome}</div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>€{p.preco.toFixed(2)}</div>
                            </td>
                            <td style={{ ...S.td(i), textAlign:"center" }}>
                              {registos.filter(r => r.produtoId === p.id).reduce((a, r) => a + r.qtd, 0)}
                            </td>
                            <td style={{ ...S.td(i), textAlign:"center", color:baixo?"#ef5350":"#81c784", fontWeight:700 }}>
                              {s}{baixo && " ⚠️"}
                            </td>
                            <td style={{ ...S.td(i), textAlign:"center" }}>
                              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                                <button style={S.stockAddBtn} onClick={() => { setExpandedStock(expanded ? null : p.id); setConfirmDeleteProduct(null); }}>
                                  {expanded ? "✕" : "+ Repor"}
                                </button>
                                {confirmDeleteProduct === p.id ? (
                                  <>
                                    <button style={S.dangerBtnConfirm} onClick={() => handleDeleteProduct(p.id)}>✓</button>
                                    <button style={S.cancelBtn} onClick={() => setConfirmDeleteProduct(null)}>✕</button>
                                  </>
                                ) : (
                                  <button style={S.dangerBtn} onClick={() => { setConfirmDeleteProduct(p.id); setExpandedStock(null); }}>🗑</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ];
                        if (expanded) {
                          rows.push(
                            <tr key={`${p.id}-repor`}>
                              <td colSpan={4} style={{ background:"rgba(46,125,50,0.12)", border:"1px solid rgba(46,125,50,0.25)", padding:"16px" }}>
                                <div style={{ fontSize:12, color:"#a5d6a7", marginBottom:12, fontWeight:600 }}>
                                  Repor stock — {p.nome} (atual: {s})
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                  <div>
                                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>QTD A ADICIONAR</div>
                                    <input style={S.smallInput} type="number" min="1" placeholder="0"
                                      value={reposInput[p.id] || ""}
                                      onChange={e => setReposInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      onKeyDown={e => e.key === "Enter" && handleRepor(p.id)} />
                                  </div>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>STOCK APÓS REPOSIÇÃO</div>
                                    <div style={{ fontSize:18, fontWeight:800, color:"#81c784" }}>
                                      {s + (parseInt(reposInput[p.id] || "0") || 0)} unid.
                                    </div>
                                  </div>
                                  <button style={S.greenBtn} onClick={() => handleRepor(p.id)}>✓ Confirmar</button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
                  ⚠️ = stock ≤ 5 unidades
                </div>
              </div>
            )}

            {/* MEMBROS */}
            {adminView === "membros" && (
              <div>
                <div style={S.formBox}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#7986cb", marginBottom:14, textTransform:"uppercase", letterSpacing:0.8 }}>
                    ➕ Adicionar membro
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={S.label}>NOME COMPLETO</label>
                    <input style={S.input} placeholder="ex: Francisco Antunes"
                      value={newNome} onChange={e => setNewNome(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddMember()} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.label}>ALCUNHA</label>
                    <input style={S.input} placeholder="ex: Chico"
                      value={newAlcunha} onChange={e => setNewAlcunha(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddMember()} />
                  </div>
                  <button style={{ ...S.primaryBtn, marginTop:0, padding:"11px 24px" }} onClick={handleAddMember}>
                    + Adicionar
                  </button>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", marginBottom:10, textTransform:"uppercase", letterSpacing:0.8 }}>
                  {members.length} membros registados
                </div>
                <div style={S.tableWrapper}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Alcunha</th>
                        <th style={S.th}>Nome</th>
                        <th style={S.th}>Consumos</th>
                        <th style={{ ...S.th, textAlign:"center" }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr key={m.id}>
                          <td style={{ ...S.td(i), fontWeight:700 }}>{m.alcunha}</td>
                          <td style={S.td(i)}>{m.nome}</td>
                          <td style={S.td(i)}>{gastosMap[m.id]?.consumos || 0}</td>
                          <td style={{ ...S.td(i), textAlign:"center" }}>
                            {confirmDeleteMember === m.id ? (
                              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                                <button style={S.dangerBtnConfirm} onClick={() => handleDeleteMember(m.id)}>Confirmar</button>
                                <button style={S.cancelBtn} onClick={() => setConfirmDeleteMember(null)}>Não</button>
                              </div>
                            ) : (
                              <button style={S.dangerBtn} onClick={() => setConfirmDeleteMember(m.id)}>🗑 Remover</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
