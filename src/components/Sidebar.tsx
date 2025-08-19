import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PenTool,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  Lightbulb,
  Video,
  FolderOpen,
  Plus,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Content Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Content Generator", href: "/generator", icon: PenTool },
  { name: "Create Post", href: "/create", icon: Plus },
  { name: "Post for Approval", href: "/approval", icon: CheckCircle },
  { name: "Publishing Queue", href: "/queue", icon: Clock },
  { name: "Brand Guidelines", href: "/guidelines", icon: FileText },
  { name: "Writing Prompts", href: "/prompts", icon: BookOpen },
  { name: "Marketing Shorts", href: "/marketing-shorts", icon: Video },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">Social Media HQ</h2>
        <p className="text-sm text-gray-500 mt-1">Your all-in-one social media content engine for business success</p>
      </div>
      
      <nav className="mt-6 px-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-emerald-500" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};