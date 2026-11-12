"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Sparkles,
  Send,
  RefreshCw,
  Bell,
  Terminal,
  Upload,
  ShieldCheck,
  Plus,
  ExternalLink,
  QrCode,
  ArrowRight,
  FileText,
  Layers,
  Table2,
  Trash2,
  Palette,
  SlidersHorizontal,
  Users,
  Briefcase,
  PartyPopper,
} from "lucide-react";

type Person = {
  id: string;
  name: string;
  email: string;
  color: string;
};

type LineItem = {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
};

type IssuedInvoice = {
  invoiceId: string;
  personName: string;
  recipientEmail: string;
  amount: string;
  items: { name: string; share: number }[];
  status: string;
  sandboxMode: string;
  payerViewUrl: string;
  createdAt: string;
  remindedAt?: string;
};

type Workspace = {
  id: string;
  name: string;
  badge: string;
  mode: "receipt" | "freelance";
  merchantOrTitle: string;
  promptText: string;
  tax: number;
  tip: number;
  summaryNote: string;
  people: Person[];
  items: LineItem[];
  invoices: IssuedInvoice[];
};

type ApiTrace = {
  timestamp: string;
  endpoint: string;
  status: string;
};

type ThemeKey = "aurora" | "cosmic" | "azure" | "paper";

const AVATAR_COLORS = [
  "bg-[#0070BA] text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-purple-600 text-white",
];

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: "ws_roommates",
    name: "Roommates & Dinner",
    badge: "Personal Split",
    mode: "receipt",
    merchantOrTitle: "Toit Brewpub — Friday Squad Dinner",
    promptText:
      "Shourya had the Pepperoni Pizza, split the Paneer Tikka, Garlic Naan, and Cold Coffees equally between Harshit, Shourya, and Prem.",
    tax: 4.8,
    tip: 7.2,
    summaryNote: "Roommate & friends workspace — click any pill or table cell to customize splits.",
    people: [
      { id: "p1", name: "Harshit", email: "harshit.buyer@sandbox.paypal.com", color: AVATAR_COLORS[0] },
      { id: "p2", name: "Shourya", email: "shourya.buyer@sandbox.paypal.com", color: AVATAR_COLORS[1] },
      { id: "p3", name: "Prem", email: "prem.buyer@sandbox.paypal.com", color: AVATAR_COLORS[2] },
    ],
    items: [
      { id: "i1", name: "Smoked Paneer Tikka", price: 18.0, assignedTo: ["p1", "p2", "p3"] },
      { id: "i2", name: "Woodfired Pepperoni Pizza", price: 22.0, assignedTo: ["p2"] },
      { id: "i3", name: "3x Iced Craft Cold Coffee", price: 15.0, assignedTo: ["p1", "p2", "p3"] },
      { id: "i4", name: "Truffle Garlic Naan Basket", price: 9.0, assignedTo: ["p1", "p2", "p3"] },
    ],
    invoices: [],
  },
  {
    id: "ws_freelance",
    name: "Freelance Clients",
    badge: "B2B Billing",
    mode: "freelance",
    merchantOrTitle: "Next.js & PayPal Sprint — Milestone #1",
    promptText:
      "Bill alex.client@sandbox.paypal.com for Next.js Landing Page ($140), PayPal Checkout Integration ($85), and Rush Weekend Delivery ($35). Add $15 tax.",
    tax: 15.0,
    tip: 0,
    summaryNote: "Client invoicing workspace — turns WhatsApp/Slack scopes into formal PayPal invoices.",
    people: [
      { id: "c1", name: "Alex Rivera (Client)", email: "alex.client@sandbox.paypal.com", color: AVATAR_COLORS[0] },
      { id: "c2", name: "Studio Ops Co-Pay", email: "finance.ops@sandbox.paypal.com", color: AVATAR_COLORS[4] },
    ],
    items: [
      { id: "f1", name: "Next.js Full-Stack Architecture", price: 140.0, assignedTo: ["c1"] },
      { id: "f2", name: "PayPal Invoicing v2 API Integration", price: 85.0, assignedTo: ["c1"] },
      { id: "f3", name: "Weekend Express Deployment", price: 35.0, assignedTo: ["c2"] },
    ],
    invoices: [],
  },
  {
    id: "ws_party",
    name: "Party & Neighbors",
    badge: "Event Pool",
    mode: "receipt",
    merchantOrTitle: "Society Rooftop Party & Sound Rental",
    promptText:
      "Split DJ & Sound System, Fairy Lights, and Catering equally across Rohan, Aditi, Kabir, and Neha.",
    tax: 6.5,
    tip: 10.0,
    summaryNote: "Neighborhood & event pooling workspace — batch-collect contributions in one click.",
    people: [
      { id: "n1", name: "Rohan (Flat 302)", email: "rohan.302@sandbox.paypal.com", color: AVATAR_COLORS[0] },
      { id: "n2", name: "Aditi (Flat 405)", email: "aditi.405@sandbox.paypal.com", color: AVATAR_COLORS[1] },
      { id: "n3", name: "Kabir (Flat 104)", email: "kabir.104@sandbox.paypal.com", color: AVATAR_COLORS[2] },
      { id: "n4", name: "Neha (Flat 201)", email: "neha.201@sandbox.paypal.com", color: AVATAR_COLORS[3] },
    ],
    items: [
      { id: "e1", name: "JBL PartyBox & Mic Rental", price: 48.0, assignedTo: ["n1", "n2", "n3", "n4"] },
      { id: "e2", name: "Rooftop barbecue & Beverage Crate", price: 64.0, assignedTo: ["n1", "n2", "n3", "n4"] },
      { id: "e3", name: "Warm Ambient String Lighting", price: 24.0, assignedTo: ["n1", "n2"] },
    ],
    invoices: [],
  },
];

