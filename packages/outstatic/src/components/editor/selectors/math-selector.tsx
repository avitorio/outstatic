import { Button } from '@/components/ui/shadcn/button'
import { cn } from '@/utils/ui'
import { SigmaIcon } from "lucide-react";
import { useEditor } from '@/components/editor/editor-context'

export const MathSelector = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  const handleClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (editor.isActive("math")) {
      // If we're on a math node, unset it
      editor.chain().focus().unsetLatex().run();
    } else {
      // Get selection text
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      // Insert the selected text as LaTeX or create an empty math node
      editor.chain().focus().setLatex({ latex: selectedText || '' }).run();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-none w-12"
      onClick={handleClick}
    >
      <SigmaIcon
        className={cn("size-4", { "text-blue-500": editor.isActive("math") })}
        strokeWidth={2.3}
      />
    </Button>
  );
};