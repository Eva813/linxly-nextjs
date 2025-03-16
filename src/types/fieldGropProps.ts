import { EditInfo } from '@/types/snippets'

export interface FieldGroupProps {
  editInfo: EditInfo;
  onChange: (updates: { [key: string]: string | string[] | boolean }) => void;
}