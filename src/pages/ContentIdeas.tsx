import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Sparkles, Target, Link2, Send } from 'lucide-react';

interface FormData {
  topicsToResearch: string;
  articleUrl: string;
}

const N8N_FORM_URL = 'https://n8n.srv886259.hstgr.cloud/form/775c6dad-671c-4ca3-b570-cad32af393f0';

export const ContentIdeas = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<FormData>();
  const watchedFields = watch();

  const onSubmit = async (data: FormData) => {
    // Check if at least one field has content
    if (!data.topicsToResearch?.trim() && !data.articleUrl?.trim()) {
        toast({
          title: "Validation Error",
          description: "Please fill in at least one field - either Topics to Research or Article URL.",
          variant: "destructive",
        });
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare the form data payload
    const formPayload = {
      'Topics to Research': data.topicsToResearch || '',
      'Article URL': data.articleUrl || ''
    };
    
    console.log('Submitting form data:', formPayload);
    
    try {
      // Use the EXACT field names from the n8n form HTML: field-0 and field-1 (with hyphens)
      const formData = new FormData();
      formData.append('field-0', data.topicsToResearch || '');
      formData.append('field-1', data.articleUrl || '');
      
      console.log('Using correct n8n field names with hyphens:', {
        'field-0': data.topicsToResearch || '',
        'field-1': data.articleUrl || ''
      });
      
      const response = await fetch(N8N_FORM_URL, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your content idea has been submitted successfully.",
        });
        reset();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit your content idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="relative z-10 pl-2 pr-4 sm:pr-6 lg:pr-8 py-12">
          {/* Header with Dynamic Icons */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <Lightbulb className="w-12 h-12 text-primary animate-pulse" />
                <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
              Content Ideas Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your creative spark into compelling social content. Submit research topics or article URLs to generate engaging posts.
            </p>
          </div>

          {/* Interactive Cards Grid */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
            {/* Research Topics Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Research Topics</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Share topics you'd like us to research and transform into engaging social media content
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Article URL Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <Link2 className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Article URLs</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Provide existing article links that we can repurpose into compelling social posts
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
              <Card className="relative bg-card/90 backdrop-blur-md border-0 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Submit Your Content Ideas
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Fill in at least one field below to get started with content generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Topics Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <Label htmlFor="topicsToResearch" className="text-lg font-semibold">
                          Research Topics
                        </Label>
                      </div>
                      <Textarea
                        id="topicsToResearch"
                        placeholder="e.g., Latest AI trends, sustainable business practices, remote work productivity tips..."
                        className="min-h-[120px] text-base bg-background/50 border-2 border-primary/20 focus:border-primary/50 rounded-xl resize-none transition-all duration-300"
                        {...register('topicsToResearch')}
                      />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-card px-4 text-muted-foreground font-medium">OR</span>
                      </div>
                    </div>

                    {/* URL Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-lg">
                          <Link2 className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <Label htmlFor="articleUrl" className="text-lg font-semibold">
                          Article URL
                        </Label>
                      </div>
                      <Input
                        id="articleUrl"
                        type="url"
                        placeholder="https://example.com/your-article"
                        className="text-base h-12 bg-background/50 border-2 border-accent/20 focus:border-accent/50 rounded-xl transition-all duration-300"
                        {...register('articleUrl', { 
                          pattern: {
                            value: /^https?:\/\/.+\..+/,
                            message: 'Please enter a valid URL'
                          }
                        })}
                      />
                      {errors.articleUrl && (
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <span className="w-1 h-1 bg-destructive rounded-full"></span>
                          {errors.articleUrl.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center gap-3">
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                              Submitting Your Ideas...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Submit Content Ideas
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};