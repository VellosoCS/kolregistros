import { supabase } from "@/integrations/supabase/client";

export async function uploadIncidentImages(files: File[], incidentId: string): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${incidentId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("incident-images")
      .upload(path, file);

    if (error) {
      console.error("Upload error:", error);
      continue;
    }

    // Store the path (not a public URL) — signed URLs are generated at display time
    urls.push(path);
  }

  return urls;
}

export async function deleteIncidentImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map((url) => {
      const match = url.match(/incident-images\/(.+)$/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];

  if (paths.length > 0) {
    await supabase.storage.from("incident-images").remove(paths);
  }
}
