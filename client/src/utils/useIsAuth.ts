import { useEffect } from "react";
import { useRouter } from "next/router";
import { useCreatePostMutation, useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
      const router = useRouter();
      const [{ data, fetching }] = useMeQuery();

      // Redirect the user if not logged in
      useEffect(() => {
          if (!fetching && !data?.me) {
              router.replace("/login?next=" + router.pathname);
          }
      }, [fetching, data]);
}