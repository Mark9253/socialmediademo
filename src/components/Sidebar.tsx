import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  Settings, 
  FileText, 
  Palette,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Content Generator', href: '/generator', icon: Sparkles },
  { name: 'Post Approval', href: '/approval', icon: CheckCircle },
  { name: 'Brand Guidelines', href: '/guidelines', icon: Palette },
  { name: 'Writing Prompts', href: '/prompts', icon: FileText },
];

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            ContentCraft
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary-foreground" : "group-hover:text-accent-foreground"
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary-light to-accent border border-primary/20">
          <p className="text-sm font-medium text-foreground">🚀 Pro Tip</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save brand guidelines first for better content generation!
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 w-64 h-full bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
};