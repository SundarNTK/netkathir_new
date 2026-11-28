// Exports contact submissions as a formatted Excel workbook (and a clean CSV fallback).
// The Excel writer is loaded only when an export is requested.

export type ContactRow = {
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
};

const GREEN = "#15803D";
const ZEBRA = "#F3FAF5";
const LINE = "#D7E5DC";

/** messages can contain line breaks / extra spaces; one tidy paragraph reads far better in a spreadsheet */
const oneLine = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** the sheet shows the time as the admin sees it (Excel dates have no time zone) */
const localDate = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

const stamp = () => new Date().toISOString().slice(0, 10);

/** the sheet rows + options (kept separate from the download so it can be tested) */
export function buildContactsSheet(rows: ContactRow[]) {
  const headers = ["#", "Received", "Name", "Email", "Phone", "Company", "Service", "Message"];
  const widths = [5, 21, 24, 32, 18, 24, 34, 90];

  const border = { borderColor: LINE, borderStyle: "thin" as const };
  const title = [
    {
      value: `Netkathir Technologies — Contact submissions  (exported ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${rows.length} entries)`,
      fontWeight: "bold" as const,
      fontSize: 13,
      textColor: GREEN,
      columnSpan: headers.length,
      height: 26,
      alignVertical: "center" as const,
    },
    ...Array(headers.length - 1).fill(null),
  ];
  const head = headers.map((h, i) => ({
    value: h,
    fontWeight: "bold" as const,
    textColor: "#FFFFFF",
    backgroundColor: GREEN,
    alignVertical: "center" as const,
    align: i === 0 ? ("center" as const) : ("left" as const),
    height: 24,
    ...border,
  }));

  const body = rows.map((r, i) => {
    const message = oneLine(r.message);
    // Excel does not grow rows for wrapped text written by a file, so estimate the height from the text length
    const lines = Math.min(20, Math.max(1, Math.ceil(message.length / 90)));
    const base = { alignVertical: "top" as const, ...border, ...(i % 2 ? { backgroundColor: ZEBRA } : {}) };
    return [
      { value: i + 1, type: Number, align: "center" as const, ...base },
      { value: localDate(r.created_at), type: Date, format: "dd mmm yyyy, h:mm AM/PM", ...base },
      { value: oneLine(r.full_name), fontWeight: "bold" as const, ...base },
      { value: oneLine(r.email), textColor: GREEN, ...base },
      { value: oneLine(r.phone), ...base },
      { value: oneLine(r.company), ...base },
      { value: oneLine(r.service), wrap: true, ...base },
      { value: message, wrap: true, height: Math.max(18, lines * 15 + 4), ...base },
    ];
  });

  return {
    data: [title, head, ...body],
    options: { sheet: "Contact submissions", columns: widths.map((width) => ({ width })), stickyRowsCount: 2 },
  };
}

export async function exportContactsXlsx(rows: ContactRow[]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const { data, options } = buildContactsSheet(rows);
  await writeXlsxFile(data, options).toFile(`netkathir-contact-submissions-${stamp()}.xlsx`);
}

/** plain CSV: readable dates, one-line messages, UTF-8 with BOM so Excel shows Tamil and other scripts correctly */
export function exportContactsCsv(rows: ContactRow[]) {
  const headers = ["Received", "Name", "Email", "Phone", "Company", "Service", "Message"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const lines = rows.map((r) =>
    [when(r.created_at), r.full_name, r.email, r.phone, r.company, r.service, r.message].map((v) => esc(oneLine(v))).join(",")
  );
  const url = URL.createObjectURL(new Blob(["﻿" + [headers.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `netkathir-contact-submissions-${stamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
