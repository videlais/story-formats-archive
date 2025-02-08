# Story Format Archive (SFA)

This is a flat-file database of JSON files describing story formats for Twine beginning with 2015 (Twine 1.4.2).

Each official story format in the collection contains all necessary files and individual software licenses. For unofficial story formats, a repository or website is listed.

## SFA: Search

[A simple search](https://videlais.github.io/story-formats-archive/) is provided to help verify entries and general data in the database.

## Database Base URLs

- Official: `https://videlais.github.io/story-formats-archive/official/index.json`
- Unofficial: `https://videlais.github.io/story-formats-archive/unofficial/index.json`

## Organization

Organization is split between `official` and `unofficial`. If a story format currently is or was packaged with Twine at any point in time, it is considered "official" with all others falling into the "unofficial" collection. Generally, those in the "unofficial" collection are more experimental in nature with some providing complex functionality and others, for example, the ability to export Twine data in different file formats.

Story formats are additionally sorted into `twine1` and `twine2` sub-collections. In some cases, a story format might be in both categories if it was originally published during the transitory period between major versions.

### Organization Example

URL: `/official/index.json`

```json
{
    "twine1": [
        {

        }
    ],
    "twine2":[
        {

        }
    ]
}
```

Directories within the major Twine versions include story format and minor version per story format (e.g. `harlowe/3.3.0`). For Twine 1 story formats, the version of Twine (e.g. `1.4.2`) is used unless explicitly mentioned by the build or author.

### Directory Example

URL: `/official/twine2/chapbook/1.0.0/`

### Story Format Properties

### Official

Each official story format has the following properties:

- `name`: (string) Name.
- `author`: (string) Author(s) of the story format.
- `version`: (string) Semantic version.
- `proofing`: (boolean) `true` if story format is for proofing and `false` otherwise.
- `description`: (string) Summary of story format.
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
            "author": "Chris Klimas",
            "version": "1.0.0",
            "proofing": false,
            "description": "A Twine story format emphasizing ease of authoring, multimedia, and playability on many different types of devices.",
            "files": [
                "LICENSE",
                "format.js",
                "logo.svg"
            ]
        }
    ]
}
```

#### Unofficial

Each unofficial story format has the following properties:

- `name`: (string) Name.
- `author`: (string) Author(s) of the story format.
- `repo`: (string) GitHub repository or website.
- `proofing`: (boolean) `true` if story format is for proofing and `false` otherwise.
- `description`: (string) Summary of story format.
- `basedOn`: (string) Parent story format it is based on, if any.
- `files`: Files of the story format.

```json
{
    "twine1": [
        {
            "name": "DotGraph",
            "author": "M. C. DeMarco",
            "version": "2.2.0",
            "repo": "https://github.com/mcdemarco/dotgraph",
            "proofing": true,
            "description": "Displays a graph of your story, with several options for color-coding, clustering, and labeling nodes; it also detects unreachable nodes and terminal leaves",
            "basedOn": "",
            "files": [
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
