import { supabase } from '../db/supabase';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  session_type: string;
  storage_path: string;
  public_url: string;
  notes?: string;
  created_at: string;
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

export async function uploadProgressPhoto(
  file: File,
  userId: string,
  date: string,
  sessionType: string,
  notes?: string,
): Promise<ProgressPhoto | null> {
  const compressed = await compressImage(file);
  const id = crypto.randomUUID();
  const path = `${userId}/${date}_${sessionType}_${id}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('progress-photos')
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) { console.error('Storage upload error:', uploadError); return null; }

  const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path);

  const { data, error } = await supabase
    .from('progress_photos')
    .insert({ id, user_id: userId, date, session_type: sessionType, storage_path: path, notes: notes || null })
    .select()
    .single();

  if (error) { console.error('DB insert error:', error); return null; }
  return { ...data, public_url: urlData.publicUrl };
}

export async function fetchProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    ...p,
    public_url: supabase.storage.from('progress-photos').getPublicUrl(p.storage_path).data.publicUrl,
  }));
}

export async function deleteProgressPhoto(photo: ProgressPhoto): Promise<boolean> {
  const { error: storageError } = await supabase.storage
    .from('progress-photos')
    .remove([photo.storage_path]);
  if (storageError) return false;

  const { error: dbError } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photo.id);

  return !dbError;
}
