# Structured Markdown

A parser that creates semantically structures Markdown into a hierarchical tree of markdown nodes.

## Why?

Markdown is a great way of expressing texts semantically. HTML is hierarchical but complex and, more often than not, used presentationally not semantically. Markdown provides a simple way of expressing the semantics of a text. However, the semantics are only implicit. It's implied that an H1 is the topic of all text that follows, similarly for lower-order elements like H2s, etc. 

This parser creates a hierarchical tree that makes this implied semantic hierarchy explicit in its tree structure. This makes it easy to semantically navigate markdown texts.

## Missing Element

We've introduced a "Sentence" level markdown element, not present in HTML or MD. A sentence is a discreet and very important semantic unit, since it composes all other larger order semantic elements. A paragraph is a collection of sentences, a heading is a collection of paragraphs, etc.