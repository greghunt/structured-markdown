# Structured Markdown

A parser that semantically structures Markdown into a hierarchical tree of markdown element nodes.

## Why?

Markdown is a great way of expressing texts semantically. HTML is hierarchical but complex and, more often than not, used presentationally not semantically. Markdown provides a simple way of expressing the semantics of a text. However, the semantics are only implicit. It's implied that an H1 is the topic of all text that follows, similarly for lower-order elements like H2s, etc. 

This parser creates a hierarchical tree that makes this implied semantic hierarchy explicit in its tree structure. This makes it easy to semantically navigate markdown texts.

## Missing Element

We've introduced a "Sentence" level markdown element, not present in HTML or MD. A sentence is a discreet and very important semantic unit, since it composes all other larger order semantic elements. A paragraph is a collection of sentences, a heading is a collection of paragraphs, etc.

## Incremental Parsing

The parser is designed to be incrementally applied to a markdown text. It can be used to parse a markdown text from the beginning, or continue parsing from a given position. This is important if we want to make the structure "stateful" and not lose the state of any unmodified nodes. This is useful if we want to persist the nodes and they contain a reference ID.