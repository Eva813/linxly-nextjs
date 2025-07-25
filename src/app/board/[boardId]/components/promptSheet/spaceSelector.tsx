/**
 * Space 選擇器組件
 * 獨立的下拉選擇器，用於切換不同的 Prompt Space
 */
import React from 'react'
import { Building2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select'
import { PromptSpace, SharedSpace } from '@/stores/promptSpace'

interface SpaceSelectorProps {
  selectedSpaceId: string
  ownedSpaces: PromptSpace[]
  sharedSpaces: SharedSpace[]
  onSpaceChange: (spaceId: string) => void
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  selectedSpaceId,
  ownedSpaces,
  sharedSpaces,
  onSpaceChange,
}) => {
  // 確保 selectedSpaceId 有值，如果沒有則使用第一個可用的 space
  const allSpaces = [...ownedSpaces, ...sharedSpaces.map(s => s.space)]
  const currentSpaceId = selectedSpaceId || (allSpaces.length > 0 ? allSpaces[0].id : '')
  
  // 找到當前選中的 space
  const currentSpace = allSpaces.find(space => space.id === currentSpaceId)
  
  return (
    <div className="mt-4 mb-3">
      <Select 
        key={`${currentSpaceId}-${currentSpace?.name}`} 
        value={currentSpaceId} 
        onValueChange={onSpaceChange}
      >
        <SelectTrigger className="w-full">
          {currentSpace ? (
            <div key={currentSpace.id} className="flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              <span>{currentSpace.name} {currentSpace.id}</span>
              {currentSpace.defaultSpace && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">
                  default
                </span>
              )}
            </div>
          ) : (
            <SelectValue placeholder="Select a space" />
          )}
        </SelectTrigger>
        <SelectContent>
          {/* My Workspaces */}
          {ownedSpaces.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                My Workspaces
              </SelectLabel>
              {ownedSpaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  <div className="flex items-center w-full">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="flex-1">{space.name}</span>
                    {space.defaultSpace && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">
                        default
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {/* Shared with Me */}
          {sharedSpaces.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                Shared with Me
              </SelectLabel>
              {sharedSpaces.map((shared) => (
                <SelectItem key={shared.space.id} value={shared.space.id}>
                  <div className="flex items-center w-full">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="flex-1">{shared.space.name}</span>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-1 py-0.5 rounded ml-2">
                      {shared.permission}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

SpaceSelector.displayName = 'SpaceSelector'