"use client"

import * as React from "react"
// import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

interface IconTitleDescriptionProps {
  icon?: React.ReactNode
  title: string
  description: string
  pro?: boolean,
  onClick?: React.MouseEventHandler<HTMLDivElement>
}


export function FormField({
  icon,
  title,
  description,
  pro = true,
  onClick
}: IconTitleDescriptionProps) {
  return (
    <div onClick={onClick} className="flex gap-3 py-2 px-4 cursor-pointer hover:bg-light transition-colors">
      {/* 左側 Icon */}
      <div className="flex flex-col justify-center text-gray-600 ">
        {icon}
      </div>

      {/* 右側標題 + 說明文字 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium">{title}</h2>
          {pro && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Lock size={14} />
              PRO
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
