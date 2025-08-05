import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Save, Loader2, Edit3 } from 'lucide-react';
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
          'Pinterest Title'
        ];
        
        const filteredPrompts = data.filter(prompt => 
          !excludedChannels.includes(prompt.channel)
        );
        
        setPrompts(filteredPrompts);
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              Writing Prompts
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize AI prompts for each social media platform to ensure consistent, platform-optimized content
            </p>
          </div>
          
          <Button onClick={handleAddNew} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add New Prompt</span>
          </Button>
        </div>

        {/* Prompts List */}
        <div className="space-y-4">
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Writing Prompts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first writing prompt to customize how AI generates content for each platform.
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Prompt
                </Button>
              </CardContent>
            </Card>
          ) : (
            prompts.map((prompt, index) => {
              const platformConfig = PLATFORM_CONFIGS[prompt.channel as Platform];
              const isLoading = savingIds.has(prompt.id || `temp-${index}`);
              
              return (
                <Card key={prompt.id || `new-${index}`} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-accent">
                          <FileText className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
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
                              <span className="flex items-center space-x-2">
                                <span>{platformConfig?.name || prompt.channel}</span>
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
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(index)}
                              disabled={isLoading}
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
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(index)}
                              disabled={isLoading}
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
                        className="min-h-[100px]"
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <Textarea
                            value={prompt.prompt || ''}
                            onChange={(e) => handleChange(index, 'prompt', e.target.value)}
                            placeholder={`Enter the writing prompt for ${platformConfig?.name || prompt.channel}...`}
                            className="min-h-[100px] border-0 bg-transparent p-0 resize-none focus-visible:ring-0"
                          />
                        </div>
                        
                        {/* Individual Update Button */}
                        {changedPrompts.has(prompt.id || '') && (
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleUpdatePrompt(index)}
                              disabled={isLoading}
                              size="sm"
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
              );
            })
          )}
        </div>

        {/* Help Card */}
        <Card className="border-primary/20 bg-primary-light/50">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Writing Effective Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Be specific:</strong> Include platform-specific requirements (character limits, hashtags, etc.)</p>
            <p><strong>Define tone:</strong> Specify the desired voice and style for each platform</p>
            <p><strong>Include structure:</strong> Mention if you want CTAs, emojis, or specific formatting</p>
            <p><strong>Platform optimization:</strong> Tailor prompts to each platform's best practices</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};