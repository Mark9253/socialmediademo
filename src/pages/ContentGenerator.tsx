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
import { Sparkles, ExternalLink, Image as ImageIcon, Loader2, FileText, Calendar, Link2 } from 'lucide-react';
import { ContentGenerationRequest, Platform, PLATFORM_CONFIGS, SocialPost } from '@/types';
import { triggerContentGeneration } from '@/services/webhooks';
import { fetchSocialPosts } from '@/services/airtable';
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Content Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform your source content into engaging social media posts
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Generate New Content</span>
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Existing Content</span>
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Source Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-primary-light">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span>Source Content</span>
                  </CardTitle>
                  <CardDescription>
                    Provide the original content that will be transformed into social posts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="headline">Headline *</Label>
                    <Input
                      id="headline"
                      value={formData.sourceHeadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, sourceHeadline: e.target.value }))}
                      placeholder="Enter the main headline or title..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary *</Label>
                    <Textarea
                      id="summary"
                      value={formData.sourceSummary}
                      onChange={(e) => setFormData(prev => ({ ...prev, sourceSummary: e.target.value }))}
                      placeholder="Provide a brief summary of the content..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sourceURL">Source URL</Label>
                      <Input
                        id="sourceURL"
                        value={formData.sourceURL}
                        onChange={(e) => setFormData(prev => ({ ...prev, sourceURL: e.target.value }))}
                        placeholder="https://example.com/article"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="goToArticle">Go to Article Link</Label>
                      <Input
                        id="goToArticle"
                        value={formData.goToArticle}
                        onChange={(e) => setFormData(prev => ({ ...prev, goToArticle: e.target.value }))}
                        placeholder="Custom link for 'Read more'"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Platforms</CardTitle>
                  <CardDescription>
                    Select which platforms you want to generate content for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
                      <div key={platform} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={platform}
                          checked={formData.socialChannels.includes(platform as Platform)}
                          onCheckedChange={(checked) => 
                            handleChannelToggle(platform as Platform, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor={platform} className="font-medium cursor-pointer">
                            {config.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Max {config.maxChars} characters
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.socialChannels.length > 0 && (
                    <div className="mt-4 p-4 bg-accent/30 rounded-lg">
                      <p className="text-sm font-medium mb-2">Selected platforms:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.socialChannels.map(channel => (
                          <Badge key={channel} variant="secondary">
                            {PLATFORM_CONFIGS[channel as Platform].name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-accent">
                      <ImageIcon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <span>Image Requirements</span>
                  </CardTitle>
                  <CardDescription>
                    Configure image generation for your posts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="needsImage"
                      checked={formData.needsImage}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, needsImage: checked as boolean }))
                      }
                    />
                    <Label htmlFor="needsImage" className="font-medium">
                      Generate image for posts
                    </Label>
                  </div>

                  {formData.needsImage && (
                    <div>
                      <Label htmlFor="imageSize">Image Size</Label>
                      <Select
                        value={formData.imageSize}
                        onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, imageSize: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square (1:1)</SelectItem>
                          <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                          <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    This will trigger your n8n workflow to generate platform-specific content
                  </p>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* Existing Content Tab */}
          <TabsContent value="existing" className="space-y-6">
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
                    {posts.map((post) => (
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

                              {/* Platforms - Selectable */}
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Social Platforms</Label>
                                <div className="mt-2 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
                                      const isSelected = post.socialChannels && typeof post.socialChannels === 'string' 
                                        ? post.socialChannels.toLowerCase().includes(platform.toLowerCase())
                                        : false;
                                      
                                      return (
                                        <div key={platform} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent/50 transition-colors">
                                          <Checkbox
                                            id={`${post.ID}-${platform}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                              // TODO: Add update functionality
                                              console.log(`Toggle ${platform} for post ${post.ID}:`, checked);
                                            }}
                                          />
                                          <Label htmlFor={`${post.ID}-${platform}`} className="text-xs cursor-pointer">
                                            {config.name}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Current selection display */}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {post.socialChannels && typeof post.socialChannels === 'string' && post.socialChannels.trim() ? (
                                      post.socialChannels.split(',').map((channel, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {channel.trim()}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No platforms selected</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Links and Image Options */}
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Source URL</Label>
                                <div className="mt-1">
                                  {post.sourceURL ? (
                                    <a 
                                      href={post.sourceURL} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-sm"
                                    >
                                      <Link2 className="w-4 h-4" />
                                      <span className="truncate max-w-xs">
                                        {post.sourceURL}
                                      </span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No source URL</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Go to Article Link</Label>
                                <div className="mt-1">
                                  {post.goToArticle ? (
                                    <a 
                                      href={post.goToArticle} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center space-x-2 text-primary hover:text-primary-hover text-sm"
                                    >
                                      <Link2 className="w-4 h-4" />
                                      <span className="truncate max-w-xs">
                                        {post.goToArticle}
                                      </span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No article link</span>
                                  )}
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
                                      checked={post.needsImage697 === 'Yes' || post.needsImage697 === 'true' || (typeof post.needsImage697 === 'boolean' && post.needsImage697)}
                                      onCheckedChange={(checked) => {
                                        // TODO: Add update functionality
                                        console.log(`Toggle needsImage for post ${post.ID}:`, checked);
                                      }}
                                    />
                                    <Label htmlFor={`${post.ID}-needsImage`} className="text-sm cursor-pointer flex items-center space-x-2">
                                      <ImageIcon className="w-4 h-4" />
                                      <span>Needs Image</span>
                                    </Label>
                                  </div>

                                  {/* Current Image Status */}
                                  <div className="text-xs text-muted-foreground">
                                    Current: {post.needsImage697 || 'Not specified'}
                                  </div>

                                  {/* Image Size Selector */}
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Image Size</Label>
                                    <Select
                                      value={post.imageSize || 'square'}
                                      onValueChange={(value) => {
                                        // TODO: Add update functionality
                                        console.log(`Change imageSize for post ${post.ID}:`, value);
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};