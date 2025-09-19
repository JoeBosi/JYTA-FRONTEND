-- Create youtubers table
CREATE TABLE public.youtubers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  channel_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtubers ENABLE ROW LEVEL SECURITY;

-- Create policies for youtubers
CREATE POLICY "Users can view their own youtubers" 
ON public.youtubers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own youtubers" 
ON public.youtubers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtubers" 
ON public.youtubers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtubers" 
ON public.youtubers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  youtuber_id UUID NOT NULL REFERENCES public.youtubers(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  playlist_name TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policies for videos
CREATE POLICY "Users can view their own videos" 
ON public.videos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.videos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.videos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_youtubers_updated_at
BEFORE UPDATE ON public.youtubers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_youtubers_user_id ON public.youtubers(user_id);
CREATE INDEX idx_youtubers_channel_id ON public.youtubers(channel_id);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_youtuber_id ON public.videos(youtuber_id);
CREATE INDEX idx_videos_video_id ON public.videos(video_id);