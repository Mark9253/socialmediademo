import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, FileText, Calendar, ExternalLink, Image as ImageIcon, Copy, Check, Save, Maximize2, X, Linkedin, Facebook, Instagram, CalendarIcon, Clock } from 'lucide-react';
import { SocialPost, Platform, PLATFORM_CONFIGS } from '@/types';
import { fetchSocialPosts, updateSocialPost } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const PostApproval = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPosts, setUpdatingPosts] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [statusChanges, setStatusChanges] = useState<Map<string, string>>(new Map());
  const [scheduledDates, setScheduledDates] = useState<Map<string, Date>>(new Map());
  const [scheduledTimes, setScheduledTimes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchSocialPosts();
        // Filter only posts that need approval and sort by creation date (newest first)
        const needsApprovalPosts = data
          .filter(post => post.Status && post.Status.toLowerCase().includes('needs approval'))
          .sort((a, b) => {
            const dateA = new Date(a.Created || 0);
            const dateB = new Date(b.Created || 0);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });
        setPosts(needsApprovalPosts);
      } catch (error) {
        console.error('Failed to load posts:', error);
        toast({
          title: "Loading Failed",
          description: "Could not load posts for approval. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

  const handleStatusUpdate = async (postId: string) => {
    const newStatus = statusChanges.get(postId);
    if (!newStatus) {
      toast({
        title: "No Status Selected",
        description: "Please select a status before submitting.",
        variant: "destructive"
      });
      return;
    }

    setUpdatingPosts(prev => new Set([...prev, postId]));
    
    try {
      // Prepare update data
      const updateData: Partial<SocialPost> = { Status: newStatus };
      
      // Add scheduled date/time if provided
      const scheduledDate = scheduledDates.get(postId);
      const scheduledTime = scheduledTimes.get(postId);
      
      if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':');
        const dateTime = new Date(scheduledDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        updateData['Date / Time to Post'] = dateTime.toISOString();
      }
      
      console.log('About to call updateSocialPost with:', postId, updateData);
      const updatedPost = await updateSocialPost(postId, updateData);
      console.log('updateSocialPost returned:', updatedPost);
      
      // Update the post in the local state
      setPosts(prev => prev.map(post => 
        post.ID === postId ? { ...post, Status: newStatus } : post
      ));

      // Clear the status change and scheduled time for this post
      setStatusChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });
      setScheduledDates(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });
      setScheduledTimes(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });

      // Wait a moment then verify the update actually stuck
      setTimeout(async () => {
        try {
          console.log('Verifying update after 3 seconds...');
          const allPosts = await fetchSocialPosts();
          const updatedPost = allPosts.find(p => p.ID === postId);
          console.log('Post after update:', updatedPost);
          if (updatedPost && updatedPost.Status !== newStatus) {
            console.error('WARNING: Status was reverted by Airtable automation!');
            console.error('Expected:', newStatus, 'Actual:', updatedPost.Status);
            toast({
              title: "Status Reverted",
              description: "The status was changed but then reverted by an Airtable automation. Please check your Airtable automations.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error verifying update:', error);
        }
      }, 3000);

      // If status is no longer "Needs Approval", remove from list
      const needsApproval = newStatus.toLowerCase() === 'needs approval';
      console.log('Checking if should remove post:', newStatus, 'needs approval:', needsApproval);
      if (!needsApproval) {
        console.log('Removing post from approval list:', postId);
        setPosts(prev => prev.filter(post => post.ID !== postId));
      }
      
      toast({
        title: "Status Updated!",
        description: `Post status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update the post status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleStatusChange = (postId: string, newStatus: string) => {
    setStatusChanges(prev => new Map(prev.set(postId, newStatus)));
  };

  const getSelectedStatus = (postId: string) => {
    return statusChanges.get(postId) || '';
  };

  const hasStatusChange = (postId: string) => {
    return statusChanges.has(postId);
  };

  const handleDateChange = (postId: string, date: Date | undefined) => {
    if (date) {
      setScheduledDates(prev => new Map(prev.set(postId, date)));
    } else {
      setScheduledDates(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });
    }
  };

  const handleTimeChange = (postId: string, time: string) => {
    setScheduledTimes(prev => new Map(prev.set(postId, time)));
  };

  const getScheduledDate = (postId: string) => {
    return scheduledDates.get(postId);
  };

  const getScheduledTime = (postId: string) => {
    return scheduledTimes.get(postId) || '';
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
      <div className="max-w-none space-y-8 pr-4 lg:pr-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Post for Approval
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve posts that are ready for publishing
          </p>
        </div>

        {/* Content */}
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
                <Card key={post.ID} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {post.sourceHeadline || 'No headline'}
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {post.Status}
                          </Badge>
                          {post.Created && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(post.Created).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Update Status</Label>
                            <Select 
                              value={getSelectedStatus(post.ID!)} 
                              onValueChange={(value) => handleStatusChange(post.ID!, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select new status..." />
                              </SelectTrigger>
                              <SelectContent className="bg-background border shadow-lg z-50">
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Needs Approval">Needs Approval</SelectItem>
                                <SelectItem value="Declined">Declined</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Schedule Date/Time */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Schedule Publication (Optional)</Label>
                            <div className="flex space-x-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "flex-1 justify-start text-left font-normal",
                                      !getScheduledDate(post.ID!) && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {getScheduledDate(post.ID!) ? format(getScheduledDate(post.ID!)!, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={getScheduledDate(post.ID!)}
                                    onSelect={(date) => handleDateChange(post.ID!, date)}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex items-center space-x-1 flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="time"
                                  value={getScheduledTime(post.ID!)}
                                  onChange={(e) => handleTimeChange(post.ID!, e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleStatusUpdate(post.ID!)}
                          disabled={updatingPosts.has(post.ID!) || !hasStatusChange(post.ID!)}
                          className="mt-6"
                        >
                          {updatingPosts.has(post.ID!) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Submit
                            </>
                          )}
                        </Button>
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

                        {/* Go to Article */}
                        {post.goToArticle && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Article Link</Label>
                            <div className="mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  const url = typeof post.goToArticle === 'string' 
                                    ? post.goToArticle 
                                    : (post.goToArticle as any)?.url;
                                  if (url) window.open(url, '_blank');
                                }}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Go to Article
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Post Image */}
                        {(post.postImage || (post as any).imageurl) && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Post Image</Label>
                            <div className="mt-2 space-y-2">
                              {(() => {
                                // First try imageurl field, then fall back to postImage
                                const imageUrlFromField = (post as any).imageurl;
                                const imageUrl = imageUrlFromField || (typeof post.postImage === 'string' 
                                  ? post.postImage 
                                  : (post.postImage as any)?.url);
                                
                                return imageUrl ? (
                                  <div className="space-y-2">
                                    <div className="w-full max-w-sm">
                                      <img
                                        src={imageUrl} 
                                        alt="Post image"
                                        className="w-full h-auto rounded-lg border shadow-sm"
                                        onError={(e) => {
                                          console.error('Image failed to load:', imageUrl);
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                    >
                                      <ImageIcon className="w-3 h-3 mr-1" />
                                      View Full Size
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    disabled
                                  >
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    No Image URL
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Platform Content */}
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Generated Content</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(Object.keys(PLATFORM_CONFIGS) as Platform[]).map(platform => 
                          renderPlatformContent(post, platform)
                        ).filter(Boolean)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Posts Need Approval</h3>
                <p className="text-muted-foreground">
                  All posts have been reviewed! New posts requiring approval will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};