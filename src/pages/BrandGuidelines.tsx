import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, Save, Loader2, CheckCircle, Image, Sparkles } from 'lucide-react';
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
  const [savingRecord, setSavingRecord] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changeSets, setChangeSets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const data = await fetchBrandGuidelines();
        
        // Find the main guidelines record (record 1)
        const mainRecord = data.find(record => record.Guidelines || record.guidelines);
        if (mainRecord) {
          setMainGuidelines({
            guidelines: mainRecord.Guidelines || mainRecord.guidelines || '',
            imageStyle: mainRecord.imageStyle || '',
            stylePrompt: mainRecord.stylePrompt || '',
            recordId: mainRecord.recordId || ''
          });
        }
        
        // Find image style records (records 2-6)
        const styleRecords = data.filter(record => record.imageStyle && !record.Guidelines && !record.guidelines);
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

  const handleSaveMainGuidelines = async () => {
    if (!mainGuidelines.recordId) return;
    
    setSavingRecord(mainGuidelines.recordId);
    try {
      await updateBrandGuidelines(mainGuidelines.recordId, {
        Guidelines: mainGuidelines.guidelines, // Use capital G for Airtable
        imageStyle: mainGuidelines.imageStyle,
        stylePrompt: mainGuidelines.stylePrompt
      });
      
      // Remove from change sets
      setChangeSets(prev => {
        const newSet = new Set(prev);
        newSet.delete(mainGuidelines.recordId || 'main');
        return newSet;
      });
      
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
      setSavingRecord(null);
    }
  };

  const handleSaveImageStyle = async (recordId: string) => {
    const styleRecord = imageStyles.find(style => style.recordId === recordId);
    if (!styleRecord) return;
    
    setSavingRecord(recordId);
    try {
      await updateBrandGuidelines(recordId, {
        Guidelines: '', // Use capital G for Airtable
        imageStyle: styleRecord.imageStyle,
        stylePrompt: styleRecord.stylePrompt
      });
      
      // Remove from change sets
      setChangeSets(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
      
      toast({
        title: "Style Saved!",
        description: `${styleRecord.imageStyle} style prompt has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save image style. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingRecord(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save main guidelines if changed
      if (changeSets.has(mainGuidelines.recordId || 'main') && mainGuidelines.recordId) {
        await updateBrandGuidelines(mainGuidelines.recordId, {
          Guidelines: mainGuidelines.guidelines, // Use capital G for Airtable
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
              Guidelines: '', // Use capital G for Airtable
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
      {/* Hero Section with Gradient Background */}
      <div className="relative min-h-[calc(100vh-2rem)] -mr-4 sm:-mr-6 lg:-mr-8 -mt-6 -mb-4 bg-gradient-to-br from-primary-light via-background to-accent/20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with Dynamic Icons */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Palette className="w-12 h-12 text-primary animate-pulse" />
                <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
              Brand Guidelines
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Define your brand voice, style, and visual preferences for consistent content generation
            </p>
          </div>

          {/* Save Changes Button */}
          {hasChanges && (
            <div className="max-w-4xl mx-auto mb-8 text-center">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="h-14 text-lg px-8 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Main Brand Guidelines */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-primary-light">
                      <Palette className="w-6 h-6 text-primary" />
                    </div>
                    <span>Brand Voice & Guidelines</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Your main brand guidelines that define voice, tone, and messaging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="guidelines" className="text-lg font-semibold">Brand Guidelines</Label>
                    <Textarea
                      id="guidelines"
                      value={mainGuidelines.guidelines || ''}
                      onChange={(e) => handleMainGuidelinesChange(e.target.value)}
                      placeholder="Describe your brand voice, tone, key messages, and style guidelines..."
                      className="mt-2 min-h-[200px] text-base bg-background/50 border-2 border-primary/20 focus:border-primary/50 rounded-xl resize-none transition-all duration-300"
                    />
                    <p className="text-base text-muted-foreground mt-3">
                      Include details about your brand personality, preferred tone of voice, key messaging, and any specific guidelines for content creation.
                    </p>
                    
                    {/* Individual Update Button for Main Guidelines */}
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleSaveMainGuidelines}
                        disabled={savingRecord === mainGuidelines.recordId || !changeSets.has(mainGuidelines.recordId || 'main')}
                        size="lg"
                        className="h-12 px-6"
                      >
                        {savingRecord === mainGuidelines.recordId ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Update Guidelines
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Image Style Prompts */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-accent/20 hover:border-accent/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-accent/20">
                      <Image className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <span>Image Style Prompts</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Configure different image styles for various content types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {imageStyles.map((style) => (
                    <div key={style.recordId} className="p-6 border-2 rounded-xl bg-muted/30 border-accent/20 hover:border-accent/40 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold capitalize text-xl">{style.imageStyle}</h4>
                        <span className="text-sm text-muted-foreground px-3 py-1 bg-background rounded-lg">
                          Style Type
                        </span>
                      </div>
                      <div>
                        <Label htmlFor={`style-${style.recordId}`} className="text-lg font-semibold">Style Prompt</Label>
                        <Textarea
                          id={`style-${style.recordId}`}
                          value={style.stylePrompt}
                          onChange={(e) => handleImageStyleChange(style.recordId, e.target.value)}
                          placeholder="Enter detailed style prompt for this image type..."
                          className="mt-2 min-h-[120px] text-base bg-background/50 border-2 border-accent/20 focus:border-accent/50 rounded-xl resize-none transition-all duration-300"
                        />
                        <p className="text-base text-muted-foreground mt-3">
                          This prompt will be used for generating {style.imageStyle} style images.
                        </p>
                        
                        {/* Individual Update Button for Image Style */}
                        <div className="mt-4 flex justify-end">
                          <Button 
                            onClick={() => handleSaveImageStyle(style.recordId)}
                            disabled={savingRecord === style.recordId || !changeSets.has(style.recordId)}
                            size="lg"
                            variant="default"
                            className="h-12 px-6"
                          >
                            {savingRecord === style.recordId ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 mr-2" />
                                Update Style
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Save All Button */}
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
              <Card className="relative bg-card/90 backdrop-blur-md border-0 shadow-2xl">
                <CardContent className="pt-8 pb-8">
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    size="lg"
                    className="w-full h-16 text-xl"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Saving Guidelines...
                      </>
                    ) : hasChanges ? (
                      <>
                        <Save className="w-6 h-6 mr-3" />
                        Save Brand Guidelines
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 mr-3" />
                        Guidelines Saved
                      </>
                    )}
                  </Button>
                  
                  <p className="text-lg text-muted-foreground text-center mt-6">
                    These guidelines will be used to ensure all generated content matches your brand identity.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};