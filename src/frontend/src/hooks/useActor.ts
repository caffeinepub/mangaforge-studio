import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      let actor: backendInterface;
      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        actor = await createActorWithConfig();
      } else {
        const actorOptions = {
          agentOptions: {
            identity,
          },
        };
        actor = await createActorWithConfig(actorOptions);
      }

      // Attempt access control init but NEVER let it crash actor creation
      try {
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await actor._initializeAccessControlWithSecret(adminToken);
      } catch (_e) {
        // Access control init failure is non-fatal; continue with actor
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
    retry: false,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    isError: actorQuery.isError,
  };
}
