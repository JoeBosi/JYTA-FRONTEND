import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
}

function parseVTTContent(vttContent: string) {
  const lines = vttContent.split('\n');
  const entries: TranscriptEntry[] = [];
  let start = 0;
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join(' ').replace(/<[^>]*>/g, '').trim();
    if (text) entries.push({ text, start, duration: 0 });
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === 'WEBVTT') continue;
    const m = line.match(/(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s+--\>\s+(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/);
    if (m) {
      if (buffer.length) flush();
      const h = parseInt(m[1] || '0');
      const mm = parseInt(m[2]);
      const ss = parseInt(m[3]);
      const ms = parseInt(m[4]);
      start = h * 3600 + mm * 60 + ss + ms / 1000;
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) flush();

  const transcript = entries.map(e => e.text).join(' ').replace(/\s+/g, ' ').trim();
  const transcriptWithTimestamps = entries
    .map(e => {
      const m = Math.floor(e.start / 60);
      const s = Math.floor(e.start % 60);
      return `[${m}:${s.toString().padStart(2, '0')}] ${e.text}`;
    })
    .join('\n');
  return { transcript, transcriptWithTimestamps };
}

async function fetchTranscript(videoId: string, languageCode = 'it') {
  const attempts = [
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&fmt=vtt`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&fmt=json3`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&tlang=${languageCode}&v=${videoId}&fmt=vtt`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&tlang=${languageCode}&v=${videoId}&fmt=json3`,
  ];

  for (const url of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const body = await res.text();
      if (!body || body.trim().length < 10) continue;
      if (body.startsWith('WEBVTT')) {
        return parseVTTContent(body);
      }
      try {
        const json = JSON.parse(body);
        if (json?.events) {
          const entries: TranscriptEntry[] = [];
          for (const ev of json.events) {
            if (!ev.segs) continue;
            const start = (parseFloat(ev.tStartMs) || 0) / 1000;
            const duration = (parseFloat(ev.dDurationMs) || 0) / 1000;
            const txt = ev.segs.map((s: any) => s.utf8).join('').trim();
            if (txt) entries.push({ text: txt, start, duration });
          }
          const transcript = entries.map(e => e.text).join(' ').replace(/\s+/g, ' ').trim();
          const transcriptWithTimestamps = entries
            .map(e => {
              const m = Math.floor(e.start / 60);
              const s = Math.floor(e.start % 60);
              return `[${m}:${s.toString().padStart(2, '0')}] ${e.text}`;
            })
            .join('\n');
          return { transcript, transcriptWithTimestamps };
        }
      } catch (_) {}
    } catch (_) {}
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, languageCode = 'it' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Select target videos for the user, with empty or null transcript
    let query = supabase
      .from('videos')
      .select('id, video_id, user_id, transcript');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    const updated: Array<{ id: string; ok: boolean; msg?: string }> = [];

    for (const v of videos || []) {
      if (v.transcript && v.transcript.trim().length > 0) {
        updated.push({ id: v.id, ok: true, msg: 'already present' });
        continue;
      }
      const fetched = await fetchTranscript(v.video_id, languageCode);
      if (!fetched) {
        // set empty transcript explicitly
        await supabase.from('videos').update({ transcript: '' }).eq('id', v.id);
        updated.push({ id: v.id, ok: false, msg: 'not found' });
        continue;
      }

      // Upsert transcripts table and update videos
      await supabase
        .from('transcripts')
        .upsert({
          video_id: v.video_id,
          language_code: languageCode,
          transcript_text: fetched.transcript,
          transcript_with_timestamps: fetched.transcriptWithTimestamps,
        });

      await supabase
        .from('videos')
        .update({ transcript: fetched.transcript })
        .eq('id', v.id);

      updated.push({ id: v.id, ok: true });
    }

    return new Response(JSON.stringify({ success: true, updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Backfill error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});