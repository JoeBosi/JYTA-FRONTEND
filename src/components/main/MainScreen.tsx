import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Camera, Edit3, Trash2, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TextFieldForm } from './TextFieldForm';
import { NoteModal } from './NoteModal';

interface TextField {
  id: string;
  title: string | null;
  content: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function MainScreen() {
  const { user, signOut } = useAuth();
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<TextField | null>(null);
  const [selectedField, setSelectedField] = useState<TextField | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTextFields();
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
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-ios-separator sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">My Notes</h1>
              <p className="text-sm text-ios-label-secondary">
                Welcome back, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-10 w-10 rounded-full text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-label-secondary h-5 w-5" />
            <Input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-ios-fill border-ios-separator rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
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
              <h3 className="text-xl font-medium text-foreground mb-2">No notes yet</h3>
              <p className="text-ios-label-secondary mb-6">
                Create your first note to get started
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Note
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
                  <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                  <p className="text-ios-label-secondary">
                    Try searching with different keywords
                  </p>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
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
            setEditingField(null);
            setShowForm(true);
          }}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-ios-large"
        >
          <Plus className="h-6 w-6" />
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
    </div>
  );
}