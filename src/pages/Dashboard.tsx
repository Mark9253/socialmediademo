import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Palette, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { fetchSocialPosts } from '@/services/airtable';
import { SocialPost } from '@/types';

export const Dashboard = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchSocialPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.Status === 'Published').length,
    scheduled: posts.filter(p => p.Status === 'Scheduled').length,
    draft: posts.filter(p => p.Status === 'Draft').length
  };

  const recentPosts = posts.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-success text-success-foreground';
      case 'Scheduled': return 'bg-warning text-warning-foreground';
      case 'Draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
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

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="max-w-6xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <TrendingUp className="w-12 h-12 text-primary animate-pulse" />
                <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent mb-4">
              Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Welcome back! Track your content performance and manage your social media presence.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-primary-light">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Generate Content</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-base">
                    Create new social media posts from your source content
                  </CardDescription>
                  <Link to="/generator">
                    <Button className="w-full group-hover:bg-primary-hover transition-colors h-12 text-lg">
                      Start Creating
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-secondary/30 hover:border-secondary/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-secondary">
                      <Palette className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <CardTitle className="text-xl">Brand Guidelines</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-base">
                    Define your brand voice and visual style
                  </CardDescription>
                  <Link to="/guidelines">
                    <Button variant="secondary" className="w-full group-hover:bg-secondary-hover transition-colors h-12 text-lg">
                      Manage Guidelines
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-70"></div>
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-accent/30 hover:border-accent/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-accent">
                      <FileText className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">Writing Prompts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-base">
                    Customize prompts for each platform
                  </CardDescription>
                  <Link to="/prompts">
                    <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors h-12 text-lg">
                      Edit Prompts
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats */}
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-success/20 hover:border-success/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <p className="text-3xl font-bold text-success">{stats.published}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-warning/20 hover:border-warning/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-3xl font-bold text-warning">{stats.scheduled}</p>
                  </div>
                  <Clock className="w-10 h-10 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-muted/40 hover:border-muted/60 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                    <p className="text-3xl font-bold text-muted-foreground">{stats.draft}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Posts */}
          <div className="max-w-6xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
              <Card className="relative bg-card/90 backdrop-blur-md border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Recent Posts</CardTitle>
                  <CardDescription className="text-lg">
                    Your latest content generation activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : recentPosts.length > 0 ? (
                    <div className="space-y-4">
                      {recentPosts.map((post) => (
                        <div key={post.ID} className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground truncate">
                              {post.sourceHeadline}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(post.Status)}>
                                {post.Status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {post.socialChannels}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {post.Created && new Date(post.Created).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground mb-4">No posts yet. Generate your first content!</p>
                      <Link to="/generator">
                        <Button className="h-12 text-lg px-8">
                          Create Your First Post
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};