import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ContentGenerationRequest, Platform, PLATFORM_CONFIGS } from '@/types';
import { triggerContentGeneration } from '@/services/webhooks';
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Content Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform your source content into engaging social media posts
          </p>
        </div>

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
      </div>
    </Layout>
  );
};