"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { readCache, writeCache } from "./cache";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import { Confirm, DateTimePicker, Icon, IconButton, PageHead, SearchBox, Segmented, Select, Stat, StatusPill, Toast, btnGhost, btnPrimary, field } from "./ui";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  tags: string[];
  body_html: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type Draft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  tags: string;
  body_html: string;
  status: "published" | "draft";
  published_at: string; // datetime-local value
};

/** old posts keep site-relative covers that live on netkathir.com */
function cover(u: string | null) {
  if (!u) return null;
  return /^https?:\/\//.test(u) ? u : `https://netkathir.com${u.startsWith("/") ? "" : "/"}${u}`;
}
function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}
const blank = (): Draft => ({ title: "", slug: "", excerpt: "", cover_image_url: "", tags: "", body_html: "", status: "draft", published_at: "" });

async function upload(f: File) {
  const fd = new FormData();
  fd.append("file", f);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Your session expired. Please sign in again.");
  if (!res.ok) throw new Error(j.error || "Upload failed");
  return j.url as string;
}

const SORTS = [
  { value: "new", label: "Newest first", icon: "clock" as const },
  { value: "old", label: "Oldest first", icon: "calendar" as const },
  { value: "az", label: "Title A–Z", icon: "sort" as const },
];

export default function BlogsAdmin() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [sort, setSort] = useState("new");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState("");
  const [del, setDel] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/blogs", { cache: "no-store" });
      if (res.status === 401) return router.replace("/admin/login");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load posts");
      setPosts(j);
      writeCache("blogs", j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load posts");
    }
  }, [router]);

  useEffect(() => {
    // show the last list straight away, then refresh it
    const cached = readCache<Post[]>("blogs");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setPosts(cached);
    load();
  }, [load]);

  // keep the cache in step with local changes (save / delete)
  useEffect(() => {
    if (posts) writeCache("blogs", posts);
  }, [posts]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (posts ?? []).filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!s || p.title.toLowerCase().includes(s) || p.slug.includes(s) || p.tags?.some((t) => t.toLowerCase().includes(s)))
    );
    const time = (p: Post) => Date.parse(p.published_at ?? p.created_at) || 0;
    if (sort === "old") list.sort((a, b) => time(a) - time(b));
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => time(b) - time(a));
    return list;
  }, [posts, q, status, sort]);

  const counts = useMemo(
    () => ({
      all: posts?.length ?? 0,
      published: posts?.filter((p) => p.status === "published").length ?? 0,
      draft: posts?.filter((p) => p.status !== "published").length ?? 0,
    }),
    [posts]
  );

  // the list has no article text; fetch the full post when it is opened
  async function edit(p: Post) {
    if (opening) return;
    setOpening(p.id);
    try {
      const res = await fetch(`/api/admin/blogs/${p.id}`, { cache: "no-store" });
      if (res.status === 401) return router.replace("/admin/login");
      const full: Post = await res.json();
      if (!res.ok) throw new Error((full as unknown as { error?: string }).error || "Could not open the post");
      setDraft({
        id: full.id,
        title: full.title,
        slug: full.slug,
        excerpt: full.excerpt ?? "",
        cover_image_url: full.cover_image_url ?? "",
        tags: (full.tags ?? []).join(", "),
        body_html: full.body_html ?? "",
        status: full.status === "published" ? "published" : "draft",
        published_at: toLocal(full.published_at),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open the post");
    } finally {
      setOpening(null);
    }
  }

  async function remove() {
    const p = del;
    if (!p) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/blogs/${p.id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setDel(null);
      return alert(j.error || "Delete failed");
    }
    setPosts((ps) => ps?.filter((x) => x.id !== p.id) ?? null);
    setDel(null);
    setToast("Post deleted");
  }

  if (draft)
    return (
      <Editor
        draft={draft}
        onCancel={() => setDraft(null)}
        onSaved={(saved, isNew) => {
          setPosts((ps) => (isNew ? [saved, ...(ps ?? [])] : (ps ?? []).map((x) => (x.id === saved.id ? saved : x))));
          setDraft(null);
          setToast(isNew ? "Post created" : "Changes saved");
        }}
      />
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead title="Blogs" sub="Published posts appear on the website's Blogs page straight away.">
        <button onClick={() => setDraft(blank())} className={btnPrimary}>
          <Icon name="plus" className="h-[1.15rem] w-[1.15rem]" /> New post
        </button>
      </PageHead>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat icon="doc" label="Total posts" value={posts ? counts.all : "–"} delay={60} />
        <Stat icon="globe" label="Live on website" value={posts ? counts.published : "–"} delay={120} />
        <Stat icon="pencil" label="Drafts" value={posts ? counts.draft : "–"} tone="amber" delay={180} />
      </div>

      <div className="adm-rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search title, slug or tag…" className="w-full sm:w-80" />
        <Segmented
          value={status}
          onChange={setStatus}
          items={[
            { value: "all", label: "All", count: counts.all },
            { value: "published", label: "Published", count: counts.published },
            { value: "draft", label: "Draft", count: counts.draft },
          ]}
        />
        <Select value={sort} onChange={setSort} options={SORTS} icon="sort" className="w-48 sm:ml-auto" label="Sort posts" />
      </div>

      {error && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <Icon name="alert" className="h-4 w-4" /> {error}{" "}
          <button onClick={load} className="ml-1 font-semibold underline">
            Retry
          </button>
        </p>
      )}

      <div className="mt-5">
        {!posts && !error ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/80" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[#14532d]/20 bg-white/70 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f1f8f3] text-[#15803d]">
              <Icon name="search" className="h-6 w-6" />
            </span>
            <p className="mt-4 font-bold text-[#14532d]">No posts match</p>
            <p className="mt-1 text-sm text-[#6b8577]">Try another search or filter.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((p, i) => {
              const c = cover(p.cover_image_url);
              const live = p.status === "published";
              return (
                <li
                  key={p.id}
                  className="adm-rise group flex flex-col gap-4 rounded-3xl border border-[#14532d]/8 bg-white p-3.5 shadow-[0_16px_36px_-32px_rgba(20,83,45,0.7)] transition duration-300 hover:-translate-y-0.5 hover:border-[#16a34a]/30 hover:shadow-[0_26px_50px_-30px_rgba(20,83,45,0.65)] sm:flex-row sm:items-center sm:p-3"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-[#14532d]/8 sm:h-[4.5rem] sm:w-32">
                    {c ? <Image src={c} alt="" fill sizes="(min-width: 640px) 128px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-110" /> : <span className="grid h-full place-items-center text-[#15803d]/50"><Icon name="image" className="h-6 w-6" /></span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.98rem] font-bold text-[#10231a]">{p.title}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-[#6b8577]">/blogs/{p.slug}</p>
                    {p.tags?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-[#f1f8f3] px-2 py-0.5 text-[0.68rem] font-semibold text-[#15803d]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 sm:gap-5">
                    <StatusPill on={live} />
                    <span className="hidden w-28 items-center gap-1.5 text-sm text-[#4a6354] md:flex">
                      <Icon name="calendar" className="h-4 w-4 text-[#8aa093]" />
                      {fmt(p.published_at)}
                    </span>
                    <div className="ml-auto flex items-center gap-1 rounded-2xl bg-[#f6faf7] p-1 sm:ml-0">
                      {live && <IconButton icon="eye" label="View on site" href={`/blogs/${p.slug}`} external tone="blue" />}
                      <IconButton icon={opening === p.id ? "clock" : "pencil"} label={opening === p.id ? "Opening…" : "Edit"} tone="green" onClick={() => edit(p)} />
                      <IconButton icon="trash" label="Delete" tone="red" onClick={() => setDel(p)} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {del && (
        <Confirm
          title="Delete this post?"
          text={`"${del.title}" will be removed permanently. To only hide it from the website, edit it and set it to Draft instead.`}
          confirm="Delete post"
          busy={deleting}
          onCancel={() => !deleting && setDel(null)}
          onConfirm={remove}
        />
      )}
      {toast && <Toast text={toast} />}
    </div>
  );
}

function Editor({ draft, onCancel, onSaved }: { draft: Draft; onCancel: () => void; onSaved: (p: Post, isNew: boolean) => void }) {
  const [d, setD] = useState(draft);
  const [slugTouched, setSlugTouched] = useState(!!draft.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const [over, setOver] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...d,
        tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
        published_at: d.published_at ? new Date(d.published_at).toISOString() : null,
      };
      const res = await fetch(d.id ? `/api/admin/blogs/${d.id}` : "/api/admin/blogs", {
        method: d.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Your session expired. Sign in again in another tab, then save.");
      if (!res.ok) throw new Error(j.error || "Save failed");
      onSaved(j, !d.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  async function pickCover(f: File | undefined) {
    if (!f) return;
    setCoverBusy(true);
    setError("");
    try {
      set("cover_image_url", await upload(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverBusy(false);
    }
  }

  const c = cover(d.cover_image_url || null);
  const tagList = d.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const label = "mb-2 flex items-center gap-1.5 text-sm font-bold text-[#3f5a4b]";
  const card = "adm-rise rounded-3xl border border-[#14532d]/8 bg-white p-5 shadow-[0_16px_36px_-32px_rgba(20,83,45,0.7)]";

  return (
    <form onSubmit={save} className="mx-auto max-w-6xl">
      <div className="adm-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onCancel} className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#15803d]">
            <Icon name="arrowLeft" className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to posts
          </button>
          <h1 className="mt-1 text-[1.9rem] font-extrabold tracking-tight text-[#0f3d22] sm:text-4xl">{d.id ? "Edit post" : "New post"}</h1>
        </div>
        <div className="flex gap-2.5">
          <button type="button" onClick={onCancel} className={btnGhost}>
            Cancel
          </button>
          <button disabled={saving || coverBusy} className={btnPrimary}>
            <Icon name={d.status === "published" && !d.id ? "spark" : "check"} className="h-[1.1rem] w-[1.1rem]" />
            {saving ? "Saving…" : d.id ? "Save changes" : d.status === "published" ? "Publish" : "Save draft"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="adm-pop mt-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-5">
          <div className={card + " space-y-5"} style={{ animationDelay: "60ms" }}>
            <label className="block">
              <span className={label}>Title *</span>
              <input
                value={d.title}
                required
                onChange={(e) => {
                  const title = e.target.value;
                  setD((x) => ({ ...x, title, slug: slugTouched ? x.slug : slugify(title) }));
                }}
                className={field + " text-lg font-bold"}
                placeholder="How ERP software simplifies business operations"
              />
            </label>
            <label className="block">
              <span className={label}><Icon name="link" className="h-4 w-4 text-[#15803d]" /> URL slug *</span>
              <div className="flex items-center rounded-2xl border border-[#14532d]/12 bg-white transition focus-within:border-[#16a34a] focus-within:shadow-[0_0_0_4px_rgba(22,163,74,0.13)]">
                <span className="rounded-l-2xl bg-[#f1f8f3] py-3 pl-4 pr-2 font-mono text-sm text-[#6b8577]">/blogs/</span>
                <input
                  value={d.slug}
                  required
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  className="w-full rounded-r-2xl bg-transparent py-3 pl-2 pr-4 font-mono text-sm outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className={label}><Icon name="message" className="h-4 w-4 text-[#15803d]" /> Short description *</span>
              <textarea value={d.excerpt} required rows={3} onChange={(e) => set("excerpt", e.target.value)} className={field + " resize-y"} placeholder="One or two sentences shown on the blog list and in search results" />
            </label>
          </div>
          <div className={card} style={{ animationDelay: "120ms" }}>
            <span className={label}><Icon name="doc" className="h-4 w-4 text-[#15803d]" /> Content</span>
            <RichEditor value={d.body_html} onChange={(v) => set("body_html", v)} onUpload={upload} />
          </div>
        </div>

        <aside className="space-y-5">
          <div className={card} style={{ animationDelay: "90ms" }}>
            <p className={label}>Status</p>
            <div className="relative grid grid-cols-2 rounded-2xl bg-[#f1f6f3] p-1">
              <span
                aria-hidden
                className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-[0_6px_16px_-8px_rgba(20,83,45,0.6)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${d.status === "published" ? "translate-x-full" : ""}`}
              />
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold capitalize transition-colors ${d.status === s ? (s === "published" ? "text-[#15803d]" : "text-[#b45309]") : "text-[#6b8577]"}`}
                >
                  <Icon name={s === "published" ? "globe" : "pencil"} className="h-4 w-4" />
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-5 block">
              <span className={label}><Icon name="calendar" className="h-4 w-4 text-[#15803d]" /> Publish date</span>
              <DateTimePicker value={d.published_at} onChange={(v) => set("published_at", v)} placeholder="Publish when saved" />
              <span className="mt-1.5 block text-xs text-[#6b8577]">Leave empty to use the moment you publish.</span>
            </div>
          </div>

          <div className={card} style={{ animationDelay: "150ms" }}>
            <p className={label}><Icon name="image" className="h-4 w-4 text-[#15803d]" /> Cover image</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); pickCover(e.dataTransfer.files?.[0]); }}
              className={`group relative block aspect-[16/9] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition ${over ? "border-[#16a34a] bg-[#dcfce7]" : "border-[#14532d]/15 bg-[#f6faf7] hover:border-[#16a34a]/60"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c && <img src={c} alt="" className="h-full w-full object-cover" />}
              <span className={`absolute inset-0 grid place-items-center text-center text-sm font-semibold text-[#15803d] transition ${c ? "bg-[#04140c]/55 text-white opacity-0 group-hover:opacity-100" : ""}`}>
                <span className="flex flex-col items-center gap-1.5">
                  <Icon name="upload" className="h-6 w-6" />
                  {c ? "Replace image" : "Click or drop an image"}
                </span>
              </span>
              {coverBusy && <span className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-bold text-[#15803d]">Uploading…</span>}
              <input type="file" accept="image/*" hidden onChange={(e) => pickCover(e.target.files?.[0])} />
            </label>
            {d.cover_image_url && (
              <button type="button" onClick={() => set("cover_image_url", "")} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline">
                <Icon name="trash" className="h-4 w-4" /> Remove image
              </button>
            )}
            <input value={d.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="…or paste an image URL" className={field + " mt-3 text-xs"} />
            <span className="mt-1.5 block text-xs text-[#6b8577]">JPG, PNG or WebP up to 2 MB. 16:9 works best.</span>
          </div>

          <label className={card + " block"} style={{ animationDelay: "180ms" }}>
            <span className={label}><Icon name="tag" className="h-4 w-4 text-[#15803d]" /> Tags</span>
            <input value={d.tags} onChange={(e) => set("tags", e.target.value)} className={field + " text-sm"} placeholder="AI, Cloud, DevOps" />
            {tagList.length > 0 && (
              <span className="mt-3 flex flex-wrap gap-1.5">
                {tagList.map((t) => (
                  <span key={t} className="adm-pop rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-bold text-[#166534]">{t}</span>
                ))}
              </span>
            )}
            <span className="mt-2 block text-xs text-[#6b8577]">Separate with commas.</span>
          </label>
        </aside>
      </div>
    </form>
  );
}
