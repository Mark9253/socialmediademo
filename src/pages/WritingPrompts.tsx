import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Save, Loader2, Edit3, X, Linkedin, Facebook, Instagram, Mail, Sparkles } from 'lucide-react';
import { WritingPrompt, Platform, PLATFORM_CONFIGS } from '@/types';
import { 
  fetchWritingPrompts, 
  updateWritingPrompt, 
  createWritingPrompt, 
  deleteWritingPrompt 
} from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

interface EditingPrompt extends WritingPrompt {
  isEditing?: boolean;
  isNew?: boolean;
}

export const WritingPrompts = () => {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<EditingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [changedPrompts, setChangedPrompts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        console.log('Attempting to fetch writing prompts...');
        const data = await fetchWritingPrompts();
        console.log('Writing prompts data received:', data);
        
        // Filter out unwanted channels
        const excludedChannels = [
          'Image Generator',
          'Blog', 
          'YouTube Shorts Description',
          'Pinterest Description',
          'YouTube Shorts Title',
          'YouTube Shorts Tilte', // Handle typo version
          'Pinterest Title'
        ];
        
        const filteredPrompts = data.filter(prompt => 
          !excludedChannels.includes(prompt.channel)
        );
        
        // Define the desired order
        const channelOrder = ['LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'Newsletter'];
        
        // Sort prompts according to the desired order
        const sortedPrompts = filteredPrompts.sort((a, b) => {
          const aIndex = channelOrder.indexOf(a.channel);
          const bIndex = channelOrder.indexOf(b.channel);
          
          // If channel not found in order, put it at the end
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          
          return aIndex - bIndex;
        });
        
        setPrompts(sortedPrompts);
      } catch (error) {
        console.error('Failed to load writing prompts:', error);
        toast({
          title: "Loading Failed",
          description: "Could not load writing prompts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [toast]);

  const handleAddNew = () => {
    const newPrompt: EditingPrompt = {
      channel: 'twitter',
      prompt: '',
      isEditing: true,
      isNew: true
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const handleEdit = (index: number) => {
    setPrompts(prev => prev.map((prompt, i) => 
      i === index ? { ...prompt, isEditing: true } : prompt
    ));
  };

  const handleCancel = (index: number) => {
    setPrompts(prev => prev.filter((prompt, i) => {
      if (i === index) {
        return !prompt.isNew; // Remove if new, keep if existing
      }
      return true;
    }).map((prompt, i) => 
      i === index ? { ...prompt, isEditing: false } : prompt
    ));
  };

  const handleSave = async (index: number) => {
    const prompt = prompts[index];
    if (!prompt.prompt.trim()) {
      toast({
        title: "Invalid Prompt",
        description: "Prompt cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    const tempId = prompt.id || `temp-${index}`;
    setSavingIds(prev => new Set([...prev, tempId]));

    try {
      let savedPrompt: WritingPrompt;
      
      if (prompt.isNew) {
        savedPrompt = await createWritingPrompt({
          channel: prompt.channel,
          prompt: prompt.prompt
        });
      } else {
        savedPrompt = await updateWritingPrompt(prompt.id!, {
          channel: prompt.channel,
          prompt: prompt.prompt
        });
      }

      setPrompts(prev => prev.map((p, i) => 
        i === index ? { ...savedPrompt, isEditing: false } : p
      ));

      // Remove from changed prompts
      if (savedPrompt.id) {
        setChangedPrompts(prev => {
          const newSet = new Set(prev);
          newSet.delete(savedPrompt.id!);
          return newSet;
        });
      }

      toast({
        title: "Prompt Saved!",
        description: `Writing prompt for ${PLATFORM_CONFIGS[prompt.channel as Platform]?.name || prompt.channel} has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save writing prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  };

  const handleUpdatePrompt = async (index: number) => {
    const prompt = prompts[index];
    if (!prompt.id || !prompt.prompt.trim()) return;

    setSavingIds(prev => new Set([...prev, prompt.id!]));

    try {
      const savedPrompt = await updateWritingPrompt(prompt.id!, {
        channel: prompt.channel,
        prompt: prompt.prompt
      });

      setPrompts(prev => prev.map((p, i) => 
        i === index ? { ...savedPrompt } : p
      ));

      // Remove from changed prompts
      setChangedPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(prompt.id!);
        return newSet;
      });

      toast({
        title: "Prompt Updated!",
        description: `Writing prompt for ${PLATFORM_CONFIGS[prompt.channel as Platform]?.name || prompt.channel} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update writing prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(prompt.id!);
        return newSet;
      });
    }
  };

  const handleDelete = async (index: number) => {
    const prompt = prompts[index];
    if (!prompt.id) return;

    setSavingIds(prev => new Set([...prev, prompt.id!]));

    try {
      await deleteWritingPrompt(prompt.id);
      setPrompts(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Prompt Deleted",
        description: "Writing prompt has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete writing prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(prompt.id!);
        return newSet;
      });
    }
  };

  const handleChange = (index: number, field: keyof WritingPrompt, value: string) => {
    setPrompts(prev => prev.map((prompt, i) => 
      i === index ? { ...prompt, [field]: value } : prompt
    ));
    
    // Track changed prompts
    const prompt = prompts[index];
    if (prompt.id) {
      setChangedPrompts(prev => new Set([...prev, prompt.id!]));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
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
                <FileText className="w-12 h-12 text-primary animate-pulse" />
                <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
              Writing Prompts
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Customize AI prompts for each social media platform to ensure consistent, platform-optimized content
            </p>
          </div>

          {/* Add New Button */}
          <div className="max-w-4xl mx-auto mb-8 text-center">
            <Button onClick={handleAddNew} className="h-14 text-lg px-8 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <Plus className="w-5 h-5 mr-2" />
              <span>Add New Prompt</span>
            </Button>
          </div>

          {/* Prompts List */}
          <div className="max-w-4xl mx-auto space-y-6">
            {prompts.length === 0 ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
                <Card className="relative bg-card/90 backdrop-blur-md border-0 shadow-2xl">
                  <CardContent className="text-center py-16">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-2xl font-medium mb-4">No Writing Prompts Yet</h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      Create your first writing prompt to customize how AI generates content for each platform.
                    </p>
                    <Button onClick={handleAddNew} className="h-12 text-lg px-8">
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Prompt
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              prompts.map((prompt, index) => {
                const platformConfig = PLATFORM_CONFIGS[prompt.channel as Platform];
                const isLoading = savingIds.has(prompt.id || `temp-${index}`);
                
                // Get platform-specific icon
                const getPlatformIcon = () => {
                  switch (prompt.channel.toLowerCase()) {
                    case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-600" />;
                    case 'facebook': return <Facebook className="w-5 h-5 text-blue-500" />;
                    case 'twitter': return <X className="w-5 h-5 text-gray-900 dark:text-white" />;
                    case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
                    case 'newsletter': return <Mail className="w-5 h-5 text-green-600" />;
                    default: return <FileText className="w-5 h-5 text-accent-foreground" />;
                  }
                };

                // Get platform display name
                const getPlatformDisplayName = () => {
                  if (prompt.channel.toLowerCase() === 'twitter') {
                    return 'X';
                  }
                  return platformConfig?.name || prompt.channel;
                };
                
                return (
                  <div key={prompt.id || `new-${index}`} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
                    <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-2xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <CardTitle className="text-xl">
                                {prompt.isEditing ? (
                                  <Select
                                    value={prompt.channel}
                                    onValueChange={(value) => handleChange(index, 'channel', value)}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                          {config.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="flex items-center space-x-3">
                                    {getPlatformIcon()}
                                    <span className="text-xl">{getPlatformDisplayName()}</span>
                                  </span>
                                )}
                              </CardTitle>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {prompt.isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancel(index)}
                                  disabled={isLoading}
                                  className="h-10 px-4"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(index)}
                                  disabled={isLoading}
                                  className="h-10 px-4"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(index)}
                                  disabled={isLoading}
                                  className="h-10 px-4"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(index)}
                                  disabled={isLoading}
                                  className="h-10 px-4"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {prompt.isEditing ? (
                          <Textarea
                            value={prompt.prompt}
                            onChange={(e) => handleChange(index, 'prompt', e.target.value)}
                            placeholder={`Enter the writing prompt for ${platformConfig?.name || prompt.channel}...`}
                            className="min-h-[120px] text-base bg-background/50 border-2 border-primary/20 focus:border-primary/50 rounded-xl resize-none transition-all duration-300"
                          />
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-xl">
                              <Textarea
                                value={prompt.prompt || ''}
                                onChange={(e) => handleChange(index, 'prompt', e.target.value)}
                                placeholder={`Enter the writing prompt for ${platformConfig?.name || prompt.channel}...`}
                                className="min-h-[120px] border-0 bg-transparent p-0 resize-none focus-visible:ring-0 text-base"
                              />
                            </div>
                            
                            {/* Individual Update Button */}
                            {changedPrompts.has(prompt.id || '') && (
                              <div className="flex justify-end">
                                <Button 
                                  onClick={() => handleUpdatePrompt(index)}
                                  disabled={isLoading}
                                  size="sm"
                                  className="h-10 px-6"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-2" />
                                      Update Prompt
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>

          {/* Help Card */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <span>💡</span>
                    <span>Tips for Writing Effective Prompts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-base">
                  <p><strong>Be specific:</strong> Include platform-specific requirements (character limits, hashtags, etc.)</p>
                  <p><strong>Define tone:</strong> Specify the desired voice and style for each platform</p>
                  <p><strong>Include structure:</strong> Mention if you want CTAs, emojis, or specific formatting</p>
                  <p><strong>Test and iterate:</strong> Monitor generated content and refine prompts based on results</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};