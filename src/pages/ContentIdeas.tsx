import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb } from 'lucide-react';

interface FormData {
  topicsToResearch: string;
  articleUrl: string;
}

const N8N_FORM_URL = 'https://n8n.srv886259.hstgr.cloud/webhook/775c6dad-671c-4ca3-b570-cad32af393f0';

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
    try {
      const response = await fetch(N8N_FORM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'Topics to Research': data.topicsToResearch,
          'Article URL': data.articleUrl
        })
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Social Content Ideas</h1>
            <p className="text-muted-foreground">Submit topics for research or article URLs to generate content from</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Content Ideas</CardTitle>
            <CardDescription>
              Provide either a topic for research or an existing article URL that can be used to generate social media content. At least one field is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topicsToResearch">
                  Topics to Research
                </Label>
                <Textarea
                  id="topicsToResearch"
                  placeholder="Enter topics you'd like us to research and create content about..."
                  className="min-h-[100px]"
                  {...register('topicsToResearch')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleUrl">
                  Article URL
                </Label>
                <Input
                  id="articleUrl"
                  type="url"
                  placeholder="https://example.com/article"
                  {...register('articleUrl', { 
                    pattern: {
                      value: /^https?:\/\/.+\..+/,
                      message: 'Please enter a valid URL'
                    }
                  })}
                />
                {errors.articleUrl && (
                  <p className="text-sm text-destructive">{errors.articleUrl.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};