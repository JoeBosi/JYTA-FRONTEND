import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Camera, Edit3, Trash2, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TextFieldForm } from './TextFieldForm';
import { NoteModal } from './NoteModal';
import { IOSHeader } from '@/components/common/IOSHeader';
import { YouTubeUrlForm } from '@/components/youtube/YouTubeUrlForm';
import { YouTuberCard } from '@/components/youtube/YouTuberCard';
import { VideoTranscriptModal } from '@/components/youtube/VideoTranscriptModal';

interface TextField {
  id: string;
  title: string | null;
  content: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

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

interface Youtuber {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_avatar_url: string | null;
  videos: Video[];
}

export function MainScreen() {
  const { user, signOut } = useAuth();
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [youtubers, setYoutubers] = useState<Youtuber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showYouTubeForm, setShowYouTubeForm] = useState(false);
  const [editingField, setEditingField] = useState<TextField | null>(null);
  const [selectedField, setSelectedField] = useState<TextField | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'youtube'>('youtube');
  const [loading, setLoading] = useState(true);
  const [backfillDone, setBackfillDone] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTextFields();
      fetchYoutubers();
    }
  }, [user]);

  const fetchTextFields = async () => {
    try {
      const { data, error } = await supabase
        .from('text_fields')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTextFields(data || []);
    } catch (error) {
      console.error('Error fetching text fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYoutubers = async () => {
    try {
      const { data, error } = await supabase
        .from('youtubers')
        .select(`
          *,
          videos (
            id,
            video_id,
            title,
            description,
            duration,
            published_at,
            playlist_name,
            thumbnail_url,
            transcript
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setYoutubers(data || []);

      // Trigger a one-time backfill for this user
      if (!backfillDone && user) {
        try {
          const { error: fnError } = await supabase.functions.invoke('backfill-transcripts', {
            body: { userId: user.id, languageCode: 'it' },
          });
          if (!fnError) {
            setBackfillDone(true);
            // Refresh after backfill
            const { data: refreshed } = await supabase
              .from('youtubers')
              .select(`*, videos ( id, video_id, title, description, duration, published_at, playlist_name, thumbnail_url, transcript )`)
              .order('updated_at', { ascending: false });
            if (refreshed) setYoutubers(refreshed);
          }
        } catch (e) {
          console.error('Backfill trigger error:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching youtubers:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('text_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTextFields(prev => prev.filter(field => field.id !== id));
    } catch (error) {
      console.error('Error deleting text field:', error);
    }
  };

  const filteredFields = textFields.filter(field =>
    field.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-ios-surface to-ios-surface-secondary flex items-center justify-center">
        <div className="animate-pulse text-ios-label-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ios-surface to-ios-surface-secondary">
      {/* iOS Header */}
      <IOSHeader title="YTTS" showDevMenu={true} />
      
      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('youtube')}
            variant={activeTab === 'youtube' ? 'default' : 'outline'}
            className="rounded-xl"
          >
            <Youtube className="h-4 w-4 mr-2" />
            YouTube
          </Button>
          <Button
            onClick={() => setActiveTab('notes')}
            variant={activeTab === 'notes' ? 'default' : 'outline'}
            className="rounded-xl"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Note
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary h-5 w-5" />
          <Input
            type="text"
            placeholder={activeTab === 'youtube' ? "Cerca nei tuoi video..." : "Cerca nelle tue note..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-ios-fill border-ios-separator rounded-xl"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'youtube' ? (
          <div className="space-y-6">
            {/* YouTube URL Form */}
            {showYouTubeForm && (
              <YouTubeUrlForm 
                onVideoAdded={() => {
                  fetchYoutubers();
                  setShowYouTubeForm(false);
                }} 
              />
            )}

            {/* YouTubers List */}
            <AnimatePresence>
              {youtubers.length === 0 && !searchQuery ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-ios-fill flex items-center justify-center">
                    <Youtube className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Nessun video aggiunto</h3>
                  <p className="text-ios-label-secondary mb-6">
                    Aggiungi il tuo primo video YouTube per iniziare
                  </p>
                  <Button
                    onClick={() => setShowYouTubeForm(true)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-6"
                  >
                    <Youtube className="w-5 h-5 mr-2" />
                    Aggiungi Video YouTube
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {youtubers
                    .filter(youtuber => 
                      !searchQuery || 
                      youtuber.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      youtuber.videos.some(video => 
                        video.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    )
                    .map((youtuber) => (
                      <YouTuberCard
                        key={youtuber.id}
                        youtuber={youtuber}
                        onVideoSelect={setSelectedVideo}
                      />
                    ))
                  }
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <AnimatePresence>
            {textFields.length === 0 && !searchQuery ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-ios-fill flex items-center justify-center">
                  <Edit3 className="w-12 h-12 text-ios-label-secondary" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">Nessuna nota</h3>
                <p className="text-ios-label-secondary mb-6">
                  Crea la tua prima nota per iniziare
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crea Nota
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Notes Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="p-4 bg-card/80 backdrop-blur-sm border-ios-separator hover:shadow-ios transition-all duration-200 cursor-pointer group"
                        onClick={() => setSelectedField(field)}
                      >
                        {field.photo_url && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <img
                              src={field.photo_url}
                              alt="Note image"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        
                        {field.title && (
                          <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                            {field.title}
                          </h3>
                        )}
                        
                        <p className="text-ios-label-secondary text-sm line-clamp-3 mb-3">
                          {field.content}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-ios-label-secondary">
                          <span>
                            {new Date(field.updated_at).toLocaleDateString()}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingField(field);
                                setShowForm(true);
                              }}
                              className="h-8 w-8 text-primary"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(field.id);
                              }}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {filteredFields.length === 0 && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ios-fill flex items-center justify-center">
                      <Search className="w-8 h-8 text-ios-label-secondary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Nessun risultato</h3>
                    <p className="text-ios-label-secondary">
                      Prova a cercare con parole chiave diverse
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="fixed bottom-6 right-6"
      >
        <Button
          onClick={() => {
            if (activeTab === 'youtube') {
              setShowYouTubeForm(true);
            } else {
              setEditingField(null);
              setShowForm(true);
            }
          }}
          className={`h-14 w-14 rounded-full text-white shadow-ios-large ${
            activeTab === 'youtube' 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {activeTab === 'youtube' ? <Youtube className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Text Field Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TextFieldForm
            field={editingField}
            onClose={() => {
              setShowForm(false);
              setEditingField(null);
            }}
            onSave={() => {
              fetchTextFields();
              setShowForm(false);
              setEditingField(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Note Reading Modal */}
      <NoteModal
        field={selectedField}
        onClose={() => setSelectedField(null)}
        onEdit={(field) => {
          setEditingField(field);
          setSelectedField(null);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />

      {/* Video Transcript Modal */}
      <VideoTranscriptModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}