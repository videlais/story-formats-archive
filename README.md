# Archive of Twine Story Formats

This is an archive of story formats for Twine beginning with 2015 (Twine 1.4.2) through the present.

## Organization

Files are split between `twine1` and `twine2` directories with the version of the story format included in the folder name (e.g. `harlowe-3.3.0`).

For Twine 1 story formats, the version of Twine (e.g. `1.4.2`) is used unless explicitly mentioned by the build or author.

## Twine 2

Each story format folder contains:

- `format.js`: JSONP code. (See [Twine 2 Story Format output specification](https://github.com/iftechfoundation/twine-specs/blob/master/twine-2-storyformats-spec.md).)
- `icon.svg`: Icon.
- `LICENSE`: License text.

## Twine 1

Depending on the story format, there may be up to three files:

- `header.html`: HTML, JavaScript, and CSS.
- `LICENSE`: License text.
- `code.js`: Additional JavaScript code.

In cases where the `code.js` file is not included, the complete JavaScript of the story format can be assumed to be part of the `header.html` file.
