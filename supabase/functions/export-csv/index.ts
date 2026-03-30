import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const resolved = url.searchParams.get("resolved");

    let query = supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (resolved === "true") {
      query = query.eq("resolved", true);
    } else if (resolved === "false") {
      query = query.eq("resolved", false);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = ["Urgência", "Professor", "Responsável", "Tipo", "Descrição", "Solução", "Acompanhamento", "Resolvido", "Data"];
    
    const rows = (data || []).map((row: any) => [
      escapeCsv(row.urgency || ""),
      escapeCsv(row.teacher_name || ""),
      escapeCsv(row.coordinator || ""),
      escapeCsv(row.problem_type || ""),
      escapeCsv(row.description || ""),
      escapeCsv(row.solution || ""),
      row.needs_follow_up ? "Sim" : "Não",
      row.resolved ? "Sim" : "Não",
      escapeCsv(new Date(row.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })),
    ].join(","));

    const BOM = "\uFEFF";
    const csv = BOM + headers.join(",") + "\n" + rows.join("\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "inline; filename=incidentes.csv",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
