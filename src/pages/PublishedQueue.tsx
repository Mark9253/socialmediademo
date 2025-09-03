import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, ExternalLink, Copy, Check, Maximize2, X, Linkedin, Facebook, Instagram, Send, Clock, CalendarIcon } from 'lucide-react';
import { SocialPost, Platform, PLATFORM_CONFIGS } from '@/types';
import { fetchSocialPosts } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

export const PublishedQueue = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchSocialPosts();
        // Filter only approved posts that haven't been published yet
        const approvedPosts = data.filter(post => 
          post.Status && post.Status.toLowerCase() === 'approved'
        );
        setPosts(approvedPosts);
      } catch (error) {
        console.error('Failed to load posts:', error);
        toast({
          title: "Loading Failed",
          description: "Could not load approved posts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      
      // Reset copy indicator after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <X className="w-4 h-4 text-gray-900 dark:text-white" />;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      default: return <span className="text-sm">📱</span>;
    }
  };

  const getPlatformDisplayName = (platform: string) => {
    if (platform.toLowerCase() === 'twitter') {
      return 'X';
    }
    return PLATFORM_CONFIGS[platform as Platform]?.name || platform;
  };

  const getCharacterCount = (text: string, platform: Platform) => {
    if (!text) return { count: 0, max: PLATFORM_CONFIGS[platform]?.maxChars || 0, isOver: false };
    
    const max = PLATFORM_CONFIGS[platform]?.maxChars || 0;
    const count = text.length;
    return {
      count,
      max,
      isOver: count > max
    };
  };

  const renderPlatformContent = (post: SocialPost, platform: Platform) => {
    const fieldMap: Record<Platform, keyof SocialPost> = {
      twitter: 'twitterCopy',
      linkedin: 'linkedinCopy', 
      instagram: 'instagramCopy',
      facebook: 'facebookCopy',
      blog: 'blogCopy'
    };

    const content = post[fieldMap[platform]] as string;
    const config = PLATFORM_CONFIGS[platform];
    const charData = getCharacterCount(content, platform);
    const copyId = `${post.ID}-${platform}`;

    if (!content) return null;

    return (
      <Dialog key={platform}>
        <DialogTrigger asChild>
          <div className="p-4 border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(platform)}
                <Label className="font-medium">{getPlatformDisplayName(platform)}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${charData.isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {charData.count}/{charData.max}
                </span>
                <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="text-sm text-foreground line-clamp-3 overflow-hidden">
              {content}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getPlatformIcon(platform)}
              <span>{getPlatformDisplayName(platform)} Content</span>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-between">
                <span>Character count: {charData.count}/{charData.max}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(content, copyId)}
                  className="h-8"
                >
                  {copiedItems.has(copyId) ? (
                    <Check className="w-4 h-4 text-success mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy Content
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              value={content}
              readOnly
              className="min-h-[200px] resize-none text-sm bg-background"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-accent">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Send className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Publishing
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Queue
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Ready-to-publish approved content for your social media channels
          </p>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-light/20 rounded-full blur-2xl animate-pulse animation-delay-1000" />
      </div>

      {/* Main Content */}
      <div className="max-w-none space-y-8 pr-4 lg:pr-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <Send className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Ready to Publish</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">7</p>
                  <p className="text-sm text-muted-foreground">Days Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-20 bg-muted animate-pulse rounded" />
                      <div className="h-32 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.ID} className="hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-card to-card/95 border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {post.sourceHeadline || 'No headline'}
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            ✓ {post.Status}
                          </Badge>
                          {post.Created && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(post.Created).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Scheduled Publication Date/Time */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 min-w-[200px]">
                        <div className="flex items-center space-x-2 mb-2">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          <Label className="text-sm font-medium text-primary">Scheduled to Publish</Label>
                        </div>
                        {(post.datePosted || (post as any)['Date / Time to Post']) ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {format(new Date(post.datePosted || (post as any)['Date / Time to Post']), 'PPP')}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(post.datePosted || (post as any)['Date / Time to Post']), 'p')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No schedule set
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Source Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Source Summary</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-md min-h-[80px]">
                          <p className="text-sm text-foreground leading-relaxed">
                            {post.sourceSummary || 'No summary provided'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Source URL */}
                        {post.sourceURL && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Source URL</Label>
                            <div className="mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  const url = typeof post.sourceURL === 'string' 
                                    ? post.sourceURL 
                                    : (post.sourceURL as any)?.url;
                                  if (url) window.open(url, '_blank');
                                }}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Source
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Post Image */}
                        {post.postImage && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Post Image</Label>
                            <div className="mt-2">
                              {(() => {
                                const imageUrl = typeof post.postImage === 'string' 
                                  ? post.postImage 
                                  : (post.postImage as any)?.url;
                                
                                return imageUrl ? (
                                  <div className="w-full max-w-sm">
                                    <img 
                                      src={imageUrl} 
                                      alt="Post visual content" 
                                      className="w-full h-auto rounded-md border border-border"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No image available</p>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Platform Content Grid */}
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Platform Content</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(Object.keys(PLATFORM_CONFIGS) as Platform[]).map((platform) => 
                          renderPlatformContent(post, platform)
                        ).filter(Boolean)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed border-2">
              <CardContent className="p-12 text-center">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Posts Ready for Publishing</h3>
                <p className="text-muted-foreground">
                  Once posts are approved, they'll appear here ready for publishing to your social media channels.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};