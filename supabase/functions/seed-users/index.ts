import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate JWT from the request
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify user has coordenacao role (only coordinators can seed users)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== "coordenacao") {
    return new Response(JSON.stringify({ error: "Forbidden: coordinators only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const users = [
    { email: "coordenacao@kol.com.br", password: "Coord2024!", role: "coordenacao", displayName: "Coordenação" },
    { email: "suporte@kol.com.br", password: "Suporte2024!", role: "suporte", displayName: "Suporte" },
    { email: "suportealuno@kol.com.br", password: "Aluno2024!", role: "suporte_aluno", displayName: "Suporte ao Aluno" },
  ];

  const results = [];

  for (const u of users) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

    if (existing) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: existing.id, role: u.role }, { onConflict: "user_id,role" });
      
      results.push({ email: u.email, status: "already_exists", roleError });
      continue;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.displayName },
    });

    if (authError) {
      results.push({ email: u.email, status: "error", error: authError.message });
      continue;
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: u.role });

    results.push({ email: u.email, status: "created", roleError: roleError?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
