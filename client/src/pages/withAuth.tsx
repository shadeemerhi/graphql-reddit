import Router from "next/router";
import React from "react";
import { useMeQuery } from "../generated/graphql";

interface PrivateRouteProps {
    component: any;
}

const withAuth: React.FC<PrivateRouteProps> = ({
    component: Component,
}) => {
    const [{ fetching, data }] = useMeQuery();

    if (!fetching && !data?.me) {
        Router.replace("/login");
    }

    return <Component />;
};
export default withAuth;
