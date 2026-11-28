"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, Select, type IconName, type Opt } from "./ui";

type Props = { value: string; onChange: (html: string) => void; onUpload: (f: File) => Promise<string> };

const BTN =
  "relative grid h-9 w-9 place-items-center rounded-xl text-[#4a6354] transition-colors hover:bg-[#15803d]/10 hover:text-[#14532d] disabled:opacity-40 disabled:hover:bg-transparent";

const BLOCKS: Opt[] = [
  { value: "p", label: "Paragraph", icon: "paragraph" },
  { value: "h2", label: "Heading 2", hint: "Section title", icon: "heading" },
  { value: "h3", label: "Heading 3", hint: "Sub-section", icon: "heading" },
  { value: "blockquote", label: "Quote", icon: "quote" },
];

type Tool = [title: string, icon: IconName, cmd: string, arg?: string];
const GROUPS: Tool[][] = [
  [
    ["Bold", "bold", "bold"],
    ["Italic", "italic", "italic"],
    ["Underline", "underline", "underline"],
  ],
  [
    ["Bulleted list", "list", "insertUnorderedList"],
    ["Numbered list", "listOrdered", "insertOrderedList"],
  ],
  [
    ["Add link", "link", "link"],
    ["Remove link", "unlink", "unlink"],
    ["Clear formatting", "eraser", "removeFormat"],
  ],
];

/** A small WYSIWYG editor for blog bodies (headings, lists, links, images) with an HTML source view. */
export default function RichEditor({ value, onChange, onUpload }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [block, setBlock] = useState("p");

  // load the initial HTML once (and when switching back from the source view)
  useEffect(() => {
    if (!source && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // keep the format dropdown in step with the caret
  useEffect(() => {
    if (source) return;
    const sel = () => {
      const node = window.getSelection()?.anchorNode;
      if (!node || !ref.current?.contains(node)) return;
      const v = document.queryCommandValue("formatBlock").toLowerCase().replace(/[<>]/g, "");
      setBlock(BLOCKS.some((b) => b.value === v) ? v : "p");
    };
    document.addEventListener("selectionchange", sel);
    return () => document.removeEventListener("selectionchange", sel);
  }, [source]);

  const sync = () => ref.current && onChange(ref.current.innerHTML);
  const cmd = (c: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(c, false, arg);
    sync();
  };
  const link = () => {
    const url = window.prompt("Link URL (https://…)");
    if (url) cmd("createLink", url);
  };
  const pickImage = async (f: File | undefined) => {
    if (!f) return;
    setUploading(true);
    try {
      const url = await onUpload(f);
      cmd("insertHTML", `<img src="${url}" alt="" />`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };

  const run = (c: string, arg?: string) => (c === "link" ? link() : cmd(c, arg));

  return (
    <div className="rounded-2xl border border-[#14532d]/12 bg-white transition focus-within:border-[#16a34a] focus-within:shadow-[0_0_0_4px_rgba(22,163,74,0.13)]">
      <div className="flex flex-wrap items-center gap-1.5 rounded-t-2xl border-b border-[#14532d]/10 bg-[#f6faf7] p-2">
        <Select
          value={block}
          onChange={(v) => {
            setBlock(v);
            cmd("formatBlock", `<${v}>`);
          }}
          options={BLOCKS}
          size="sm"
          keepFocus
          label="Text style"
          className={`w-36 ${source ? "pointer-events-none opacity-40" : ""}`}
        />
        {GROUPS.map((g, gi) => (
          <div key={gi} className="flex items-center gap-0.5 border-l border-[#14532d]/10 pl-1.5">
            {g.map(([title, icon, c, arg]) => (
              <button key={title} type="button" aria-label={title} disabled={source} onMouseDown={(e) => e.preventDefault()} onClick={() => run(c, arg)} className={`${BTN} adm-ib`}>
                <Icon name={icon} className="h-[1.1rem] w-[1.1rem]" />
                <span className="adm-tip">{title}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="flex items-center gap-0.5 border-l border-[#14532d]/10 pl-1.5">
          <button type="button" aria-label="Insert image" disabled={source || uploading} onClick={() => file.current?.click()} className={`${BTN} adm-ib w-auto gap-1.5 px-2.5 text-sm font-semibold`}>
            <span className="flex items-center gap-1.5">
              <Icon name="image" className="h-[1.1rem] w-[1.1rem]" />
              {uploading ? "Uploading…" : "Image"}
            </span>
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
        </div>
        <div className="ml-auto grid grid-cols-2 rounded-xl bg-[#e8f1ec] p-0.5">
          {[
            [false, "Visual", "eye"],
            [true, "HTML", "code"],
          ].map(([v, l, ic]) => (
            <button
              key={String(l)}
              type="button"
              onClick={() => setSource(v as boolean)}
              className={`flex items-center gap-1.5 rounded-[0.65rem] px-3 py-1.5 text-xs font-bold transition ${source === v ? "bg-white text-[#15803d] shadow-sm" : "text-[#6b8577] hover:text-[#14532d]"}`}
            >
              <Icon name={ic as IconName} className="h-3.5 w-3.5" />
              {l as string}
            </button>
          ))}
        </div>
      </div>
      {source ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} className="block min-h-[420px] w-full resize-y rounded-b-2xl p-4 font-mono text-[13px] leading-relaxed outline-none" />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          data-placeholder="Write the article…"
          className="blog-body admin-editor min-h-[420px] max-w-none rounded-b-2xl p-5 outline-none"
        />
      )}
    </div>
  );
}
