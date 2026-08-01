import { createClient } from "@/lib/supabase/client";

export const storageService = {
  /**
   * Upload inspection photo to Supabase Storage bucket 'inspection-photos'
   * Target Path Structure: inspection-photos/{year}/{month}/{tabletCode}/{photoType}.jpg
   */
  async uploadInspectionPhoto(
    file: File | Blob,
    year: number,
    month: number,
    tabletCode: string,
    photoType: "front" | "back" | "screen" | "accessory"
  ): Promise<{ path: string; publicUrl: string }> {
    const monthStr = String(month).padStart(2, "0");
    const cleanTabletCode = tabletCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${photoType}_${Date.now()}.jpg`;
    const path = `${year}/${monthStr}/${cleanTabletCode}/${filename}`;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("inspection-photos")
        .upload(path, file, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.warn("Supabase storage upload error, returning object URL fallback:", error.message);
        // Dev fallback if storage bucket not initialized locally
        const mockUrl = typeof window !== "undefined" ? URL.createObjectURL(file) : "/placeholder-photo.jpg";
        return { path, publicUrl: mockUrl };
      }

      const { data: urlData } = supabase.storage
        .from("inspection-photos")
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (err: any) {
      console.warn("Storage upload exception, using local URL:", err);
      const mockUrl = typeof window !== "undefined" ? URL.createObjectURL(file) : "/placeholder-photo.jpg";
      return { path, publicUrl: mockUrl };
    }
  },

  /**
   * Remove photo file from storage bucket
   */
  async deleteInspectionPhoto(path: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("inspection-photos")
        .remove([path]);

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get public URL for stored image path
   */
  getPublicUrl(path: string): string {
    try {
      const supabase = createClient();
      const { data } = supabase.storage.from("inspection-photos").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      return "/placeholder-photo.jpg";
    }
  },
};
