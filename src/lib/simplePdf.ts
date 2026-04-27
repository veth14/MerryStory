function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function normalizePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(value: string, maxChars: number) {
  const words = normalizePdfText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (word.length <= maxChars) {
      currentLine = word;
      return;
    }

    for (let index = 0; index < word.length; index += maxChars) {
      lines.push(word.slice(index, index + maxChars));
    }
    currentLine = "";
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

export function buildSimplePdf(title: string, lines: string[]): Uint8Array {
  const normalizedTitle = normalizePdfText(title) || "Document Preview";
  const wrappedTitle = wrapText(normalizedTitle, 34);
  const wrappedBody = lines.flatMap((line) => wrapText(line, 72));

  const contentLines = [
    "BT",
    "/F1 10 Tf",
    "52 756 Td",
    "(MerryStory Admin Documents) Tj",
    "ET",
    "0.95 0.75 0.26 rg",
    "48 730 516 2 re",
    "f",
    "0 g",
    "BT",
    "/F1 24 Tf",
    "52 694 Td",
  ];

  wrappedTitle.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    } else {
      contentLines.push("0 -28 Td");
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    }
  });

  contentLines.push("/F1 11 Tf");
  contentLines.push("0 -34 Td");
  contentLines.push("(Generated PDF summary) Tj");

  wrappedBody.forEach((line, index) => {
    if (index === 0) {
      contentLines.push("0 -30 Td");
    } else {
      contentLines.push("0 -18 Td");
    }
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });

  contentLines.push("0 -34 Td");
  contentLines.push("/F1 10 Tf");
  contentLines.push("(This PDF is generated from database record details.) Tj");
  contentLines.push("ET");
  const content = contentLines.join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
