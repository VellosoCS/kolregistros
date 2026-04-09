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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "coordenacao@kol.com.br", password: "Coord2024!", role: "coordenacao", displayName: "Coordenação" },
    { email: "suporte@kol.com.br", password: "Suporte2024!", role: "suporte", displayName: "Suporte" },
    { email: "suportealuno@kol.com.br", password: "Aluno2024!", role: "suporte_aluno", displayName: "Suporte ao Aluno" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

    if (existing) {
      // Ensure role exists
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

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: u.role });

    results.push({ email: u.email, status: "created", roleError: roleError?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
