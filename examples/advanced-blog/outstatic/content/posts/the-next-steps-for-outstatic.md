---
title: 'Far Out - The Next Steps for Outstatic '
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'the-next-steps-for-outstatic'
description: 'The plan was simple: start a blog and write about my journey as a developer. But that''s exactly the problem, I''m a developer. '
coverImage: '/images/1500x500-Q3ND.webp'
tags: [{"value":"outstatic","label":"Outstatic"},{"value":"nextJs","label":"NextJs"},{"value":"gitHub","label":"GitHub"}]
publishedAt: '2024-01-02T14:41:29.000Z'
---

*Originally written on November 14th , 2022 on [GitHub](https://github.com/avitorio/outstatic/discussions/56)*

Hello there,

First of all, I'd like to thank you for being here. The fact that people from all around the world are interested in Outstatic still blows my mind.

My goal with this post is to talk a little bit about the origins of the project and where I see it going. I promise it's going to be quick.

## How it all started

I've always wanted to make writing a part of my life. In my opinion, being able to express yourself eloquently is key to becoming better at whatever you do.

The plan was simple: start a blog and write about my journey as a developer. But that's exactly the problem, I'm a developer. I could've just used one of the hundreds of possible CMS solutions or blogging platforms out there, but no, I had to build my own.

I initially cloned a Next.js + Markdown blog example. The advantages of static websites were clear from the beginning, but pushing Markdown to GitHub felt a bit antiquated. I wanted to be able to log in to my website and just edit content.

A few lines of code later, I had built a tool that looked somewhat decent and thought to myself: “perhaps other people might find this useful”. So I gave the project a name and packaged it to look like a "product". Once it had the basic features I needed, I'd make the GitHub repo public, announce it on a subreddit or two, and then start working on my own blog. Long story short, the library blew up and I am yet to start writing. 😅

Together with all the support and compliments also came feature requests, issues, pull requests, and I found myself juggling between my day job, an apartment renovation, answering questions, and fixing bugs for Outstatic. Thankfully, some amazing people were kind enough to contribute with ideas, code and also helping run the community. Big shout out to [@jakobo](https://github.com/jakobo), [@ahaasler](https://github.com/ahaasler), [@DCzajkowski](https://github.com/DCzajkowski) and [everyone else who contributed so far](https://github.com/avitorio/outstatic/graphs/contributors)

## Next steps

We have something special going on. How do we keep improving it? I believe developer experience is key to making this project successful. This entails having a welcoming community, a solid code base and a clear vision of where we're going.

### Welcoming Community

Outstatic has the potential to become a successful CMS framework, but that can only be achieved if the project is community driven. Users need to feel welcome and have enough freedom to contribute in whatever part of the project they might enjoy working on and feel they are good at. For this we need to have clear guidelines for contribution, developer documentation, code standards, safe guards and feedback processes.

### Solid Code Base

You see, I built this for myself. There was no intention to push it out into the open. So yes, a lot of the code is messy and based on my immediate needs. But now that I'm no longer alone, refactoring is definitely needed. Shout out to [@DCzajkowski](https://github.com/DCzajkowski) for kicking off the [thread on this topic](https://github.com/avitorio/outstatic/discussions/54).

I'd love to reorganise the project in a way that allows for sustainable long-term code base maintenance and improvements.

## Where are we going?

Outstatic is a tool built by and for developers but with the goal of being as easy to use and install as possible, so that anyone can build web projects with it. I've divided our immediate needs into two categories: Developers and Users.

### Developers

First things first. Developers are the backbone of the project. To improve developer experience, the code base and repository setup could really benefit from:

- Clear contribution guidelines.
- Tests (unit, API endpoints, and possibly e2e).
- Enforce coding style consistency (lint-stage and husky), see [ongoing discussion](https://github.com/avitorio/outstatic/discussions/54#discussioncomment-4107145).
- CI/CD with Github Actions (at least set up for tests and building), require to pass before merging.
- Adding Changesets.
- Proper template for Pull Requests.
- A bit further ahead: SOLID architecture.

### Users

In terms of product features, there are a couple of things I believe would be amazing for both the type of projects Outstatic enables and the number of people who'd be open to use it:

- Custom field creation. Allow users to add Document metadata.
- Internationalisation
- Accessibility (perhaps using [radix ui](https://www.radix-ui.com/))
- Support for other git providers such as Gitlab and Bitbucket.
- Support for other data storage options, maybe even external databases.
- Eventually support for other authentication methods if data is stored somewhere other than git.

These are the steps I can think of for now and I want to start working on them asap. I'll create issues for the Developers part. I'd be be extremely thankful to those who want to step-up and take care of any of the features mentioned above.

I hope we as a community can work together to create the best developer experience possible and build a product that's loved by everyone who gets to use it. Let's do this!