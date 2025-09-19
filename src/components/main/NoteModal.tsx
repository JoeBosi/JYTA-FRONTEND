import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TextField {
  id: string;
  title: string | null;
  content: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface NoteModalProps {
  field: TextField | null;
  onClose: () => void;
  onEdit: (field: TextField) => void;
  onDelete: (id: string) => void;
}

export function NoteModal({ field, onClose, onEdit, onDelete }: NoteModalProps) {
  if (!field) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <Card className="bg-card/95 backdrop-blur-xl border-ios-separator shadow-ios-large">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ios-separator">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-ios-label-secondary" />
                <span className="text-sm text-ios-label-secondary">
                  {new Date(field.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(field)}
                  className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDelete(field.id);
                    onClose();
                  }}
                  className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Photo */}
              {field.photo_url && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={field.photo_url}
                    alt="Note image"
                    className="w-full h-64 object-cover"
                  />
                </motion.div>
              )}

              {/* Title */}
              {field.title && (
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold text-foreground mb-4 leading-tight"
                >
                  {field.title}
                </motion.h1>
              )}

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="prose prose-sm max-w-none"
              >
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {field.content}
                </p>
              </motion.div>

              {/* Updated info */}
              {field.updated_at !== field.created_at && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 pt-4 border-t border-ios-separator"
                >
                  <p className="text-xs text-ios-label-secondary">
                    Modificato il {new Date(field.updated_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}