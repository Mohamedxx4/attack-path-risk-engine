# Risk Scoring

Layer 2 of the Attack Path Risk Engine.

Owner: Rahsheetha

## What this does
Takes a discovered path from `/path-discovery` and scores it 0–100 using:

    Risk Score = Impact(target) × Likelihood(path) × 10
    Likelihood(path) = DecayFactor(hops) × HopWeightProduct × MitigationMultiplier

Full formula, weights, and worked examples are documented in `/docs`.

## Tech
Python 3.x.

## Status
🚧 Not started — formula drafted, implementation pending.