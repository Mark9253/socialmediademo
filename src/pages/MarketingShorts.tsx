import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fetchMarketingVideoFolders } from '@/services/airtable';
import { MarketingVideoFolder } from '@/types';
import { Zap, Target, Folder, Briefcase, ExternalLink, Loader2 } from 'lucide-react';

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
  const [folders, setFolders] = useState<MarketingVideoFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarketingShortsFormData>({
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

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const fetchedFolders = await fetchMarketingVideoFolders();
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error",
        description: "Failed to load marketing folders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleFolderClick = (folder: MarketingVideoFolder) => {
    const folderUrl = folder.url || folder['Marketing Shorts Folder'];
    if (folderUrl && folderUrl.startsWith('http')) {
      window.open(folderUrl, '_blank');
    } else {
      toast({
        title: "No URL",
        description: "This folder doesn't have a valid URL configured.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: MarketingShortsFormData) => {
    setIsSubmitting(true);
    
    try {
      // Try sending as JSON to n8n webhook
      const payload = {
        'Company URL': data.companyUrl || '',
        'Product': data.product || '',
        'Target Audience': data.targetAudience || '',
        'Name': data.name || '',
        'Email Address': data.email || '',
        'Company Name': data.companyName || '',
        'Campaign Style': data.campaignStyle || ''
      };

      console.log('Sending JSON to n8n:', payload);

      const response = await fetch(MARKETING_SHORTS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Marketing shorts request submitted successfully!",
        });
        reset();
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting marketing shorts request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
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

        {/* Marketing Folders Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Marketing Resource Folders
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse and access your marketing resource folders directly
            </p>
          </div>

          {loadingFolders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading folders...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No folders found</h3>
              <p className="text-sm text-muted-foreground">No marketing folders are currently available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
              {folders.map((folder, index) => (
                <Card 
                  key={folder.recordId || index}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/40"
                  onClick={() => handleFolderClick(folder)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Folder className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg truncate" title={folder.name || 'Marketing Folder'}>
                      {folder.name || 'Marketing Folder'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-center">
                    <div className="space-y-2">
                      {(folder.url || folder['Marketing Shorts Folder']) && (
                        <p className="text-xs text-muted-foreground truncate" title={folder.url || folder['Marketing Shorts Folder']}>
                          {folder.url || folder['Marketing Shorts Folder']}
                        </p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                        disabled={!(folder.url || folder['Marketing Shorts Folder'])}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Folder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  <Folder className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Resource Access</CardTitle>
                <CardDescription>
                  Easy access to all your marketing resources and folders above
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyUrl">Company URL *</Label>
                    <Input 
                      id="companyUrl"
                      placeholder="https://your-company.com" 
                      {...register('companyUrl', { required: 'Company URL is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.companyUrl && (
                      <p className="text-sm text-destructive">{errors.companyUrl.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Product *</Label>
                    <Textarea 
                      id="product"
                      placeholder="Describe your product or service..."
                      rows={3}
                      {...register('product', { required: 'Product is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.product && (
                      <p className="text-sm text-destructive">{errors.product.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience *</Label>
                    <Textarea 
                      id="targetAudience"
                      placeholder="Describe your target audience..."
                      rows={3}
                      {...register('targetAudience', { required: 'Target audience is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.targetAudience && (
                      <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input 
                      id="name"
                      placeholder="Your full name" 
                      {...register('name', { required: 'Name is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="your.email@company.com" 
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName"
                      placeholder="Your company name" 
                      {...register('companyName', { required: 'Company name is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.companyName && (
                      <p className="text-sm text-destructive">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaignStyle">Campaign Style *</Label>
                    <Textarea 
                      id="campaignStyle"
                      placeholder="Describe your preferred campaign style..."
                      rows={3}
                      {...register('campaignStyle', { required: 'Campaign style is required' })}
                      className="transition-all duration-200 focus:border-primary/50"
                    />
                    {errors.campaignStyle && (
                      <p className="text-sm text-destructive">{errors.campaignStyle.message}</p>
                    )}
                  </div>

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
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
};