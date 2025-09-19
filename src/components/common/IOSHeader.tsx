import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  Database, 
  Code, 
  Bug, 
  Menu,
  X,
  Home,
  FileText,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface IOSHeaderProps {
  title?: string;
  showDevMenu?: boolean;
}

export function IOSHeader({ title = "YTTS", showDevMenu = true }: IOSHeaderProps) {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const devMenuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Database, label: "Database", path: "/db" },
    { icon: Code, label: "API", path: "/api" },
    { icon: Bug, label: "Debug", path: "/debug" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <header className="bg-card/90 backdrop-blur-xl border-b border-ios-separator sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Dev menu button */}
            {showDevMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(true)}
                className="h-10 w-10 rounded-full bg-ios-fill/50 hover:bg-ios-fill"
              >
                <Menu className="h-5 w-5 text-ios-label" />
              </Button>
            )}
            
            {/* Center - App title */}
            <div className="flex-1 flex justify-center">
              <motion.h1 
                className="text-xl font-semibold text-foreground tracking-tight"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {title}
              </motion.h1>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-ios-fill/50 hover:bg-ios-fill"
              >
                <User className="h-5 w-5 text-ios-label" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-10 w-10 rounded-full bg-ios-fill/50 hover:bg-ios-fill text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Development Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-72 h-full bg-card/95 backdrop-blur-xl border-r border-ios-separator"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-ios-separator">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Development</h2>
                    <p className="text-sm text-ios-label-secondary">Navigation Menu</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMenu(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {devMenuItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        // Here you can add navigation logic
                        console.log(`Navigate to: ${item.path}`);
                        setShowMenu(false);
                      }}
                      className="w-full justify-start h-12 px-4 mb-1 rounded-xl hover:bg-ios-fill/50"
                    >
                      <item.icon className="h-5 w-5 mr-3 text-ios-label-secondary" />
                      <span className="text-ios-label">{item.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* User Info */}
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-ios-fill/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Developer
                    </p>
                    <p className="text-xs text-ios-label-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}