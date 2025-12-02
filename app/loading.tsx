import React from "react";
import Skeleton from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gray-900 text-white overflow-hidden relative">
      {/* Left Sidebar Skeleton */}
      <div className="hidden lg:block w-64 bg-gray-800 border-r border-gray-700 p-2 space-y-3">
        {/* Tabs Skeleton */}
        <div className="flex border-b border-gray-700 mb-2">
          <Skeleton className="flex-1 h-10 mr-1" />
          <Skeleton className="flex-1 h-10 ml-1" />
        </div>
        {/* List Items Skeleton */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-700/20 flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col relative bg-black h-1/2 lg:h-full items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-pulse text-gray-600 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p>Loading Workspace...</p>
             </div>
        </div>
        
        {/* Info Overlay Skeleton */}
        <div className="absolute top-4 left-4">
             <Skeleton className="h-8 w-64 rounded-full" />
        </div>

        {/* Thumbnails Skeleton */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 p-2">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-md" />
            ))}
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className="w-full lg:w-80 bg-gray-800 border-l border-gray-700 h-1/2 lg:h-full p-4 space-y-6">
         <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                </div>
            ))}
         </div>
         
         <div className="pt-4 border-t border-gray-700">
             <Skeleton className="h-10 w-full rounded" />
         </div>
      </div>
    </div>
  );
}
