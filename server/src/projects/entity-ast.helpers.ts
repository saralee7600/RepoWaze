import * as ts from 'typescript';

/** A decorator reduced to its name and call arguments, e.g. `@Column('int', {...})`. */
export interface DecoratorInfo {
  name: string;
  args: readonly ts.Expression[];
}

/** Returns the identifier of `Foo` or `typeorm.Foo`, otherwise null. */
function readName(expression: ts.Expression): string | null {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

/** Lists the decorators on a node (class or property) as `{ name, args }`. */
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

/** Strips any surrounding parentheses, e.g. `(() => X)`. */
function unwrapParentheses(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

/** Reads `'text'` or `` `text` `` (without substitutions). */
export function readString(expression: ts.Expression | undefined): string | null {
  return expression && ts.isStringLiteralLike(expression) ? expression.text : null;
}

/** Reads `true` / `false`; returns undefined for anything else. */
export function readBoolean(expression: ts.Expression | undefined): boolean | undefined {
  if (expression?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

/** Finds the first object-literal argument (the TypeORM options object). */
export function findOptionsObject(
  args: readonly ts.Expression[],
): ts.ObjectLiteralExpression | undefined {
  return args.find((arg): arg is ts.ObjectLiteralExpression =>
    ts.isObjectLiteralExpression(arg),
  );
}

/** Reads `{ key: <expression> }` from an object literal. */
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

/** Renders a column `type` expression: `'varchar'`, `String`, `ColumnType.JSON`, ... */
export function readTypeExpression(
  expression: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): string | null {
  if (!expression) return null;
  return readString(expression) ?? expression.getText(sourceFile);
}

/** Finds the first `return <expr>` of a block-bodied arrow function. */
function findReturnedExpression(block: ts.Block): ts.Expression | undefined {
  for (const statement of block.statements) {
    if (ts.isReturnStatement(statement) && statement.expression) {
      return statement.expression;
    }
  }
  return undefined;
}

/** Reads the body of a `() => expr` / `function () { return expr; }` argument. */
function readFunctionBody(expression: ts.Expression): ts.Expression | null {
  if (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression)) {
    return null;
  }
  const body = ts.isBlock(expression.body)
    ? findReturnedExpression(expression.body)
    : expression.body;
  return body ? unwrapParentheses(body) : null;
}

/** Reads the target of `@OneToMany(() => Target, ...)` or `@OneToMany('Target', ...)`. */
export function readRelationTarget(argument: ts.Expression | undefined): string | null {
  if (!argument) return null;
  const literal = readString(argument);
  if (literal) return literal;

  const body = readFunctionBody(argument);
  return body ? readName(body) : null;
}

/** Reads the inverse side of `(target) => target.property` or `'property'`. */
export function readInverseProperty(argument: ts.Expression | undefined): string | null {
  if (!argument) return null;
  const literal = readString(argument);
  if (literal) return literal;

  const body = readFunctionBody(argument);
  return body && ts.isPropertyAccessExpression(body) ? body.name.text : null;
}

/**
 * Reduces a property type annotation to the entity class name it refers to:
 * `Relation<User[]>`, `Promise<User>`, `User | null` and `User[]` all give `User`.
 */
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

/** Mirrors TypeORM's default naming strategy: `UserProfile` -> `user_profile`. */
export function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}
