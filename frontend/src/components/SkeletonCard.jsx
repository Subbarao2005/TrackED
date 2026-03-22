import React from 'react';

// Generic shimmer skeleton card for stat boxes
export function SkeletonStatCard() {
  return (
    <div className="bg-[#0A0F1C] border border-slate-800/80 p-6 rounded-3xl shadow-lg overflow-hidden relative">
      <div className="shimmer h-10 w-10 rounded-2xl mb-4" />
      <div className="shimmer h-3 w-24 rounded mb-3" />
      <div className="shimmer h-8 w-16 rounded" />
    </div>
  );
}

// Skeleton for table rows
export function SkeletonTableRow({ cols = 4 }) {
  return (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-2">
          <div className="shimmer h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}
