# Link or Card 0.6.0

## YouTube cards record the channel's handle

A card made from a YouTube link now stores the channel's handle in a `handle` line, next to the channel name in `author`:

````markdown
```linkcard
url: https://www.youtube.com/watch?v=jNQXAC9IVRw
title: Me at the zoo
author: jawed
handle: @jawed
```
````

The handle is **not shown in the card**. It lives in the card's source only, so the card looks the same as before and the handle is there for search and your own reference.

Which links get one:

| Pasted link | `handle` |
| --- | --- |
| A video, including `youtu.be` links | the channel's handle |
| A Short | the channel's handle |
| A channel page pasted as `youtube.com/@handle` | that handle |
| A channel page pasted by its ID, or a playlist | none |
| Any page that is not YouTube | none |

## Upgrading

No action is needed. Cards you already have are unchanged, because a card is only fetched once, when it is created. To give one a handle, add a `handle:` line by hand, or convert the card to a link and back to a card to fetch the page again.
