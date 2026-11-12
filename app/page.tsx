"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Sparkles,
  CheckCircle2,
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

type ApiTrace = {
  timestamp: string;
  endpoint: string;
  status: string;
};

const AVATAR_COLORS = [
  "bg-[#003087] text-white",
  "bg-emerald-700 text-white",
  "bg-amber-700 text-white",
  "bg-rose-700 text-white",
  "bg-indigo-700 text-white",
];

export default function PayPalWorkbench() {
  // Mode & Input state
  const [inputMode, setInputMode] = useState<"receipt" | "freelance">("receipt");
  const [promptText, setPromptText] = useState(
    "Shourya had the Pepperoni Pizza, split the Paneer Tikka, Garlic Naan, and Cold Coffees equally between Harshit, Shourya, and Prem."
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [isExtracting, setIsExtracting] = useState(false);

  // Workbench Receipt State (Pre-loaded with an instant interactive example)
  const [merchantOrTitle, setMerchantOrTitle] = useState("Toit Brewpub — Team Dinner");
  const [tax, setTax] = useState<number>(4.8);
  const [tip, setTip] = useState<number>(7.2);
  const [summaryNote, setSummaryNote] = useState(
    "Click any teammate pill on the thermal receipt to reassign items in real time."
  );

  const [people, setPeople] = useState<Person[]>([
    { id: "p1", name: "Harshit", email: "harshit.buyer@sandbox.paypal.com", color: AVATAR_COLORS[0] },
    { id: "p2", name: "Shourya", email: "shourya.buyer@sandbox.paypal.com", color: AVATAR_COLORS[1] },
    { id: "p3", name: "Prem", email: "prem.buyer@sandbox.paypal.com", color: AVATAR_COLORS[2] },
  ]);

  const [items, setItems] = useState<LineItem[]>([
    { id: "i1", name: "Smoked Paneer Tikka", price: 18.0, assignedTo: ["p1", "p2", "p3"] },
    { id: "i2", name: "Woodfired Pepperoni Pizza", price: 22.0, assignedTo: ["p2"] },
    { id: "i3", name: "3x Iced Craft Cold Coffee", price: 15.0, assignedTo: ["p1", "p2", "p3"] },
    { id: "i4", name: "Truffle Garlic Naan Basket", price: 9.0, assignedTo: ["p1", "p2", "p3"] },
  ]);

  // New person input
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");

  // Policy & Approval Gate
  const [policyApproved, setPolicyApproved] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [invoices, setInvoices] = useState<IssuedInvoice[]>([]);
  const [activeQrInvoice, setActiveQrInvoice] = useState<string | null>(null);

  // Live API Inspector Logs
  const [traces, setTraces] = useState<ApiTrace[]>([
    {
      timestamp: new Date().toISOString(),
      endpoint: "SYSTEM READY — PayPal Invoicing v2 Sandbox + Gemini 2.5 Flash",
      status: "IDLE",
    },
  ]);

  // Toggle person assignment on a receipt line item
  const toggleAssignment = (itemId: string, personId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedTo.includes(personId);
        if (exists && item.assignedTo.length === 1) return item; // Keep at least 1 assignee
        const updated = exists
          ? item.assignedTo.filter((id) => id !== personId)
          : [...item.assignedTo, personId];
        return { ...item, assignedTo: updated };
      })
    );
    setPolicyApproved(false);
  };

  // Add a participant
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const id = `p${Date.now()}`;
    const email =
      newPersonEmail.trim() ||
      `${newPersonName.toLowerCase().replace(/\s+/g, ".")}@sandbox.paypal.com`;
    setPeople((prev) => [
      ...prev,
      { id, name: newPersonName.trim(), email, color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length] },
    ]);
    setNewPersonName("");
    setNewPersonEmail("");
  };

  // Proportional Split Math (Subtotal + Exact Proportional Tax & Tip)
  const splitBreakdown = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + it.price, 0);
    return people.map((person) => {
      const personItems: { name: string; share: number }[] = [];
      let personSubtotal = 0;

      items.forEach((item) => {
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
      const personTax = tax * proportion;
      const personTip = tip * proportion;
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
        total,
        items: personItems,
      };
    });
  }, [people, items, tax, tip]);

  const grandTotal = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.price, 0);
    return sub + tax + tip;
  }, [items, tax, tip]);

  // Preset Loaders for 1-Click Live Demo
  const loadPreset = (type: "dinner" | "freelance") => {
    setPolicyApproved(false);
    if (type === "dinner") {
      setInputMode("receipt");
      setMerchantOrTitle("Toit Brewpub — Team Dinner");
      setTax(4.8);
      setTip(7.2);
      setPeople([
        { id: "p1", name: "Harshit", email: "harshit.buyer@sandbox.paypal.com", color: AVATAR_COLORS[0] },
        { id: "p2", name: "Shourya", email: "shourya.buyer@sandbox.paypal.com", color: AVATAR_COLORS[1] },
        { id: "p3", name: "Prem", email: "prem.buyer@sandbox.paypal.com", color: AVATAR_COLORS[2] },
      ]);
      setItems([
        { id: "i1", name: "Smoked Paneer Tikka", price: 18.0, assignedTo: ["p1", "p2", "p3"] },
        { id: "i2", name: "Woodfired Pepperoni Pizza", price: 22.0, assignedTo: ["p2"] },
        { id: "i3", name: "3x Iced Craft Cold Coffee", price: 15.0, assignedTo: ["p1", "p2", "p3"] },
        { id: "i4", name: "Truffle Garlic Naan Basket", price: 9.0, assignedTo: ["p1", "p2", "p3"] },
      ]);
      setSummaryNote("Loaded group dinner preset. Click any avatar pill on the receipt to adjust shares.");
    } else {
      setInputMode("freelance");
      setPromptText(
        "Bill alex.client@sandbox.paypal.com for Next.js Landing Page ($140), PayPal Checkout Integration ($85), and Rush Weekend Delivery ($35). Add $15 tax."
      );
      setMerchantOrTitle("Next.js & PayPal Sprint — Milestone #1");
      setTax(15.0);
      setTip(0);
      setPeople([
        { id: "c1", name: "Alex Rivera (Client)", email: "alex.client@sandbox.paypal.com", color: AVATAR_COLORS[0] },
      ]);
      setItems([
        { id: "f1", name: "Next.js Landing Page Architecture", price: 140.0, assignedTo: ["c1"] },
        { id: "f2", name: "PayPal Sandbox API Integration", price: 85.0, assignedTo: ["c1"] },
        { id: "f3", name: "Rush 24h Delivery Fee", price: 35.0, assignedTo: ["c1"] },
      ]);
      setSummaryNote("Parsed freelance WhatsApp/DM scope into structured PayPal invoice line items.");
    }
  };

  // Handle Receipt Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini 2.5 Flash Extraction
  const handleRunAiExtraction = async () => {
    setIsExtracting(true);
    setPolicyApproved(false);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: imagePreview && inputMode === "receipt" ? "image" : "text",
          textPrompt: promptText,
          imageBase64: imagePreview,
          mimeType: imageMime,
          existingPeople: people,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Extraction failed");
      }

      const d = json.data;
      if (d.merchantOrTitle) setMerchantOrTitle(d.merchantOrTitle);
      if (typeof d.tax === "number") setTax(d.tax);
      if (typeof d.tip === "number") setTip(d.tip);
      if (d.summaryNote) setSummaryNote(d.summaryNote);

      if (Array.isArray(d.people) && d.people.length > 0) {
        setPeople(
          d.people.map((p: any, idx: number) => ({
            id: p.id || `p${idx + 1}`,
            name: p.name || `Person ${idx + 1}`,
            email: p.email || `${(p.name || "user").toLowerCase().replace(/\s+/g, ".")}@sandbox.paypal.com`,
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          }))
        );
      }

      if (Array.isArray(d.items) && d.items.length > 0) {
        setItems(
          d.items.map((it: any, idx: number) => ({
            id: it.id || `item_${idx + 1}`,
            name: it.name || "Line Item",
            price: Number(it.price) || 0,
            assignedTo:
              Array.isArray(it.assignedTo) && it.assignedTo.length > 0
                ? it.assignedTo
                : [d.people?.[0]?.id || "p1"],
          }))
        );
      }

      if (json.trace) {
        setTraces((prev) => [json.trace, ...prev]);
      }
    } catch (err: any) {
      alert(`AI Extraction Notice: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Dispatch Real PayPal Sandbox Invoices
  const handleDispatchPayPalInvoices = async () => {
    if (!policyApproved) return;
    setIsDispatching(true);
    try {
      const res = await fetch("/api/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_invoices",
          merchantOrTitle,
          splits: splitBreakdown,
        }),
      });
      const data = await res.json();
      if (data.invoices) {
        setInvoices((prev) => [...data.invoices, ...prev]);
      }
      if (data.traces) {
        setTraces((prev) => [...data.traces, ...prev]);
      }
    } catch (err: any) {
      alert(`PayPal Dispatch Error: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Sync / Simulate Sandbox Payment Status
  const handleSyncStatus = async (invoiceId: string, simulatePaid = false) => {
    const res = await fetch("/api/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_status", invoiceId, simulatePaid }),
    });
    const data = await res.json();
    if (data.status) {
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceId === invoiceId ? { ...inv, status: data.status } : inv))
      );
    }
    if (data.trace) {
      setTraces((prev) => [data.trace, ...prev]);
    }
  };

  // Fire PayPal v2 Reminder
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
      setInvoices((prev) =>
        prev.map((item) =>
          item.invoiceId === inv.invoiceId ? { ...item, remindedAt: data.remindedAt } : item
        )
      );
    }
    if (data.trace) {
      setTraces((prev) => [data.trace, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#111111] flex flex-col font-sans selection:bg-[#003087] selection:text-white">
      {/* TOP BAR — Clean Editorial Ledger Header */}
      <header className="border-b border-stone-300 bg-[#F7F6F2]/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111111] border border-stone-700 text-white flex items-center justify-center shadow-sm relative overflow-hidden">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="absolute bottom-0 inset-x-0 h-1 bg-[#0070BA]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight text-lg text-stone-900">
                PayPal Split &amp; Bill Workbench
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#003087]/10 text-[#003087] font-semibold border border-[#003087]/20">
                Invoicing v2 Sandbox
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Multimodal Receipt &amp; DM Parser → Interactive Tactile Split → Live PayPal Invoices
            </p>
          </div>
        </div>

        {/* Instant Judge Demo Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-500 mr-1">Instant Demo Scenarios:</span>
          <button
            onClick={() => loadPreset("dinner")}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 transition cursor-pointer"
          >
            🍽️ Group Dinner Receipt
          </button>
          <button
            onClick={() => loadPreset("freelance")}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 transition cursor-pointer"
          >
            💻 Freelance DM Scope
          </button>
        </div>
      </header>

      {/* MAIN 3-COLUMN FINANCIAL WORKBENCH */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1 (4 cols): MULTIMODAL INPUT & PARTICIPANT ROSTER */}
        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-stone-300 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                01 / Capture Source
              </span>
              <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-100 text-xs">
                <button
                  onClick={() => setInputMode("receipt")}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    inputMode === "receipt" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                  }`}
                >
                  Receipt Photo
                </button>
                <button
                  onClick={() => setInputMode("freelance")}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    inputMode === "freelance" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                  }`}
                >
                  Freelance DM
                </button>
              </div>
            </div>

            {inputMode === "receipt" && (
              <label className="block border-2 border-dashed border-stone-300 hover:border-[#0070BA] rounded-lg p-4 text-center cursor-pointer transition bg-stone-50/70 mb-3">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Uploaded receipt"
                      className="max-h-36 mx-auto rounded border border-stone-200 object-contain"
                    />
                    <p className="text-xs text-[#0070BA] font-medium">Click to replace receipt photo</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-stone-500" />
                    <p className="text-xs font-medium text-stone-800">
                      Drop a thermal receipt photo or click to browse
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Gemini 2.5 Flash extracts every item, tax, and tip automatically
                    </p>
                  </div>
                )}
              </label>
            )}

            <label className="block text-xs font-medium text-stone-700 mb-1">
              {inputMode === "receipt"
                ? "Natural Language Split Instruction (or leave blank for even split)"
                : "Paste WhatsApp / Slack / Email Billing Message"}
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Shourya had the pizza, split the rest equally..."
              className="w-full rounded-lg border border-stone-300 bg-stone-50 p-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#003087] font-mono"
            />

            <button
              onClick={handleRunAiExtraction}
              disabled={isExtracting}
              className="mt-3 w-full py-2.5 px-4 rounded-lg bg-[#111111] hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isExtracting
                ? "Gemini 2.5 Flash Parsing Line Items..."
                : "Extract & Auto-Assign Line Items with Gemini"}
            </button>
          </div>

          {/* Participant Roster & Payer Emails */}
          <div className="bg-white border border-stone-300 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                02 / Payer Roster (PayPal Sandbox)
              </span>
              <span className="text-[11px] font-mono text-stone-500">{people.length} active</span>
            </div>

            <div className="space-y-2 mb-4">
              {people.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${p.color}`}
                    >
                      {p.name.charAt(0)}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-stone-900 truncate">{p.name}</p>
                      <p className="text-[11px] font-mono text-stone-500 truncate">{p.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPerson} className="space-y-2 pt-2 border-t border-stone-200">
              <p className="text-[11px] font-medium text-stone-600">Add roommate or client:</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Adarsh)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="rounded border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                />
                <input
                  type="email"
                  placeholder="Sandbox Email (optional)"
                  value={newPersonEmail}
                  onChange={(e) => setNewPersonEmail(e.target.value)}
                  className="rounded border border-stone-300 px-2.5 py-1.5 text-xs bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded border border-stone-300 bg-stone-100 hover:bg-stone-200 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Participant Pill
              </button>
            </form>
          </div>
        </section>

        {/* COLUMN 2 (4 cols): TACTILE THERMAL PAPER RECEIPT (CLICK TO REASSIGN) */}
        <section className="lg:col-span-4">
          <div className="bg-[#FFFDF9] border border-stone-300 rounded-xl shadow-md overflow-hidden relative">
            {/* Top Serrated Receipt Edge Effect */}
            <div className="h-2 bg-[repeating-linear-gradient(-45deg,#e7e5e4,#e7e5e4_6px,#FFFDF9_6px,#FFFDF9_12px)] border-b border-stone-200" />

            <div className="p-6">
              <div className="flex items-center justify-between border-b border-dashed border-stone-300 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
                    INTERACTIVE THERMAL LEDGER
                  </span>
                  <input
                    value={merchantOrTitle}
                    onChange={(e) => setMerchantOrTitle(e.target.value)}
                    className="font-bold text-base text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#003087] focus:outline-none w-full"
                  />
                </div>
                <Receipt className="w-5 h-5 text-stone-400 shrink-0" />
              </div>

              <p className="text-[11px] bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md px-2.5 py-1.5 mb-4">
                💡 {summaryNote}
              </p>

              {/* Line Items with Interactive Person Toggle Chips */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-stone-200 bg-white hover:border-stone-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-stone-900">{item.name}</span>
                      <span className="font-mono text-xs font-bold text-stone-900">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-stone-400 mr-1">SPLIT:</span>
                      {people.map((person) => {
                        const active = item.assignedTo.includes(person.id);
                        return (
                          <button
                            key={person.id}
                            onClick={() => toggleAssignment(item.id, person.id)}
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1 ${
                              active
                                ? `${person.color} shadow-2xs`
                                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            }`}
                          >
                            <span>{person.name}</span>
                            {active && (
                              <span className="font-mono text-[10px] opacity-90">
                                ${(item.price / item.assignedTo.length).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax, Tip & Grand Total Footer */}
              <div className="mt-5 pt-4 border-t border-dashed border-stone-300 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>SUBTOTAL</span>
                  <span>${items.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>TAX (PROPORTIONAL)</span>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value) || 0)}
                      className="w-16 text-right border border-stone-300 rounded px-1 py-0.5 bg-white text-stone-900"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>TIP / GRATUITY</span>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tip}
                      onChange={(e) => setTip(Number(e.target.value) || 0)}
                      className="w-16 text-right border border-stone-300 rounded px-1 py-0.5 bg-white text-stone-900"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-300">
                  <span>TOTAL LEDGER</span>
                  <span>${grandTotal.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Bottom Serrated Receipt Edge */}
            <div className="h-2 bg-[repeating-linear-gradient(45deg,#e7e5e4,#e7e5e4_6px,#FFFDF9_6px,#FFFDF9_12px)] border-t border-stone-200" />
          </div>
        </section>

        {/* COLUMN 3 (4 cols): HUMAN APPROVAL GUARDRAIL & LIVE PAYPAL INVOICES */}
        <section className="lg:col-span-4 space-y-5">
          {/* Proportional Shares + Human-in-the-Loop Approval Gate */}
          <div className="bg-white border border-stone-300 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                03 / PayPal Dispatch &amp; Guardrail
              </span>
              <ShieldCheck className="w-4 h-4 text-[#003087]" />
            </div>

            <div className="space-y-2.5 mb-4">
              {splitBreakdown.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">{sp.name}</span>
                      <span className="text-[11px] font-mono text-stone-500">
                        ({sp.items.length} lines)
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-stone-500">{sp.email}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-[#003087]">${sp.total.toFixed(2)}</span>
                    <span className="block text-[10px] text-stone-400">
                      incl. ${(sp.taxShare + sp.tipShare).toFixed(2)} tax/tip
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Human-in-the-Loop Policy Gate */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#003087]/5 border border-[#003087]/20 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={policyApproved}
                onChange={(e) => setPolicyApproved(e.target.checked)}
                className="mt-0.5 accent-[#003087]"
              />
              <span className="text-xs text-stone-800 leading-snug">
                <strong>Human-in-the-Loop Authorization:</strong> I verify the proportional tax/tip
                allocation and authorize creating &amp; sending{" "}
                <span className="font-mono font-bold">
                  {splitBreakdown.filter((s) => s.total > 0).length} PayPal Invoices ($
                  {grandTotal.toFixed(2)} USD)
                </span>
                .
              </span>
            </label>

            <button
              onClick={handleDispatchPayPalInvoices}
              disabled={!policyApproved || isDispatching}
              className="w-full py-3 px-4 rounded-lg bg-[#003087] hover:bg-[#0070BA] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              {isDispatching
                ? "Calling PayPal Invoicing v2 Sandbox..."
                : `Approve & Issue ${splitBreakdown.filter((s) => s.total > 0).length} PayPal Invoices`}
            </button>
          </div>

          {/* LIVE ISSUED PAYPAL SANDBOX INVOICES TRACKER */}
          <div className="bg-white border border-stone-300 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
                04 / Live PayPal Invoices ({invoices.length})
              </span>
              <span className="text-[11px] font-mono text-emerald-700">v2/invoicing</span>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-stone-200 rounded-lg">
                <FileText className="w-6 h-6 mx-auto text-stone-400 mb-1.5" />
                <p className="text-xs text-stone-600 font-medium">No invoices dispatched yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Check the authorization box above and click Approve &amp; Issue
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  return (
                    <div
                      key={inv.invoiceId}
                      className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/70 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-900">
                              {inv.personName}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-stone-500">{inv.invoiceId}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-stone-900">
                          ${inv.amount}
                        </span>
                      </div>

                      {/* QR Code Drawer */}
                      {activeQrInvoice === inv.invoiceId && (
                        <div className="p-3 bg-white rounded border border-stone-200 text-center space-y-1.5">
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
                        <p className="text-[11px] text-[#003087] bg-[#003087]/5 px-2 py-1 rounded font-mono">
                          ✓ AI Reminder sent at {inv.remindedAt}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <a
                          href={inv.payerViewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#003087] text-white hover:bg-[#0070BA] flex items-center gap-1"
                        >
                          Pay in Sandbox <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() =>
                            setActiveQrInvoice(
                              activeQrInvoice === inv.invoiceId ? null : inv.invoiceId
                            )
                          }
                          className="text-[11px] font-medium px-2 py-1 rounded border border-stone-300 bg-white hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" /> QR
                        </button>

                        {!isPaid && (
                          <>
                            <button
                              onClick={() => handleSyncStatus(inv.invoiceId, true)}
                              className="text-[11px] font-medium px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                              title="Sync or simulate Sandbox payer settlement"
                            >
                              <RefreshCw className="w-3 h-3" /> Sync Paid
                            </button>

                            <button
                              onClick={() => handleRemind(inv)}
                              className="text-[11px] font-medium px-2 py-1 rounded border border-stone-300 bg-white hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
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
      <footer className="mt-auto border-t border-stone-300 bg-[#141413] text-stone-200 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-4 h-4" />
            <span>LIVE PAYPAL &amp; GEMINI TELEMETRY</span>
          </div>
          <div className="flex-1 overflow-x-auto font-mono text-[11px] text-stone-300 flex items-center gap-4">
            {traces.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-stone-500">[{t.timestamp.slice(11, 19)}]</span>
                <span className="text-amber-300">{t.endpoint}</span>
                <ArrowRight className="w-3 h-3 text-stone-500" />
                <span className="text-emerald-400">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}