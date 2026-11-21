# Reference Reel: Frame-by-Frame Breakdown

Source: `VID-20261121-WA0002.mp4` ("Let's design GitHub"), with a CTA that names the creator as `speedy_devv`.
Full recovered script with timings: [`transcript.md`](transcript.md).

---

## 1. Technical specs (match these exactly)

| Property | Value |
|---|---|
| Resolution | 720×1280 (9:16). Render the master at **1080×1920** and let the platform downscale. |
| Frame rate | 30 fps constant |
| Duration | 125.9 s |
| Video | H.264, ~480 kbps. This is a WhatsApp re-encode; upload the master at 12–20 Mbps. |
| Audio | AAC 44.1 kHz. Effectively **mono**: side/mid is −65 dB. |
| Loudness | **−14.3 LUFS integrated**, true peak +0.4 dBTP (we will target −1 dBTP), LRA **2.8 LU**, so the voice is heavily compressed |
| Audio bed | **No music, no SFX.** It is voice only. Gaps before section changes drop to digital silence for about 0.2 s. |
| Voice band | 99% of the energy is below 7.5 kHz, so the voice is close-miked and warm (a typical TTS or podcast mic) |
| Pace | ~445 words in 126 s ≈ **210 WPM**. That is fast, with almost no pauses except 0.15–0.2 s breaths before each new section. |

---

## 2. Screen layout (constant through the whole video, in 720-px coordinates)

```
y   0 ─────────────────────────────────────────
     (empty headroom ~200 px, safe zone for the IG UI)
y 240  CAPTION line 1          (centered, ~34 px font)
y 268  CAPTION line 2
y 370  ● FRONT DOOR ○ STORAGE ○ APP ○ ACTIONS ○ AGENTS   ← chapter tracker + GitHub logo at left
       (top-right corner: a live "stat counter" such as 5 / 60+ / 52 / 17.9 / 25 ms)
y 430 ┌───────────────────────────────┐
      │      HERO VISUAL CARD         │  ~600×400, rounded 12 px, soft shadow
      │  (UI mock / diagram / number) │
y 880 └───────────────────────────────┘
y 950       PRESENTER (3D cartoon, waist-up, cropped by the bottom edge)
y1280 ─────────────────────────────────────────
```

There are three fixed layers. Each one does a single job:
1. **Captions** (top) say what is being said.
2. **Hero card** (middle) shows it.
3. **Presenter** (bottom) emotes it.

The **chapter tracker** in between tells the viewer how far through the video they are.

---

## 3. Visual design system

**Two themes that alternate by section.** The theme flip is itself a pattern interrupt.

