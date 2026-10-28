# perfekt LinkedIn video

A 26 s, 1080×1350 (4:5) video of perfekt for a LinkedIn post: [`perfekt.mp4`](perfekt.mp4). It is silent, because LinkedIn autoplays muted.

Every line in the terminal is real perfekt output. `capture.sh` runs the built CLI in a throwaway repo with fixed commit dates, so the hashes stay the same, and saves each command's output to `output/`. The composition shows those files verbatim.

The video is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition: `index.html` mounts three scenes from `compositions/` (hook, terminal, end card).

```sh
pnpm build                  # from the repo root, so dist/cli.js exists
cd demo/linkedin
npm run capture             # refresh output/ from the real CLI
npm run dev                 # preview and edit in the browser
npm run check               # lint, runtime and layout checks
npm run render              # write perfekt.mp4
```

When perfekt's output changes, run `capture`, copy the changed lines into `compositions/terminal.html`, then check and render again.
