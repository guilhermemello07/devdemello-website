---
title: "What WWDC25 Means for Senior iOS Engineers"
description: "My notes from Apple Park: the APIs I am most excited about and the patterns I am rethinking."
pubDate: 2026-05-12
tags: ["Career", "SwiftUI", "Swift"]
draft: false
---

## The big shifts

WWDC25 was quieter on the surface than the Swift Concurrency or SwiftUI years — but the compounding effect of everything Apple shipped is substantial for senior engineers.

Three things I am rethinking after the week:

**1. SwiftUI is now the default, not the aspiration.** With UIKit interop fully stable, there is no good reason to start new screens in UIKit unless you are maintaining a large existing codebase.

**2. Structured concurrency patterns have settled.** The Swift team's guidance on actor isolation is clear enough that I can write a team style guide without hedging.

**3. Testing infrastructure grew up.** Swift Testing is now the obvious choice for new test targets.

```swift
import Testing

@Test("User login stores a valid token")
func loginStoresToken() async throws {
    let auth = AuthService(client: MockAPIClient())
    try await auth.login(email: "test@example.com", password: "correct")
    #expect(auth.currentToken != nil)
}
```

The macro-based assertion model is a genuine improvement over XCTest's `XCTAssert*` family. I am migrating incrementally and not looking back.
