import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TextField {
  id: string;
  title: string | null;
  content: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface TextFieldFormProps {
  field?: TextField | null;
  onClose: () => void;
  onSave: () => void;
}

export function TextFieldForm({ field, onClose, onSave }: TextFieldFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: field?.title || '',
    content: field?.content || ''
  });
  const [photoUrl, setPhotoUrl] = useState(field?.photo_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(data.path);

      setPhotoUrl(publicUrl);
      toast({
        title: "Photo uploaded",
        description: "Your photo has been successfully uploaded."
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (photoUrl && user) {
      try {
        // Extract filename from URL for deletion
        const urlParts = photoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage
          .from('photos')
          .remove([filePath]);
      } catch (error) {
        console.error('Error removing photo:', error);
      }
    }
    setPhotoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.content.trim()) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        photo_url: photoUrl
      };

      if (field) {
        const { error } = await supabase
          .from('text_fields')
          .update(payload)
          .eq('id', field.id);

        if (error) throw error;
        toast({
          title: "Note updated",
          description: "Your note has been successfully updated."
        });
      } else {
        const { error } = await supabase
          .from('text_fields')
          .insert([payload]);

        if (error) throw error;
        toast({
          title: "Note created",
          description: "Your note has been successfully created."
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving text field:', error);
      toast({
        title: "Save failed",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card className="bg-card/95 backdrop-blur-xl border-ios-separator">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-ios-separator">
            <h2 className="text-xl font-semibold text-foreground">
              {field ? 'Edit Note' : 'Create Note'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Photo Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Photo (Optional)
              </label>
              {photoUrl ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={photoUrl}
                    alt="Note photo"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ios-separator rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {uploading ? (
                    <div className="animate-pulse">
                      <div className="w-12 h-12 bg-ios-fill rounded-full mx-auto mb-3" />
                      <p className="text-ios-label-secondary">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-ios-fill rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-ios-label-secondary" />
                      </div>
                      <p className="text-ios-label-secondary mb-1">Tap to add a photo</p>
                      <p className="text-xs text-ios-label-secondary">
                        JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title (Optional)
              </label>
              <Input
                type="text"
                placeholder="Enter a title for your note..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="h-12 bg-ios-fill border-ios-separator rounded-xl"
              />
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content *
              </label>
              <Textarea
                placeholder="Write your note here..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px] bg-ios-fill border-ios-separator rounded-xl resize-none"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 border-ios-separator rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !formData.content.trim()}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                {saving ? 'Saving...' : (field ? 'Update Note' : 'Create Note')}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}