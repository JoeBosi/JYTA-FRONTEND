import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  playlistId?: string;
  playlistTitle?: string;
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL del video richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'URL YouTube non valido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.error('YouTube API key not configured');
      return new Response(
        JSON.stringify({ error: 'API YouTube non configurata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video details from YouTube API
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`
    );

    if (!videoResponse.ok) {
      console.error('YouTube API error:', await videoResponse.text());
      return new Response(
        JSON.stringify({ error: 'Errore chiamata API YouTube' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Video non trovato' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const video = videoData.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    // Get channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${snippet.channelId}&part=snippet&key=${youtubeApiKey}`
    );

    let channelThumbnail = '';
    if (channelResponse.ok) {
      const channelData = await channelResponse.json();
      if (channelData.items && channelData.items.length > 0) {
        channelThumbnail = channelData.items[0].snippet.thumbnails?.default?.url || '';
      }
    }

    // Get playlist info if available
    let playlistTitle = '';
    if (snippet.playlistId) {
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?id=${snippet.playlistId}&part=snippet&key=${youtubeApiKey}`
      );
      
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        if (playlistData.items && playlistData.items.length > 0) {
          playlistTitle = playlistData.items[0].snippet.title;
        }
      }
    }

    const videoInfo: VideoInfo = {
      id: videoId,
      title: snippet.title,
      description: snippet.description,
      duration: formatDuration(contentDetails.duration),
      publishedAt: snippet.publishedAt,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      playlistId: snippet.playlistId,
      playlistTitle: playlistTitle || undefined,
    };

    console.log('Video info retrieved successfully:', videoInfo.title);

    return new Response(
      JSON.stringify({ success: true, data: videoInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-video-info function:', error);
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});