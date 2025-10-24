import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let supabaseClient = null;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️  Supabase credentials not configured. File uploads will fail.');
    console.warn('   Set SUPABASE_URL and SUPABASE_KEY environment variables.');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return supabaseClient;
}

export async function supabaseUpload(filePath, storagePath, bucket, mimeType) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const { data, error } = await client.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
}

export async function supabasePublicUrl(storagePath, bucket) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  try {
    const { data } = client.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Supabase public URL error:', error);
    throw error;
  }
}

export async function supabaseUploadComplete(filePaths, storagePaths, bucket, mimeType, originalNames) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  try {
    const streamUrls = [];
    const downloadUrls = [];

    for (let i = 0; i < filePaths.length; i++) {
      const fileBuffer = await fs.readFile(filePaths[i]);
      const { data, error } = await client.storage
        .from(bucket)
        .upload(storagePaths[i], fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const { data: urlData } = client.storage
        .from(bucket)
        .getPublicUrl(storagePaths[i]);

      streamUrls.push(urlData.publicUrl);
      downloadUrls.push(`${urlData.publicUrl}?download=${originalNames[i]}`);
    }

    return { streamUrls, downloadUrls };
  } catch (error) {
    console.error('Supabase upload complete error:', error);
    throw error;
  }
}

export default function createSupabaseService() {
  return getSupabaseClient();
}
