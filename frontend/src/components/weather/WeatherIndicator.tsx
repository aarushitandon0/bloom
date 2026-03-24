// ── Weather indicator component ─────────────────────────────

import {
  Sun, Cloud, CloudRain, CloudLightning,
  Wind, CloudFog, Snowflake, Thermometer,
} from 'lucide-react';
import type { WeatherType } from '@/types/mood';
import { getWeatherLabel } from '@/lib/mood';

interface WeatherIndicatorProps {
  weather: WeatherType;
  size?: number;
  showLabel?: boolean;
}

function WeatherIcon({ weather, size = 16 }: { weather: WeatherType; size?: number }) {
  switch (weather) {
    case 'sunny':        return <Sun size={size} />;
    case 'rain':         return <CloudRain size={size} />;
    case 'thunder':      return <CloudLightning size={size} />;
    case 'windy':        return <Wind size={size} />;
    case 'foggy':        return <CloudFog size={size} />;
    case 'snowy':        return <Snowflake size={size} />;
    case 'heat_shimmer': return <Thermometer size={size} />;
    case 'overcast':     return <Cloud size={size} />;
  }
}

export function WeatherIndicator({ weather, size = 16, showLabel = false }: WeatherIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-1 text-ink/60">
      <WeatherIcon weather={weather} size={size} />
      {showLabel && (
        <span className="text-xs font-body">{getWeatherLabel(weather)}</span>
      )}
    </div>
  );
}
