import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAnalyticsData, fetchPostHistory } from "@/services/airtable";
import { AnalyticsData, PostHistory } from "@/types";
import { Users, Eye, TrendingUp, BarChart3, Calendar, Award, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, historyData] = await Promise.all([
          fetchAnalyticsData(),
          fetchPostHistory()
        ]);
        setAnalytics(analyticsData);
        setPostHistory(historyData);
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate KPIs
  const calculateKPIs = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentData = analytics.filter(item => {
      if (!item.Date) return false;
      const itemDate = new Date(item.Date);
      return itemDate >= last30Days;
    });

    const totalFollowers = analytics.reduce((sum, item) => sum + (item.Followers || 0), 0);
    const totalReach = recentData.reduce((sum, item) => sum + (item.Reach || 0), 0);
    const totalImpressions = recentData.reduce((sum, item) => sum + (item.Impressions || 0), 0);
    
    // Calculate growth rate
    const oldData = analytics.filter(item => {
      if (!item.Date) return false;
      const itemDate = new Date(item.Date);
      const old30Days = new Date(last30Days);
      old30Days.setDate(old30Days.getDate() - 30);
      return itemDate >= old30Days && itemDate < last30Days;
    });
    const oldFollowers = oldData.reduce((sum, item) => sum + (item.Followers || 0), 0);
    const growthRate = oldFollowers > 0 ? ((totalFollowers - oldFollowers) / oldFollowers * 100) : 0;

    return { totalFollowers, totalReach, totalImpressions, growthRate };
  };

  const kpis = calculateKPIs();

  // Group analytics by platform
  const platformData = analytics.reduce((acc, item) => {
    const platform = item.Platform || 'Unknown';
    if (!acc[platform]) {
      acc[platform] = {
        followers: 0,
        reach: 0,
        impressions: 0,
        posts: 0,
        engagement: 0
      };
    }
    acc[platform].followers += item.Followers || 0;
    acc[platform].reach += item.Reach || 0;
    acc[platform].impressions += item.Impressions || 0;
    acc[platform].posts += item.Posts || 0;
    acc[platform].engagement += item.Engagement || 0;
    return acc;
  }, {} as Record<string, any>);

  // Get top performing posts
  const topPosts = postHistory
    .filter(post => post.status?.toLowerCase() === 'success')
    .sort((a, b) => (b.reach || 0) - (a.reach || 0))
    .slice(0, 10);

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return <Instagram className="h-5 w-5" />;
    if (platformLower.includes('facebook')) return <Facebook className="h-5 w-5" />;
    if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter className="h-5 w-5" />;
    if (platformLower.includes('linkedin')) return <Linkedin className="h-5 w-5" />;
    return <BarChart3 className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">📊 Social Media Performance Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights</p>
        </div>

        {/* Executive Summary - KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalFollowers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalReach.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.growthRate > 0 ? '+' : ''}{kpis.growthRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">vs previous period</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="content">Top Content</TabsTrigger>
            <TabsTrigger value="history">Post History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(platformData).map(([platform, data]) => (
                <Card key={platform}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform)}
                      <CardTitle>{platform}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Followers:</span>
                      <span className="font-semibold">{data.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reach (30d):</span>
                      <span className="font-semibold">{data.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Impressions:</span>
                      <span className="font-semibold">{data.impressions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posts:</span>
                      <span className="font-semibold">{data.posts}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Comparison</CardTitle>
                <CardDescription>Performance metrics by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(platformData)
                    .sort((a, b) => b[1].followers - a[1].followers)
                    .map(([platform, data]) => (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platform)}
                            <span className="font-medium">{platform}</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {data.followers.toLocaleString()} followers
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ 
                              width: `${Math.min((data.followers / Math.max(...Object.values(platformData).map((d: any) => d.followers))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🏆 Best Performing Content</CardTitle>
                <CardDescription>Top posts by reach</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post Title</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Reach</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPosts.map((post) => (
                      <TableRow key={post.recordId}>
                        <TableCell className="font-medium">
                          {post.post_url ? (
                            <a 
                              href={post.post_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {post.title || 'View Post'}
                            </a>
                          ) : (
                            post.title || 'Untitled'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(post.platform || '')}
                            <span>{post.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">{(post.reach || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(post.engagement || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📅 Publishing History</CardTitle>
                <CardDescription>Recent posts across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Metrics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postHistory
                      .sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                      })
                      .slice(0, 50)
                      .map((post) => (
                        <TableRow key={post.recordId}>
                          <TableCell className="font-medium">
                            {post.post_url ? (
                              <a 
                                href={post.post_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {post.title || 'View Post'}
                              </a>
                            ) : (
                              post.title || 'Untitled'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(post.platform || '')}
                              <span>{post.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              post.status?.toLowerCase() === 'success' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {post.status || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {post.reach ? `${post.reach.toLocaleString()} reach` : 'No data'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
