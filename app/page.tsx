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
const [moduleType, setModuleType] = useState("Straight");
const [cornerSize, setCornerSize] = useState("");
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
      module_type: moduleType,
corner_size: cornerSize,
      dimensions,
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
    });
  }, [modules, search, standardFilter, statusFilter]);
  return (
    <main>
      <style>{`
        body { margin: 0; background: #f3f2ed; }
        .page { min-height: 100vh; padding: 20px; font-family: Arial, sans-serif; color: #111; }
        .hero { background: linear-gradient(135deg, #050505, #202020); color: white; border-radius: 28px; padding: 28px; display: flex; align-items: center; gap: 22px; box-shadow: 0 16px 40px rgba(0,0,0,.22); }
        .logo { width: 120px; height: 120px; border-radius: 50%; background: white; object-fit: contain; border: 5px solid #ffd21f; flex-shrink: 0; }
        .badge { background: #ffd21f; color: black; display: inline-block; padding: 7px 13px; border-radius: 999px; font-weight: 900; font-size: 13px; }
        .title { font-size: 44px; margin: 10px 0; line-height: 1; }
        .subtitle { color: #ddd; max-width: 700px; font-size: 17px; }
        .toolbar { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 20px 0 12px; }
        .filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        input, select { padding: 14px; border-radius: 15px; border: 1px solid #ccc; font-size: 16px; background: white; }
        button { border: 0; border-radius: 15px; padding: 14px 18px; font-weight: 900; cursor: pointer; }
        .blackBtn { background: #050505; color: #ffd21f; }
        .yellowBtn { background: #ffd21f; color: black; margin-top: 14px; margin-right: 10px; }
        .grayBtn { background: #ddd; color: black; margin-top: 14px; }
        .formCard { background: white; padding: 22px; border-radius: 24px; border-top: 8px solid #ffd21f; box-shadow: 0 10px 26px rgba(0,0,0,.08); margin-bottom: 26px; }
        .formGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .uploadBox { padding: 14px; border-radius: 15px; border: 2px dashed #999; background: #fafafa; font-weight: 900; text-align: center; cursor: pointer; }
        .preview { margin-top: 15px; width: 200px; max-width: 100%; border-radius: 16px; border: 1px solid #ddd; }
        .sectionHeader { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 28px rgba(0,0,0,.13); }
        .moduleImage { width: 100%; height: 210px; object-fit: cover; background: #ddd; }
        .noImage { height: 210px; background: #ddd; display: flex; align-items: center; justify-content: center; color: #555; font-weight: 900; }
        .cardBody { padding: 18px; }
        .tag { background: #ffd21f; padding: 6px 11px; border-radius: 999px; font-weight: 900; font-size: 13px; display: inline-block; }
        .status { display: inline-block; margin-left: 8px; background: #eee; padding: 6px 11px; border-radius: 999px; font-weight: 800; font-size: 13px; }
        .actions { display: flex; gap: 10px; margin-top: 16px; }
        .editBtn { background: #050505; color: #ffd21f; flex: 1; }
        .deleteBtn { background: #b00020; color: white; flex: 1; }

        @media (max-width: 700px) {
          .page { padding: 12px; }
          .hero { flex-direction: column; text-align: center; padding: 22px; }
          .logo { width: 100px; height: 100px; }
          .title { font-size: 32px; }
          .subtitle { font-size: 15px; }
          .toolbar, .filters, .formGrid { grid-template-columns: 1fr; }
          .sectionHeader { flex-direction: column; align-items: flex-start; gap: 4px; }
          button, input, select { width: 100%; box-sizing: border-box; }
          .actions { flex-direction: column; }
        }
      `}</style>

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

          {!user ? (
            <button className="blackBtn" onClick={login}>
              Member Login
            </button>
          ) : (
            <button className="blackBtn" onClick={logout}>
              Logout
            </button>
          )}
        </section>

        <section className="filters">
          <select
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
          >
            <option>All</option>
            <option>T-Trak</option>
            <option>N-Trak</option>
            <option>Free-moN</option>
            <option>Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Planning</option>
            <option>Under Construction</option>
            <option>Active</option>
            <option>Retired</option>
          </select>

          <button
            className="blackBtn"
            onClick={() => {
              setSearch("");
              setStandardFilter("All");
              setStatusFilter("All");
            }}
          >
            Clear Filters
          </button>
        </section>

        {user && (
          <section className="formCard">
            <h2>{editingId ? "Edit Module" : "Add a Module"}</h2>

            <div className="formGrid">
              <input
                placeholder="Module name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="uploadBox">
                {uploading
                  ? "Uploading..."
                  : photo
                  ? "Change Module Photo"
                  : "Choose Module Photo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>

              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
              >
                <option>T-Trak</option>
                <option>N-Trak</option>
                <option>Free-moN</option>
                <option>Other</option>
              </select>
<div>
              <select
  value={moduleType}
  onChange={(e) => {
    setModuleType(e.target.value);
    setCornerSize("");
  }}
>
  <option>Straight</option>
  <option>Inside Corner</option>
  <option>Outside Corner</option>
  <option>Bridge</option>
</select>
</div>
              {(moduleType === "Inside Corner" || moduleType === "Outside Corner") && (
  <div>
  <select
    value={cornerSize}
    onChange={(e) => setCornerSize(e.target.value)}
  >
    <option value="">Select corner size</option>
    <option>Small Inside Corner - 195 mm / 220 mm</option>
    <option>Medium Inside Corner - 220 mm / 245 mm</option>
    <option>Large Inside Corner - 245 mm / 270 mm</option>
    <option>Standard Corner - 365 mm (14.37")</option>
    <option>End Cap - 365 mm x 732 mm (14.37" x 28.82")</option>
    <option>Large Radius - 315 mm / 348 mm</option>
    <option>Large Radius - 348 mm / 381 mm</option>
    <option>Large Radius - 381 mm / 414 mm</option>
    <option>Large Radius - 447 mm / 480 mm</option>
  </select>
)}
              <select
  value={dimensions}
  onChange={(e) => setDimensions(e.target.value)}
>
  <option value="">Select module size</option>
  <option>Single - 308 mm (12.13")</option>
  <option>Double - 618 mm (24.33")</option>
  <option>Triple - 928 mm (36.54")</option>
  <option>Quad - 1238 mm (48.74")</option>
  <option>Corner - 365.1 mm x 365.1 mm (14.38" x 14.38")</option>
  <option>End Cap - 731.8 mm x 365.1 mm (28.81" x 14.38")</option>
  <option>Interchange Double - 390 mm x 618 mm (15.35" x 24.33")</option>
  <option>Interchange Triple - 474 mm x 928 mm (18.66" x 36.54")</option>
  <option>Other / custom</option>
</select>
  </div>
  )}
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Planning</option>
                <option>Under Construction</option>
                <option>Active</option>
                <option>Retired</option>
              </select>

              <input
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {photo && <img src={photo} alt="Preview" className="preview" />}

            <div>
              <button className="yellowBtn" onClick={saveModule}>
                {editingId ? "Save Changes" : "Add Module"}
              </button>

              {editingId && (
                <button className="grayBtn" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        )}

        <div className="sectionHeader">
          <h2>Modules</h2>
          <p>{filteredModules.length} shown</p>
        </div>

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
                    <button className="editBtn" onClick={() => startEdit(m)}>
                      Edit
                    </button>
                    <button
                      className="deleteBtn"
                      onClick={() => deleteModule(m.id)}
                    >
                      Delete
                    </button>
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
