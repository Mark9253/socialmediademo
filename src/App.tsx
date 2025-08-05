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
import { ContentIdeas } from "./pages/ContentIdeas";
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
          <Route path="/ideas" element={<ContentIdeas />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
