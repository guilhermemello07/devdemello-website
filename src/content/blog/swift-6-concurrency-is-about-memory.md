---
title: "Swift 6 Concurrency Isn't About Speed, It's About Memory"
description: "A practical guide to migrating a UIKit and RxSwift codebase to Swift Concurrency and SwiftUI — and why strict concurrency is really a memory-safety feature."
pubDate: 2026-06-30
tags: ["Swift", "Concurrency", "Swift 6", "Migration"]
draft: false
---

Every time Swift 6 strict concurrency comes up, the conversation slides toward threads and performance. "It'll make my app faster." "Actors are about parallelism." Both miss the point.

Migrating a large, mature app from RxSwift and UIKit to Combine, async/await, and SwiftUI is a big undertaking, and the single most valuable thing it buys you isn't speed. It's memory safety. An entire category of crashes — the intermittent, can't-reproduce-it, only-happens-on-some-devices kind — becomes *impossible*, because the compiler starts rejecting the code that causes them before it ever ships.

That's the reframe this guide is built on: Swift 6 concurrency is a memory-safety feature wearing a performance costume. Once you internalise that, the migration stops feeling like the compiler being pedantic and starts feeling like it's doing you a favour.

## The codebase you're starting from

You know the flavour of "Swift" this guide is aimed at: RxSwift everywhere, UIKit-first, an aging MVC structure, and just enough Objective-C left to keep things interesting. In other words, a normal, successful app that has been shipping for years and has accumulated the architecture of its era.

Three things tend to hurt:

- **Crashes.** Not constant, but persistent — the kind that show up in your crash reporter with a stack trace that makes no sense, can't be reproduced locally, and quietly correlate with "the app was doing several things at once."
- **Slow startup.** Initialisation does a lot of concurrent work, and a lot of it is fighting itself.
- **Maintenance hell.** RxSwift chains nobody wants to touch, retain semantics that are impossible to reason about, and threading scattered across scheduler operators and `DispatchQueue.async` calls.

None of that is unusual. If your app is more than a few years old, you probably recognise at least two of the three.

## Why concurrency is a memory story

This is the part most migration guides skip.

A data race isn't just "two threads read a stale value." When two threads touch the same mutable memory without synchronisation, the failure modes are *memory* failures: a reference gets over-released and you crash on a dangling pointer; a collection mutates mid-iteration and its internal buffer ends up in an invalid state; a half-written value gets read as garbage. These are use-after-free and heap-corruption bugs, and they are the worst kind to debug, because they're non-deterministic. They depend on timing, device speed, thermal state, and luck.

This is what makes them so dangerous. Data races and memory-corruption crashes are among the hardest failures to reproduce, and among the most common in older, threading-heavy codebases. Once you start tagging crash reports by root cause, the concurrency-shaped ones dominate the "cannot reproduce" pile. And the payoff is real: teams that adopt strict concurrency routinely report substantial reductions in data-race crashes afterward, at no runtime cost.

Here's the key difference Swift 6 makes. In the old world of manual queues, locks, and RxSwift schedulers, nothing *stopped* you from sharing mutable state across threads. The tools assumed you'd be careful. You wouldn't be, because no human reliably is. Swift 6's strict concurrency moves that guarantee from "developer discipline at runtime" to "compiler proof at build time." The compiler now tracks which code runs in which isolation domain and refuses to let you share non-`Sendable` state across them. The bugs don't get caught in QA. They don't compile.

That's why it's a memory feature, not a speed feature. The whole point is to make a class of memory-corruption bugs *unrepresentable*.

## How to run the migration (the short version)

The full playbook is a post of its own, but the shape matters here:

