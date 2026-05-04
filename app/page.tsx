"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Page() {
  const [modules, setModules] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [standard, setStandard] = useState("T-Trak");
  const [dimensions, setDimensions] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [customDimensions, setCustomDimensions] = useState("");

  useEffect(() => {
    loadModules();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadModules() {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setModules(data || []);
  }

  async function login() {
    const email = window.prompt("Enter your email");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://cans-module-site-v2.vercel.app",
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email for the login link.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }
  async function uploadPhoto(file: File) {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    setUploading(true);

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const fileName = `${user.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("module-photos")
      .upload(fileName, file);

    if (error) {
      setUploading(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("module-photos")
      .getPublicUrl(fileName);

    setPhoto(data.publicUrl);
    setUploading(false);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPhoto("");
    setStandard("T-Trak");
    setDimensions("");
    setStatus("Active");
    setNotes("");
  }

  function startEdit(m: any) {
    setEditingId(m.id);
    setName(m.module_name || "");
    setPhoto(m.photo_url || "");
    setStandard(m.standard || "T-Trak");
    setDimensions(m.dimensions || "");
    setStatus(m.status || "Active");
    setNotes(m.additional_notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveModule() {
    if (!user) return alert("Please log in first.");
    if (!name.trim()) return alert("Please enter a module name.");
    if (uploading) return alert("Please wait for photo upload to finish.");

    const payload = {
      module_name: name,
      owner_name: user.email,
      user_id: user.id,
      photo_url: photo,
      standard,
     dimensions: dimensions === "Other" ? customDimensions : dimensions, 
      status,
      additional_notes: notes,
    };

    const result = editingId
      ? await supabase.from("modules").update(payload).eq("id", editingId)
      : await supabase.from("modules").insert(payload);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    resetForm();
    loadModules();
  }

  async function deleteModule(id: string) {
    if (!window.confirm("Delete this module?")) return;

    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadModules();
  }

  const filteredModules = useMemo(() => {
    const term = search.toLowerCase();

    return modules.filter((m) => {
      const matchesSearch = [
        m.module_name,
        m.owner_name,
        m.standard,
        m.dimensions,
        m.status,
        m.additional_notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);

      const matchesStandard =
        standardFilter === "All" || m.standard === standardFilter;

      const matchesStatus =
        statusFilter === "All" || m.status === statusFilter;

      return matchesSearch && matchesStandard && matchesStatus;
   }, [modules, search, standardFilter, statusFilter]); 
  return (
   <main>
    <div className="page">
      <section className="hero">
        <img src="/cans-logo.png" alt="C.A.N.S. logo" className="logo" />
        <div>
          <p className="badge">Columbus Area N Scalers</p>
          <h1 className="title">C.A.N.S. Module Directory</h1>
          <p className="subtitle">
            A clean member-powered directory for module photos, standards,
            dimensions, status, and setup notes.
          </p>
        </div>
      </section>

      <section className="toolbar">
        <input
          placeholder="Search by module, owner, notes, size..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="cards">
        {filteredModules.map((m) => (
          <article key={m.id} className="card">
            {m.photo_url ? (
              <img
                src={m.photo_url}
                alt={m.module_name}
                className="moduleImage"
              />
            ) : (
              <div className="noImage">No Photo</div>
            )}

            <div className="cardBody">
              <span className="tag">{m.standard || "Module"}</span>
              <span className="status">{m.status || "Active"}</span>

              <h3>{m.module_name}</h3>
              <p>
                <b>Owner:</b> {m.owner_name}
              </p>

              {m.dimensions && (
                <p>
                  <b>Size:</b> {m.dimensions}
                </p>
              )}

              {m.additional_notes && <p>{m.additional_notes}</p>}

              {user && (
                <div className="actions">
                  <button onClick={() => startEdit(m)}>Edit</button>
                  <button onClick={() => deleteModule(m.id)}>Delete</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  </main>
);
  }
          
