# Emberline Canyon Post

A bush-pilot flight game for the make.fun [best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057).

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/konzlodon74-dot/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/konzlodon74-dot/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Fly a high-wing bush plane over Emberline Island — a procedural island with a carved canyon, a grass-bench airstrip with edge lamps, hangars and pine forest. Three sorties:

1. **Ring Run** — thread eight rings through the canyon in order against the clock.
2. **Cargo Drop** — line up over the yellow clearing and put the crate in the circle (Space).
3. **Precision Landing** — touch down soft, slow and centred on the strip for a score.

Throttle and turn discipline matter: controls bite harder with speed, low speed stalls, fuel burns with throttle, and hard arrivals bend the airframe. Chase and cockpit cameras (C), the cockpit with a lit instrument panel — horizon ball, airspeed, altimeter, fuel and throttle dials.

Controls: mouse or arrow keys pitch and roll · W/S or Shift/Ctrl throttle · 1/2/3 pick a mission · Space drops cargo · R restarts.

Run locally: `node serve.ts`, then open http://localhost:8080. Hand in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

Built with three.js (vendored under `game/vendor/`). All names, art and terrain are original.
