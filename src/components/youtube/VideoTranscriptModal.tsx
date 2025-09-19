import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, List, Youtube, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Video {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  published_at: string | null;
  playlist_name: string | null;
  thumbnail_url: string | null;
  transcript: string | null;
}

interface VideoTranscriptModalProps {
  video: Video | null;
  onClose: () => void;
  onVideoDeleted?: () => void;
}

export function VideoTranscriptModal({ video, onClose, onVideoDeleted }: VideoTranscriptModalProps) {
  const [localTranscript, setLocalTranscript] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!video) return;
    setLocalTranscript(video.transcript || '');
  }, [video]);

  useEffect(() => {
    const fetchIfEmpty = async () => {
      if (!video) return;
      if (localTranscript && localTranscript.trim().length > 0) return;
      setIsFetching(true);
      setDebugLog('Nessuna trascrizione in DB. Avvio recupero da YouTube...');
      try {
        const url = `https://www.youtube.com/watch?v=${video.video_id}`;
        const { data, error } = await supabase.functions.invoke('youtube-video-info', {
          body: { url, languageCode: 'it' },
        });
        if (error) {
          setDebugLog(`Errore funzione: ${error.message}`);
          toast.error('Errore nel recupero trascrizione');
          return;
        }
        if (!data?.success) {
          setDebugLog(`Risposta non valida dalla funzione: ${JSON.stringify(data)}`);
          toast.error('Trascrizione non disponibile');
          return;
        }
        const t = data.data?.transcript || '';
        if (!t) {
          setDebugLog('Funzione completata ma nessuna trascrizione trovata.');
        } else {
          setDebugLog('Trascrizione recuperata. Salvo nel DB...');
          setLocalTranscript(t);
          const { error: updateErr } = await supabase
            .from('videos')
            .update({ transcript: t })
            .eq('id', video.id);
          if (updateErr) {
            setDebugLog(`Errore salvataggio DB: ${updateErr.message}`);
          } else {
            setDebugLog('Trascrizione salvata con successo.');
          }
        }
      } catch (e: any) {
        setDebugLog(`Eccezione: ${String(e?.message || e)}`);
        toast.error('Errore inatteso nel recupero trascrizione');
      } finally {
        setIsFetching(false);
      }
    };
    fetchIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  const handleDeleteVideo = async () => {
    if (!video) return;
    
    const confirmDelete = window.confirm(`Sei sicuro di voler cancellare il video "${video.title}"?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) {
        console.error('Error deleting video:', error);
        toast.error('Errore nella cancellazione del video');
        return;
      }

      toast.success('Video cancellato con successo');
      onClose();
      onVideoDeleted?.();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Errore nella cancellazione del video');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!video) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const openYouTubeVideo = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.video_id}`;
    console.log('Opening YouTube URL:', youtubeUrl);
    window.open(youtubeUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-ios-separator bg-ios-fill/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                  {video.title}
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {video.duration && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {video.duration}
                    </Badge>
                  )}
                  {video.published_at && (
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(video.published_at)}
                    </Badge>
                  )}
                  {video.playlist_name && (
                    <Badge variant="secondary">
                      <List className="h-3 w-3 mr-1" />
                      {video.playlist_name}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={openYouTubeVideo}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Guarda su YouTube
                  </Button>
                  
                  <Button
                    onClick={handleDeleteVideo}
                    disabled={isDeleting}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Cancellazione...' : 'Cancella Video'}
                  </Button>
                </div>
              </div>
              
              {video.thumbnail_url && (
                <div className="flex-shrink-0">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-32 h-20 rounded-lg object-cover"
                  />
                </div>
              )}
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transcript Content */}
          <ScrollArea className="flex-1 p-6 max-h-[60vh]">
            <Card className="p-6 bg-ios-fill/10 border-ios-separator">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Trascrizione del Video
                </h3>
              </div>
              
              {debugLog && (
                <div className="mb-4 flex items-start gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4 mt-1" />
                  <p className="text-sm whitespace-pre-wrap">{debugLog}</p>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none text-foreground">
                {localTranscript ? (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {localTranscript}
                  </p>
                ) : (
                  <p className="text-ios-label-secondary italic">
                    {isFetching ? 'Recupero trascrizione in corso...' : 'Trascrizione non disponibile per questo video.'}
                  </p>
                )}
              </div>
            </Card>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}