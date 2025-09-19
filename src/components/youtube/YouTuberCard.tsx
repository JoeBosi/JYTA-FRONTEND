import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, Calendar, Clock, List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface YouTuberCardProps {
  youtuber: Youtuber;
  onVideoSelect: (video: Video) => void;
}

export function YouTuberCard({ youtuber, onVideoSelect }: YouTuberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-ios-separator">
        {/* Youtuber Header */}
        <div
          className="p-4 cursor-pointer hover:bg-ios-fill/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {youtuber.channel_avatar_url && (
                <img
                  src={youtuber.channel_avatar_url}
                  alt={youtuber.channel_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {youtuber.channel_name}
                </h3>
                <p className="text-ios-label-secondary text-sm">
                  {youtuber.videos.length} video{youtuber.videos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5 text-ios-label-secondary" />
            </motion.div>
          </div>
        </div>

        {/* Videos List */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="border-t border-ios-separator">
            {youtuber.videos.map((video) => (
              <div
                key={video.id}
                className="p-4 border-b border-ios-separator last:border-b-0 hover:bg-ios-fill/30 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {video.thumbnail_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground mb-2 line-clamp-2">
                      {video.title}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {video.duration && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {video.duration}
                        </Badge>
                      )}
                      {video.published_at && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(video.published_at)}
                        </Badge>
                      )}
                      {video.playlist_name && (
                        <Badge variant="secondary" className="text-xs">
                          <List className="h-3 w-3 mr-1" />
                          {video.playlist_name}
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onVideoSelect(video)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Leggi trascrizione
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}