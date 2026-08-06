import React from "react";
import { Tablet } from "lucide-react";

export function BrandHeader() {
  return (
    <div className="flex items-center gap-3.5 mb-7">
      <div className="w-11 h-11 bg-gradient-to-tr from-[#4F46E5] to-[#6D5DFE] rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
        <Tablet className="w-5 h-5 stroke-[2.2]" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight leading-none">
          <span className="text-[#1F2937]">Tab</span>
          <span className="text-[#4F46E5]">Monitor</span>
        </h1>
      </div>
    </div>
  );
}
