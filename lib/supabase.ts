import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our processed videos table
export interface ProcessedVideoDb {
  id: string;
  user_id: string | null;
  video_url: string;
  video_id: string;
  title: string;
  channel_name?: string;
  thumbnail_url?: string;
  prefix: string;
  markdown_content?: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
  playbook_generated: boolean;
  playbook_content?: string;
  playbook_generated_at?: string;
}

// Helper function to extract video ID from URL
export const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : url;
};

// Helper function to save processed video to Supabase
export const saveProcessedVideo = async (videoData: {
  video_url: string;
  title: string;
  channel_name?: string;
  thumbnail_url?: string;
  prefix: string;
  markdown_content?: string;
}) => {
  const video_id = extractVideoId(videoData.video_url);
  
  // Get current user (will be null for anonymous users)
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('processed_videos')
    .insert([
      {
        user_id: user?.id || null, // Allow null for anonymous users
        video_url: videoData.video_url,
        video_id,
        title: videoData.title,
        channel_name: videoData.channel_name,
        thumbnail_url: videoData.thumbnail_url,
        prefix: videoData.prefix,
        markdown_content: videoData.markdown_content,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving processed video:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  return data;
};

// Helper function to load processed videos from Supabase
export const loadProcessedVideos = async () => {
  // Get current user (will be null for anonymous users)
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('processed_videos')
    .select('*')
    .order('created_at', { ascending: false });
  
  // If user is authenticated, filter by user_id
  // If anonymous, show all videos with null user_id
  if (user) {
    query = query.eq('user_id', user.id);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading processed videos:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  return data || [];
};

// Helper function to update video playbook
export const updateVideoPlaybook = async (videoId: string, playbookContent: string) => {
  const { data, error } = await supabase
    .from('processed_videos')
    .update({
      playbook_content: playbookContent,
      playbook_generated: true,
      playbook_generated_at: new Date().toISOString()
    })
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    console.error('Error updating video playbook:', error);
    throw error;
  }

  return data;
};

// Helper function to mark playbook generation as failed
export const markPlaybookGenerationFailed = async (videoId: string, errorMessage?: string) => {
  const { data, error } = await supabase
    .from('processed_videos')
    .update({
      playbook_content: errorMessage ? `ERROR: ${errorMessage}` : 'ERROR: Playbook generation failed',
      playbook_generated: false,
      playbook_generated_at: new Date().toISOString()
    })
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    console.error('Error marking playbook generation failed:', error);
    throw error;
  }

  return data;
};

// Helper function to delete processed video
export const deleteProcessedVideo = async (videoId: string) => {
  const { error } = await supabase
    .from('processed_videos')
    .delete()
    .eq('id', videoId);

  if (error) {
    console.error('Error deleting processed video:', error);
    throw error;
  }
};

// Types for shared playbooks
export interface SharedPlaybookDb {
  id: string;
  user_id: string | null;
  original_video_id: string;
  share_id: string;
  title: string;
  description?: string;
  playbook_content: string;
  video_title: string;
  video_url?: string;
  channel_name?: string;
  thumbnail_url?: string;
  tags: string[];
  view_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to create shared playbook
export interface CreateSharedPlaybookData {
  original_video_id: string;
  title: string;
  description?: string;
  playbook_content: string;
  video_title: string;
  video_url?: string;
  channel_name?: string;
  thumbnail_url?: string;
  tags?: string[];
}

// Helper function to create shared playbook
export const createSharedPlaybook = async (data: CreateSharedPlaybookData) => {
  // Get current user (will be null for anonymous users)
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: sharedPlaybook, error } = await supabase
    .from('shared_playbooks')
    .insert([
      {
        user_id: user?.id || null,
        original_video_id: data.original_video_id,
        share_id: crypto.randomUUID(),
        title: data.title,
        description: data.description,
        playbook_content: data.playbook_content,
        video_title: data.video_title,
        video_url: data.video_url,
        channel_name: data.channel_name,
        thumbnail_url: data.thumbnail_url,
        tags: data.tags || [],
        view_count: 0,
        is_active: true,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating shared playbook:', error);
    throw error;
  }

  return sharedPlaybook;
};

// Helper function to get shared playbook by share ID
export const getSharedPlaybook = async (shareId: string) => {
  const { data, error } = await supabase
    .from('shared_playbooks')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error getting shared playbook:', error);
    throw error;
  }

  return data;
};

// Helper function to increment view count
export const incrementSharedPlaybookViews = async (shareId: string) => {
  const { error } = await supabase
    .from('shared_playbooks')
    .update({ view_count: supabase.rpc('increment', { row_id: shareId }) })
    .eq('share_id', shareId);

  if (error) {
    console.error('Error incrementing view count:', error);
  }
};

// Helper function to get user's shared playbooks
export const getUserSharedPlaybooks = async () => {
  // Get current user (will be null for anonymous users)
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('shared_playbooks')
    .select('*')
    .order('created_at', { ascending: false });
  
  // If user is authenticated, filter by user_id
  // If anonymous, show all shared playbooks with null user_id
  if (user) {
    query = query.eq('user_id', user.id);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading shared playbooks:', error);
    throw error;
  }

  return data || [];
};

// Helper function to deactivate shared playbook
export const deactivateSharedPlaybook = async (shareId: string) => {
  const { error } = await supabase
    .from('shared_playbooks')
    .update({ is_active: false })
    .eq('share_id', shareId);

  if (error) {
    console.error('Error deactivating shared playbook:', error);
    throw error;
  }
};