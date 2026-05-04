"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    loadModules();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  async function loadModules() {
    const { data } = await supabase.from("modules").select("*");
    setModules(data || []);
  }

  async function login() {
    const email = window.prompt("Enter your email");
    if (!email) return;

    await supabase.auth.signInWithOtp({ email });
    alert("Check your email for the login link.");
  }

  async function addModule() {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    await supabase.from("modules").insert({
      module_name: name,
      owner_name: user.email,
      user_id: user.id,
      photo_url: photo,
    });

    setName("");
    setPhoto("");
    loadModules();
  }
  }
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>C.A.N.S. Module Directory</h1>

      {!user ? (
        <button onClick={login}>Login</button>
      ) : (
        <p>Logged in as {user.email}</p>
      )}

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Module name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Photo URL"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
        />

        <button onClick={addModule}>Add Module</button>
      </div>

      <h2>Modules</h2>

      {modules.map((m) => (
        <div key={m.id} style={{ marginBottom: 20 }}>
          <strong>{m.module_name}</strong> — {m.owner_name}
          <br />
          {m.photo_url && (
            <img
              src={m.photo_url}
              alt={m.module_name}
              width={200}
              style={{ marginTop: 10 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