| Section | Time | Theme |
|---|---|---|
| Hook (3D tower) | 0–2.2 s | Dark, with a green "contribution-graph" pixel band |
| Hook stats + promise | 2.2–12.9 | Light (#F6F6F6) with a faint 40 px grid |
| 1 Front door | 12.9–30.9 | Dark (#111) with a faint grid |
| 2 Storage | 30.9–51.3 | Light |
| 3 App | 51.3–66.6 | Dark |
| 4 Actions + recap | 66.6–94.0 | Light |
| 5 Agents (twist) | 94.0–121.2 | Dark, with red accent bars (incidents) |
| CTA | 121.2–126 | Light |

**Typography**
- Captions use a geometric/humanist sans (Google Sans / Figtree / "Plus Jakarta Sans" will match), at about **34 px on a 720 frame (~50 px at 1080)**.
  - Active word: weight **700**, full contrast (white on dark, #111 on light).
  - Spoken words: weight 400 at about 45% opacity (grey).
- UI and diagram text use a monospace face (JetBrains Mono / Geist Mono): commit hashes, branch names, the numbers on cards, and tracker labels in 9 px uppercase with tracking.
- Accent colours:
  - Selection blue #3B82F6 (box fill ~15% alpha with a 1.5 px stroke)
  - Success green #2EA043
  - Warning amber #D29922 (the "pending" bar)
  - Danger red #E5484D (the incident bars)

**Assets are realistic GitHub UI recreations** built with fictional but consistent data: a repo `kestrelferry/booking-api`, a user `ines-okafor`, a branch `fix-seat-hold`, commits `9c41d0b → a3f9c1e`, and PR #482 "Fix double-booked seats on the 7:40 ferry". **One running story object (one push) threads through every section.** This is the biggest storytelling device in the video.

---

## 4. Motion language (every animation type found)

| # | Animation | Where | Spec to rebuild |
|---|---|---|---|
| A1 | **Word-by-word caption reveal** | Entire video | Each word enters as its audio starts. Entry: blur 8 px→0, opacity 0→1, y +6 px→0, over 4–5 frames. The previous word dims to grey. A page holds 1–2 lines (3–8 words). The page clears with a fast blur-out of about 3 frames. |
| A2 | **Keyword selection box** ("Figma select") | ~1 keyword per page (≈95 times) | A blue rect with 4 corner handles plus a **blue dot "cursor"** at the top-left. The box draws in over 4 frames as a horizontal wipe with a scale of 0.95→1. It holds while the word stays active, then the fill fades. This is the signature element. |
| A3 | **Odometer / slot-machine number roll** | 1,000,000,000 · 225,000,000 · 124,000,000 · 2,000,000 lines · 52 · 17.9 | Each digit column scrolls vertically with motion blur and settles left→right with a stagger of about 2 frames per digit. Duration 0.8–1.2 s, ease-out. |
| A4 | **Section transition: "card expands to fill"** | 12.9, 30.9, 51.3, 66.6, 94.0 | A rounded card in the new theme scales from the hero card's rect to full frame in **4–5 frames**, corners 12→0. Old content blur-fades. The **presenter stays on top and never cuts**. The tracker dot for the new chapter turns green. |
| A5 | **Theme crossfade through grey** | 2.2 s (hook→light) | Dark → light luminance ramp over 6 frames while the hero card morphs into its new layout. |
| A6 | **Blur-in / blur-out of UI cards** | Every visual change | blur 10 px + opacity + scale 0.96→1, 6–8 frames. Exits are faster (4 frames). |
| A7 | **Element stagger / list build** | Lists such as "60 jobs", rule checkboxes, Kafka consumers | Rows appear top→bottom with a stagger of about 3 frames. Checkmarks flip from grey circle to green check. |
| A8 | **Git graph animation** | Front door | Nodes pop in (scale 0→1.1→1). A connector line draws (stroke-dashoffset) from local to origin. The amber "pending" bar fills. |
| A9 | **Pan / camera dolly across a big diagram** | Front door (LB→HAProxy→babeld→gitauth), App (Kafka fan-out) | A large diagram sits in a "viewport". The camera translates and zooms to each component as it is named. Data dots travel along connector lines (green pulses). |
| A10 | **Quorum / vote counter** | Storage: "3 of 5" → "5 of 5" | Counter badge increments, and each server row gets a green check in sequence. |
| A11 | **Lock icon drop** | "locked", "Remember the lock?" | Padlock pops onto the rack (scale overshoot 1.15). The presenter is simultaneously holding a padlock prop. |
| A12 | **Arc / latency line** | "25 milliseconds away" | An arc draws between "GitHub data center" and "Microsoft Azure". A label pops at the apex. |
| A13 | **Bar chart rise** | "52 incidents" | Red equalizer-style stacked bars rise per month (Jan–Sep), staggered. |
| A14 | **Fan-out tree** | "GitHub points to agents" | Logo → 4 branches (Claude Code, Codex, Copilot, Gemini) drawn with lines, icons pop. |
| A15 | **Recap stack** | 87–94 s | All 4 previous section cards stack vertically as a mini "architecture page". The camera scrolls as each is named. This is a visual summary. |
| A16 | **Phone mock for CTA** | 121–126 s | A phone frame shows the reel itself: the Follow button is tapped ("Following"), then the share sheet opens and a friend avatar is selected and Sent. It literally demonstrates the CTA. |
| A17 | **Corner stat counter** | Top-right of tracker | It persists the section's key number (5, 60+, 52, 17.9, 25 ms) so the number stays in view after it is spoken. |
| A18 | **Hook 3D tower** | 0–2 s | A chrome GitHub coin drops in. A shockwave ring ripples out. The coin extrudes into a glass cylinder stack with callout labels (load balancers, babeld, Spokes 5 copies, Ruby on Rails, Kafka, MySQL, Actions). It is a pre-rendered 3D clip (Blender/Spline) over a green pixel band. |

**Cadence:** the visual changes roughly every **0.5–1.0 s** (a caption word, a box, or a card state). There are only 7 true scene changes in 126 s. Everything else is continuous in-place animation, which keeps the reel feeling smooth rather than choppy.

---

## 5. Presenter (the avatar)

- A stylised 3D cartoon character (Pixar/Memoji-like): young man, brown quiff, **mirrored green-blue sport visor glasses**, red crew-neck T-shirt. It is the creator's mascot and brand anchor.
- It is **lip-synced** to the voice (mouth moves on syllables) with idle head bob and blinks. That means AI-generated talking clips composited with alpha (background keyed to match the theme).
- **Gestures change at almost every caption page** (~85 gesture swaps) through a fast 2–3 frame dissolve. They are **semantic**:

| Gesture | Spoken cue |
|---|---|
| Open palm presenting | "Let's follow", "Next" |
| Finger point up or at the card | Facts |
| Hand-stop | "before anything else", "never" |
| Fist bump / thumbs up | "you", "access" |
| Arms crossed | "rules", "nothing carries over" |
| Peace / count fingers | "two", "five" |
| Hands on cheeks (shock) | "40%" |
| Both hands on head (overwhelmed) | "17.9 billion" |
| Facepalm | "takes longer" |
| Hand over brow (looking far) | "waiting" |
| Biting nails / worried | "52 incidents" |

- **Props** appear in hand: a padlock ("locked") and an hourglass ("stuck in the queue").

---

## 6. Hook and retention architecture (every hook type used)

| t | Hook type | Execution |
|---|---|---|
| 0.0 | **Visual pattern hook** | Motion starts in frame 1 with no logo intro: the 3D chrome logo and a shockwave. |
| 0.1 | **Topic hook ("Let's design X")** | A known brand, plus an implicit interview-prep promise. The first spoken word starts at 0.1 s. |
| 1.9–8.0 | **Scale/stat stack (curiosity through magnitude)** | 1 billion repos → 225 M devs → 124 M jobs/day. There are three escalating numbers in 6 s, each with an odometer roll. |
| 9.0–12.8 | **Roadmap / promise hook** | "Let's follow one push and see how GitHub checks it, stores it, reacts to it and tests it." The four verbs map to the four chapters and the visible tracker. This creates an **open loop**: viewers wait to see all four. |
| Throughout | **Single protagonist object** | One push (`a3f9c1e`) travels through every system. It works like a character arc. |
| Each section | **Re-hook transitions** | "First, the front door." / "Next, storage." / "Then, the app." / "Then, Actions." Each comes with a theme flip, a tracker tick, and a 0.2 s silence: a mini-reset every 15–20 s. |
| Each section | **Problem → mechanism framing** | "A disk can die at any moment, so your code can never live on just one." The *why* always comes before the *what*. |
| 30.9 s / 49 s | **Plant** | "the whole repository is locked, so pushes take turns." This detail is planted as a throwaway… |
| 87–94 | **Recap (false ending)** | "So GitHub is a front door that checks you, five copies that vote…". It feels like the end. |
| 94.0 | **Twist / second-act hook** | "**But** this year it keeps going down." The theme turns dark with red. It is news-driven and timely (2026), and it rewards viewers who stayed. |
| 107.0 | **Payoff / callback** | "**Remember the lock?**" The planted detail returns as the root cause, which makes the viewer feel smart. |
| 116.7 | **Resolution** | What GitHub is doing about it (per-branch lock). |
| 121.2 | **Identity-based CTA + share trigger** | "Follow for more breakdowns, and share it with the dev friend whose Actions are stuck in the queue." It is a relatable in-joke, so people tag a specific friend, and it is demonstrated with an on-screen phone mock. |
| Loop | **Seamless loop** | It ends on a light frame right after the stinger line with no outro card, so the replay starts immediately. |

**Script rules observed**
- Sentences are short: 3–8 words per caption page and **one idea per page**.
- Every page has exactly **one keyword** worth highlighting, usually a noun or number.
- Connectives drive momentum: "so", "then", "and", "but". There is no filler and no greetings.
- Concrete numbers appear every 5–10 s.
- Jargon is always followed by an appositive definition ("babeld, GitHub's git proxy", "gitauth, GitHub's login service", "Spokes, GitHub's storage system", "Azure, Microsoft's cloud").
- Structure: **Hook (stats) → Promise (roadmap) → 4 chapters → Recap → Twist (news) → Callback → Resolution → CTA.**

---

## 7. How we rebuild it (production pipeline)

| Stage | Tool | Notes |
|---|---|---|
| Script | You → me (hook audit) | Same rules as section 6. Target 200–215 WPM, 120–130 s. |
| Voice | ElevenLabs (v3 / Multilingual v2) | We use audio tags for emotion. Export WAV 44.1 kHz. |
| Word timings | Forced alignment of **your** audio against the known script, via ElevenLabs Speech-to-Text (`timestamps_granularity: "word"`) or a local aligner | This drives every caption, box, and gesture cut. |
| Motion graphics | **Remotion** (React → MP4), 1080×1920, 30 fps | All of A1–A17 are code: captions, selection boxes, odometers, cards, tracker, transitions, diagrams, phone CTA. This gives frame-accurate sync to the word timings. |
| UI mocks | React components inside Remotion | GitHub-style dark/light cards, git graph, racks, terminal, PR page. |
| Presenter | Option A: your own mascot via an AI avatar tool (HeyGen / Hedra / Kling avatar lip-sync) on a green screen, cut into per-gesture clips. Option B: I render a lightweight 2D/2.5D animated SVG presenter in Remotion (mouth driven by audio amplitude, gesture poses keyed to tags). | We must **not copy the reference creator's character**. We build our own mascot with the same *role*. |
| Hook 3D shot | Spline/Blender clip, or a Remotion 3D-ish CSS/Three.js version | 2 s, chrome logo plus extrude. |
| Audio master | ffmpeg: HPF 80 Hz, de-ess, compression, `loudnorm` to −14 LUFS / −1 dBTP, mono | Matches the reference (no music). An optional subtle whoosh on section flips. |
| QA | I re-analyse the render the same way (frames, caption sync drift < 2 frames, loudness, safe zones) before marking it ready | |

---

## 8. Script checklist I will grade your script against

1. First spoken word ≤ 0.2 s; topic named in the first 1.5 s ("Let's design ___").
2. 2–3 escalating scale numbers within the first 8 s.
3. A roadmap sentence with N verbs, where N equals the number of chapters (shown on the tracker).
4. One concrete protagonist object followed end to end.
5. Each chapter opens with a transition word (First / Next / Then / Then) plus a 2–3 word title.
6. Problem → mechanism ("X can fail, so Y") inside each chapter.
7. Every jargon term gets an appositive definition right after it.
8. One planted detail early that is paid off later ("Remember the ___?").
9. A recap that sounds like an ending, then a "But…" twist with fresh, sourced news or numbers.
10. A resolution, followed by an identity/share CTA with a relatable in-joke. No "like and subscribe".
11. One keyword per 3–8 word chunk; a number every ≤ 10 s.
12. 420–460 words total (≈ 2:00–2:10 at 210 WPM). No filler, no greetings.
13. All facts verifiable (I will fact-check each number online).
