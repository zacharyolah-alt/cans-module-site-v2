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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadModules();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

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

  async function saveModule() {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter a module name.");
      return;
    }

    const payload = {
      module_name: name,
      owner_name: user.email,
      user_id: user.id,
      standard,
      dimensions,
      status,
      additional_notes: notes,
    };

    if (editingId) {
      const { error } = await supabase
        .from("modules")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("modules").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm();
    loadModules();
  }

  async function deleteModule(id: string) {
    const ok = window.confirm("Delete this module?");
    if (!ok) return;

    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadModules();
  }

  const filteredModules = useMemo(() => {
    const term = search.toLowerCase();

    return modules.filter((m) =>
      [
        m.module_name,
        m.owner_name,
        m.standard,
        m.dimensions,
        m.status,
        m.additional_notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [modules, search]);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <img src="/cans-logo.png" alt="C.A.N.S. logo" style={styles.logo} />

        <div>
          <p style={styles.badge}>Columbus Area N Scalers</p>
          <h1 style={styles.title}>C.A.N.S. Module Directory</h1>
          <p style={styles.subtitle}>
            Member module photos, setup notes, standards, dimensions, and layout information.
          </p>
        </div>
      </section>

      <section style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!user ? (
          <button style={styles.blackButton} onClick={login}>
            Member Login
          </button>
        ) : (
          <button style={styles.blackButton} onClick={logout}>
            Logout
          </button>
        )}
      </section>

      {user && (
        <section style={styles.formCard}>
          <h2>{editingId ? "Edit Module" : "Add a Module"}</h2>

          <div style={styles.grid}>
            <input
              style={styles.input}
              placeholder="Module name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label style={styles.uploadBox}>
              {uploading ? "Uploading..." : "Choose Module Photo"}
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
              style={styles.input}
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
            >
              <option>T-Trak</option>
              <option>N-Trak</option>
              <option>Free-moN</option>
              <option>Other</option>
            </select>

            <input
              style={styles.input}
              placeholder="Dimensions"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />

            <select
              style={styles.input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Planning</option>
              <option>Under Construction</option>
              <option>Active</option>
              <option>Retired</option>
            </select>

            <input
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {photo && (
            <div style={styles.previewWrap}>
              <p style={styles.previewLabel}>Selected photo:</p>
              <img src={photo} alt="Module preview" style={styles.preview} />
            </div>
          )}

          <button style={styles.yellowButton} onClick={saveModule}>
            {editingId ? "Save Changes" : "Add Module"}
          </button>

          {editingId && (
            <button style={styles.cancelButton} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </section>
      )}

      <h2 style={styles.sectionTitle}>Modules</h2>

      <section style={styles.cards}>
        {filteredModules.map((m) => {
          const canEdit = user && user.id === m.user_id;

          return (
            <article key={m.id} style={styles.card}>
              {m.photo_url ? (
                <img src={m.photo_url} alt={m.module_name} style={styles.moduleImage} />
              ) : (
                <div style={styles.noImage}>No Photo</div>
              )}

              <div style={styles.cardBody}>
                <span style={styles.tag}>{m.standard || "Module"}</span>
                <h3 style={styles.cardTitle}>{m.module_name}</h3>

                <p>
                  <b>Owner:</b> {m.owner_name}
                </p>

                {m.dimensions && (
                  <p>
                    <b>Size:</b> {m.dimensions}
                  </p>
                )}

                {m.status && (
                  <p>
                    <b>Status:</b> {m.status}
                  </p>
                )}

                {m.additional_notes && <p>{m.additional_notes}</p>}

                {canEdit && (
                  <div style={styles.actions}>
                    <button style={styles.editButton} onClick={() => startEdit(m)}>
                      Edit
                    </button>

                    <button style={styles.deleteButton} onClick={() => deleteModule(m.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f4f4f0",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  hero: {
    background: "#050505",
    color: "white",
    borderRadius: 24,
    padding: 24,
    display: "flex",
    gap: 20,
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    background: "white",
    objectFit: "contain",
    border: "4px solid #ffd21f",
  },
  badge: {
    background: "#ffd21f",
    color: "black",
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontWeight: 800,
  },
  title: {
    fontSize: 42,
    margin: "10px 0",
  },
  subtitle: {
    color: "#ddd",
    maxWidth: 650,
  },
  toolbar: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  search: {
    flex: 1,
    minWidth: 240,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  blackButton: {
    background: "#050505",
    color: "#ffd21f",
    border: 0,
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  yellowButton: {
    background: "#ffd21f",
    color: "black",
    border: 0,
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 900,
    marginTop: 14,
    marginRight: 10,
    cursor: "pointer",
  },
  cancelButton: {
    background: "#ddd",
    color: "black",
    border: 0,
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 800,
    marginTop: 14,
    cursor: "pointer",
  },
  formCard: {
    background: "white",
    padding: 20,
    borderRadius: 22,
    borderTop: "8px solid #ffd21f",
    marginBottom: 25,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  input: {
    padding: 13,
    borderRadius: 12,
    border: "1px solid #ccc",
    fontSize: 15,
  },
  uploadBox: {
    padding: 13,
    borderRadius: 12,
    border: "2px dashed #999",
    background: "#fafafa",
    fontSize: 15,
    fontWeight: 800,
    textAlign: "center",
    cursor: "pointer",
  },
  previewWrap: {
    marginTop: 15,
  },
  previewLabel: {
    fontWeight: 800,
    marginBottom: 6,
  },
  preview: {
    width: 180,
    borderRadius: 12,
    border: "1px solid #ddd",
  },
  sectionTitle: {
    fontSize: 32,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
  },
  card: {
    background: "white",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,.12)",
  },
  moduleImage: {
    width: "100%",
    height: 190,
    objectFit: "cover",
  },
  noImage: {
    height: 190,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ddd",
    color: "#555",
  },
  cardBody: {
    padding: 18,
  },
  tag: {
    background: "#ffd21f",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  },
  cardTitle: {
    marginTop: 12,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 15,
  },
  editButton: {
    background: "#050505",
    color: "#ffd21f",
    border: 0,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteButton: {
    background: "#b00020",
    color: "white",
    border: 0,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
};
