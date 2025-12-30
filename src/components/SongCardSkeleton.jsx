import React from "react";

export default function SongCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      {/* Image */}
      <div className="aspect-square bg-gray-700" />

      {/* Text */}
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="h-8 bg-gray-700 rounded mt-3" />
      </div>
    </div>
  );
}
