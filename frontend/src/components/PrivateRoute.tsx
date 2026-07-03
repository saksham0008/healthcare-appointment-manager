import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps extends RouteProps {
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles, children, ...rest }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Route
      {...rest}
      render={() => {
        if (!isAuthenticated) return <Redirect to="/login" />;
        if (roles && user && !roles.includes(user.role)) return <Redirect to="/" />;
        return <>{children}</>;
      }}
    />
  );
};

export default PrivateRoute;
