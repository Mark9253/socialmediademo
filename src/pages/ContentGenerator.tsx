import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ExternalLink, Image as ImageIcon, Loader2, FileText, Calendar, Link2, Copy, Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ContentGenerationRequest, Platform, PLATFORM_CONFIGS, SocialPost } from '@/types';
import { triggerContentGeneration } from '@/services/webhooks';
import { fetchSocialPosts, updateSocialPost } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

export const ContentGenerator = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContentGenerationRequest>({
    sourceHeadline: '',
    sourceSummary: '',
    sourceURL: '',
    goToArticle: '',
    socialChannels: [],
    needsImage: false,
    imageSize: 'square'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [editingPosts, setEditingPosts] = useState<Map<string, Partial<SocialPost>>>(new Map());
  const [savingPosts, setSavingPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchSocialPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load posts:', error);
        toast({
          title: "Loading Failed",
          description: "Could not load existing posts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

  const handleChannelToggle = (platform: Platform, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      socialChannels: checked 
        ? [...prev.socialChannels, platform]
        : prev.socialChannels.filter(ch => ch !== platform)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceHeadline.trim() || !formData.sourceSummary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both headline and summary fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.socialChannels.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one social media platform.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await triggerContentGeneration(formData);
      
      toast({
        title: "Content Generation Started!",
        description: "Your content is being generated. You'll receive the results shortly.",
      });
      
      // Reset form
      setFormData({
        sourceHeadline: '',
        sourceSummary: '',
        sourceURL: '',
        goToArticle: '',
        socialChannels: [],
        needsImage: false,
        imageSize: 'square'
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-success text-success-foreground';
      case 'Scheduled': return 'bg-warning text-warning-foreground';
      case 'Draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
    const icons: Record<string, any> = {
      twitter: '🐦',
      linkedin: '💼', 
      instagram: '📸',
      facebook: '👥',
      blog: '📝'
    };
    return icons[platform.toLowerCase()] || '📱';
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

  // Update post field functions
  const updatePostField = (postId: string, field: keyof SocialPost, value: any) => {
    console.log('updatePostField called:', { postId, field, value });
    if (!postId) {
      console.error('Missing postId in updatePostField');
      return;
    }
    setEditingPosts(prev => {
      const newMap = new Map(prev);
      const currentEdits = newMap.get(postId) || {};
      newMap.set(postId, { ...currentEdits, [field]: value });
      return newMap;
    });
  };

  const handlePlatformToggle = (postId: string, platform: Platform, checked: boolean) => {
    console.log('handlePlatformToggle called:', { postId, platform, checked });
    if (!postId) {
      console.error('Missing postId in handlePlatformToggle');
      return;
    }
    const post = posts.find(p => p.ID === postId);
    if (!post) {
      console.error('Post not found:', postId);
      return;
    }

    // Get current platforms, checking edits first, then original post data
    const edits = editingPosts.get(postId);
    const currentChannels = edits?.socialChannels || post.socialChannels;
    const currentPlatforms = currentChannels && typeof currentChannels === 'string' 
      ? currentChannels.split(',').map(p => p.trim().toLowerCase())
      : [];

    let newPlatforms;
    if (checked) {
      // Add platform if not already present
      if (!currentPlatforms.includes(platform.toLowerCase())) {
        newPlatforms = [...currentPlatforms, platform.toLowerCase()];
      } else {
        newPlatforms = currentPlatforms;
      }
    } else {
      // Remove platform
      newPlatforms = currentPlatforms.filter(p => p !== platform.toLowerCase());
    }

    updatePostField(postId, 'socialChannels', newPlatforms.join(', '));
  };

  const handleImageToggle = (postId: string, checked: boolean) => {
    updatePostField(postId, 'needsImage?', checked ? 'Yes' : 'No');
  };

  const handleImageSizeChange = (postId: string, size: string) => {
    updatePostField(postId, 'imageSize', size);
  };

  const savePostChanges = async (postId: string) => {
    const edits = editingPosts.get(postId);
    if (!edits || Object.keys(edits).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes to save for this post.",
        variant: "destructive"
      });
      return;
    }

    setSavingPosts(prev => new Set([...prev, postId]));

    try {
      const updatedPost = await updateSocialPost(postId, edits);
      
      // Update the posts state with the new data
      setPosts(prev => prev.map(post => 
        post.ID === postId ? { ...post, ...updatedPost } : post
      ));

      // Clear the editing state for this post
      setEditingPosts(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });

      toast({
        title: "Changes Saved!",
        description: "Post settings have been updated successfully.",
      });

    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const hasUnsavedChanges = (postId: string) => {
    const edits = editingPosts.get(postId);
    const hasChanges = Boolean(edits && Object.keys(edits).length > 0);
    console.log('hasUnsavedChanges check:', { postId, edits, hasChanges });
    return hasChanges;
  };

  return (
    <Layout>
      <div className="max-w-none space-y-8 pr-4 lg:pr-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Content Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform your source content into engaging social media posts
          </p>
        </div>

        <div className="space-y-6">
          {/* Existing Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <span>Source Content Database</span>
                </CardTitle>
                <CardDescription>
                  View and reference your existing source content data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => {
                      console.log('Rendering post:', { ID: post.ID, sourceHeadline: post.sourceHeadline });
                      if (!post.ID) {
                        console.error('Post missing ID:', post);
                        return null;
                      }
                      return (
                        <Card key={post.ID} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                  {post.sourceHeadline || 'No headline'}
                                </h3>
                                <Badge className={getStatusColor(post.Status)}>
                                  {post.Status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {post.Created && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(post.Created).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Summary */}
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Summary</Label>
                                  <div className="mt-1 p-3 bg-muted/50 rounded-md min-h-[80px]">
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {post.sourceSummary || 'No summary provided'}
                                    </p>
                                  </div>
                                </div>

                                 {/* Platforms - Multi-Select Popover */}
                                 <div>
                                   <Label className="text-sm font-medium text-muted-foreground">Social Platforms</Label>
                                   <div className="mt-2">
                                     <Popover>
                                       <PopoverTrigger asChild>
                                         <Button 
                                           variant="outline" 
                                           className="w-full justify-between h-9 bg-background border"
                                         >
                                           <span className="text-sm">
                                             {(() => {
                                               const edits = editingPosts.get(post.ID!);
                                               const currentChannels = edits?.socialChannels || post.socialChannels;
                                               const count = currentChannels && typeof currentChannels === 'string' && currentChannels.trim() 
                                                 ? currentChannels.split(',').length 
                                                 : 0;
                                               return count > 0 ? `${count} platform${count > 1 ? 's' : ''} selected` : 'Select platforms...';
                                             })()}
                                           </span>
                                           <ChevronDown className="h-4 w-4 opacity-50" />
                                         </Button>
                                       </PopoverTrigger>
                                       <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50" align="start">
                                         <div className="p-2">
                                           {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
                                             // Get current value, taking edits into account
                                             const edits = editingPosts.get(post.ID!);
                                             const currentChannels = edits?.socialChannels || post.socialChannels;
                                             const isSelected = currentChannels && typeof currentChannels === 'string' 
                                               ? currentChannels.toLowerCase().includes(platform.toLowerCase())
                                               : false;
                                             
                                             return (
                                               <div 
                                                 key={platform} 
                                                 className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                                                 onClick={() => {
                                                   handlePlatformToggle(post.ID!, platform as Platform, !isSelected);
                                                 }}
                                               >
                                                 <Checkbox
                                                   checked={isSelected}
                                                   className="pointer-events-none"
                                                 />
                                                 <span className="text-sm">{config.name}</span>
                                               </div>
                                             );
                                           })}
                                         </div>
                                       </PopoverContent>
                                     </Popover>
                                     
                                     {/* Current selection display */}
                                     <div className="flex flex-wrap gap-1 mt-2">
                                       {(() => {
                                         const edits = editingPosts.get(post.ID!);
                                         const currentChannels = edits?.socialChannels || post.socialChannels;
                                         
                                         return currentChannels && typeof currentChannels === 'string' && currentChannels.trim() ? (
                                           currentChannels.split(',').map((channel, index) => (
                                             <Badge 
                                               key={index} 
                                               variant="outline" 
                                               className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                               onClick={() => {
                                                 handlePlatformToggle(post.ID!, channel.trim() as Platform, false);
                                               }}
                                             >
                                               {channel.trim()} ×
                                             </Badge>
                                           ))
                                         ) : (
                                           <span className="text-xs text-muted-foreground">No platforms selected</span>
                                         );
                                       })()}
                                     </div>
                                   </div>
                                 </div>
                              </div>

                              {/* Links and Image Options */}
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Source URL</Label>
                                  <div className="mt-1">
                                    {(() => {
                                      const url = typeof post.sourceURL === 'object' && post.sourceURL?.url 
                                        ? post.sourceURL.url 
                                        : typeof post.sourceURL === 'string' 
                                          ? post.sourceURL 
                                          : null;
                                      
                                      return url ? (
                                        <a 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-sm"
                                        >
                                          <Link2 className="w-4 h-4" />
                                          <span className="truncate max-w-xs">
                                            {url}
                                          </span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">No source URL</span>
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-muted-foreground">Go to Article Link</Label>
                                  <div className="mt-1">
                                    {(() => {
                                      const url = typeof post.goToArticle === 'object' && post.goToArticle?.url 
                                        ? post.goToArticle.url 
                                        : typeof post.goToArticle === 'string' 
                                          ? post.goToArticle 
                                          : null;
                                      
                                      return url ? (
                                        <a 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-sm"
                                        >
                                          <Link2 className="w-4 h-4" />
                                          <span className="truncate max-w-xs">
                                            {url}
                                          </span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">No article link</span>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Image Options - Selectable */}
                                <div className="border-t pt-3">
                                  <Label className="text-sm font-medium text-muted-foreground">Image Requirements</Label>
                                  <div className="mt-2 space-y-3">
                                     {/* Needs Image Toggle */}
                                     <div className="flex items-center space-x-3 p-2 border rounded hover:bg-accent/50 transition-colors">
                                       <Checkbox
                                         id={`${post.ID}-needsImage`}
                                          checked={(() => {
                                            const edits = editingPosts.get(post.ID!);
                                            const currentValue = edits?.['needsImage?'] || post['needsImage?'];
                                            return currentValue === 'Yes' || currentValue === 'true' || (typeof currentValue === 'boolean' && currentValue);
                                          })()}
                                         onCheckedChange={(checked) => {
                                           handleImageToggle(post.ID!, checked as boolean);
                                         }}
                                       />
                                       <Label htmlFor={`${post.ID}-needsImage`} className="text-sm cursor-pointer flex items-center space-x-2">
                                         <ImageIcon className="w-4 h-4" />
                                         <span>Needs Image</span>
                                       </Label>
                                     </div>

                                     {/* Current Image Status */}
                                     <div className="text-xs text-muted-foreground">
                                        Current: {(() => {
                                          const edits = editingPosts.get(post.ID!);
                                          return edits?.['needsImage?'] || post['needsImage?'] || 'Not specified';
                                        })()}
                                     </div>

                                     {/* Image Size Selector */}
                                     <div>
                                       <Label className="text-xs font-medium text-muted-foreground">Image Size</Label>
                                       <Select
                                         value={(() => {
                                           const edits = editingPosts.get(post.ID!);
                                           return edits?.imageSize || post.imageSize || 'square';
                                         })()}
                                         onValueChange={(value) => {
                                           handleImageSizeChange(post.ID!, value);
                                         }}
                                       >
                                         <SelectTrigger className="mt-1 h-8 text-xs">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="square">Square (1:1)</SelectItem>
                                           <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                                           <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                  </div>
                                </div>

                                {/* Save Changes Button */}
                                {hasUnsavedChanges(post.ID!) && (
                                  <div className="mt-4 pt-3 border-t">
                                    <Button
                                      onClick={() => savePostChanges(post.ID!)}
                                      disabled={savingPosts.has(post.ID!)}
                                      className="w-full"
                                      size="sm"
                                    >
                                      {savingPosts.has(post.ID!) ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Saving Changes...
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 mr-2" />
                                          Save Changes to Airtable
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Generated Content Section */}
                            {(post.twitterCopy || post.linkedinCopy || post.instagramCopy || post.facebookCopy || post.blogCopy || post.imagePrompt || post.postImage) && (
                              <div className="mt-6 border-t pt-6">
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className="p-2 rounded-lg bg-success-light">
                                    <Sparkles className="w-5 h-5 text-success" />
                                  </div>
                                  <h4 className="text-lg font-semibold">Generated Content</h4>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {/* Platform Posts */}
                                  <div className="space-y-4">
                                    {post.twitterCopy && (
                                      <div className="p-4 border rounded-lg bg-accent/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getPlatformIcon('twitter')}</span>
                                            <Label className="font-medium">Twitter</Label>
                                            <Badge variant="outline" className="text-xs">
                                              {getCharacterCount(post.twitterCopy, 'twitter').count}/{getCharacterCount(post.twitterCopy, 'twitter').max}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.twitterCopy, `${post.ID}-twitter`)}
                                          >
                                            {copiedItems.has(`${post.ID}-twitter`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border">
                                          {post.twitterCopy}
                                        </div>
                                      </div>
                                    )}

                                    {post.linkedinCopy && (
                                      <div className="p-4 border rounded-lg bg-accent/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getPlatformIcon('linkedin')}</span>
                                            <Label className="font-medium">LinkedIn</Label>
                                            <Badge variant="outline" className="text-xs">
                                              {getCharacterCount(post.linkedinCopy, 'linkedin').count}/{getCharacterCount(post.linkedinCopy, 'linkedin').max}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.linkedinCopy, `${post.ID}-linkedin`)}
                                          >
                                            {copiedItems.has(`${post.ID}-linkedin`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border">
                                          {post.linkedinCopy}
                                        </div>
                                      </div>
                                    )}

                                    {post.instagramCopy && (
                                      <div className="p-4 border rounded-lg bg-accent/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getPlatformIcon('instagram')}</span>
                                            <Label className="font-medium">Instagram</Label>
                                            <Badge variant="outline" className="text-xs">
                                              {getCharacterCount(post.instagramCopy, 'instagram').count}/{getCharacterCount(post.instagramCopy, 'instagram').max}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.instagramCopy, `${post.ID}-instagram`)}
                                          >
                                            {copiedItems.has(`${post.ID}-instagram`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border">
                                          {post.instagramCopy}
                                        </div>
                                      </div>
                                    )}

                                    {post.facebookCopy && (
                                      <div className="p-4 border rounded-lg bg-accent/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getPlatformIcon('facebook')}</span>
                                            <Label className="font-medium">Facebook</Label>
                                            <Badge variant="outline" className="text-xs">
                                              {getCharacterCount(post.facebookCopy, 'facebook').count}/{getCharacterCount(post.facebookCopy, 'facebook').max}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.facebookCopy, `${post.ID}-facebook`)}
                                          >
                                            {copiedItems.has(`${post.ID}-facebook`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border">
                                          {post.facebookCopy}
                                        </div>
                                      </div>
                                    )}

                                    {post.blogCopy && (
                                      <div className="p-4 border rounded-lg bg-accent/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getPlatformIcon('blog')}</span>
                                            <Label className="font-medium">Blog</Label>
                                            <Badge variant="outline" className="text-xs">
                                              {getCharacterCount(post.blogCopy, 'blog').count}/{getCharacterCount(post.blogCopy, 'blog').max}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.blogCopy, `${post.ID}-blog`)}
                                          >
                                            {copiedItems.has(`${post.ID}-blog`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border max-h-40 overflow-y-auto">
                                          {post.blogCopy}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Image Content */}
                                  <div className="space-y-4">
                                    {post.imagePrompt && (
                                      <div className="p-4 border rounded-lg bg-primary-light">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <ImageIcon className="w-5 h-5 text-primary" />
                                            <Label className="font-medium">Image Prompt</Label>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(post.imagePrompt, `${post.ID}-imagePrompt`)}
                                          >
                                            {copiedItems.has(`${post.ID}-imagePrompt`) ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-background/50 p-3 rounded border">
                                          {post.imagePrompt}
                                        </div>
                                      </div>
                                    )}

                                    {post.postImage && (
                                      <div className="p-4 border rounded-lg bg-secondary">
                                        <div className="flex items-center space-x-2 mb-3">
                                          <ImageIcon className="w-5 h-5 text-secondary-foreground" />
                                          <Label className="font-medium">Generated Image</Label>
                                        </div>
                                        {(() => {
                                          // Handle Airtable attachment object or plain URL string
                                          const imageUrl = typeof post.postImage === 'object' && post.postImage?.url 
                                            ? post.postImage.url 
                                            : typeof post.postImage === 'string' 
                                              ? post.postImage 
                                              : null;
                                          
                                          const imageData = typeof post.postImage === 'object' ? post.postImage : null;
                                          
                                          if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
                                            return (
                                              <div className="space-y-2">
                                                <img 
                                                  src={imageUrl} 
                                                  alt={imageData?.filename || "Generated post image"}
                                                  className="w-full max-w-sm rounded-lg border shadow-sm"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                                {imageData && (
                                                  <div className="text-xs text-muted-foreground space-y-1">
                                                    {imageData.filename && <div>📁 {imageData.filename}</div>}
                                                    {imageData.width && imageData.height && (
                                                      <div>📐 {imageData.width} × {imageData.height}px</div>
                                                    )}
                                                    {imageData.size && (
                                                      <div>💾 {(imageData.size / 1024).toFixed(1)}KB</div>
                                                    )}
                                                  </div>
                                                )}
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => copyToClipboard(imageUrl, `${post.ID}-postImage`)}
                                                  className="w-full"
                                                >
                                                  {copiedItems.has(`${post.ID}-postImage`) ? (
                                                    <>
                                                      <Check className="w-4 h-4 mr-2" />
                                                      Image URL Copied
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Copy className="w-4 h-4 mr-2" />
                                                      Copy Image URL
                                                    </>
                                                  )}
                                                </Button>
                                              </div>
                                            );
                                          } else {
                                            // Fallback for non-URL content
                                            const displayText = imageUrl || JSON.stringify(post.postImage, null, 2);
                                            return (
                                              <div className="text-sm bg-background/50 p-3 rounded border">
                                                {displayText}
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    )}

                                    {/* Empty State for Image Section */}
                                    {!post.imagePrompt && !post.postImage && (
                                      <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No image content generated</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your first content using the "Generate New Content" tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
};
