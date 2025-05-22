

import { FaEdit, FaEye } from "react-icons/fa";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type Mode = "edit" | "preview";

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function EditPreviewButtons({ mode, onModeChange }: Props) {
  return (
    <div className="flex pr-4 justify-end">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => onModeChange(v as Mode)}
        className="inline-flex gap-0 rounded-md divide-x border border-gray-300 h-12 dark:border-light"
      >
        <ToggleGroupItem
          value="edit"
          className="flex items-center gap-1 px-3 py-2 h-full rounded  font-bold rounded-r-none data-[state=on]:bg-light data-[state=on]:text-primary data-[state=on]:dark:text-third data-[state=off]:bg-white data-[state=off]:text-gray-600 data-[state=off]:dark:bg-background data-[state=off]:dark:text-third"
          aria-label="Edit"
        >
          <FaEdit className="text-base" />
          Edit
        </ToggleGroupItem>

        <ToggleGroupItem
          value="preview"
          className="flex items-center gap-1 px-3 py-2  h-full rounded  rounded-l-none font-bold data-[state=on]:bg-light data-[state=on]:text-primary data-[state=on]:dark:text-third data-[state=off]:bg-white data-[state=off]:text-gray-600 data-[state=off]:dark:bg-background data-[state=off]:dark:text-third"
          aria-label="Preview"
        >
          <FaEye className="text-base" />
          Preview
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

