---
title: "Clean Architecture in Swift: A Practical 2026 Guide"
description: "Protocols, dependency injection, and testable modules — the structure I reach for on every new project."
pubDate: 2026-05-28
tags: ["Swift", "Architecture"]
draft: false
---

## Why architecture still matters in 2026

With Swift Concurrency mature and SwiftData stable, the plumbing is largely solved. The hard part is still the same: keeping your domain logic free from framework coupling.

Here is the folder structure I default to:

```swift
// Domain layer — zero UIKit, zero SwiftData imports
struct FetchUserPostsUseCase {
    let repository: PostRepository

    func execute(userID: UserID) async throws -> [Post] {
        try await repository.posts(for: userID)
    }
}

// Repository protocol lives in the domain layer
protocol PostRepository: Sendable {
    func posts(for userID: UserID) async throws -> [Post]
}
```

The concrete SwiftData implementation lives in the data layer and conforms to `PostRepository`. Tests mock the protocol, not the database. Boring and reliable — exactly what you want in a production app.
