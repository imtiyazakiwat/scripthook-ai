import type { ScriptFormat } from "./schema";

export interface SampleScript {
  id: string;
  title: string;
  format: ScriptFormat;
  script: string;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: "longform-growth",
    title: "Channel growth story (leaky intro)",
    format: "youtube_longform",
    script: `Hey guys, welcome back to the channel! My name is Alex, and if you're new here, I make videos about growing on YouTube. Today we are gonna talk about how I grew my channel from zero to 100,000 subscribers in one year. But before we get started, make sure you smash that like button and subscribe, it really helps the channel.

[B-roll: old analytics dashboard]

So basically, when I started, I had no idea what I was doing. I was uploading two videos every week, spending like ten hours on each one, and nobody was watching. I bought a new camera, a new mic, new lights, and honestly it didn't change anything at all, which was really frustrating and made me want to quit more than once.

But here's the thing nobody tells you: views don't come from uploading more. They come from the first 30 seconds of every single video. I lost almost $3,000 on gear before I figured this out.

(Sound effect: whoosh)

The secret is something I call the retention ladder. Step one: open with the result. Show people where they'll end up before you explain anything. Step two: show the struggle. Viewers stay for the story of how you got there, not for the tutorial. Step three: tease the payoff, but never deliver it until the end.

When I applied this to my next ten videos, my average view duration went from 2 minutes to almost 6 minutes. And the algorithm noticed. That's when everything changed.

So yeah, that's pretty much it for today. Thanks for watching, and I'll see you in the next one.`,
  },
  {
    id: "shorts-productivity",
    title: "Productivity Short (soft open)",
    format: "youtube_shorts",
    script: `So today I wanted to share a quick productivity tip that has really helped me. Basically, I used to check my phone like a hundred times a day. Then I tried putting it in another room while I work. And honestly? I finished a whole week of work in two days. The crazy part is it only took one change. Try it tomorrow and tell me how it goes. Follow for more tips like this.`,
  },
  {
    id: "tiktok-shop-serum",
    title: "TikTok Shop skincare UGC",
    format: "tiktok_shop",
    script: `Okay so I bought this vitamin C serum from the TikTok Shop and I wanted to give you guys my honest review. It's literally the best serum ever and it's guaranteed to change your skin. I've been using it for two weeks now. My dark spots from last summer are honestly so much lighter, look at this before and after. It doesn't feel sticky, it absorbs in like ten seconds. It's on sale right now, so tap the orange cart before it sells out again.`,
  },
];
