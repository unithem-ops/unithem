"use client";

import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

export default function EvidenceEnhancer() {
  useEffect(() => {
    if (!API) return;
    let records = [];
    let cancelled = false;

    async function loadRecords() {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "listCases" })
        });
        const data = await res.json();
        if (data?.ok) records = data.records || [];
      } catch (_) {}
    }

    function norm(v) {
      return String(v || "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function enhanceTables() {
      if (cancelled || !records.length) return;
      document.querySelectorAll("table").forEach((table) => {
        const headers = [...table.querySelectorAll("thead th")];
        const statusIndex = headers.findIndex(h => norm(h.textContent) === "status");
        if (statusIndex < 0) return;

        let evidenceIndex = headers.findIndex(h => norm(h.textContent) === "bukti dokumen");
        if (evidenceIndex < 0) {
          const th = document.createElement("th");
          th.textContent = "Bukti Dokumen";
          const actionIndex = headers.findIndex(h => norm(h.textContent) === "tindakan");
          if (actionIndex >= 0) headers[actionIndex].before(th);
          else headers[statusIndex].after(th);
          evidenceIndex = actionIndex >= 0 ? actionIndex : statusIndex + 1;
        }

        table.querySelectorAll("tbody tr").forEach((tr) => {
          if (tr.dataset.evidenceAdded === "1") return;
          const cells = [...tr.children];
          if (!cells.length || cells.length === 1) return;

          const nameCell = cells[1];
          if (!nameCell) return;
          const lines = (nameCell.innerText || "").split("\n").map(s => s.trim()).filter(Boolean);
          const name = lines[0] || "";
          const noKp = lines[1] || "";
          const rec = records.find(r => (noKp && norm(r.noKp) === norm(noKp)) || (!noKp && norm(r.namaMurid) === norm(name)));

          const td = document.createElement("td");
          if (rec?.buktiUrl) {
            const a = document.createElement("a");
            a.href = rec.buktiUrl;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = "Lihat Bukti";
            a.style.fontWeight = "600";
            a.style.textDecoration = "underline";
            td.appendChild(a);
          } else {
            td.textContent = "—";
          }

          const updatedHeaders = [...table.querySelectorAll("thead th")];
          const actionIndex = updatedHeaders.findIndex(h => norm(h.textContent) === "tindakan");
          if (actionIndex >= 0 && cells[actionIndex - 1]) {
            cells[actionIndex - 1].after(td);
          } else if (cells[statusIndex]) {
            cells[statusIndex].after(td);
          } else {
            tr.appendChild(td);
          }
          tr.dataset.evidenceAdded = "1";
        });
      });
    }

    loadRecords().then(enhanceTables);
    const observer = new MutationObserver(enhanceTables);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return null;
}