- **Incremental, behind feature flags.** Nothing should be a big-bang rewrite. Carve out one area, rebuild it, flag it, ship it, watch the crash reporter, move on.
- **Reactive layer: RxSwift → Combine, and async/await wherever the work is really just "do this async thing and give me a result."** A lot of Rx in real apps is imperative async work in a reactive costume; that code wants to be `async`/`await`, not an `Observable`.
- **UI: UIKit → SwiftUI, and MVC → MVVM**, one flow at a time. Login first — small, self-contained, high-traffic, a great canary — then progressively gnarlier logic.
- **Strict concurrency, staged.** The path that works: turn on `SWIFT_STRICT_CONCURRENCY = complete` to get *warnings* without breaking the build, fix them domain by domain, and only flip the language mode to Swift 6 once a module is clean. Jumping straight into Swift 6 mode on a large codebase is how you end up staring at several hundred errors and rage-quitting.
- **Tests as the safety net.** Migrations are exactly where regressions hide. Coverage is what lets you change the engine while the car is moving.

On a large app this takes many months and many releases. That's normal, and it's the first thing to internalise. More on scoping later.

## Pattern 1: the login that races itself

It's one of the most common, so let's keep it concrete but generic.

A very common pattern: when a user logs in, the app fetches a large batch of records, decodes them off the main thread, writes them into a local database, and later reads them back out to display. Parallelise the fetching and decoding for speed, cache some of it in memory so the UI feels snappy, and you have a beautiful little concurrency minefield.

Here's the shape of the problem (illustrative):

```swift
final class DocumentStore {
    private var cache: [String: Document] = [:]

    func load(_ ids: [String]) {
        for id in ids {
            DispatchQueue.global().async {
                let doc = self.fetchAndDecode(id)
                self.cache[id] = doc          // written from many threads at once
            }
        }
    }

    func document(for id: String) -> Document? {
        cache[id]                              // read while writes are in flight
    }
}
```

Every one of those background closures mutates `cache` concurrently, and the UI reads from it whenever it likes. `Dictionary` is a value type with a copy-on-write buffer; mutating it from multiple threads at once corrupts that buffer. The result is one of those irreproducible crashes: an `EXC_BAD_ACCESS` deep inside `Swift.Dictionary` that you cannot reproduce on demand, plus the occasional "why did that record come back empty?"

The fix is to give the mutable state a single owner. An actor does precisely that:

```swift
actor DocumentStore {
    private var cache: [String: Document] = [:]

    func load(_ ids: [String]) async {
        await withTaskGroup(of: (String, Document).self) { group in
            for id in ids {
                group.addTask { (id, await Self.fetchAndDecode(id)) }  // off-actor, in parallel
            }
            for await (id, doc) in group {
                cache[id] = doc               // serialized: only the actor touches cache
            }
        }
    }

    func document(for id: String) -> Document? {
        cache[id]
    }

    private static func fetchAndDecode(_ id: String) async -> Document { /* ... */ }
}
```

The fetching and decoding still happen in parallel inside the task group, but every mutation of `cache` is serialised by the actor. There is now exactly one place that touches that memory, and the compiler enforces it: try to poke `cache` from outside and you get a compile error, not a 2 a.m. crash report. (`Document` has to be `Sendable` to cross those boundaries, which is the subject of pattern 3.)

That's the migration in miniature. You're not making it "faster." You're making the unsafe version impossible to write.

## Pattern 2: shared mutable state and the actor reentrancy trap

Once you start looking, shared mutable state is everywhere: an in-memory cache, a token/session store, a download-progress tracker, a counter feeding analytics. In the old code these were classes guarded by a `DispatchQueue` if you were disciplined, and guarded by nothing if you weren't.

Actors replace all of that. State inside an actor is isolated; the runtime guarantees only one task executes actor code at a time, so your mutations are safe by construction. No locks, no "remember to hop to the right queue," no `os_unfair_lock` you pasted from a forum.

But here's the trap most people miss, and the thing intermediate devs underestimate: **actors are reentrant.** When you `await` inside an actor method, the actor can run *other* work while you're suspended. So this is not as safe as it looks:

```swift
actor BalanceManager {
    private var balance = 0

    func deduct(_ amount: Int) async {
        guard balance >= amount else { return }
        await audit.record(amount)        // suspension point
        balance -= amount                 // state may have changed during the await
    }
}
```

