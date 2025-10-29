import React, { ReactNode } from 'react';

interface SearchLayoutProps {
  sidebar: ReactNode;
  results: ReactNode;
}

export function SearchLayout({ sidebar, results }: SearchLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full bg-neutral-50">
      {/* Sidebar - Desktop: Fixed width, Tablet/Mobile: Hidden (will use drawer) */}
      <aside className="hidden lg:block w-80 bg-background border-r border-border sticky top-0 h-screen overflow-y-auto">
        {sidebar}
      </aside>

      {/* Main content area */}
      <main className="flex-1 w-full">
        {results}
      </main>
    </div>
  );
}
