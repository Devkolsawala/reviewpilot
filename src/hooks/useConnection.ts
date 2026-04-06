"use client";
import { useState, useEffect, useCallback } from "react";
import type { Connection } from "@/types/connection";
import { createClient } from "@/lib/supabase/client";

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      setConnections([]);
    } else {
      setConnections(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return { connections, loading, refetch: fetchConnections };
}
