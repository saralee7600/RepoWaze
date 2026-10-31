import * as ts from 'typescript';

export interface DecoratorInfo {
  name: string;
  args: readonly ts.Expression[];
}

function readName(expression: ts.Expression): string | null {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

export function getDecorators(node: ts.Node): DecoratorInfo[] {
  if (!ts.canHaveDecorators(node)) return [];

  const result: DecoratorInfo[] = [];
  for (const decorator of ts.getDecorators(node) ?? []) {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression)) {
      const name = readName(expression.expression);
      if (name) result.push({ name, args: expression.arguments });
    } else {
      const name = readName(expression);
      if (name) result.push({ name, args: [] });
    }
  }
  return result;
}

function unwrapParentheses(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

export function readString(
  expression: ts.Expression | undefined,
): string | null {
  return expression && ts.isStringLiteralLike(expression)
    ? expression.text
    : null;
}

export function readBoolean(
  expression: ts.Expression | undefined,
): boolean | undefined {
  if (expression?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

export function findOptionsObject(
  args: readonly ts.Expression[],
): ts.ObjectLiteralExpression | undefined {
  return args.find((arg): arg is ts.ObjectLiteralExpression =>
    ts.isObjectLiteralExpression(arg),
  );
}

export function getOption(
  options: ts.ObjectLiteralExpression | undefined,
  key: string,
): ts.Expression | undefined {
  if (!options) return undefined;
  for (const property of options.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === key
    ) {
      return property.initializer;
    }
  }
  return undefined;
}

export function readTypeExpression(
  expression: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): string | null {
  if (!expression) return null;
  return readString(expression) ?? expression.getText(sourceFile);
}

function findReturnedExpression(block: ts.Block): ts.Expression | undefined {
  for (const statement of block.statements) {
    if (ts.isReturnStatement(statement) && statement.expression) {
      return statement.expression;
    }
  }
  return undefined;
}

function readFunctionBody(expression: ts.Expression): ts.Expression | null {
  if (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression)) {
    return null;
  }
  const body = ts.isBlock(expression.body)
    ? findReturnedExpression(expression.body)
    : expression.body;
  return body ? unwrapParentheses(body) : null;
}

export function readRelationTarget(
  argument: ts.Expression | undefined,
): string | null {
  if (!argument) return null;
  const literal = readString(argument);
  if (literal) return literal;

  const body = readFunctionBody(argument);
  return body ? readName(body) : null;
}

export function readInverseProperty(
  argument: ts.Expression | undefined,
): string | null {
  if (!argument) return null;
  const literal = readString(argument);
  if (literal) return literal;

  const body = readFunctionBody(argument);
  return body && ts.isPropertyAccessExpression(body) ? body.name.text : null;
}

export function unwrapEntityTypeName(typeText: string | null): string | null {
  if (!typeText) return null;

  let current = typeText
    .replace(/\s*\|\s*(null|undefined)\b/g, '')
    .replace(/\b(null|undefined)\s*\|\s*/g, '')
    .trim();
  let previous: string;
  do {
    previous = current;
    current = current
      .replace(/^(?:Relation|Promise|Array|ReadonlyArray)<(.+)>$/, '$1')
      .replace(/\[\]$/, '')
      .trim();
  } while (current !== previous);

  return /^[A-Za-z_$][\w$]*$/.test(current) ? current : null;
}

export function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}
