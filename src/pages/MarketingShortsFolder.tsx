import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchMarketingVideoFolders } from '@/services/airtable';
import { MarketingVideoFolder } from '@/types';
import { Folder, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketingShortsFolder = () => {
  const [folders, setFolders] = useState<MarketingVideoFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const { toast } = useToast();

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const fetchedFolders = await fetchMarketingVideoFolders();
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error",
        description: "Failed to load marketing folders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingFolders(false);
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-32 right-16 w-16 h-16 bg-accent/30 rounded-full blur-lg animate-bounce" />
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-secondary/40 rounded-full blur-md animate-pulse delay-1000" />
            
            {/* Content */}
            <div className="text-center relative z-10">
              <Link to="/marketing-shorts">
                <Button 
                  variant="outline" 
                  className="mb-6 border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Marketing Shorts
                </Button>
              </Link>
              
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                  <Folder className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
                Marketing Shorts Folders
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Browse and access your marketing resource folders
              </p>
            </div>
          </div>
        </div>

        {/* Folders Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loadingFolders ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folders.map((folder, index) => (
                <Card 
                  key={folder.recordId || index}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40"
                  onClick={() => handleFolderClick(folder)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg truncate" title={folder.name || 'Marketing Folder'}>
                      {folder.name || 'Marketing Folder'}
                    </CardTitle>
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
      </div>
    </Layout>
  );
};