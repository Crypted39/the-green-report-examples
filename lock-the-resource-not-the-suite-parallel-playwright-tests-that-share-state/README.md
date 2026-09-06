# Lock the Resource, Not the Suite: Parallel Playwright Tests That Share State

Demo suite for the blog post on Playwright 1.63 **test locks**.

Twenty-six tests against a deliberately naive app. Twenty of them are
independent. Six of them contend over two shared, mutable resources. The
suite is run three ways to show what each parallelism strategy costs.

## The app

`server/app.js` is a dependency-free Node server holding two records in
process memory:

| Resource | Page | Stands in for |
|---|---|---|
| `settings` | `/settings` | the one seeded admin account |
| `queue` | `/queue` | a report queue / rate-limited sandbox API |

Both `POST` handlers do a **read, wait 120ms, write the whole record back**.
That is the read-modify-write window real apps get for free from a slow ORM
or a cache round trip. Two workers hitting it at once clobber each other.

Independent `/widget/:id` pages sleep 600ms so serializing the suite has an
honest, measurable cost.

## The tests

    tests/independent.spec.ts   20 tests, touch nothing shared
    tests/naive/                6 contending tests, no locks      <- "before"
    tests/locked/               the same 6, with locks declared   <- "after"

The two directories are identical apart from the lock option, and both
projects pull in the same `independent.spec.ts`, so the comparison is
like for like.

| Spec | Lock |
|---|---|
| `settings`, `profile`, `notifications`, `billing` | `'user-settings'` |
| `queue` | `'report-queue'` |
| `report-run` | `['user-settings', 'report-queue']` |

## Running it

    npm install
    npx playwright install chromium

    npm run bench          # all three modes, with timings

    npm run test:naive     # fullyParallel, no locks -> races
    npm run test:workers1  # workers=1, the sledgehammer
    npm run test:locked    # fullyParallel + locks

`retries` is pinned to `0` in the config on purpose. A single retry hides
the race and defeats the whole demo.

## Measured on a 12-core Windows box, 6 workers

| Mode | Wall clock | Result |
|---|---|---|
| `fullyParallel`, no locks | 9-17s (fails fast) | **3-4 failures every run** |
| `workers: 1` | 27-30s | green |
| `fullyParallel` + locks | 15-17s | green |

Numbers move with hardware and worker count. The shape does not: locks are
green like `workers: 1` and roughly twice as fast, and the gap widens as
the independent-test count grows, because those tests never stop being
parallel.

## The timeline reporter

`reporters/timeline.ts` prints an ASCII gantt of when each test actually
ran. It is attached with 1.63's `--add-reporter`, which appends to the
configured reporters rather than replacing them.

Locked run, trimmed:

      widget 19 renders its rows      |             ###
      widget 20 renders its rows      |             ###
      change billing email            |             ########
      enqueue a report run            |              ######
      toggle notification preferences |                     ########
      rename user                     |                             ########
      export account report           |                                      ###########
      update user settings            |                                                ########

Three things to read off it:

1. The widget tests stay stacked. Locks never touched them.
2. The four `user-settings` tests are strictly end to end.
3. `enqueue a report run` overlaps `change billing email` - different lock,
   no contention - while `export account report` holds both and waits for
   both.

That third line is the payoff, and the reason to name locks after resources
instead of reaching for one global mutex.

## The catch

Locks serialize the tests that declare them, so the locked set becomes the
critical path. Six contending tests at ~2s each puts a hard ~12s floor
under this suite no matter how many cores you add. Locks make shared state
survivable; they do not make it good. Per-test data seeding is still the
better fix wherever you can get it.
