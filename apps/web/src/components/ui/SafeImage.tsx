"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Image, { ImageProps } from "next/image";

interface Props extends ImageProps {
  fallbackSrc?: string;
}

interface State {
  hasError: boolean;
}

/**
 * SafeImage provides an Error Boundary around next/image.
 * This prevents the entire application from crashing if an external 
 * image domain is not configured in next.config.ts.
 */
class SafeImageErrorBoundary extends Component<{ children: ReactNode; fallbackSrc?: string }, State> {
  constructor(props: { children: ReactNode; fallbackSrc?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.warn("SafeImage Error detected:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SafeImage Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to a standard img tag if next/image fails (likely a config error)
      const { children } = this.props;
      const child = React.Children.only(children) as React.ReactElement<ImageProps>;
      
      return (
        <img
          src={typeof child.props.src === 'string' ? child.props.src : ''}
          alt={child.props.alt || ""}
          className={child.props.className}
          style={child.props.style}
          width={child.props.width}
          height={child.props.height}
          loading="lazy"
        />
      );
    }

    return this.props.children;
  }
}

export function SafeImage({ fallbackSrc, ...props }: Props) {
  return (
    <SafeImageErrorBoundary fallbackSrc={fallbackSrc}>
      <Image {...props} alt={props.alt ?? ""} />
    </SafeImageErrorBoundary>
  );
}
