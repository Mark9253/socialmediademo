import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, X, Linkedin, Facebook, Instagram, Image as ImageIcon, Upload, CheckCircle } from 'lucide-react';
import { Platform, PLATFORM_CONFIGS } from '@/types';
import { createSocialPost } from '@/services/airtable';
import { useToast } from '@/hooks/use-toast';

const createPostSchema = z.object({
  imageType: z.enum(['none', 'upload', 'url']),
  imageUrl: z.string().optional(),
  twitterCopy: z.string().optional(),
  linkedinCopy: z.string().optional(),
  instagramCopy: z.string().optional(),
  facebookCopy: z.string().optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export const CreatePost = () => {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      imageType: 'none',
      imageUrl: '',
      twitterCopy: '',
      linkedinCopy: '',
      instagramCopy: '',
      facebookCopy: '',
    },
  });

  const imageType = form.watch('imageType');

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'twitter': return <X className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCharacterCount = (text: string, platform: Platform) => {
    const max = PLATFORM_CONFIGS[platform]?.maxChars || 0;
    const count = text.length;
    return {
      count,
      max,
      isOver: count > max
    };
  };

  const onSubmit = async (data: CreatePostForm) => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to post to.",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one platform has content
    const hasContent = selectedPlatforms.some(platform => {
      const content = data[`${platform}Copy` as keyof CreatePostForm] as string;
      return content && content.trim().length > 0;
    });

    if (!hasContent) {
      toast({
        title: "No Content",
        description: "Please add content for at least one selected platform.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the post data
      const postData = {
        sourceHeadline: 'Manual Post', // Default for manual posts
        sourceSummary: 'User created post', // Default for manual posts
        sourceURL: '', // Empty for manual posts
        goToArticle: '', // Empty for manual posts
        socialChannels: selectedPlatforms.join(', '),
        twitterCopy: data.twitterCopy || '',
        linkedinCopy: data.linkedinCopy || '',
        instagramCopy: data.instagramCopy || '',
        facebookCopy: data.facebookCopy || '',
        blogCopy: '', // Default empty blog copy
        imagePrompt: '', // Default empty image prompt
        postImage: '', // Default empty, will be updated below if needed
        Status: 'Needs Approval', // Default status
        'needsImage?': imageType !== 'none' ? 'Yes' : 'No',
        imageSize: 'Standard', // Default size
      };

      // Handle image based on type
      if (imageType === 'url' && data.imageUrl) {
        (postData as any).imageurl = data.imageUrl;
      } else if (imageType === 'upload' && uploadedFile) {
        // For file uploads, we'll store a placeholder for now
        // In a real implementation, you'd upload to a file storage service first
        postData.postImage = `Uploaded file: ${uploadedFile.name}`;
        toast({
          title: "Note",
          description: "File upload functionality requires additional setup. The filename has been saved.",
          variant: "default"
        });
      }

      await createSocialPost(postData);

      toast({
        title: "Post Created Successfully!",
        description: "Your post has been created and is waiting for approval.",
      });

      // Reset form
      form.reset();
      setSelectedPlatforms([]);
      setUploadedFile(null);
      setImagePreview(null);

    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: "Creation Failed",
        description: "Could not create the post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pr-4 lg:pr-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Create Your Own Post
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and schedule your own social media content
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Platforms</CardTitle>
                <CardDescription>
                  Choose which social media platforms to create content for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['twitter', 'linkedin', 'facebook', 'instagram'] as Platform[]).map((platform) => (
                    <Button
                      key={platform}
                      type="button"
                      variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => handlePlatformToggle(platform)}
                    >
                      {getPlatformIcon(platform)}
                      <span className="text-sm">{PLATFORM_CONFIGS[platform].name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Content */}
            {selectedPlatforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    Create your content for each selected platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      {selectedPlatforms.map((platform) => (
                        <TabsTrigger key={platform} value={platform} className="flex items-center space-x-1">
                          {getPlatformIcon(platform)}
                          <span>{PLATFORM_CONFIGS[platform].name}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {selectedPlatforms.map((platform) => (
                      <TabsContent key={platform} value={platform} className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`${platform}Copy` as keyof CreatePostForm}
                          render={({ field }) => {
                            const charData = getCharacterCount((field.value as string) || '', platform);
                            return (
                              <FormItem>
                                <div className="flex items-center justify-between mb-2">
                                  <FormLabel className="flex items-center space-x-2">
                                    {getPlatformIcon(platform)}
                                    <span>{PLATFORM_CONFIGS[platform].name} Content</span>
                                  </FormLabel>
                                  <Badge variant={charData.isOver ? "destructive" : "secondary"}>
                                    {charData.count}/{charData.max}
                                  </Badge>
                                </div>
                                <FormControl>
                                  <Textarea
                                    placeholder={`Write your ${PLATFORM_CONFIGS[platform].name} post here...`}
                                    className="min-h-[120px]"
                                    {...field}
                                    value={field.value as string || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Post Image</CardTitle>
                <CardDescription>
                  Add an image to your post (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="none" />
                            <Label htmlFor="none">No Image</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="upload" id="upload" />
                            <Label htmlFor="upload">Upload File</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="url" id="url" />
                            <Label htmlFor="url">Image URL</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imageType === 'upload' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image or drag and drop
                        </p>
                      </Label>
                    </div>
                    {uploadedFile && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <ImageIcon className="w-4 h-4" />
                        <span>{uploadedFile.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {imageType === 'url' && (
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageUrlChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {imagePreview && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Preview</Label>
                    <div className="mt-2 max-w-sm">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-auto rounded-lg border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-primary-hover">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};