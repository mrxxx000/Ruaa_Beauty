import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env');
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  service: string; // 'mehendi', 'makeup', 'lashes', etc.
  createdAt: Date;
  uploadedBy: number; // user id
}

export class MediaService {
  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    fileType: 'image' | 'video',
    service: string,
    userId: number
  ): Promise<{ id: string; url: string; filename: string }> {
    try {
      const client = getSupabaseClient();
      
      // Create unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${fileType}s/${service}/${timestamp}-${filename}`;

      // Upload to Supabase storage
      const { data, error } = await client.storage
        .from('media')
        .upload(uniqueFilename, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = client.storage
        .from('media')
        .getPublicUrl(uniqueFilename);

      // Store metadata in database
      const { data: dbData, error: dbError } = await client
        .from('media')
        .insert([
          {
            filename: filename,
            storage_path: uniqueFilename,
            url: publicUrlData.publicUrl,
            type: fileType,
            service: service,
            uploaded_by: userId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
      }

      return {
        id: dbData?.id || timestamp.toString(),
        url: publicUrlData.publicUrl,
        filename: filename,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * Get all media files, optionally filtered by service or type
   */
  async getAllMedia(
    service?: string,
    fileType?: 'image' | 'video'
  ): Promise<MediaItem[]> {
    try {
      const client = getSupabaseClient();
      
      let query = client.from('media').select('*');

      if (service) {
        query = query.eq('service', service);
      }

      if (fileType) {
        query = query.eq('type', fileType);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to fetch media: ${error.message}`);
      }

      return (
        data?.map((item: any) => ({
          id: item.id,
          filename: item.filename,
          url: item.url,
          type: item.type,
          service: item.service,
          createdAt: new Date(item.created_at),
          uploadedBy: item.uploaded_by,
        })) || []
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get media: ${errorMessage}`);
    }
  }

  /**
   * Delete a media file
   */
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      const client = getSupabaseClient();
      
      // Get the storage path first
      const { data: dbData, error: dbError } = await client
        .from('media')
        .select('storage_path')
        .eq('id', mediaId)
        .single();

      if (dbError) {
        throw new Error(`Failed to find media: ${dbError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await client.storage
        .from('media')
        .remove([dbData.storage_path]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      // Delete from database
      const { error: deleteError } = await client
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (deleteError) {
        throw new Error(`Failed to delete media record: ${deleteError.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete media: ${errorMessage}`);
    }
  }

  /**
   * Get media by service (e.g., 'mehendi', 'makeup', 'lashes')
   */
  async getMediaByService(service: string): Promise<MediaItem[]> {
    return this.getAllMedia(service);
  }
}
