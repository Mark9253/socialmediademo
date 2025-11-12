import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAnalyticsData, fetchPostHistory } from "@/services/airtable";
import { AnalyticsData, PostHistory } from "@/types";
import { Users, Eye, TrendingUp, BarChart3, Calendar as CalendarIcon, Award, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostTimingHeatMap } from "@/components/PostTimingHeatMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type DateRangePreset = '7' | '30' | '90' | 'custom' | 'all';

interface Predictions {
  growthForecasts: {
    next30Days: { followerGrowth: number; reachIncrease: number; engagementRate: number };
    next60Days: { followerGrowth: number; reachIncrease: number; engagementRate: number };
    next90Days: { followerGrowth: number; reachIncrease: number; engagementRate: number };
  };
  contentInsights: {
    bestPerformingContentTypes: string[];
    optimalPostingTimes: string[];
    recommendedFrequency: string;
  };
  platformRecommendations: Array<{
    platform: string;
    prediction: string;
    actionItems: string[];
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  risks: Array<{
    title: string;
    description: string;
    mitigation: string;
  }>;
  keyTakeaways: string[];
}

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangePreset>('30');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

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

  // Generate predictions
  const generatePredictions = async () => {
    setLoadingPredictions(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-analytics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            analyticsData: filteredAnalytics,
            postHistory: filteredPostHistory,
            dateRange: dateRange === 'custom' 
              ? `${customStartDate ? format(customStartDate, 'MMM dd, yyyy') : ''} - ${customEndDate ? format(customEndDate, 'MMM dd, yyyy') : ''}`
              : dateRange === 'all' ? 'All time' : `Last ${dateRange} days`
          }),
        }
      );

      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please try again later.');
        return;
      }
      
      if (response.status === 402) {
        toast.error('Payment required. Please add credits to your Lovable workspace.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions);
      toast.success('Predictions generated successfully!');
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error('Failed to generate predictions. Please try again.');
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Filter data based on date range
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;
    
    if (dateRange === 'all') {
      return { analytics, postHistory };
    }
    
    if (dateRange === 'custom') {
      if (!customStartDate || !customEndDate) {
        return { analytics, postHistory };
      }
      startDate = customStartDate;
      const endDate = customEndDate;
      
      return {
        analytics: analytics.filter(item => {
          if (!item.Date) return false;
          const itemDate = new Date(item.Date);
          return itemDate >= startDate && itemDate <= endDate;
        }),
        postHistory: postHistory.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at);
          return itemDate >= startDate && itemDate <= endDate;
        })
      };
    }
    
    // Preset ranges
    const days = parseInt(dateRange);
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    return {
      analytics: analytics.filter(item => {
        if (!item.Date) return false;
        const itemDate = new Date(item.Date);
        return itemDate >= startDate;
      }),
      postHistory: postHistory.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      })
    };
  };

  const { analytics: filteredAnalytics, postHistory: filteredPostHistory } = getFilteredData();

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalFollowers = filteredAnalytics.reduce((sum, item) => sum + (item.Followers || 0), 0);
    const totalReach = filteredAnalytics.reduce((sum, item) => sum + (item.Reach || 0), 0);
    const totalImpressions = filteredAnalytics.reduce((sum, item) => sum + (item.Impressions || 0), 0);
    
    // Calculate growth rate (comparing first half vs second half of the period)
    const sortedData = [...filteredAnalytics].sort((a, b) => {
      const dateA = a.Date ? new Date(a.Date).getTime() : 0;
      const dateB = b.Date ? new Date(b.Date).getTime() : 0;
      return dateA - dateB;
    });
    
    const midPoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midPoint);
    const secondHalf = sortedData.slice(midPoint);
    
    const firstHalfFollowers = firstHalf.reduce((sum, item) => sum + (item.Followers || 0), 0);
    const secondHalfFollowers = secondHalf.reduce((sum, item) => sum + (item.Followers || 0), 0);
    const growthRate = firstHalfFollowers > 0 ? ((secondHalfFollowers - firstHalfFollowers) / firstHalfFollowers * 100) : 0;

    return { totalFollowers, totalReach, totalImpressions, growthRate };
  };

  const kpis = calculateKPIs();

  // Group analytics by platform
  const platformData = filteredAnalytics.reduce((acc, item) => {
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
  const topPosts = filteredPostHistory
    .filter(post => post.status?.toLowerCase() === 'success')
    .sort((a, b) => (b.reach || 0) - (a.reach || 0))
    .slice(0, 10);

  // Prepare data for charts
  const prepareGrowthTrendData = () => {
    const dataByDate: Record<string, any> = {};
    
    filteredAnalytics.forEach(item => {
      if (!item.Date) return;
      const date = new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dataByDate[date]) {
        dataByDate[date] = { date, total: 0 };
      }
      
      const platform = item.Platform || 'Unknown';
      if (!dataByDate[date][platform]) {
        dataByDate[date][platform] = 0;
      }
      
      dataByDate[date][platform] += item.Followers || 0;
      dataByDate[date].total += item.Followers || 0;
    });
    
    return Object.values(dataByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const prepareEngagementData = () => {
    const dataByDate: Record<string, any> = {};
    
    filteredAnalytics.forEach(item => {
      if (!item.Date) return;
      const date = new Date(item.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dataByDate[date]) {
        dataByDate[date] = { date, reach: 0, impressions: 0, engagement: 0 };
      }
      
      dataByDate[date].reach += item.Reach || 0;
      dataByDate[date].impressions += item.Impressions || 0;
      dataByDate[date].engagement += item.Engagement || 0;
    });
    
    return Object.values(dataByDate).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const preparePlatformComparisonData = () => {
    return Object.entries(platformData)
      .map(([platform, data]) => ({
        platform,
        followers: data.followers,
        reach: data.reach,
        engagement: data.engagement,
        posts: data.posts
      }))
      .sort((a, b) => b.followers - a.followers);
  };

  const growthTrendData = prepareGrowthTrendData();
  const engagementData = prepareEngagementData();
  const platformComparisonData = preparePlatformComparisonData();

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      Instagram: '#E4405F',
      Facebook: '#1877F2',
      Twitter: '#1DA1F2',
      X: '#000000',
      LinkedIn: '#0A66C2',
    };
    return colors[platform] || '#8B5CF6';
  };

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

        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={dateRange === '7' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('7')}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={dateRange === '30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('30')}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={dateRange === '90' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('90')}
                >
                  Last 90 Days
                </Button>
                <Button
                  variant={dateRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('all')}
                >
                  All Time
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        if (date && customEndDate) {
                          setDateRange('custom');
                        }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        if (customStartDate && date) {
                          setDateRange('custom');
                        }
                      }}
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {dateRange === 'custom' && customStartDate && customEndDate && (
              <p className="text-sm text-muted-foreground mt-4">
                Showing data from {format(customStartDate, "MMM dd, yyyy")} to {format(customEndDate, "MMM dd, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Executive Summary - KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalFollowers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'all' ? 'All time' : dateRange === 'custom' ? 'Selected period' : `Last ${dateRange} days`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalReach.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'all' ? 'All time' : dateRange === 'custom' ? 'Selected period' : `Last ${dateRange} days`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {dateRange === 'all' ? 'All time' : dateRange === 'custom' ? 'Selected period' : `Last ${dateRange} days`}
              </p>
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
              <p className="text-xs text-muted-foreground">Period comparison</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="content">Top Content</TabsTrigger>
            <TabsTrigger value="timing">⏰ Post Timing</TabsTrigger>
            <TabsTrigger value="history">Post History</TabsTrigger>
            <TabsTrigger value="predictions">🔮 Predictions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Growth Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>📈 Growth Trends</CardTitle>
                <CardDescription>Follower growth over time by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={growthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    {Object.keys(platformData).map(platform => (
                      <Line
                        key={platform}
                        type="monotone"
                        dataKey={platform}
                        stroke={getPlatformColor(platform)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>👁️ Engagement Over Time</CardTitle>
                <CardDescription>Reach, impressions, and engagement trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={engagementData}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#8B5CF6" 
                      fillOpacity={1} 
                      fill="url(#colorReach)" 
                      name="Reach"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#3B82F6" 
                      fillOpacity={1} 
                      fill="url(#colorImpressions)" 
                      name="Impressions"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#10B981" 
                      fillOpacity={1} 
                      fill="url(#colorEngagement)" 
                      name="Engagement"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Performance Cards */}
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
            {/* Platform Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Comparison</CardTitle>
                <CardDescription>Side-by-side performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={platformComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="platform" 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="followers" fill="#8B5CF6" name="Followers" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="reach" fill="#3B82F6" name="Reach" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="engagement" fill="#10B981" name="Engagement" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Follower Distribution</CardTitle>
                <CardDescription>Breakdown by platform</CardDescription>
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

          {/* Post Timing Heat Map Tab */}
          <TabsContent value="timing" className="space-y-4">
            <PostTimingHeatMap posts={filteredPostHistory} />
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
                    {filteredPostHistory
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

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>🔮 Predictive Analytics & Forecasts</CardTitle>
                    <CardDescription>AI-powered insights and growth predictions</CardDescription>
                  </div>
                  <Button 
                    onClick={generatePredictions} 
                    disabled={loadingPredictions || filteredAnalytics.length === 0}
                  >
                    {loadingPredictions ? 'Analyzing...' : 'Generate Predictions'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!predictions && !loadingPredictions && (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No predictions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Generate Predictions" to analyze your data and forecast future trends
                    </p>
                  </div>
                )}

                {loadingPredictions && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing your data and generating predictions...</p>
                  </div>
                )}

                {predictions && (
                  <div className="space-y-6">
                    {/* Growth Forecasts */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">📈 Growth Forecasts</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">Next 30 Days</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Follower Growth:</span>
                              <span className="font-semibold text-green-600">
                                +{predictions.growthForecasts.next30Days.followerGrowth.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Reach Increase:</span>
                              <span className="font-semibold text-blue-600">
                                +{predictions.growthForecasts.next30Days.reachIncrease.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Engagement Rate:</span>
                              <span className="font-semibold text-purple-600">
                                {predictions.growthForecasts.next30Days.engagementRate.toFixed(1)}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">Next 60 Days</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Follower Growth:</span>
                              <span className="font-semibold text-green-600">
                                +{predictions.growthForecasts.next60Days.followerGrowth.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Reach Increase:</span>
                              <span className="font-semibold text-blue-600">
                                +{predictions.growthForecasts.next60Days.reachIncrease.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Engagement Rate:</span>
                              <span className="font-semibold text-purple-600">
                                {predictions.growthForecasts.next60Days.engagementRate.toFixed(1)}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">Next 90 Days</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Follower Growth:</span>
                              <span className="font-semibold text-green-600">
                                +{predictions.growthForecasts.next90Days.followerGrowth.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Reach Increase:</span>
                              <span className="font-semibold text-blue-600">
                                +{predictions.growthForecasts.next90Days.reachIncrease.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Engagement Rate:</span>
                              <span className="font-semibold text-purple-600">
                                {predictions.growthForecasts.next90Days.engagementRate.toFixed(1)}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Content Insights */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">💡 Content Strategy Insights</h3>
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Best Performing Content Types:</h4>
                            <div className="flex flex-wrap gap-2">
                              {predictions.contentInsights.bestPerformingContentTypes.map((type, i) => (
                                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Optimal Posting Times:</h4>
                            <div className="flex flex-wrap gap-2">
                              {predictions.contentInsights.optimalPostingTimes.map((time, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Recommended Frequency:</h4>
                            <p className="text-muted-foreground">{predictions.contentInsights.recommendedFrequency}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Platform Recommendations */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">🎯 Platform-Specific Recommendations</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {predictions.platformRecommendations.map((rec, i) => (
                          <Card key={i}>
                            <CardHeader>
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(rec.platform)}
                                <CardTitle className="text-base">{rec.platform}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground">{rec.prediction}</p>
                              <div>
                                <h5 className="font-semibold text-sm mb-2">Action Items:</h5>
                                <ul className="space-y-1">
                                  {rec.actionItems.map((item, j) => (
                                    <li key={j} className="text-sm flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Opportunities */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">🚀 Growth Opportunities</h3>
                      <div className="space-y-3">
                        {predictions.opportunities.map((opp, i) => (
                          <Card key={i} className={cn(
                            "border-l-4",
                            opp.impact === 'high' && "border-l-green-500",
                            opp.impact === 'medium' && "border-l-yellow-500",
                            opp.impact === 'low' && "border-l-blue-500"
                          )}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{opp.title}</h4>
                                  <p className="text-sm text-muted-foreground">{opp.description}</p>
                                </div>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                                  opp.impact === 'high' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                                  opp.impact === 'medium' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                                  opp.impact === 'low' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                )}>
                                  {opp.impact} impact
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Risks */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">⚠️ Potential Risks & Mitigation</h3>
                      <div className="space-y-3">
                        {predictions.risks.map((risk, i) => (
                          <Card key={i} className="border-l-4 border-l-red-500">
                            <CardContent className="pt-6">
                              <h4 className="font-semibold mb-1">{risk.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                              <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm"><strong>Mitigation:</strong> {risk.mitigation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Key Takeaways */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">✨ Key Takeaways</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <ul className="space-y-2">
                            {predictions.keyTakeaways.map((takeaway, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
