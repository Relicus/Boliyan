import { supabase } from "@/lib/supabase";

export async function uploadListingImage(file: File, userId: string): Promise<string> {
  // Sanitize filename and prepend timestamp/userId for uniqueness/organization
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); 
  const fileName = `${userId}/${Date.now()}_${cleanName}`;
  
  const { error } = await supabase.storage
    .from('listings')
    .upload(fileName, file, { 
        cacheControl: '3600', 
        upsert: false 
    });
  
  if (error) {
    throw error;
  }
  
  const { data } = supabase.storage.from('listings').getPublicUrl(fileName);
  return data.publicUrl;
}
