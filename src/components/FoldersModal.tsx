import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, ExternalLink, Loader2 } from 'lucide-react';
import { fetchMarketingVideoFolders } from '@/services/airtable';
import { MarketingVideoFolder } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FoldersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FoldersModal = ({ open, onOpenChange }: FoldersModalProps) => {
  console.log('FoldersModal component rendered', { open });
  const [folders, setFolders] = useState<MarketingVideoFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  const loadFolders = async () => {
    console.log('loadFolders called');
    setLoading(true);
    try {
      console.log('Calling fetchMarketingVideoFolders...');
      const fetchedFolders = await fetchMarketingVideoFolders();
      console.log('Fetched folders:', fetchedFolders);
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error",
        description: "Failed to load marketing folders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: MarketingVideoFolder) => {
    const folderUrl = folder.url || folder['Marketing Shorts Folder'];
    if (folderUrl && folderUrl.startsWith('http')) {
      window.open(folderUrl, '_blank');
    } else {
      toast({
        title: "No URL",
        description: "This folder doesn't have a valid URL configured.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Marketing Resource Folders
          </DialogTitle>
          <DialogDescription>
            Browse and access your marketing resource folders
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading folders...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No folders found</h3>
              <p className="text-sm text-muted-foreground">No marketing folders are currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder, index) => (
                <Card 
                  key={folder.recordId || index}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40"
                  onClick={() => handleFolderClick(folder)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg truncate" title={folder.name || 'Marketing Folder'}>
                      {folder.name || 'Marketing Folder'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {(folder.url || folder['Marketing Shorts Folder']) ? 'Click to access folder' : 'No URL available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 text-center">
                    <div className="space-y-2">
                      {(folder.url || folder['Marketing Shorts Folder']) && (
                        <p className="text-xs text-muted-foreground truncate" title={folder.url || folder['Marketing Shorts Folder']}>
                          {folder.url || folder['Marketing Shorts Folder']}
                        </p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                        disabled={!(folder.url || folder['Marketing Shorts Folder'])}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Folder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};