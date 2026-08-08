import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { taskQueryKeys } from "@/hooks/use-tasks";

export function useRefreshOnFocus() {
  const queryClient = useQueryClient();
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }

      void queryClient.refetchQueries({
        queryKey: taskQueryKeys.all,
        stale: true,
        type: "active",
      });
    }, [queryClient]),
  );
}
