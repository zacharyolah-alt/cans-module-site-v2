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
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [standard, setStandard] = useState("T-Trak");
  const [dimensions, setDimensions] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadModules();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function loadModules() {
    const { data } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    setModules(data || []);
  }

  async function login() {
    const email = window.prompt("Enter your email");
    if (!email) return;
    await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: "https://cans-module-site-v2.vercel.app",
  },
});
    alert("Check your email for the login link.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function addModule() {
    if (!user) return alert("Please log in first.");
    if (!name.trim()) return alert("Please enter a module name.");

    await supabase.from("modules").insert({
      module_name: name,
      owner_name: user.email,
      user_id: user.id,
      photo_url: photo,
      standard,
      dimensions,
      status,
      additional_notes: notes,
    });

    setName("");
    setPhoto("");
    setDimensions("");
    setNotes("");
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
        <img src="/cans-logo.png" style={styles.logo} />
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
          <button style={styles.blackButton} onClick={login}>Member Login</button>
        ) : (
          <button style={styles.blackButton} onClick={logout}>Logout</button>
        )}
      </section>

      {user && (
        <section style={styles.formCard}>
          <h2>Add a Module</h2>

          <div style={styles.grid}>
            <input style={styles.input} placeholder="Module name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={styles.input} placeholder="Photo URL" value={photo} onChange={(e) => setPhoto(e.target.value)} />
            <select style={styles.input} value={standard} onChange={(e) => setStandard(e.target.value)}>
              <option>T-Trak</option>
              <option>N-Trak</option>
              <option>Free-moN</option>
              <option>Other</option>
            </select>
            <input style={styles.input} placeholder="Dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
            <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Planning</option>
              <option>Under Construction</option>
              <option>Active</option>
              <option>Retired</option>
            </select>
            <input style={styles.input} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button style={styles.yellowButton} onClick={addModule}>Add Module</button>
        </section>
      )}

      <h2 style={styles.sectionTitle}>Modules</h2>

      <section style={styles.cards}>
        {filteredModules.map((m) => (
          <article key={m.id} style={styles.card}>
            {m.photo_url ? (
              <img src={m.photo_url} style={styles.moduleImage} />
            ) : (
              <div style={styles.noImage}>No Photo</div>
            )}

            <div style={styles.cardBody}>
              <span style={styles.tag}>{m.standard || "Module"}</span>
              <h3>{m.module_name}</h3>
              <p><b>Owner:</b> {m.owner_name}</p>
              {m.dimensions && <p><b>Size:</b> {m.dimensions}</p>}
              {m.status && <p><b>Status:</b> {m.status}</p>}
              {m.additional_notes && <p>{m.additional_notes}</p>}
            </div>
          </article>
        ))}
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
  },
  search: {
    flex: 1,
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
  },
  yellowButton: {
    background: "#ffd21f",
    color: "black",
    border: 0,
    padding: "14px 18px",
    borderRadius: 14,
    fontWeight: 900,
    marginTop: 14,
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
};
