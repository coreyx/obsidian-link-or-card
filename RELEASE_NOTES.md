# Link or Card 0.5.0

## Cards show the author

A card now shows who made the page, on its own line under the title.

The name is read when the card is created and stored in the card as an `author` line:

````markdown
```linkcard
url: https://stephango.com/file-over-app
title: File over app
author: Steph Ango
```
````

Where the name comes from, in order:

1. the page's author tag
2. its structured data, which is where a YouTube channel name comes from
3. failing those, the Twitter handle the page names as its creator, such as `@obsdmd`

Pages that name nobody, GitHub repositories for one, get no `author` line. You can add or correct the line by hand, like any other line in a card.

## Upgrading

Cards you already have are unchanged, because a card is only fetched once, when it is created. To give one an author, add an `author:` line by hand, or convert the card to a link and back to a card to fetch the page again.
