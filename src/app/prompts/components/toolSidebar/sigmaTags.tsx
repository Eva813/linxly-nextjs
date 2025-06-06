// components/SigmaTags.tsx
"use client";

import React from "react";

interface IconTitleDescriptionProps {
  icon?: React.ReactNode
}

export default function SigmaTags({
  icon
}: IconTitleDescriptionProps) {
  return (
    <div className="flex items-center space-x-2 bg-white p-4">
      {/* Σ icon on the left */}
      <div className="flex flex-col justify-center text-gray-600">
        {icon}
      </div>

      {/* Pill tags on the right */}
      <div className="flex items-center space-x-2">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
          you &middot;&middot;&middot;
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
          langopt &middot;&middot;&middot;
        </span>
      </div>
    </div>
  );
}
