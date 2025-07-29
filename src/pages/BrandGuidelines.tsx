import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, Save, Loader2, CheckCircle } from 'lucide-react';
import { BrandGuideline } from '@/types';
import { fetchBrandGuidelines, updateBrandGuidelines } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

export const BrandGuidelines = () => {
  const { toast } = useToast();
  const [guidelines, setGuidelines] = useState<BrandGuideline>({
    guidelines: '',
    imageStyle: '',
    stylePrompt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const data = await fetchBrandGuidelines();
        if (data.length > 0) {
          setGuidelines(data[0]);
        }
      } catch (error) {
        console.error('Failed to load brand guidelines:', error);
        toast({
          title: "Loading Failed",
          description: "Could not load brand guidelines. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadGuidelines();
  }, [toast]);

  const handleChange = (field: keyof BrandGuideline, value: string) => {
    setGuidelines(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (guidelines.recordId) {
        await updateBrandGuidelines(guidelines.recordId, {
          guidelines: guidelines.guidelines,
          imageStyle: guidelines.imageStyle,
          stylePrompt: guidelines.stylePrompt
        });
      }
      
      setHasChanges(false);
      toast({
        title: "Guidelines Saved!",
        description: "Your brand guidelines have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save brand guidelines. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              Brand Guidelines
            </h1>
            <p className="text-muted-foreground mt-2">
              Define your brand voice, style, and visual preferences for consistent content generation
            </p>
          </div>
          
          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          )}
        </div>

        {/* Brand Voice & Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary-light">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <span>Brand Voice & Guidelines</span>
            </CardTitle>
            <CardDescription>
              Describe your brand's personality, tone, and key messaging guidelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="guidelines">Brand Guidelines</Label>
              <Textarea
                id="guidelines"
                value={guidelines.guidelines}
                onChange={(e) => handleChange('guidelines', e.target.value)}
                placeholder="Describe your brand voice, tone, key messages, and style guidelines..."
                className="mt-1 min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include details about your brand personality, preferred tone of voice, key messaging, and any specific guidelines for content creation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visual Style */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Style Preferences</CardTitle>
            <CardDescription>
              Define your preferred visual style for generated images and graphics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="imageStyle">Image Style</Label>
              <Input
                id="imageStyle"
                value={guidelines.imageStyle}
                onChange={(e) => handleChange('imageStyle', e.target.value)}
                placeholder="e.g., Modern, minimalist, corporate, playful, vintage..."
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Describe your preferred visual style in a few words (e.g., "modern and minimalist", "warm and friendly").
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Style Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Style Prompt</CardTitle>
            <CardDescription>
              Provide detailed instructions for AI image generation that align with your brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="stylePrompt">AI Style Prompt</Label>
              <Textarea
                id="stylePrompt"
                value={guidelines.stylePrompt}
                onChange={(e) => handleChange('stylePrompt', e.target.value)}
                placeholder="Detailed prompt for AI image generation (colors, style, mood, elements to include/avoid)..."
                className="mt-1 min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground mt-2">
                This will be used as part of AI image generation prompts. Include specific colors, styles, moods, and any elements to include or avoid.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="lg"
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Guidelines...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Brand Guidelines
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Guidelines Saved
                </>
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              These guidelines will be used to ensure all generated content matches your brand identity.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};