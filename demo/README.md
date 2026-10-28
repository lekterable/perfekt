# perfekt demo video

A 36 s, 1080×1350 (4:5) silent video of perfekt for social posts and the docs: [`perfekt.mp4`](perfekt.mp4).

Every line in the terminal is real perfekt output. `capture.sh` runs the built CLI in a throwaway repo with fixed commit dates and saves each command's output to `output/`, and the composition shows those lines verbatim. The hashes stay the same until a new Biome or perfekt release changes the files `setup` writes; the `ci` timings differ on every run. It also downloads Apple's emoji images into `assets/emoji/`, so the video shows the same emoji as the README and the terminal on a Mac. The PNGs stay out of git; the rendered video shows them.

The video is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition: `index.html` mounts three scenes from `compositions/`: the hook, the terminal (setup, the commit hook, changelog, release, ci) and the end card.

```sh
pnpm build                  # from the repo root, so dist/cli.js exists
cd demo
npm run capture             # refresh output/ from the real CLI and fetch the emoji images
npm run dev                 # preview and edit in the browser
npm run check               # lint, runtime and layout checks
npm run render              # write perfekt.mp4
```

When perfekt's output changes, run `capture`, copy the changed lines into `compositions/terminal.html`, then check and render again.
