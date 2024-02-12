import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { ComponentPropsWithRef, useRef, useState } from "react";

export const Pre = (props: ComponentPropsWithRef<"pre">) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copy] = useCopyToClipboard();
  return (
    <div className="p-0 relative">
      <div className="flex absolute top-2 right-4 rounded-md border border-gray-600">
        <button
          onClick={() => {
            copy(preRef?.current?.textContent ?? "").then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 1500);
            });
          }}
          title="Copy code"
          className={clsx([
            "hidden rounded px-1 transition-colors md:flex items-center gap-1 text-sm",
            "border border-gray-300 dark:border-gray-600",
            "text-gray-700",
            "bg-gray-50 hover:bg-gray-300",
          ])}
        >
          {isCopied ? (
            <>
              <Check size={14} /> done
            </>
          ) : (
            <>
              <Copy size={14} /> copy
            </>
          )}
        </button>
      </div>
      <pre {...props} ref={preRef}>
        {props.children}
      </pre>
    </div>
  );
};

export function CustomCode(props: ComponentPropsWithRef<"code">) {
  const language = props.className?.includes("language")
    ? props.className.replace("language-", "").replace(" code-highlight", "")
    : null;

  return (
    <code {...props} data-code-type={language && "code-block"}>
      {language ? (
        <div className="overflow-x-auto pt-4">{props.children}</div>
      ) : (
        <span>{props.children}</span>
      )}
      {language ? (
        <div className="absolute top-0 left-4 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
          <span className="select-none bg-gradient-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white">
            {language}
          </span>
        </div>
      ) : null}
    </code>
  );
}
