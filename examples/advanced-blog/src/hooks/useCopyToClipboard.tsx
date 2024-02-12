import { useState } from "react";

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>; // Return success

/** @see https://usehooks-ts.com/react-hook/use-copy-to-clipboard */
export default function useCopyToClipboard(): [CopyFn, CopiedValue] {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const copy: CopyFn = async (text) => {
    if (!navigator?.clipboard) {
      // eslint-disable-next-line no-console
      console.warn("Clipboard not supported");
      return false;
    }

    // Try to save to clipboard then save it in the state if worked
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  };

  return [copy, copiedText];
}
