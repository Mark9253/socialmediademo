import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generator" element={<ContentGenerator />} />
          <Route path="/guidelines" element={<BrandGuidelines />} />
          <Route path="/prompts" element={<WritingPrompts />} />
          <Route path="/approval" element={<PostApproval />} />
          <Route path="/queue" element={<PublishedQueue />} />
          <Route path="/ideas" element={<ContentIdeas />} />
          <Route path="/marketing-shorts" element={<MarketingShorts />} />
          <Route path="/marketing-shorts-folders" element={<MarketingShortsFolder />} />
          {/* <Route path="/create" element={<CreatePost />} /> */} {/* Temporarily hidden */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
