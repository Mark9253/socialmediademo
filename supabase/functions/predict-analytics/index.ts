import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyticsData, postHistory, dateRange } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalDataPoints: analyticsData.length,
      totalPosts: postHistory.length,
      platforms: [...new Set(analyticsData.map((d: any) => d.Platform))],
      dateRange: dateRange,
      recentTrends: analyticsData.slice(-10),
      topPerformingPosts: postHistory
        .filter((p: any) => p.status?.toLowerCase() === 'success')
        .sort((a: any, b: any) => (b.reach || 0) - (a.reach || 0))
        .slice(0, 5)
    };

    const systemPrompt = `You are a social media analytics expert specialized in predictive analytics. 
Analyze the provided historical data and generate actionable predictions and insights for future growth.
Focus on:
1. Follower growth projections for the next 30, 60, and 90 days
2. Engagement trend forecasts
3. Best performing content patterns
4. Optimal posting times and frequencies
5. Platform-specific recommendations
6. Potential growth opportunities
7. Risk factors and areas for improvement

Provide specific, data-driven predictions with concrete numbers and percentages.`;

    const userPrompt = `Analyze this social media performance data and provide predictive insights:

Date Range: ${dataSummary.dateRange}
Total Data Points: ${dataSummary.totalDataPoints}
Total Posts: ${dataSummary.totalPosts}
Platforms: ${dataSummary.platforms.join(", ")}

Recent Performance Trends:
${JSON.stringify(dataSummary.recentTrends, null, 2)}

Top Performing Posts:
${JSON.stringify(dataSummary.topPerformingPosts, null, 2)}

Generate comprehensive predictions including:
- Growth forecasts (30, 60, 90 day projections)
- Engagement predictions
- Content strategy recommendations
- Platform-specific insights
- Actionable next steps`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_predictions",
            description: "Generate predictive analytics and forecasts based on historical social media data",
            parameters: {
              type: "object",
              properties: {
                growthForecasts: {
                  type: "object",
                  properties: {
                    next30Days: {
                      type: "object",
                      properties: {
                        followerGrowth: { type: "number", description: "Predicted follower growth percentage" },
                        reachIncrease: { type: "number", description: "Predicted reach increase percentage" },
                        engagementRate: { type: "number", description: "Predicted engagement rate percentage" }
                      },
                      required: ["followerGrowth", "reachIncrease", "engagementRate"]
                    },
                    next60Days: {
                      type: "object",
                      properties: {
                        followerGrowth: { type: "number" },
                        reachIncrease: { type: "number" },
                        engagementRate: { type: "number" }
                      },
                      required: ["followerGrowth", "reachIncrease", "engagementRate"]
                    },
                    next90Days: {
                      type: "object",
                      properties: {
                        followerGrowth: { type: "number" },
                        reachIncrease: { type: "number" },
                        engagementRate: { type: "number" }
                      },
                      required: ["followerGrowth", "reachIncrease", "engagementRate"]
                    }
                  },
                  required: ["next30Days", "next60Days", "next90Days"]
                },
                contentInsights: {
                  type: "object",
                  properties: {
                    bestPerformingContentTypes: {
                      type: "array",
                      items: { type: "string" }
                    },
                    optimalPostingTimes: {
                      type: "array",
                      items: { type: "string" }
                    },
                    recommendedFrequency: { type: "string" }
                  },
                  required: ["bestPerformingContentTypes", "optimalPostingTimes", "recommendedFrequency"]
                },
                platformRecommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      prediction: { type: "string" },
                      actionItems: {
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["platform", "prediction", "actionItems"]
                  }
                },
                opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["title", "description", "impact"]
                  }
                },
                risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      mitigation: { type: "string" }
                    },
                    required: ["title", "description", "mitigation"]
                  }
                },
                keyTakeaways: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["growthForecasts", "contentInsights", "platformRecommendations", "opportunities", "risks", "keyTakeaways"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_predictions" } }
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No predictions generated");
    }

    const predictions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ predictions }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in predict-analytics:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
