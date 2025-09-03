import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    needsImage: false
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedItems, setCopiedItems] = useState(new Set<string>());
  const [editingPosts, setEditingPosts] = useState(new Map<string, Partial<SocialPost>>());
  const [savingPosts, setSavingPosts] = useState(new Set<string>());

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchSocialPosts();
      const waitingPosts = fetchedPosts
        .filter(post => post.Status === 'Waiting for Content')
        .sort((a, b) => {
          // Sort by creation date, newest first
          const dateA = new Date(a.Created || 0);
          const dateB = new Date(b.Created || 0);
          return dateB.getTime() - dateA.getTime();
        });
      setPosts(waitingPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (platform: Platform) => {
    setFormData(prev => ({
      ...prev,
      socialChannels: prev.socialChannels.includes(platform)
        ? prev.socialChannels.filter(p => p !== platform)
        : [...prev.socialChannels, platform]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceHeadline.trim() || !formData.sourceSummary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the source headline and summary.",
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
        needsImage: false
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
      case 'Waiting for Content': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Posted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, id]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      case 'facebook': return '📘';
      case 'blog': return '📝';
      default: return '📱';
    }
  };

  const getCharacterCount = (text: string, platform: Platform) => {
    const count = text ? text.length : 0;
    const max = PLATFORM_CONFIGS[platform].maxChars;
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
      newPlatforms = [...currentPlatforms, platform.toLowerCase()];
    } else {
      newPlatforms = currentPlatforms.filter(p => p !== platform.toLowerCase());
    }

    // Convert to comma-separated string for storage
    const newChannelsString = newPlatforms.join(', ');
    updatePostField(postId, 'socialChannels', newChannelsString);
  };

  const handleImageToggle = (postId: string, checked: boolean) => {
    updatePostField(postId, 'needsImage?', checked ? 'Yes' : 'No');
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
      // Format the edits for Airtable - convert socialChannels string to array with proper capitalization
      const formattedEdits = { ...edits };
      if (formattedEdits.socialChannels && typeof formattedEdits.socialChannels === 'string') {
        // Convert "twitter, facebook" to ["Twitter", "Facebook"] with proper capitalization
        formattedEdits.socialChannels = formattedEdits.socialChannels
          .split(',')
          .map(channel => {
            const trimmed = channel.trim();
            // Map to exact values expected by Airtable
            switch (trimmed.toLowerCase()) {
              case 'linkedin': return 'LinkedIn';
              case 'twitter': return 'Twitter';
              case 'instagram': return 'Instagram';
              case 'facebook': return 'Facebook';
              case 'blog': return 'Blog';
              default: return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            }
          })
          .filter(channel => channel.length > 0);
      }

      const updatedPost = await updateSocialPost(postId, formattedEdits);
      
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
        title: "Changes Saved",
        description: "Post updated successfully.",
      });
    } catch (error) {
      console.error('Error saving post changes:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save changes. Please try again.",
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

  const hasUnsavedChanges = (postId: string): boolean => {
    const edits = editingPosts.get(postId);
    return edits ? Object.keys(edits).length > 0 : false;
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Content Generator</h1>
            <p className="text-muted-foreground">Generate and manage social media content from source articles</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Source Content Database</span>
            </CardTitle>
            <CardDescription>
              View and manage your source content that's waiting for content generation
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
              <div className="grid gap-6">
                {posts.map((post) => (
                  <Card key={post.ID} className="border-l-4 border-l-amber-400">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{post.sourceHeadline}</h3>
                            <Badge className={`text-xs ${getStatusColor(post.Status || 'Unknown')}`}>
                              {post.Status || 'Unknown'}
                            </Badge>
                          </div>
                          {post.Created && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(post.Created).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Summary</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {post.sourceSummary}
                          </p>
                        </div>

                        {/* URLs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {post.sourceURL && (
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm flex items-center">
                                <Link2 className="w-3 h-3 mr-1" />
                                Source URL
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground truncate">
                                  {typeof post.sourceURL === 'string' ? post.sourceURL : post.sourceURL?.url || 'No URL'}
                                </span>
                                {typeof post.sourceURL === 'string' && post.sourceURL !== 'URL not available' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => window.open(post.sourceURL as string, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {post.goToArticle && (
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm flex items-center">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Article Link
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground truncate">
                                  {typeof post.goToArticle === 'string' ? post.goToArticle : post.goToArticle?.url || 'No URL'}
                                </span>
                                {typeof post.goToArticle === 'string' && post.goToArticle !== 'URL not available' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => window.open(post.goToArticle as string, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Social Channels */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Social Media Platforms</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
                              const isChecked = (() => {
                                const edits = editingPosts.get(post.ID!);
                                const channels = edits?.socialChannels || post.socialChannels;
                                
                                if (typeof channels === 'string') {
                                  return channels.toLowerCase().includes(platform.toLowerCase());
                                }
                                
                                if (Array.isArray(channels)) {
                                  return channels.some(ch => ch.toLowerCase() === platform.toLowerCase());
                                }
                                
                                return false;
                              })();

                              return (
                                <div key={platform} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${post.ID}-${platform}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handlePlatformToggle(post.ID!, platform as Platform, checked as boolean)}
                                  />
                                  <Label htmlFor={`${post.ID}-${platform}`} className="text-xs cursor-pointer">
                                    {config.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Image Option */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Image Requirements</h4>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${post.ID}-image`}
                              checked={(() => {
                                const edits = editingPosts.get(post.ID!);
                                const needsImage = edits?.['needsImage?'] || post['needsImage?'];
                                return needsImage === 'Yes';
                              })()}
                              onCheckedChange={(checked) => handleImageToggle(post.ID!, checked as boolean)}
                            />
                            <Label htmlFor={`${post.ID}-image`} className="text-sm cursor-pointer flex items-center space-x-2">
                              <ImageIcon className="w-4 h-4" />
                              <span>Needs Image</span>
                            </Label>
                          </div>
                        </div>

                        {/* Save Button */}
                        {hasUnsavedChanges(post.ID!) && (
                          <div className="pt-4 border-t">
                            <Button
                              onClick={() => savePostChanges(post.ID!)}
                              disabled={savingPosts.has(post.ID!)}
                              className="w-full"
                            >
                              {savingPosts.has(post.ID!) ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving Changes...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
                <p className="text-muted-foreground">
                  No source content is currently waiting for generation. Create new content to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};