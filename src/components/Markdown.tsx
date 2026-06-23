import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renderiza markdown no estilo do blog/docs do Postou (dark, Plus Jakarta).
// Server component — sem "use client" (react-markdown roda no RSC).
export default function Markdown({ content }: { content: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.015em", marginTop: 16, marginBottom: 0, color: "#fff" }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 8, marginBottom: 0, color: "#fff" }}>{children}</h3>
          ),
          p: ({ children }) => <p style={{ color: "#bbb", fontSize: 17, margin: 0 }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ color: "#bbb", fontSize: 17, paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ color: "#bbb", fontSize: 17, paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ lineHeight: 1.55 }}>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} style={{ color: "#6e8df0", fontWeight: 600, textDecoration: "none" }}>{children}</a>
          ),
          strong: ({ children }) => <strong style={{ color: "#fff", fontWeight: 700 }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: "#ddd" }}>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "3px solid #4169E1", paddingLeft: 20, color: "#ddd", fontSize: 19, fontStyle: "italic", fontWeight: 500, margin: "8px 0" }}>{children}</blockquote>
          ),
          code: ({ children }) => (
            <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6, fontSize: 15, fontFamily: "ui-monospace, monospace" }}>{children}</code>
          ),
          hr: () => <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
