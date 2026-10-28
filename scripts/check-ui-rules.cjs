/* Project-only guard: reject literal UI copy and palette values in UI source. */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = ['src/components', 'src/screens', 'src/layouts', 'src/navigations'];
const attributes = new Set([
  'title', 'label', 'placeholder', 'accessibilityLabel', 'accessibilityHint',
  'headerTitle', 'message', 'description', 'hint', 'emptyText', 'loadingText',
]);
const color = /^(#[\da-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|white|black|red|green|blue|gray|grey|yellow|orange|purple|transparent)$/i;
const failures = [];

function inspect(file) {
  const source = ts.createSourceFile(
    file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  function report(node, message) {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    failures.push(`${file}:${line + 1} ${message}`);
  }
  function visit(node) {
    if (ts.isJsxText(node) && /[\p{L}\p{N}]/u.test(node.text)) {
      report(node, 'User-facing text needs a translation key.');
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (color.test(node.text)) {
        // A property name is a token reference, not a rendered color value.
        const parent = node.parent;
        if (!(ts.isPropertyAssignment(parent) && parent.name === node)) {
          report(node, 'Use a centralized theme token for colors.');
        }
      }
      const parent = node.parent;
      if (ts.isJsxAttribute(parent) && attributes.has(parent.name.getText(source))
          && /[\p{L}\p{N}]/u.test(node.text)) {
        report(node, 'User-facing prop needs a translation key.');
      }
      if (ts.isJsxExpression(parent) && ts.isJsxElement(parent.parent)
          && /[\p{L}\p{N}]/u.test(node.text)) {
        report(node, 'Rendered string needs a translation key.');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(file);
    } else if (/\.tsx?$/.test(file)) {
      inspect(file);
    }
  }
}

roots.forEach(walk);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('UI theme/translation rules passed.');
}
