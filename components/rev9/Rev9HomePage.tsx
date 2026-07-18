import { readFileSync } from "node:fs";
import path from "node:path";
import Script from "next/script";

type Rev9Source = {
  body: string;
  script: string;
  styles: string;
};

function between(source: string, start: string, end: string, label: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Rev 9 source is missing its ${label} section.`);
  }

  return source.slice(startIndex + start.length, endIndex).trim();
}

function readRev9Source(): Rev9Source {
  const sourcePath = path.join(
    process.cwd(),
    "public",
    "rev9-claude-source.html",
  );
  const source = readFileSync(sourcePath, "utf8");

  return {
    styles: between(source, "<style>", "</style>", "style"),
    body: between(source, "<body>", "<script>", "body"),
    script: between(source, "<script>", "</script>", "script"),
  };
}

export function Rev9HomePage() {
  const source = readRev9Source();

  return (
    <>
      {/* This is the reviewed, local Rev 9 artifact rendered as the real page DOM. */}
      <style dangerouslySetInnerHTML={{ __html: source.styles }} />
      <style>{"html { background: transparent; }"}</style>
      <div
        className="rev9-page contents"
        dangerouslySetInnerHTML={{ __html: source.body }}
      />
      <Script
        id="rev9-home-behavior"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: source.script }}
      />
    </>
  );
}
