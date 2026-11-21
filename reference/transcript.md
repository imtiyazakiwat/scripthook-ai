# Reference transcript (recovered from burned-in captions, 10 fps sampling)

Times = when the phrase finishes on screen (±0.1 s). **Bold** = word wrapped in the blue selection box.

| t (s) | Section | Caption page |
|---|---|---|
| 1.3 | HOOK | Let's design **GitHub.** |
| 2.9 | HOOK | GitHub stores a **billion** repositories |
| 4.9 | HOOK | for **225** million developers, |
| 6.7 | HOOK | and runs **124** million |
| 8.0 | HOOK | **Actions** jobs a day. |
| 9.0 | PROMISE | Let's follow one **push** |
| 10.4 | PROMISE | and see how GitHub **checks** it, |
| 11.1 | PROMISE | **stores** it, |
| 11.9 | PROMISE | **reacts** to it |
| 12.8 | PROMISE | and **tests** it. |
| 14.1 | 1 FRONT DOOR | First, the front **door.** |
| 15.7 | 1 | Your push comes from the open **internet,** |
| 16.7 | 1 | so before anything else, |
| 18.1 | 1 | GitHub has to know it's **you.** |
| 19.4 | 1 | It hits the **load** balancers, |
| 20.5 | 1 | then **HAProxy,** |
| 21.4 | 1 | then **babeld,** |
| 22.6 | 1 | GitHub's git **proxy.** |
| 24.1 | 1 | babeld asks **gitauth,** |
| 25.3 | 1 | GitHub's **login** service, |
| 26.5 | 1 | if you have push **access,** |
| 28.1 | 1 | and right before your branch **moves,** |
| 30.7 | 1 | one last [check?] enforces the repository's **rules.** |
| 31.9 | 2 STORAGE | Next, **storage.** |
| 33.3 | 2 | A **disk** can die at any moment, |
| 34.2 | 2 | so your code can **never** |
| 35.3 | 2 | live on just one. |
| 35.8 | 2 | **Spokes,** |
| 36.9 | 2 | GitHub's storage **system,** |
| 38.6 | 2 | keeps a full **copy** of your repository |
| 40.0 | 2 | on **five** different machines. |
| 41.4 | 2 | Your push goes to all **five,** |
| 42.5 | 2 | and your branch only **moves** |
| 43.7 | 2 | once **most** of them agree, |
| 44.4 | 2 | so the **website,** |
| 46.0 | 2 | the **API** and your tests |
| 47.2 | 2 | all see the same **version.** |
| 47.9 | 2 | While they **vote,** |
| 49.4 | 2 | the whole repository is **locked,** |
| 51.1 | 2 | so pushes to it take **turns.** |
| 52.1 | 3 APP | Then, the **app.** |
| 53.1 | 3 | When your push **lands,** |
| 54.9 | 3 | more than **60** jobs have to react: |
| 56.2 | 3 | your pull request **updates,** |
| 57.2 | 3 | **webhooks** go out, |
| 58.2 | 3 | your **workflows** start. |
| 59.1 | 3 | So the **main** app, |
| 60.2 | 3 | nearly **two** million lines |
| 61.3 | 3 | of Ruby on **Rails,** |
| 62.8 | 3 | posts **one** event on Kafka, |
| 64.5 | 3 | a **feed** every service listens to, |
| 66.4 | 3 | and each **job** picks it up on its own. |
| 67.7 | 4 ACTIONS | Then, **Actions.** |
| 69.4 | 4 | A workflow can run **any** code at all, |
| 71.1 | 4 | so it can never touch anyone **else's.** |
| 72.5 | 4 | Every **job** on GitHub's runners |
| 74.2 | 4 | gets its own new **virtual** machine, |
| 75.1 | 4 | mostly in **Azure,** |
| 76.2 | 4 | Microsoft's **cloud.** |
| 76.8 | 4 | Inside it, |
| 78.4 | 4 | a small **open-source** program called |
| 79.9 | 4 | the **runner** calls out to GitHub, |
| 80.9 | 4 | **picks** up your job, |
| 83.2 | 4 | runs each **step** and sends back the logs. |
| 84.7 | 4 | Then the whole **machine** is thrown **away,** |
| 86.7 | 4 | so **nothing** carries over to the next job. |
| 87.8 | RECAP | So GitHub is a front **door** |
| 88.6 | RECAP | that checks you, |
| 90.7 | RECAP | **five** copies that vote on every push, |
| 92.0 | RECAP | one **app** that fans it out, |
| 93.8 | RECAP | and a **fresh** machine for every job. |
| 95.6 | 5 AGENTS (twist) | But this year it keeps going **down,** |
| 97.2 | 5 | **52** incidents in nine months, |
| 98.7 | 5 | and GitHub points to **agents.** |
| 100.4 | 5 | More than **40%** of pull requests |
| 101.5 | 5 | now start with an **agent,** |
| 103.6 | 5 | and pushes hit **17.9** billion |
| 104.2 | 5 | in a year, |
| 106.1 | 5 | more than the two years before **combined.** |
| 107.0 | 5 | Remember the **lock?** |
| 108.2 | 5 | Pushes to one **repository** |
| 109.1 | 5 | still take **turns,** |
| 110.5 | 5 | and for most repositories, |
| 111.7 | 5 | **two** of the five copies now |
| 112.6 | 5 | sit in **Azure,** |
| 114.0 | 5 | **25** milliseconds away, |
| 115.6 | 5 | so every turn takes **longer.** |
| 116.7 | 5 | So GitHub is **rebuilding** |
| 118.4 | 5 | **Spokes** with one lock per **branch,** |
| 119.6 | 5 | and pushes to different **branches** |
| 121.0 | 5 | will stop waiting on each other. |
| 122.3 | CTA | **Follow** for more breakdowns, |
| 123.4 | CTA | and **share** it with the dev friend |
| 125.8 | CTA | whose Actions are **stuck** in the queue. |
