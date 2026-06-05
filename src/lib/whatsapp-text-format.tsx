import { ReactNode } from "react";

export function trimUrlTrailingPunctuation(url: string) {
  let href = url;
  let trailing = "";

  while (/[.,!?;:]$/.test(href)) {
    trailing = href.slice(-1) + trailing;
    href = href.slice(0, -1);
  }

  return { href, trailing };
}

export function renderWhatsappInlineText(text: string, keyPrefix = "wa-text") {
  const nodes: ReactNode[] = [];
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const formatRegex =
    /(```([\s\S]+?)```|\*\*(\S[\s\S]*?\S|\S)\*\*|\*(\S[\s\S]*?\S|\S)\*|_(\S[\s\S]*?\S|\S)_|~(\S[\s\S]*?\S|\S)~|`([^`\n]+?)`)/g;

  const pushFormattedText = (part: string, prefix: string) => {
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    formatRegex.lastIndex = 0;

    while ((match = formatRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(part.slice(lastIndex, match.index));
      }

      const key = `${prefix}-${match.index}`;
      if (match[2]) {
        nodes.push(
          <code
            key={key}
            className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.92em] dark:bg-white/10"
          >
            {match[2]}
          </code>
        );
      } else if (match[3]) {
        nodes.push(
          <strong key={key}>
            {renderWhatsappInlineText(match[3], key)}
          </strong>
        );
      } else if (match[4]) {
        nodes.push(
          <strong key={key}>
            {renderWhatsappInlineText(match[4], key)}
          </strong>
        );
      } else if (match[5]) {
        nodes.push(<em key={key}>{renderWhatsappInlineText(match[5], key)}</em>);
      } else if (match[6]) {
        nodes.push(<s key={key}>{renderWhatsappInlineText(match[6], key)}</s>);
      } else if (match[7]) {
        nodes.push(
          <code
            key={key}
            className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.92em] dark:bg-white/10"
          >
            {match[7]}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < part.length) {
      nodes.push(part.slice(lastIndex));
    }
  };

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pushFormattedText(text.slice(lastIndex, match.index), `${keyPrefix}-t`);
    }

    const { href, trailing } = trimUrlTrailingPunctuation(match[0]);
    nodes.push(
      <a
        key={`${keyPrefix}-link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[#027eb5] underline underline-offset-2 hover:text-[#006b9b] dark:text-[#60a5fa] dark:hover:text-[#93c5fd]"
      >
        {href}
      </a>
    );
    if (trailing) nodes.push(trailing);

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    pushFormattedText(text.slice(lastIndex), `${keyPrefix}-t-end`);
  }

  return nodes;
}

export function WhatsappFormattedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <p className={className}>{renderWhatsappInlineText(text)}</p>;
}
