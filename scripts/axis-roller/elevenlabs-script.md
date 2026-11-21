# Apache Axis + Roller: final voice script (ElevenLabs)

## Settings
- Model: Eleven v3, or the most expressive model your account offers. If audio tags get read aloud, delete the `[tags]` and keep the punctuation.
- Stability: **Natural**. Use Creative only if the delivery sounds flat.
- Speed: 1.05–1.1. The target is ~195 WPM, which gives a total of ~68–72 s.
- Voice: a confident, close-mic male or female "tech news" voice. No accent preference.
- Export: WAV 44.1 kHz (or MP3 192k+). Generate it in **one take**, not line by line. It sounds more natural, and alignment is easier.
- Don't add music. I master the voice to −14 LUFS.

## Paste this into ElevenLabs (everything between the lines)

---
[serious] This software died years ago. And hackers are using it to break into companies... right now.

[urgent] One attack started on a Confluence server. Four hours later, they were inside a cloud data warehouse. Twelve hours later? Microsoft 365.

Two Apache bugs are under attack. Let's check if you're exposed.

[confident] First, Apache Axis. An end-of-life Java library, still hiding inside other products, like Confluence, Atlassian's team wiki. The bug is rated nine point eight out of ten. No password needed to run code.

[serious] And here's the catch. Apache will never ship a fixed Axis one. So the fix has to come from your vendor. On Confluence, that's nine point two point twenty-eight. Or switch off the Remote API. It's off by default... but older, upgraded servers can still have it on.

[mischievously] But bug number two has a trap.

[confident] Apache Roller, the open-source blogging platform. Also rated nine point eight. Every version before six point one point six. And Apache says it's being exploited right now.

[serious] Here's the trap. Turning off XML-RPC, its remote posting feature, in the admin panel... does NOT protect you. You have to upgrade. Six point one point six, or later.

[calm] Remember. The dangerous server is the one everyone forgot was still running. Search your network for Axis and Roller. Today.

[excited] Follow for daily breach breakdowns. And send this to the sysadmin who swears nothing old is still running.
---

## On-screen plan (I build this after I get your audio)

The tracker shows `HOOK · AXIS · ROLLER · CHECK`. The corner counter shows `0h → 4h → 12h`, then `9.8`, then `9.8`, then `6.1.6+`.

| Beat | Caption keyword (blue box) | Hero card |
|---|---|---|
| Hook 1 | **died** / **right now** | Grey "EOL" tombstone stamp on an Axis jar, then red pulse |
| Hook 2 | **Confluence** → **four** → **twelve** → **Microsoft 365** | Attack-path diagram: the camera pans server → data warehouse → M365, with an odometer clock 0h→4h→12h |
| Promise | **Two** / **exposed** | Two bug cards slide in, and the tracker appears |
| Axis | **Axis** / **nine point eight** / **No password** | Card: `CVE-2026-90436 · CVSS 9.8`. A SOAP request arrow, then a shell icon |
| Catch | **never** / **vendor** / **9.2.28** / **Remote API** | Admin-panel mock with the "Remote API (XML-RPC & SOAP)" checkbox being unticked, plus a version badge |
| Rehook | **trap** | Theme flip (dark→light) and the tracker moves to ROLLER |
| Roller | **Roller** / **9.8** / **6.1.6** / **right now** | Card: `CVE-2026-129448 · < 6.1.6 · EXPLOITED` |
| Payoff | **XML-RPC** / **NOT** / **upgrade** | Toggle switched OFF, red ✕ "still vulnerable", then an upgrade bar to 6.1.6 with a green check |
| Callback | **forgot** / **Today** | Server rack with one dusty, cobwebbed box glowing red. A search bar types "axis roller" |
| CTA | **Follow** / **sysadmin** | Phone mock: follow tap, then the share sheet sends to a "sysadmin" contact |
