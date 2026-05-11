import { forwardRef, useCallback } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { prefetchRoute } from "@/lib/route-prefetch";

/**
 * Drop-in replacement for react-router's <Link> that prefetches the
 * destination route's code chunk on hover/focus/touchstart so the
 * navigation feels instant and the route transition can play without
 * a loading flash.
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onMouseEnter, onFocus, onTouchStart, ...rest }, ref) => {
    const href = typeof to === "string" ? to : to.pathname || "";
    const trigger = useCallback(() => prefetchRoute(href), [href]);

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={(e) => {
          trigger();
          onMouseEnter?.(e);
        }}
        onFocus={(e) => {
          trigger();
          onFocus?.(e);
        }}
        onTouchStart={(e) => {
          trigger();
          onTouchStart?.(e);
        }}
        {...rest}
      />
    );
  }
);
PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;