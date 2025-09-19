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
  transcript?: string;
  transcriptWithTimestamps?: string;
}

interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
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

async function fetchYouTubeTranscript(videoId: string, languageCode: string = 'it'): Promise<{ transcript: string; transcriptWithTimestamps: string } | null> {
  try {
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.log('YouTube API key not found');
      return null;
    }

    // First, get the list of available captions
    const captionsListUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${youtubeApiKey}`;
    
    const captionsResponse = await fetch(captionsListUrl);
    if (!captionsResponse.ok) {
      console.log('Failed to fetch captions list');
      return null;
    }
    
    const captionsData = await captionsResponse.json();
    if (!captionsData.items || captionsData.items.length === 0) {
      console.log('No captions available for this video');
      return null;
    }
    
    // Find the desired language or fallback to first available
    let selectedCaption = captionsData.items.find((caption: any) => 
      caption.snippet.language === languageCode
    );
    
    // If not found, try auto-generated captions
    if (!selectedCaption) {
      selectedCaption = captionsData.items.find((caption: any) => 
        caption.snippet.language === languageCode && caption.snippet.trackKind === 'asr'
      );
    }
    
    // If still not found, use the first available caption
    if (!selectedCaption) {
      selectedCaption = captionsData.items[0];
      console.log(`Using fallback language: ${selectedCaption.snippet.language}`);
    }
    
    // Download the caption content
    const captionDownloadUrl = `https://www.googleapis.com/youtube/v3/captions/${selectedCaption.id}?key=${youtubeApiKey}&tfmt=srt`;
    
    const captionResponse = await fetch(captionDownloadUrl);
    if (!captionResponse.ok) {
      console.log('Failed to download caption content');
      return null;
    }
    
    const srtContent = await captionResponse.text();
    return parseSRTContent(srtContent);
    
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return null;
  }
}

function parseSRTContent(srtContent: string): { transcript: string; transcriptWithTimestamps: string } {
  const lines = srtContent.trim().split('\n\n');
  const transcriptEntries: TranscriptEntry[] = [];
  
  for (const block of lines) {
    const blockLines = block.trim().split('\n');
    if (blockLines.length >= 3) {
      // Skip the sequence number (first line)
      const timecodeLine = blockLines[1];
      const textLines = blockLines.slice(2);
      
      // Parse timecode (e.g., "00:00:01,234 --> 00:00:04,567")
      const timeMatch = timecodeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const milliseconds = parseInt(timeMatch[4]);
        
        const startTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        const text = textLines.join(' ').replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
        
        if (text) {
          transcriptEntries.push({
            text,
            start: startTime,
            duration: 0 // Duration not needed for SRT parsing
          });
        }
      }
    }
  }
  
  // Create plain transcript
  const transcript = transcriptEntries
    .map(entry => entry.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Create transcript with timestamps
  const transcriptWithTimestamps = transcriptEntries
    .map(entry => {
      const totalMinutes = Math.floor(entry.start / 60);
      const seconds = Math.floor(entry.start % 60);
      const timestamp = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
      return `[${timestamp}] ${entry.text}`;
    })
    .join('\n');
  
  return { transcript, transcriptWithTimestamps };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, languageCode = 'it' } = await req.json();
    
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!youtubeApiKey) {
      console.error('YouTube API key not configured');
      return new Response(
        JSON.stringify({ error: 'API YouTube non configurata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Configurazione Supabase mancante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if transcript already exists in database
    const { data: existingTranscript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('transcript_text, transcript_with_timestamps')
      .eq('video_id', videoId)
      .eq('language_code', languageCode)
      .maybeSingle();

    let transcript = '';
    let transcriptWithTimestamps = '';

    if (existingTranscript && !transcriptError) {
      console.log('Found existing transcript in database for video:', videoId);
      transcript = existingTranscript.transcript_text || '';
      transcriptWithTimestamps = existingTranscript.transcript_with_timestamps || '';
    } else {
      console.log('Fetching new transcript from YouTube for video:', videoId);
      
      // Fetch transcript from YouTube
      const transcriptData = await fetchYouTubeTranscript(videoId, languageCode);
      
      if (transcriptData) {
        transcript = transcriptData.transcript;
        transcriptWithTimestamps = transcriptData.transcriptWithTimestamps;
        
        // Save transcript to database
        const { error: insertError } = await supabase
          .from('transcripts')
          .upsert({
            video_id: videoId,
            language_code: languageCode,
            transcript_text: transcript,
            transcript_with_timestamps: transcriptWithTimestamps
          });

        if (insertError) {
          console.error('Error saving transcript to database:', insertError);
        } else {
          console.log('Transcript saved to database successfully');
        }
      } else {
        console.log('No transcript available for this video');
      }
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
      transcript: transcript || undefined,
      transcriptWithTimestamps: transcriptWithTimestamps || undefined,
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