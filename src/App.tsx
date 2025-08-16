import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { ContentGenerator } from "./pages/ContentGenerator";
import { BrandGuidelines } from "./pages/BrandGuidelines";
import { WritingPrompts } from "./pages/WritingPrompts";
import { PostApproval } from "./pages/PostApproval";
import { PublishedQueue } from "./pages/PublishedQueue";
import { ContentIdeas } from "./pages/ContentIdeas";
import { MarketingShorts } from "./pages/MarketingShorts";
import { MarketingShortsFolder } from "./pages/MarketingShortsFolder";
import { CreatePost } from "./pages/CreatePost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/generator" element={
              <ProtectedRoute>
                <ContentGenerator />
              </ProtectedRoute>
            } />
            <Route path="/guidelines" element={
              <ProtectedRoute>
                <BrandGuidelines />
              </ProtectedRoute>
            } />
            <Route path="/prompts" element={
              <ProtectedRoute>
                <WritingPrompts />
              </ProtectedRoute>
            } />
            <Route path="/approval" element={
              <ProtectedRoute>
                <PostApproval />
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute>
                <PublishedQueue />
              </ProtectedRoute>
            } />
            <Route path="/ideas" element={
              <ProtectedRoute>
                <ContentIdeas />
              </ProtectedRoute>
            } />
            <Route path="/marketing-shorts" element={
              <ProtectedRoute>
                <MarketingShorts />
              </ProtectedRoute>
            } />
            <Route path="/marketing-shorts-folders" element={
              <ProtectedRoute>
                <MarketingShortsFolder />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
