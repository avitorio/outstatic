import { Button } from '@/components/ui/shadcn/button'
import { cn } from '@/utils/ui'
import { SigmaIcon } from "lucide-react";
import { useEditor } from '@/components/editor/editor-context'
import { useState } from 'react';

export const MathSelector = () => {
  const { editor } = useEditor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latexInput, setLatexInput] = useState('');

  if (!editor) return null;

  const handleClick = (evt) => {
    if (editor.isActive("math")) {
      // If we're on a math node, unset it
      editor.chain().focus().unsetLatex().run();
    } else {
      // Get selection text
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      // Check if selection is already valid LaTeX
      const isLatex = selectedText && (
        // Simple check - you might want more sophisticated validation
        selectedText.includes('=') || 
        selectedText.includes('\\') ||
        selectedText.includes('_') ||
        selectedText.includes('^')
      );
      
      if (isLatex) {
        // If selection looks like LaTeX, directly convert it
        editor.chain().focus().setLatex({ latex: selectedText }).run();
      } else if (selectedText) {
        // If there's a selection but it doesn't look like LaTeX, initialize modal with it
        setLatexInput(selectedText);
        setIsModalOpen(true);
      } else {
        // If no selection, just open an empty modal
        setLatexInput('');
        setIsModalOpen(true);
      }
    }
  };

  const handleLatexSubmit = () => {
    if (latexInput) {
      editor.chain().focus().setLatex({ latex: latexInput }).run();
    }
    setIsModalOpen(false);
  };

  return (
    <>
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
      
      {/* Simple modal for LaTeX input - you'd probably want to use your UI library's modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Enter LaTeX</h3>
            <input
              type="text"
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              className="border p-2 w-full mb-2"
              placeholder="e.g., E = mc^2"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLatexSubmit}>
                Insert
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};