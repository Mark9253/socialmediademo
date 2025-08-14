import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Zap, Target, Users, Briefcase, ExternalLink } from 'lucide-react';
import { fetchMarketingVideoFolders } from '@/services/airtable';
import { MarketingVideoFolder } from '@/types';

interface MarketingShortsFormData {
  companyUrl: string;
  product: string;
  targetAudience: string;
  name: string;
  email: string;
  companyName: string;
  campaignStyle: string;
}

const MARKETING_SHORTS_WEBHOOK_URL = 'https://up-stride.app.n8n.cloud/form/3ecf1193-969e-4f35-bb4c-d9523ae5c9e0';

export const MarketingShorts = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketingFolders, setMarketingFolders] = useState<MarketingVideoFolder[]>([]);
  
  const form = useForm<MarketingShortsFormData>({
    defaultValues: {
      companyUrl: '',
      product: '',
      targetAudience: '',
      name: '',
      email: '',
      companyName: '',
      campaignStyle: ''
    }
  });

  useEffect(() => {
    const loadMarketingFolders = async () => {
      try {
        const folders = await fetchMarketingVideoFolders();
        setMarketingFolders(folders);
      } catch (error) {
        console.error('Error loading marketing folders:', error);
      }
    };
    
    loadMarketingFolders();
  }, []);

  const onSubmit = async (data: MarketingShortsFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(MARKETING_SHORTS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success('Marketing shorts request submitted successfully!');
        form.reset();
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting marketing shorts request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-32 right-16 w-16 h-16 bg-accent/30 rounded-full blur-lg animate-bounce" />
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-secondary/40 rounded-full blur-md animate-pulse delay-1000" />
            
            {/* Content */}
            <div className="text-center relative z-10">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                  <Zap className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
                Marketing Shorts
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Create high-impact marketing campaigns tailored to your brand
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="group hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Targeted Campaigns</CardTitle>
                <CardDescription>
                  Precisely crafted campaigns that resonate with your target audience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-accent/20 hover:border-accent/40">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-accent/20 to-accent/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Audience Insights</CardTitle>
                <CardDescription>
                  Deep understanding of your audience to maximize campaign effectiveness
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-secondary/20 hover:border-secondary/40">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-secondary/20 to-secondary/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Brand Alignment</CardTitle>
                <CardDescription>
                  Campaigns that perfectly align with your brand voice and values
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Main Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Marketing Shorts Request
                </CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below to get started with your custom marketing campaign
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="companyUrl"
                      rules={{ required: 'Company URL is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company URL *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://your-company.com" 
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="product"
                      rules={{ required: 'Product is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product or service..."
                              rows={3}
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetAudience"
                      rules={{ required: 'Target audience is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your target audience..."
                              rows={3}
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: 'Name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your full name" 
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      rules={{ 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="your.email@company.com" 
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      rules={{ required: 'Company name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your company name" 
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campaignStyle"
                      rules={{ required: 'Campaign style is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Style *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your preferred campaign style..."
                              rows={3}
                              {...field} 
                              className="transition-all duration-200 focus:border-primary/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover transition-all duration-300 text-lg py-6"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Marketing Shorts Request'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {marketingFolders.length > 0 && (
              <Card className="mt-8 shadow-xl border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Marketing Video Folders
                  </CardTitle>
                  <CardDescription className="text-base">
                    Access your generated marketing content folders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketingFolders.map((folder, index) => (
                      <div key={folder.recordId || index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-background to-primary/5 hover:shadow-md transition-all duration-300">
                        <div>
                          <h3 className="font-medium text-lg">{folder.name || `Marketing Folder ${index + 1}`}</h3>
                          <p className="text-sm text-muted-foreground">Google Drive Folder</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                          className="bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
                        >
                          <a 
                            href={folder['Marketing Shorts Folder']} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Open Folder
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};