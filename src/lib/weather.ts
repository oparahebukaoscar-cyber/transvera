export async function fetchWeatherAlertForCoords(lat: number, lon: number) {
  const key = process.env.NEXT_PUBLIC_OPENWEATHERMAP_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Simple rule-based alert: heavy rain/snow or strong wind
    const weather = (data.weather && data.weather[0] && data.weather[0].main) || null;
    const wind = data.wind?.speed || 0;
    const rain = data.rain?.["1h"] || data.rain?.["3h"] || 0;
    const snow = data.snow?.["1h"] || data.snow?.["3h"] || 0;

    if (rain > 5) return `Heavy rain reported (${rain} mm/h) — expect delays`;
    if (snow > 1) return `Snow accumulation (${snow} mm) — expect delays`;
    if (wind > 12) return `High winds (${Math.round(wind)} m/s) — expect delays`;
    if (weather && (weather.toLowerCase().includes("thunder") || weather.toLowerCase().includes("storm"))) {
      return `Severe weather: ${weather} — expect delays`;
    }

    return null;
  } catch (e) {
    return null;
  }
}
