import { PostHistory } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PostTimingHeatMapProps {
  posts: PostHistory[];
}

export const PostTimingHeatMap = ({ posts }: PostTimingHeatMapProps) => {
  // Days and hours for the grid
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate post count and average performance for each day/hour slot
  const calculateHeatMapData = () => {
    const data: Record<string, { count: number; totalReach: number; avgReach: number }> = {};

    posts.forEach(post => {
      if (!post.created_at) return;
      
      const date = new Date(post.created_at);
      const day = date.getDay(); // 0-6 (Sun-Sat)
      const hour = date.getHours(); // 0-23
      const key = `${day}-${hour}`;

      if (!data[key]) {
        data[key] = { count: 0, totalReach: 0, avgReach: 0 };
      }

      data[key].count += 1;
      data[key].totalReach += post.reach || 0;
      data[key].avgReach = data[key].totalReach / data[key].count;
    });

    return data;
  };

  const heatMapData = calculateHeatMapData();

  // Find max values for normalization
  const maxCount = Math.max(...Object.values(heatMapData).map(d => d.count), 1);
  const maxReach = Math.max(...Object.values(heatMapData).map(d => d.avgReach), 1);

  // Get color intensity based on value
  const getColorIntensity = (value: number, max: number) => {
    const intensity = Math.min(value / max, 1);
    return intensity;
  };

  // Get cell background color
  const getCellStyle = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const data = heatMapData[key];

    if (!data || data.count === 0) {
      return {
        backgroundColor: 'hsl(var(--muted))',
        opacity: 0.3
      };
    }

    const countIntensity = getColorIntensity(data.count, maxCount);
    const reachIntensity = getColorIntensity(data.avgReach, maxReach);
    
    // Combine both metrics: count affects opacity, reach affects color intensity
    return {
      backgroundColor: `hsl(var(--primary))`,
      opacity: 0.2 + (countIntensity * 0.4) + (reachIntensity * 0.4)
    };
  };

  // Get tooltip content
  const getTooltipContent = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const data = heatMapData[key];

    if (!data || data.count === 0) {
      return `${days[day]} ${hour}:00 - No posts`;
    }

    return `${days[day]} ${hour}:00\n${data.count} post${data.count > 1 ? 's' : ''}\nAvg Reach: ${Math.round(data.avgReach).toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Timing Heat Map</CardTitle>
        <CardDescription>
          Post frequency and performance by day and time. Darker colors indicate better performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-16 flex-shrink-0"></div>
              <div className="flex gap-1">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="w-8 text-xs text-center text-muted-foreground"
                    style={{ flexShrink: 0 }}
                  >
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Heat map grid */}
            {days.map((day, dayIndex) => (
              <div key={day} className="flex mb-1 items-center">
                <div className="w-16 text-sm font-medium text-muted-foreground flex-shrink-0">
                  {day}
                </div>
                <div className="flex gap-1">
                  {hours.map(hour => {
                    const style = getCellStyle(dayIndex, hour);
                    const tooltip = getTooltipContent(dayIndex, hour);
                    
                    return (
                      <div
                        key={hour}
                        className="w-8 h-8 rounded border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                        style={style}
                        title={tooltip}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Less activity</span>
                <div className="flex gap-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
                    <div
                      key={opacity}
                      className="w-6 h-6 rounded border border-border"
                      style={{
                        backgroundColor: 'hsl(var(--primary))',
                        opacity
                      }}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">More activity + performance</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
