import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Youtube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface YouTubeUrlFormProps {
  onVideoAdded: () => void;
}

export function YouTubeUrlForm({ onVideoAdded }: YouTubeUrlFormProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Inserisci un URL di YouTube');
      return;
    }

    if (!user) {
      toast.error('Devi essere autenticato');
      return;
    }

    setIsLoading(true);

    try {
      // Call edge function to get video info
      const { data: videoInfoResponse, error: videoInfoError } = await supabase.functions.invoke('youtube-video-info', {
        body: { url: url.trim() }
      });

      if (videoInfoError) {
        console.error('Video info error:', videoInfoError);
        toast.error('Errore nel recupero delle informazioni del video');
        return;
      }

      if (!videoInfoResponse.success) {
        toast.error(videoInfoResponse.error || 'Video non trovato');
        return;
      }

      const videoInfo = videoInfoResponse.data;

      // Check if youtuber already exists
      let youtuberId: string;
      const { data: existingYoutuber, error: youtuberCheckError } = await supabase
        .from('youtubers')
        .select('id')
        .eq('channel_id', videoInfo.channelId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (youtuberCheckError) {
        console.error('Error checking youtuber:', youtuberCheckError);
        toast.error('Errore nel controllo del canale');
        return;
      }

      if (existingYoutuber) {
        youtuberId = existingYoutuber.id;
      } else {
        // Create new youtuber
        const { data: newYoutuber, error: youtuberError } = await supabase
          .from('youtubers')
          .insert({
            user_id: user.id,
            channel_id: videoInfo.channelId,
            channel_name: videoInfo.channelTitle,
            channel_avatar_url: `https://www.googleapis.com/youtube/v3/channels?id=${videoInfo.channelId}&part=snippet&key=AIzaSyDummy` // Placeholder for now
          })
          .select()
          .single();

        if (youtuberError) {
          console.error('Error creating youtuber:', youtuberError);
          toast.error('Errore nella creazione del canale');
          return;
        }

        youtuberId = newYoutuber.id;
      }

      // Check if video already exists
      const { data: existingVideo, error: videoCheckError } = await supabase
        .from('videos')
        .select('id')
        .eq('video_id', videoInfo.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (videoCheckError) {
        console.error('Error checking video:', videoCheckError);
        toast.error('Errore nel controllo del video');
        return;
      }

      if (existingVideo) {
        toast.info('Video già presente nella tua collezione');
        setUrl('');
        onVideoAdded();
        return;
      }

      // Create new video
      const { error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          youtuber_id: youtuberId,
          video_id: videoInfo.id,
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          published_at: videoInfo.publishedAt,
          playlist_name: videoInfo.playlistTitle,
          thumbnail_url: videoInfo.thumbnailUrl,
          transcript: videoInfo.transcript || 'Trascrizione non disponibile per questo video.'
        });

      if (videoError) {
        console.error('Error creating video:', videoError);
        toast.error('Errore nel salvataggio del video');
        return;
      }

      toast.success('Video aggiunto con successo!');
      setUrl('');
      onVideoAdded();

    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('Errore nell\'elaborazione del video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-ios-separator">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500 rounded-lg">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Aggiungi Video YouTube
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="h-12 bg-ios-fill border-ios-separator rounded-xl"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Elaborazione...' : 'Aggiungi Video'}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}