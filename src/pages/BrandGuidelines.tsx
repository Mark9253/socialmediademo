import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, Save, Loader2, CheckCircle, Image } from 'lucide-react';
import { BrandGuideline } from '@/types';
import { fetchBrandGuidelines, updateBrandGuidelines } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

interface ImageStyleRecord {
  recordId: string;
  imageStyle: string;
  stylePrompt: string;
}

export const BrandGuidelines = () => {
  const { toast } = useToast();
  const [mainGuidelines, setMainGuidelines] = useState<BrandGuideline>({
    guidelines: '',
    imageStyle: '',
    stylePrompt: '',
    recordId: ''
  });
  const [imageStyles, setImageStyles] = useState<ImageStyleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changeSets, setChangeSets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const data = await fetchBrandGuidelines();
        
        // Find the main guidelines record (record 1)
        const mainRecord = data.find(record => record.guidelines);
        if (mainRecord) {
          setMainGuidelines(mainRecord);
        }
        
        // Find image style records (records 2-6)
        const styleRecords = data.filter(record => record.imageStyle && !record.guidelines);
        setImageStyles(styleRecords.map(record => ({
          recordId: record.recordId || '',
          imageStyle: record.imageStyle,
          stylePrompt: record.stylePrompt
        })));
        
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

  const handleMainGuidelinesChange = (value: string) => {
    setMainGuidelines(prev => ({ ...prev, guidelines: value }));
    setHasChanges(true);
    setChangeSets(prev => new Set(prev).add(mainGuidelines.recordId || 'main'));
  };

  const handleImageStyleChange = (recordId: string, value: string) => {
    setImageStyles(prev => prev.map(style => 
      style.recordId === recordId 
        ? { ...style, stylePrompt: value }
        : style
    ));
    setHasChanges(true);
    setChangeSets(prev => new Set(prev).add(recordId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save main guidelines if changed
      if (changeSets.has(mainGuidelines.recordId || 'main') && mainGuidelines.recordId) {
        await updateBrandGuidelines(mainGuidelines.recordId, {
          guidelines: mainGuidelines.guidelines,
          imageStyle: mainGuidelines.imageStyle,
          stylePrompt: mainGuidelines.stylePrompt
        });
      }
      
      // Save image style records if changed
      for (const recordId of changeSets) {
        if (recordId !== (mainGuidelines.recordId || 'main')) {
          const styleRecord = imageStyles.find(style => style.recordId === recordId);
          if (styleRecord) {
            await updateBrandGuidelines(recordId, {
              guidelines: '',
              imageStyle: styleRecord.imageStyle,
              stylePrompt: styleRecord.stylePrompt
            });
          }
        }
      }
      
      setHasChanges(false);
      setChangeSets(new Set());
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

        {/* Main Brand Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary-light">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <span>Brand Voice & Guidelines</span>
            </CardTitle>
            <CardDescription>
              Your main brand guidelines that define voice, tone, and messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="guidelines">Brand Guidelines</Label>
              <Textarea
                id="guidelines"
                value={mainGuidelines.guidelines || ''}
                onChange={(e) => handleMainGuidelinesChange(e.target.value)}
                placeholder="Describe your brand voice, tone, key messages, and style guidelines..."
                className="mt-1 min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include details about your brand personality, preferred tone of voice, key messaging, and any specific guidelines for content creation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Style Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary-light">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <span>Image Style Prompts</span>
            </CardTitle>
            <CardDescription>
              Configure different image styles for various content types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {imageStyles.map((style) => (
              <div key={style.recordId} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize text-lg">{style.imageStyle}</h4>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
                    Style Type
                  </span>
                </div>
                <div>
                  <Label htmlFor={`style-${style.recordId}`}>Style Prompt</Label>
                  <Textarea
                    id={`style-${style.recordId}`}
                    value={style.stylePrompt}
                    onChange={(e) => handleImageStyleChange(style.recordId, e.target.value)}
                    placeholder="Enter detailed style prompt for this image type..."
                    className="mt-1 min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    This prompt will be used for generating {style.imageStyle} style images.
                  </p>
                </div>
              </div>
            ))}
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