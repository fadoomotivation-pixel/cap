# Add to Capital Brix — browser extension

One button that saves a broker you are already looking at into your
channel-partner list, assigned to you.

## Why this exists, and why it is not a scraper

The registry import (`/admin/partners` → Import) answers **who is new** —
MCA's monthly incorporations and the state RERA agent registries both publish
a registration date, which is the only reliable way to tell a new entrant from
a five-year-old list.

What those registries do **not** give you is a phone number. Finding that is
the actual work, and it is done by a person looking something up. This
extension is for that last step: the listing is open in front of you, one
click puts it in your list instead of you retyping it into a second window —
which is where a number gets mistyped or a lead gets dropped.

It is deliberately **not** a crawler:

- It only ever reads **the page you are looking at**, when you open the popup.
- It saves **one record per click**, typed or confirmed by you.
- There is no background job, no list walking, no rate to get blocked.

A server-side crawler against Google Maps was considered and rejected:
scraping breaches Google's terms, the ban arrives after the work is done, and
a Maps pin proves somebody paid for a listing rather than that they are a
working agent.

## Install (each telecaller, once)

1. Copy this folder to the computer.
2. Chrome → `chrome://extensions` → turn on **Developer mode** (top right).
3. **Load unpacked** → pick this folder.
4. Pin the extension, open it, press ⚙ and paste your **capture token**.

HR generates the token at `/admin/partners` → *Who works it*. It identifies
whose list a saved broker lands in, so it is personal — not shared. If one
leaks, HR regenerates it and the old one stops working immediately.

## Using it

Open a listing, select the broker's name if it is on the page, click the
extension. Name and phone come in pre-filled; correct anything, add a note,
press **Add to my list**. It appears in your Employee Portal → Channel
Partners straight away.

Click twice on the same person and you get **one** row, not two — the same
name and number update the existing record rather than duplicating it, and a
row somebody else already holds stays with them.

Anyone marked **do not call** cannot be re-added. That is checked on the
server, so it holds no matter which route the name arrives by.

## What it can and cannot do

The project URL and anon key in `config.js` are the same pair the public
website ships; they are designed to be public and grant nothing by
themselves. Every table is behind row-level security, and the one function
this calls — `cb_capture_partner_target` — refuses anything without a valid
capture token. The worst a leaked token can do is add a target and put it in
that person's own list, which is what they could do by hand anyway.