Between the `guard` and the subtraction, the `await` opens a door. Another call to `deduct` can slip in, pass the same guard against the same balance, and now you've double-spent. Actor isolation protects you from *data races* — corrupted memory — but it does not protect you from *logic races* across suspension points. You have to read every `await` as "anything could happen here" and keep your invariants on one side of it. Knowing that distinction is the difference between someone who's read the actors tutorial and someone who can ship correct concurrent code.

Apple's documentation on actors and actor isolation is very good on this, and it's worth reading the reentrancy section slowly, not skimming it.

## Pattern 3: the type that compiled yesterday and won't today

When you flip on strict concurrency, the compiler starts asking a new question about every value that crosses an isolation boundary: *is this safe to send?* That's `Sendable`.

Value types made of `Sendable` things are automatically `Sendable`. Most of the friction comes from reference types. Model and "manager" types that were perfectly happy under Swift 5.9 will light up like a Christmas tree under strict mode, because they're classes with mutable properties being passed between threads. They were *always* unsafe. Swift 5.9 just didn't tell you.

The fixes, roughly in order of preference:

- **Make it a value type.** If a model is just data, a `struct` of `Sendable` properties *is* `Sendable`, for free. A lot of "model objects that are classes for no reason" can simply become structs.
- **Make the reference type genuinely thread-safe, then mark it.** If it really needs to be a class with shared mutable state, that's an actor — or a class whose access you've synchronised, in which case you can vouch for it with `@unchecked Sendable`. The word *unchecked* is the warning label: you are now the compiler. Reach for it sparingly, and only where you can prove the safety yourself.
- **`@Sendable` closures.** Closures that escape into concurrent contexts must promise they only capture `Sendable` state, which is what surfaces a lot of accidental `self` captures (more on those below).

Swift 6.4, shipped at WWDC26, even adds a way to say the quiet part out loud: a `~Sendable` annotation to mark a type as *intentionally* non-`Sendable`. That's more than a note to colleagues — it's how you model an ephemeral, use-it-linearly type that was never meant to cross isolation boundaries in the first place. And unlike an unavailable `Sendable` conformance, `~Sendable` doesn't close the door on the whole class hierarchy: a thread-safe subclass can still add its own `Sendable` conformance.

The mental shift: a `Sendable` error is almost never the compiler being annoying. It's the compiler pointing at memory you were sharing unsafely and didn't know it.

## The memory angle: retain cycles in the async era

Here's a thing nobody warns you about: moving to async/await quietly changes your retain-cycle surface area.

Structured concurrency is mostly kind to you. A child task created with `async let` or `withTaskGroup` is scoped: it finishes (or is cancelled) when the scope ends, so capturing `self` strongly inside it is usually fine, and even desirable. The danger is **unstructured, long-lived work**:

```swift
final class FeedViewModel {
    var task: Task<Void, Never>?

    func start() {
        task = Task {
            for await update in stream {
                self.apply(update)        // strong self, alive as long as the stream
            }
        }
    }
}
```

That `Task` captures `self` strongly and lives until the stream ends. If the view model should have been deallocated, it can't be. You have a leak, and a leaked view model usually means a leak of everything it holds. Combine subscriptions carry the same hazard, but you have to know which API bites. `assign(to:on:)` holds a strong reference to the object you assign to, and a `sink` retains whatever `self` its closure captures; either way, `self` stays alive for as long as the subscription is stored. The `assign(to: &$published)` form is the deliberate exception: it was introduced specifically to *avoid* retaining `self`, so it doesn't create the cycle.

A reliable rule of thumb:

- **Short-lived, structured child tasks** (`async let`, task groups, a `Task` you `await` and discard): capture `self` strongly. It's scoped; it'll go away.
- **Long-lived or stored unstructured tasks**, and **Combine subscriptions that outlive a single call**: capture `[weak self]`, and bail early if `self` is gone.
- **Cancel stored tasks in `deinit`.** Structured concurrency cleans up after itself; the `Task {}` you stuffed in a property does not.

