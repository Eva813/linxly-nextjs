import { EditInfo } from '@/types/prompt'

export interface FieldGroupProps {
  editInfo: EditInfo;
  onChange: (updates: { [key: string]: string | string[] | boolean | null }) => void;
}