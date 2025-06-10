import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { CalcChip } from './calcChip';
import { MdOutlineNewLabel } from "react-icons/md";

const FormCalcView: React.FC<NodeViewProps> = ({ node }) => {
  // 將 attrs 轉型以取出 promptData
  const { promptData } = node.attrs as { promptData: { name: string , default: string } };
  console.log('FormCalcView promptData:', node);

  // const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newValue = event.target.value;
  //   console.log(`Updated value for ${promptData.name}:`, newValue);
  //   // Add logic to update the value in the parent context or store
  // };

  return (
    <NodeViewWrapper 
      as="span"
      className="text-sm"
      data-type="calc"
      role="button"
      contentEditable={false}
      // onClick={handleClick}
      data-prompt={JSON.stringify(node.attrs.promptData)}
      >
      <CalcChip
        data={{ name: promptData.name }}
        icon={<MdOutlineNewLabel className="text-gray-500" />}
        borderColor="border-[#FF9A9A]" 
      />
    </NodeViewWrapper>
  );
};

export default FormCalcView;
