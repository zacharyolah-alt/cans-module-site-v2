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

  function resetForm() {
    setEditingId(null);
    setName("");
    setPhoto("");
    setStandard("T-Trak");
    setDimensions("");
    setStatus("Active");
    setNotes("");
  }

  function startEdit(m: any
