import { useState, useEffect } from "react";

export function useTracking(id: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setData({
        id,
        status: "In Transit",
        origin: "San Francisco, CA",
        destination: "New York, NY",
        eta: "2 Days",
      });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  return { data, loading };
}

export default useTracking;
