import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, FileText, BookOpen, CheckCircle, Clock, Lightbulb, Video, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const stats = [
    { label: "Content Generated", value: "0", icon: PenTool, color: "text-blue-600" },
    { label: "Posts Approved", value: "0", icon: CheckCircle, color: "text-green-600" },
    { label: "Posts in Queue", value: "0", icon: Clock, color: "text-orange-600" },
    { label: "Published", value: "0", icon: Video, color: "text-purple-600" },
  ];

  const quickActions = [
    {
      title: "Generate Content",
      description: "Create engaging social media posts with AI",
      icon: PenTool,
      href: "/generator",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Brand Guidelines",
      description: "Define your brand voice and visual identity",
      icon: FileText,
      href: "/guidelines",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      title: "Writing Prompts",
      description: "Customize prompts for different content types",
      icon: BookOpen,
      href: "/prompts",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <Layout>
      <div className="p-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 p-8 text-white">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-4">Social Media HQ</h1>
              <p className="text-xl text-emerald-50 mb-6 max-w-2xl">
                Your all-in-one social media content engine for business success
              </p>
              <Link to="/generator">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                  <Plus className="mr-2 h-5 w-5" />
                  Start Creating
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
              <div className="w-full h-full bg-white rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-emerald-600 transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={action.href}>
                    <Button variant="outline" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};