export default function PayPalWorkbench() {
  // Visual Theme & Layout Customizer State
  const [theme, setTheme] = useState<ThemeKey>("aurora");
  const [centerView, setCenterView] = useState<"table" | "receipt">("table");
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Customizable Table Columns
  const [visibleCols, setVisibleCols] = useState({
    unitShare: true,
    splitRatio: true,
    taxTipCol: true,
    payerEmail: true,
  });

  // Multi-Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWsId, setActiveWsId] = useState<string>("ws_roommates");
  const [newWsName, setNewWsName] = useState("");
  const [showNewWsInput, setShowNewWsInput] = useState(false);

  const activeWs = useMemo(
    () => workspaces.find((w) => w.id === activeWsId) || workspaces[0],
    [workspaces, activeWsId]
  );

  const updateActiveWs = (updater: (ws: Workspace) => Workspace) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === activeWs.id ? updater(w) : w)));
  };

  // Upload & Processing States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [isExtracting, setIsExtracting] = useState(false);
  const [policyApproved, setPolicyApproved] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeQrInvoice, setActiveQrInvoice] = useState<string | null>(null);

  // Add Participant & Custom Row States
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");
  const [newRowName, setNewRowName] = useState("");
  const [newRowPrice, setNewRowPrice] = useState("");

  // Live API Telemetry
  const [traces, setTraces] = useState<ApiTrace[]>([
    {
      timestamp: new Date().toISOString(),
      endpoint: "WORKSPACE ENGINE READY — Multi-Workspace + PayPal Invoicing v2 Sandbox",
      status: "ONLINE",
    },
  ]);

  // Create a brand new isolated workspace
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const id = `ws_${Date.now()}`;
    const created: Workspace = {
      id,
      name: newWsName.trim(),
      badge: "Custom Space",
      mode: "receipt",
      merchantOrTitle: `${newWsName.trim()} — Shared Ledger`,
      promptText: "Split all items equally among everyone.",
      tax: 0,
      tip: 0,
      summaryNote: `Custom workspace "${newWsName.trim()}" initialized. Add rows and participants below.`,
      people: [
        { id: "p1", name: "Member 1", email: "member1@sandbox.paypal.com", color: AVATAR_COLORS[0] },
        { id: "p2", name: "Member 2", email: "member2@sandbox.paypal.com", color: AVATAR_COLORS[1] },
      ],
      items: [
        { id: `row_${Date.now()}`, name: "Initial Shared Expense", price: 30.0, assignedTo: ["p1", "p2"] },
      ],
      invoices: [],
    };
    setWorkspaces((prev) => [...prev, created]);
    setActiveWsId(id);
    setNewWsName("");
    setShowNewWsInput(false);
    setPolicyApproved(false);
  };

  // Toggle person assignment on a row
  const toggleAssignment = (itemId: string, personId: string) => {
    updateActiveWs((ws) => ({
      ...ws,
      items: ws.items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedTo.includes(personId);
        if (exists && item.assignedTo.length === 1) return item;
        const updated = exists
          ? item.assignedTo.filter((id) => id !== personId)
          : [...item.assignedTo, personId];
        return { ...item, assignedTo: updated };
      }),
    }));
    setPolicyApproved(false);
  };

  // Inline Edit Row Name or Price
  const updateRowField = (itemId: string, field: "name" | "price", value: string) => {
    updateActiveWs((ws) => ({
      ...ws,
      items: ws.items.map((it) => {
        if (it.id !== itemId) return it;
        return field === "name" ? { ...it, name: value } : { ...it, price: Math.max(0, Number(value) || 0) };
      }),
    }));
    setPolicyApproved(false);
  };

  // Add Custom Row to Table
  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowName.trim()) return;
    const priceVal = parseFloat(newRowPrice) || 15.0;
    const allIds = activeWs.people.map((p) => p.id);
    updateActiveWs((ws) => ({
      ...ws,
      items: [
        ...ws.items,
        {
          id: `item_${Date.now()}`,
          name: newRowName.trim(),
          price: priceVal,
          assignedTo: allIds.length > 0 ? allIds : ["p1"],
        },
      ],
    }));
    setNewRowName("");
    setNewRowPrice("");
    setPolicyApproved(false);
  };

  // Delete Row from Table
  const handleDeleteRow = (itemId: string) => {
    if (activeWs.items.length <= 1) return;
    updateActiveWs((ws) => ({
      ...ws,
      items: ws.items.filter((it) => it.id !== itemId),
    }));
    setPolicyApproved(false);
  };

  // Add Participant to Active Workspace
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const id = `p_${Date.now()}`;
    const email =
      newPersonEmail.trim() ||
      `${newPersonName.toLowerCase().replace(/\s+/g, ".")}@sandbox.paypal.com`;
    updateActiveWs((ws) => ({
      ...ws,
      people: [
        ...ws.people,
        {
          id,
          name: newPersonName.trim(),
          email,
          color: AVATAR_COLORS[ws.people.length % AVATAR_COLORS.length],
        },
      ],
    }));
    setNewPersonName("");
    setNewPersonEmail("");
  };

  // Remove Participant
  const handleRemovePerson = (personId: string) => {
    if (activeWs.people.length <= 1) return;
    const fallbackId = activeWs.people.find((p) => p.id !== personId)?.id || "p1";
    updateActiveWs((ws) => ({
      ...ws,
      people: ws.people.filter((p) => p.id !== personId),
      items: ws.items.map((it) => {
        const filtered = it.assignedTo.filter((id) => id !== personId);
        return { ...it, assignedTo: filtered.length > 0 ? filtered : [fallbackId] };
      }),
    }));
  };

  // Proportional Split Calculation
  const splitBreakdown = useMemo(() => {
    const subtotal = activeWs.items.reduce((acc, it) => acc + it.price, 0);
    return activeWs.people.map((person) => {
      const personItems: { name: string; share: number }[] = [];
      let personSubtotal = 0;

      activeWs.items.forEach((item) => {
        if (item.assignedTo.includes(person.id)) {
          const share = item.price / item.assignedTo.length;
          personSubtotal += share;
          personItems.push({
            name:
              item.assignedTo.length > 1
                ? `${item.name} (1/${item.assignedTo.length} split)`
                : item.name,
            share,
          });
        }
      });

      const proportion = subtotal > 0 ? personSubtotal / subtotal : 0;
      const personTax = activeWs.tax * proportion;
      const personTip = activeWs.tip * proportion;
      const total = personSubtotal + personTax + personTip;

      if (personTax + personTip > 0.01) {
        personItems.push({
          name: "Proportional Tax & Gratuity",
          share: personTax + personTip,
        });
      }

      return {
        ...person,
        subtotal: personSubtotal,
        taxShare: personTax,
        tipShare: personTip,
        proportionPct: Math.round(proportion * 100),
        total,
        items: personItems,
      };
    });
  }, [activeWs]);

  const grandTotal = useMemo(() => {
    const sub = activeWs.items.reduce((s, i) => s + i.price, 0);
    return sub + activeWs.tax + activeWs.tip;
  }, [activeWs]);

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // AI Extraction
  const handleRunAiExtraction = async () => {
    setIsExtracting(true);
    setPolicyApproved(false);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: imagePreview && activeWs.mode === "receipt" ? "image" : "text",
          textPrompt: activeWs.promptText,
          imageBase64: imagePreview,
          mimeType: imageMime,
          existingPeople: activeWs.people,
          existingItems: activeWs.items,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) throw new Error(json.error || "Extraction failed");

      const d = json.data;
      updateActiveWs((ws) => ({
        ...ws,
        merchantOrTitle: d.merchantOrTitle || ws.merchantOrTitle,
        tax: typeof d.tax === "number" ? d.tax : ws.tax,
        tip: typeof d.tip === "number" ? d.tip : ws.tip,
        summaryNote: d.summaryNote || ws.summaryNote,
        people:
          Array.isArray(d.people) && d.people.length > 0
            ? d.people.map((p: any, idx: number) => ({
                id: p.id || `p${idx + 1}`,
                name: p.name || `Person ${idx + 1}`,
                email:
                  p.email ||
                  `${(p.name || "user").toLowerCase().replace(/\s+/g, ".")}@sandbox.paypal.com`,
                color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
              }))
            : ws.people,
        items:
          Array.isArray(d.items) && d.items.length > 0
            ? d.items.map((it: any, idx: number) => ({
                id: it.id || `item_${idx + 1}`,
                name: it.name || "Line Item",
                price: Number(it.price) || 0,
                assignedTo:
                  Array.isArray(it.assignedTo) && it.assignedTo.length > 0
                    ? it.assignedTo
                    : [d.people?.[0]?.id || ws.people[0]?.id || "p1"],
              }))
            : ws.items,
      }));

      if (json.trace) setTraces((prev) => [json.trace, ...prev]);
    } catch (err: any) {
      alert(`AI Extraction Notice: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Dispatch PayPal Invoices for Active Workspace
  const handleDispatchPayPalInvoices = async () => {
    if (!policyApproved) return;
    setIsDispatching(true);
    try {
      const res = await fetch("/api/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_invoices",
          merchantOrTitle: activeWs.merchantOrTitle,
          splits: splitBreakdown,
        }),
      });
      const data = await res.json();
      if (data.invoices) {
        updateActiveWs((ws) => ({
          ...ws,
          invoices: [...data.invoices, ...ws.invoices],
        }));
      }
      if (data.traces) setTraces((prev) => [...data.traces, ...prev]);
    } catch (err: any) {
      alert(`PayPal Dispatch Error: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Sync Paid Status
  const handleSyncStatus = async (invoiceId: string) => {
    const res = await fetch("/api/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_status", invoiceId, simulatePaid: true }),
    });
    const data = await res.json();
    if (data.status) {
      updateActiveWs((ws) => ({
        ...ws,
        invoices: ws.invoices.map((inv) =>
          inv.invoiceId === invoiceId ? { ...inv, status: data.status } : inv
        ),
      }));
    }
    if (data.trace) setTraces((prev) => [data.trace, ...prev]);
  };

  // Send Reminder
  const handleRemind = async (inv: IssuedInvoice) => {
    const res = await fetch("/api/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remind_invoice",
        invoiceId: inv.invoiceId,
        personName: inv.personName,
        amount: inv.amount,
      }),
    });
    const data = await res.json();
    if (data.remindedAt) {
      updateActiveWs((ws) => ({
        ...ws,
        invoices: ws.invoices.map((item) =>
          item.invoiceId === inv.invoiceId ? { ...item, remindedAt: data.remindedAt } : item
        ),
      }));
    }
    if (data.trace) setTraces((prev) => [data.trace, ...prev]);
  };

  // Dynamic Theme Styles (Glassmorphism + Minimalist Textures)
  const isDark = theme === "cosmic" || theme === "azure";

  const themeWrapperClass = {
    aurora:
      "bg-[radial-gradient(ellipse_at_top_left,_#f5d0fe_0%,_#e0f2fe_45%,_#fef3c7_100%)] text-slate-900",
    cosmic:
      "bg-[#070B19] bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:24px_24px] text-slate-100",
    azure:
      "bg-[linear-gradient(135deg,#041C32_0%,#04293A_50%,#064663_100%)] bg-[linear-gradient(to_right,#38bdf818_1px,transparent_1px),linear-gradient(to_bottom,#38bdf818_1px,transparent_1px)] [background-size:32px_32px] text-slate-100",
    paper: "bg-[#F7F6F2] text-[#111111]",
  }[theme];

  const glassCardClass = {
    aurora:
      "bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_8px_32px_rgba(31,38,135,0.08)]",
    cosmic:
      "bg-slate-900/65 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
    azure:
      "bg-sky-950/55 backdrop-blur-xl border border-sky-400/25 shadow-[0_8px_32px_rgba(2,132,199,0.25)]",
    paper: "bg-white border border-stone-300 shadow-xs",
  }[theme];

  const subCardClass = isDark
    ? "bg-white/5 border border-white/10 text-slate-100"
    : "bg-white/80 border border-stone-200/80 text-slate-900";

  const inputClass = isDark
    ? "bg-slate-950/60 border border-white/20 text-white placeholder:text-slate-400"
    : "bg-white/90 border border-stone-300 text-slate-900 placeholder:text-stone-400";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${themeWrapperClass}`}>
      {/* TOP BAR — Brand Emblem + Theme Switcher */}
      <header
        className={`sticky top-0 z-30 px-6 py-3 border-b transition ${
          isDark
            ? "bg-slate-950/70 border-white/10 backdrop-blur-xl"
            : "bg-white/65 border-white/60 backdrop-blur-xl"
        }`}
      >
        <div className="max-w-[1480px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003087] to-[#0070BA] border border-white/30 text-white flex items-center justify-center shadow-md relative overflow-hidden">
              <Receipt className="w-5 h-5 text-amber-300" />
              <span className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold tracking-tight text-lg">
                  Appie · PayPal Split &amp; Bill OS
                </h1>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0070BA]/20 text-[#0070BA] dark:text-sky-300 font-semibold border border-[#0070BA]/30">
                  Invoicing v2 Live
                </span>
              </div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Multi-Workspace Commercial Billing · Custom Glass Tables · Live PayPal Sandbox
              </p>
            </div>
          </div>

          {/* Interactive Background & Texture Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono opacity-75 flex items-center gap-1 mr-1">
              <Palette className="w-3.5 h-3.5" /> Surface Theme:
            </span>
            {(
              [
                { id: "aurora", label: "🌈 Frosted Glass" },
                { id: "cosmic", label: "✨ Cosmic Starlight" },
                { id: "azure", label: "♟️ Azure Grid" },
                { id: "paper", label: "🧾 Paper Ledger" },
              ] as { id: ThemeKey; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  theme === t.id
                    ? "bg-[#0070BA] text-white border-[#0070BA] shadow-sm"
                    : isDark
                    ? "bg-white/5 border-white/15 hover:bg-white/10 text-slate-200"
                    : "bg-white/70 border-stone-300 hover:bg-white text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MULTI-WORKSPACE SWITCHER BAR */}
      <div className="max-w-[1480px] w-full mx-auto px-6 pt-5 pb-1">
        <div className={`rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-3 ${glassCardClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 opacity-70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Workspaces:
            </span>

            {workspaces.map((ws) => {
              const active = ws.id === activeWs.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWsId(ws.id);
                    setPolicyApproved(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    active
                      ? "bg-[#003087] text-white shadow-md scale-[1.01]"
                      : isDark
                      ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      : "bg-white/70 hover:bg-white text-slate-700 border border-stone-200/80"
                  }`}
                >
                  {ws.id === "ws_roommates" && <Users className="w-3.5 h-3.5" />}
                  {ws.id === "ws_freelance" && <Briefcase className="w-3.5 h-3.5" />}
                  {ws.id === "ws_party" && <PartyPopper className="w-3.5 h-3.5" />}
                  <span>{ws.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-black/10 opacity-75"
                    }`}
                  >
                    {ws.people.length}p · {ws.items.length} rows
                  </span>
                </button>
              );
            })}

            {showNewWsInput ? (
              <form onSubmit={handleCreateWorkspace} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Workspace Name (e.g. Goa Trip)"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg ${inputClass}`}
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewWsInput(false)}
                  className="text-xs px-2 py-1.5 opacity-70 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowNewWsInput(true)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border border-dashed flex items-center gap-1 transition cursor-pointer ${
                  isDark
                    ? "border-white/25 hover:border-white/50 text-slate-300"
                    : "border-stone-400 hover:border-stone-600 text-stone-700"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> New Workspace
              </button>
            )}
          </div>

          <div className="text-xs font-mono opacity-75 pr-2">
            Active Ledger: <strong>${grandTotal.toFixed(2)} USD</strong> ({activeWs.invoices.length} invoices sent)
          </div>
        </div>
      </div>

      {/* MAIN 3-COLUMN WORKBENCH */}
      <main className="flex-1 max-w-[1480px] w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1 (3 cols): AI CAPTURE & PAYER ROSTER */}
        <section className="lg:col-span-3 space-y-5">
          <div className={`rounded-2xl p-5 ${glassCardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider opacity-70 font-semibold">
                01 / Capture Input
              </span>
              <div className="inline-flex rounded-lg p-0.5 bg-black/10 text-xs">
                <button
                  onClick={() => updateActiveWs((w) => ({ ...w, mode: "receipt" }))}
                  className={`px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeWs.mode === "receipt" ? "bg-[#0070BA] text-white" : "opacity-75"
                  }`}
                >
                  Receipt
                </button>
                <button
                  onClick={() => updateActiveWs((w) => ({ ...w, mode: "freelance" }))}
                  className={`px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeWs.mode === "freelance" ? "bg-[#0070BA] text-white" : "opacity-75"
                  }`}
                >
                  DM Scope
                </button>
              </div>
            </div>

            {activeWs.mode === "receipt" && (
              <label className="block border-2 border-dashed border-current/25 hover:border-[#0070BA] rounded-xl p-3.5 text-center cursor-pointer transition mb-3">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {imagePreview ? (
                  <div className="space-y-1.5">
                    <img
                      src={imagePreview}
                      alt="Uploaded receipt"
                      className="max-h-28 mx-auto rounded object-contain"
                    />
                    <p className="text-[11px] text-[#0070BA] font-medium">Replace receipt image</p>
                  </div>
                ) : (
                  <div className="py-2 space-y-1">
                    <Upload className="w-5 h-5 mx-auto opacity-60" />
                    <p className="text-xs font-medium">Drop receipt photo or browse</p>
                    <p className="text-[10px] opacity-60">Auto-populates workspace rows</p>
                  </div>
                )}
              </label>
            )}

            <label className="block text-xs font-medium opacity-80 mb-1">
              AI Split Rule / Freelance Billing Message:
            </label>
            <textarea
              rows={3}
              value={activeWs.promptText}
              onChange={(e) => updateActiveWs((w) => ({ ...w, promptText: e.target.value }))}
              className={`w-full rounded-xl p-2.5 text-xs font-mono focus:outline-none ${inputClass}`}
            />

            <button
              onClick={handleRunAiExtraction}
              disabled={isExtracting}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#003087] to-[#0070BA] hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isExtracting ? "Parsing Workspace Rows..." : "AI Auto-Split & Populate Rows"}
            </button>
          </div>

          {/* Workspace Payer Roster */}
          <div className={`rounded-2xl p-5 ${glassCardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider opacity-70 font-semibold">
                02 / Workspace Roster
              </span>
              <span className="text-[11px] font-mono opacity-70">{activeWs.people.length} payers</span>
            </div>

            <div className="space-y-2 mb-4">
              {activeWs.people.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl ${subCardClass}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${p.color}`}
                    >
                      {p.name.charAt(0)}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-[10px] font-mono opacity-65 truncate">{p.email}</p>
                    </div>
                  </div>
                  {activeWs.people.length > 1 && (
                    <button
                      onClick={() => handleRemovePerson(p.id)}
                      className="opacity-40 hover:opacity-100 hover:text-rose-500 p-1 cursor-pointer"
                      title="Remove person"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPerson} className="space-y-2 pt-2 border-t border-current/10">
              <input
                type="text"
                placeholder="Name (e.g. Neighbor / Client)"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs ${inputClass}`}
              />
              <input
                type="email"
                placeholder="PayPal Email (optional)"
                value={newPersonEmail}
                onChange={(e) => setNewPersonEmail(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono ${inputClass}`}
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-current/10 hover:bg-current/15 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add to {activeWs.name}
              </button>
            </form>
          </div>
        </section>

        {/* COLUMN 2 (5 cols): CUSTOMIZABLE TABLE & TACTILE RECEIPT MATRIX */}
        <section className="lg:col-span-5 space-y-4">
          <div className={`rounded-2xl p-5 ${glassCardClass}`}>
            {/* Matrix Header & View / Column Customizer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-current/10">
              <div className="flex-1 min-w-[200px]">
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 block">
                  {activeWs.badge} · INTERACTIVE LEDGER
                </span>
                <input
                  value={activeWs.merchantOrTitle}
                  onChange={(e) =>
                    updateActiveWs((w) => ({ ...w, merchantOrTitle: e.target.value }))
                  }
                  className="font-bold text-base bg-transparent border-b border-transparent hover:border-current/30 focus:border-[#0070BA] focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setCenterView(centerView === "table" ? "receipt" : "table")}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-current/20 hover:bg-current/5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  {centerView === "table" ? "Receipt Mode" : "Table Mode"}
                </button>

                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-current/20 hover:bg-current/5 flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Columns
                </button>

                {showColumnMenu && (
                  <div
                    className={`absolute right-0 top-10 z-20 w-52 rounded-xl p-3 space-y-2 text-xs shadow-xl ${
                      isDark ? "bg-slate-900 border border-white/20" : "bg-white border border-stone-300"
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase opacity-60">
                      Customize Ledger Columns
                    </p>
                    {[
                      { key: "unitShare", label: "Show Per-Person $ Share" },
                      { key: "splitRatio", label: "Show Split Ratio Badge" },
                      { key: "taxTipCol", label: "Show Proportional Tax/Tip" },
                      { key: "payerEmail", label: "Show Sandbox Payer Email" },
                    ].map((col) => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(visibleCols as any)[col.key]}
                          onChange={(e) =>
                            setVisibleCols((prev) => ({ ...prev, [col.key]: e.target.checked }))
                          }
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOMIZABLE SPREADSHEET TABLE VIEW */}
            {centerView === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-current/15 text-[11px] font-mono uppercase opacity-70">
                      <th className="py-2 pr-2">Row Item (Editable)</th>
                      <th className="py-2 px-2 w-24">Price ($)</th>
                      <th className="py-2 px-2">Assigned Payers (Click to Toggle)</th>
                      {visibleCols.splitRatio && <th className="py-2 px-2 text-right">Ratio</th>}
                      <th className="py-2 pl-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-current/10 text-xs">
                    {activeWs.items.map((item) => (
                      <tr key={item.id} className="group hover:bg-current/5 transition">
                        <td className="py-2.5 pr-2">
                          <input
                            value={item.name}
                            onChange={(e) => updateRowField(item.id, "name", e.target.value)}
                            className="font-semibold bg-transparent border-b border-transparent focus:border-[#0070BA] focus:outline-none w-full"
                          />
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold">
                          <div className="flex items-center">
                            <span>$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={item.price}
                              onChange={(e) => updateRowField(item.id, "price", e.target.value)}
                              className="w-16 bg-transparent border-b border-transparent focus:border-[#0070BA] focus:outline-none font-mono"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex flex-wrap gap-1">
                            {activeWs.people.map((person) => {
                              const active = item.assignedTo.includes(person.id);
                              return (
                                <button
                                  key={person.id}
                                  onClick={() => toggleAssignment(item.id, person.id)}
                                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1 ${
                                    active
                                      ? `${person.color} shadow-xs`
                                      : "bg-current/10 opacity-50 hover:opacity-90"
                                  }`}
                                >
                                  <span>{person.name}</span>
                                  {active && visibleCols.unitShare && (
                                    <span className="font-mono text-[10px] opacity-90">
                                      ${(item.price / item.assignedTo.length).toFixed(2)}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        {visibleCols.splitRatio && (
                          <td className="py-2.5 px-2 text-right font-mono text-[11px] opacity-75">
                            1/{item.assignedTo.length}
                          </td>
                        )}
                        <td className="py-2.5 pl-1 text-right">
                          {activeWs.items.length > 1 && (
                            <button
                              onClick={() => handleDeleteRow(item.id)}
                              className="opacity-30 hover:opacity-100 hover:text-rose-500 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TACTILE THERMAL RECEIPT VIEW */
              <div className="space-y-2.5">
                {activeWs.items.map((item) => (
                  <div key={item.id} className={`p-3 rounded-xl ${subCardClass}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{item.name}</span>
                      <span className="font-mono text-xs font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeWs.people.map((person) => {
                        const active = item.assignedTo.includes(person.id);
                        return (
                          <button
                            key={person.id}
                            onClick={() => toggleAssignment(item.id, person.id)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium cursor-pointer ${
                              active ? person.color : "bg-current/10 opacity-55"
                            }`}
                          >
                            {person.name}{" "}
                            {active && visibleCols.unitShare
                              ? `$${(item.price / item.assignedTo.length).toFixed(2)}`
                              : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* + ADD CUSTOM ROW BAR */}
            <form
              onSubmit={handleAddRow}
              className="mt-4 pt-3 border-t border-current/10 flex flex-wrap items-center gap-2"
            >
              <input
                type="text"
                placeholder="+ Add custom row item (e.g. Dessert / Hosting Fee)"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                className={`flex-1 min-w-[180px] rounded-lg px-3 py-1.5 text-xs ${inputClass}`}
              />
              <input
                type="number"
                step="0.5"
                placeholder="Price ($)"
                value={newRowPrice}
                onChange={(e) => setNewRowPrice(e.target.value)}
                className={`w-24 rounded-lg px-2.5 py-1.5 text-xs font-mono ${inputClass}`}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#0070BA] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </form>

            {/* Subtotal, Tax, Tip & Grand Total Footer */}
            <div className="mt-5 pt-4 border-t border-dashed border-current/20 space-y-2 font-mono text-xs">
              <div className="flex justify-between opacity-75">
                <span>SUBTOTAL ({activeWs.items.length} ROWS)</span>
                <span>${activeWs.items.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center opacity-80">
                <span>TAX (PROPORTIONAL)</span>
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activeWs.tax}
                    onChange={(e) =>
                      updateActiveWs((w) => ({ ...w, tax: Number(e.target.value) || 0 }))
                    }
                    className={`w-16 text-right rounded px-1.5 py-0.5 ${inputClass}`}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center opacity-80">
                <span>TIP / POOL FEE</span>
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.5"
                    value={activeWs.tip}
                    onChange={(e) =>
                      updateActiveWs((w) => ({ ...w, tip: Number(e.target.value) || 0 }))
                    }
                    className={`w-16 text-right rounded px-1.5 py-0.5 ${inputClass}`}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-current/20">
                <span>WORKSPACE TOTAL LEDGER</span>
                <span>${grandTotal.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </section>

        {/* COLUMN 3 (4 cols): HUMAN GUARDRAIL & LIVE PAYPAL INVOICES */}
        <section className="lg:col-span-4 space-y-5">
          <div className={`rounded-2xl p-5 ${glassCardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider opacity-70 font-semibold">
                03 / Workspace Split Summary
              </span>
              <ShieldCheck className="w-4 h-4 text-[#0070BA]" />
            </div>

            <div className="space-y-2.5 mb-4">
              {splitBreakdown.map((sp) => (
                <div
                  key={sp.id}
                  className={`p-3 rounded-xl flex items-center justify-between ${subCardClass}`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{sp.name}</span>
                      {visibleCols.splitRatio && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0070BA]/15 text-[#0070BA] dark:text-sky-300">
                          {sp.proportionPct}% share
                        </span>
                      )}
                    </div>
                    {visibleCols.payerEmail && (
                      <p className="text-[11px] font-mono opacity-65">{sp.email}</p>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-[#0070BA] dark:text-sky-300">
                      ${sp.total.toFixed(2)}
                    </span>
                    {visibleCols.taxTipCol && (
                      <span className="block text-[10px] opacity-60">
                        +${(sp.taxShare + sp.tipShare).toFixed(2)} tax/tip
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0070BA]/10 border border-[#0070BA]/30 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={policyApproved}
                onChange={(e) => setPolicyApproved(e.target.checked)}
                className="mt-0.5 accent-[#0070BA]"
              />
              <span className="text-xs leading-snug">
                <strong>Human-in-the-Loop Authorization:</strong> I approve dispatching{" "}
                <span className="font-mono font-bold">
                  {splitBreakdown.filter((s) => s.total > 0).length} PayPal Invoices ($
                  {grandTotal.toFixed(2)} USD)
                </span>{" "}
                for workspace <strong>{activeWs.name}</strong>.
              </span>
            </label>

            <button
              onClick={handleDispatchPayPalInvoices}
              disabled={!policyApproved || isDispatching}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#003087] to-[#0070BA] hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              {isDispatching
                ? "Calling PayPal Invoicing v2 Sandbox..."
                : `Approve & Issue ${splitBreakdown.filter((s) => s.total > 0).length} PayPal Invoices`}
            </button>
          </div>

          {/* LIVE ISSUED PAYPAL SANDBOX INVOICES FOR ACTIVE WORKSPACE */}
          <div className={`rounded-2xl p-5 ${glassCardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider opacity-70 font-semibold">
                04 / {activeWs.name} Invoices ({activeWs.invoices.length})
              </span>
              <span className="text-[11px] font-mono text-emerald-500">v2/invoicing</span>
            </div>

            {activeWs.invoices.length === 0 ? (
              <div className="text-center py-7 border border-dashed border-current/20 rounded-xl">
                <FileText className="w-6 h-6 mx-auto opacity-40 mb-1.5" />
                <p className="text-xs font-medium opacity-75">
                  No invoices sent in {activeWs.name} yet
                </p>
                <p className="text-[11px] opacity-50 mt-0.5">
                  Approve the guardrail above to batch-send PayPal invoices
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWs.invoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  return (
                    <div key={inv.invoiceId} className={`p-3.5 rounded-xl space-y-2.5 ${subCardClass}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs">{inv.personName}</span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono opacity-60">{inv.invoiceId}</p>
                        </div>
                        <span className="font-mono text-sm font-bold">${inv.amount}</span>
                      </div>

                      {activeQrInvoice === inv.invoiceId && (
                        <div className="p-3 bg-white text-slate-900 rounded-lg text-center space-y-1">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                              inv.payerViewUrl
                            )}`}
                            alt="PayPal Invoice QR"
                            className="w-28 h-28 mx-auto"
                          />
                          <p className="text-[10px] font-mono text-stone-500">
                            Scan to open PayPal Sandbox Checkout
                          </p>
                        </div>
                      )}

                      {inv.remindedAt && (
                        <p className="text-[11px] text-sky-400 bg-sky-500/10 px-2 py-1 rounded font-mono">
                          ✓ AI Reminder sent at {inv.remindedAt}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <a
                          href={inv.payerViewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#0070BA] text-white hover:opacity-90 flex items-center gap-1"
                        >
                          Pay in Sandbox <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() =>
                            setActiveQrInvoice(
                              activeQrInvoice === inv.invoiceId ? null : inv.invoiceId
                            )
                          }
                          className="text-[11px] font-medium px-2 py-1 rounded-lg border border-current/20 hover:bg-current/10 flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" /> QR
                        </button>

                        {!isPaid && (
                          <>
                            <button
                              onClick={() => handleSyncStatus(inv.invoiceId)}
                              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Sync Paid
                            </button>

                            <button
                              onClick={() => handleRemind(inv)}
                              className="text-[11px] font-medium px-2 py-1 rounded-lg border border-current/20 hover:bg-current/10 flex items-center gap-1 cursor-pointer"
                            >
                              <Bell className="w-3 h-3" /> Remind
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* BOTTOM LIVE PAYPAL REST API INSPECTOR DRAWER */}
      <footer className="mt-auto border-t border-white/10 bg-[#070B19]/95 text-slate-200 px-6 py-3 backdrop-blur-md">
        <div className="max-w-[1480px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-4 h-4" />
            <span>LIVE PAYPAL &amp; GEMINI TELEMETRY</span>
          </div>
          <div className="flex-1 overflow-x-auto font-mono text-[11px] text-slate-300 flex items-center gap-4">
            {traces.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-500">[{t.timestamp.slice(11, 19)}]</span>
                <span className="text-amber-300">{t.endpoint}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}