How do you find the cycles? The boring, reliable way: the **memory graph debugger** to see who's retaining whom, **Instruments (Leaks and Allocations)** to catch the growth, and crash and metrics signatures to know where to look first. There's no shortcut here. You profile, you read the retain chain, you fix the capture.

This is the other half of "concurrency is a memory story." The compiler eliminates data races for you. Retain cycles it does *not*: those are still yours to own, and the async world gives you fresh ways to create them.

## Before you start

If you take one thing from this post, take this: **scope the migration honestly, because it is bigger than you think.**

Before you change a line, map what you're going to touch. Which modules share mutable state? Where does threading actually live today — in obvious `DispatchQueue` calls, or buried in Rx schedulers and operator chains? What's your test coverage on the riskiest areas? What can you hide behind a feature flag so you can ship incrementally and roll back? A thorough, up-front evaluation of impact and scope will save you from the much worse experience of discovering it halfway through.

A few specifics worth getting right:

- **Stage strict concurrency.** Warnings first, fix by domain, flip the language mode last. Don't go straight to Swift 6 mode on a large app.
- **Don't reach for `@MainActor` reflexively to silence errors.** Main-actor-by-default is a legitimate, deliberate architecture for a lot of app code (Swift 6.2 even made it an opt-in default), but sprinkling `@MainActor` to make the compiler stop complaining quietly serialises work that should be concurrent. Use it as an intentional choice, not a crutch.
- **Understand the model before you adopt the syntax.** This is the big one. If you don't actually understand isolation, `Sendable`, and suspension points, strict concurrency won't fix your bugs; it'll relocate them somewhere the compiler can't see, or you'll `@unchecked Sendable` your way around the very safety you were trying to gain. The entire payoff is conditional on understanding the model. Solving real-world concurrency problems takes real concurrency knowledge, not pattern-matching.

## A quick word on WWDC26

The ergonomics keep getting better. Swift 6.4, released at WWDC26, smooths over some of the rough edges that made strict concurrency feel like a fight:

- You can now make **async calls in `defer` bodies** (SE-0493). Sounds small; matters a lot, because `defer` is exactly where you want guaranteed async cleanup (closing a resource, flushing a buffer) on every exit path.
- The **`~Sendable`** annotation from pattern 3 (intentional non-`Sendable` types, without closing off subclass conformance) is excellent hygiene for public APIs.

And Xcode 27's tooling keeps closing the gap between "the compiler complained" and "I understand why": the Swift Concurrency instrument now surfaces async task scheduling, actor contention, and thread usage; a new LLDB `swift task tree` command prints the live tree of running tasks when something deadlocks; and because Xcode 27 is an MCP host, agents like Claude can read those diagnostics directly to help you fix them. (The *flagging* still comes from the compiler; Swift 6.4 just sharpened its task and `Sendable` warnings.) None of this changes the core lesson. It just makes the right thing easier to do.

## Is it worth it?

Without hesitation. Teams that make this shift consistently push their crash-free rate up and keep it there, but the metric undersells it. The real win is that a whole genus of bug — the intermittent, timing-dependent, memory-corrupting, impossible-to-reproduce crash — stops being something you *debug*. It becomes something the compiler refuses to let you write.

That's what people miss when they frame Swift 6 concurrency as a performance feature. The speed is nice. The safety is the point. Once your code compiles under strict concurrency *and you understand why it compiles*, you've removed an entire category of memory bugs from your future — and that's worth every error message it takes to get there.

---

*Further reading: Apple's "Concurrency" chapter in The Swift Programming Language, and the `actors` and `Sendable` documentation; the official Swift 6 migration guide on swift.org; Swift Evolution SE-0493 (async calls in `defer` bodies); and Antoine van der Lee's "Swift 6.4: What's New in Concurrency" on SwiftLee.*
