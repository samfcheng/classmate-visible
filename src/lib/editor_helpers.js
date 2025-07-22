export function parseString(input) {
  const htmlParts = [];
  const comments = [];

  // Regular expression to match the patterns
  const regex = /\[\)/g;

  // Track the starting index of unmatched text
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    const [fullMatch, text, comment, type] = match;

    // Add the unmatched text before the match
    if (match.index > lastIndex) {
      // Append unmatched text to the current <p> tag
      htmlParts.push(input.slice(lastIndex, match.index));
    }

    // Replace matched text with <mark> and collect comments
    htmlParts.push(`<mark class="${type} inline-comment">${text}</mark>`);
    comments.push({
      type: type,
      text: text,
      comment: comment.charAt(0).toUpperCase() + comment.slice(1)
    });

    // Update lastIndex to track the end of the match
    lastIndex = regex.lastIndex;
  }

  // Add the remaining unmatched text after the last match
  if (lastIndex < input.length) {
    htmlParts.push(input.slice(lastIndex));
  }

  // Combine everything into paragraphs based on line breaks
  const paragraphs = htmlParts.join('').split('\n').map(line => `<p>${line.trim()}</p>`).join('');

  return { html: paragraphs, comments };
}

export function sanitizeByOriginal(original, commented) {
  // 1) pull out every comment with its index in the commented text
  const commentRegex = /\[\s*(.*?)\s*\])/g;
  const comments = [];
  let m;
  while ((m = commentRegex.exec(commented)) !== null) {
    comments.push({
      text:   m[1].trim(),
      note:   m[2].trim(),
      kind:   m[3].trim(),
      cIndex: m.index
    });
  }

  function escRE(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  let out = '';
  let outputCursor = 0;   // where we last emitted up to in original
  let searchCursor = 0;   // where we start our next regex search

  for (const { text, note, kind, cIndex } of comments) {
    // 2) grab a bit of pre‑bracket context from the commented text
    const ctxBefore = commented.slice(Math.max(0, cIndex - 20), cIndex)
                               .replace(commentRegex, '')
                               .trim();
    // find that context in original to anchor our search
    let anchorPos = 0;
    if (ctxBefore) {
      const reCtx = new RegExp(escRE(ctxBefore));
      const cm = reCtx.exec(original);
      if (cm) {
        anchorPos = cm.index + cm[0].length;
      }
    }
    // never search before where we last matched
    searchCursor = Math.max(searchCursor, anchorPos);

    // 3) build flexible‑whitespace regex for the bracket text
    const parts = text.split(/\s+/).map(escRE).join('\\s+');
    const reText = new RegExp(parts, 'g');
    reText.lastIndex = searchCursor;
    const tm = reText.exec(original);
    if (!tm) {
      // skip if we can’t find it
      continue;
    }

    const start = tm.index;
    const matched = tm[0];
    const end = start + matched.length;

    // 4) now correctly emit everything from outputCursor→start
    out += original.slice(outputCursor, start)
        + `[${matched}]{{${note}}}(${kind})`;

    // advance both cursors
    outputCursor = end;
    searchCursor = end;
  }

  // 5) finally add any trailing text
  out += original.slice(outputCursor);
  return out;
}
