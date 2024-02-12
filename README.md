Yet another reddit frontend with a focus on simplicity. Work in progress.

To use, redirect https://www.reddit.com/ANY_URL to https://tenextractor.github.io/yarf/?url=/ANY_URL.

Example: https://www.reddit.com/r/javascript > https://tenextractor.github.io/yarf/?url=/r/javascript

This can be automatically done with addons like [Redirector](https://github.com/einaregilsson/Redirector). Privacy Redirect does not work.

Works using cross-site requests, so please disable tracking protection if you get errors.

Inspired by [libreddit](https://github.com/libreddit/libreddit), but the requests to reddit are sent from the client instead of the server. The advantage is that this avoids 'too many requests' errors, but the disadvantage is that requests are sent from your machine which makes it easier for reddit to track you. If you are concerned about this, use a VPN or another similar tool.
