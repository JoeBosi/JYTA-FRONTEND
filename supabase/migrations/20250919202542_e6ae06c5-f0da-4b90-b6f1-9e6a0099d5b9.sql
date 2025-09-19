-- Add column for transcript with timestamps
ALTER TABLE public.transcripts 
ADD COLUMN transcript_with_timestamps TEXT;