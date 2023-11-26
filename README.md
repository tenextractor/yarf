Yet another reddit frontend with a focus on simplicity.

To use, redirect https://www.reddit.com/<url> to https://telextractor.github.io/yarf/?url=/<url>. This can be automatically done with addons like [Redirector](https://github.com/einaregilsson/Redirector). Privacy Redirect does not work.

Works using cross-site requests, so please disable tracking protection if you get errors.

Inspired by libreddit, but the requests to reddit are sent from the client instead of the server. The advantage is that this avoids 'too many requests' errors, but the disadvantage is that requests are sent from your machine which makes it easier for reddit to track you. If you are concerned about this, use a VPN or another similar tool.
