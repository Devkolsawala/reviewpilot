import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeIlike, buildIlikePattern } from "../lib/search/sanitize";

test("search: escapeIlike escapes % _ and backslash", () => {
  assert.equal(escapeIlike("%_%"), "\\%\\_\\%");
  assert.equal(escapeIlike("50% off_now"), "50\\% off\\_now");
  assert.equal(escapeIlike("a\\b"), "a\\\\b");
  assert.equal(escapeIlike("plain text"), "plain text");
});

test("search: buildIlikePattern wraps escaped query in wildcards", () => {
  assert.equal(buildIlikePattern("great app"), "%great app%");
  // Adversarial input from the spec — wildcards must be literal.
  assert.equal(buildIlikePattern("%_%"), "%\\%\\_\\%%");
});

test("search: buildIlikePattern enforces 2-char minimum after trimming", () => {
  assert.equal(buildIlikePattern(""), null);
  assert.equal(buildIlikePattern(" a "), null);
  assert.equal(buildIlikePattern("ab"), "%ab%");
  // Stripped-to-nothing inputs don't sneak past the minimum.
  assert.equal(buildIlikePattern("(,)"), null);
});

test("search: buildIlikePattern strips PostgREST filter delimiters", () => {
  // Commas/parens would break out of the .or() filter expression.
  assert.equal(buildIlikePattern("crash,refund"), "%crash refund%");
  assert.equal(buildIlikePattern("a(b)c"), "%a b c%");
});
