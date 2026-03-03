import React from "react";
import { renderRichMathText } from "../utils/academicTools";

export default function RichTextMath({ text, className = "", as = "div", preserveLines = true }) {
  const Component = as;

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{
        __html: renderRichMathText(text || "", { preserveLines }),
      }}
    />
  );
}
