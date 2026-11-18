import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: true,
});

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      className={`md ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: md.render(text) }}
    />
  );
}
