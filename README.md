# Archive of Twine Story Formats

This is a database of story formats for Twine beginning with 2015 (Twine 1.4.2) through the present (Twine 2.7.1).

Each story format contains all necessary files and individual licenses.

## Organization

Files are split between `twine1` and `twine2` directories with the version of the story format included in the folder name (e.g. `harlowe-3.3.0`). For Twine 1 story formats, the version of Twine (e.g. `1.4.2`) is used unless explicitly mentioned by the build or author.

Each story format has the following properties:

- `name`: Name.
- `version`: Semantic version.
- `files`: Files of the story format.

**Example:**

```json
{
    "twine1": [
        {
            "name": "jonah",
            "version": "1.4.2",
            "files": [
                "LICENSE",
                "code.js",
                "header.html"
            ]
        }
    ],
    "twine2": [
        {
            "name": "chapbook",
            "version": "1.0.0",
            "files": [
                "LICENSE",
                "format.js",
                "logo.svg"
            ]
        }
    ]
}
```

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
