# TriggerScript Documentation

TriggerScript is heavily inspired from JavaScript and likewise it is very simple to learn!

## Primitive Values

**NULL:** `null`<br>
**BOOLEAN:** `true | false`<br>
**NUMBER:** `1 | -1 | 3.141`<br>
**STRING:** `'triggerscript'`

## Operators

**Binary Operators:** `+ - / *`<br>
**Comparison Operators:** `< > <= >=`<br>
**Logical Operators:** `AND(&&) OR(||) NOT(!)`<br>
**Equality Operators:** `strict(==) strict(!=)`<br>
**Assignment Operators:** `=`<br>

## Strings

Strings are *strictly* created using the single-quote symbol('). For example:

```js
chatBroadcast('Hello') // Hello
chatBroadcast("Hello") // Error: Unrecognized token '"'
```

## Creating Variables

To create a variable, you'll need to use the `var` keyword. It is strict with semi-colon so make sure to add it after the expression.

Despite it being function-scoped in JavaScript, in TriggerScript it is block-scoped meaning:

```js
if (true) {
  var x = 10;
} else {
  chatBroadcast(x) // Error: Unresolved variable 'x'
}
```

### If-Statements

Creating if-statements in TriggerScript is very similar to JavaScript. The syntax follows as:

```js
if (condition) {
  'If Expression'
} else {
  'Else Expression'
}
```

Although there is no built-in `else if` keyword, you can easily recreate it like so:

```js
if (condition) {
  'If Expression'
} else {
  if (condition) {
    'Else If Expression'
  } else {
    'Else Expression'
  }
}
```

## Creating Functions

Creating functions in TriggerScript is also quite similar to JavaScript—however, instead of `function` as a keyword, TriggerScript uses `func`. For example:

```go
func add(a, b) {
  back a + b;
}

chatBroadcast(add(1, 1)) // 2
```

If you noticed, the code used `back` as a statement there. It is equivalent to `return` keyword in JavaScript.

Like variable declaration, the `back` keyword is also strict at adding semi-colon after the expression.

## Native Functions

> The amount of functions in this list is not final!

```ts
len(str: string): number
```
- Returns the length of a given string.
```ts
chatBroadcast(message: string): string
```
- Broadcasts a message throughout the world.
```ts
bounce(horizStrength: number, vertStrength: number): void
```
- Launches the player based on both horizontal and vertical strength.

### Example:
```js
var str = 'dispatch';
if (len(str) == 8) {
  chatBroadcast('BEST GAME EVER!')
} else {
  bounce(10, 10)
}
```

## Questions

- Is this the final product?
  - "No, it isn't. I released this add-on in it's very early stages and will be updated as time goes on."