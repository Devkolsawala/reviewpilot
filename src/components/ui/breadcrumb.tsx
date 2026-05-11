"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav">
>(({ className, ...props }, ref) => (
  <nav ref={ref} aria-label="Breadcrumb" className={cn(className)} {...props} />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn("flex flex-wrap items-center gap-1.5 text-xs", className)}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

function BreadcrumbLink({
  className,
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-current="page"
    className={cn("text-foreground font-medium truncate", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

function BreadcrumbSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden
      className={cn("text-muted-foreground/50 flex items-center", className)}
      {...props}
    >
      <ChevronRight className="h-3 w-3" />
    </li>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
