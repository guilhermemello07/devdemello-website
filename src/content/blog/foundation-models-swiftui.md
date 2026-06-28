---
title: "Building AI-Powered Features with Foundation Models in SwiftUI"
description: "How to integrate on-device Foundation Models into a production SwiftUI app without sacrificing architecture."
pubDate: 2026-06-15
tags: ["Swift", "AI", "SwiftUI"]
draft: false
---

## On-device intelligence, done right

Apple's Foundation Models framework brings powerful on-device AI to Swift without a network round-trip. Here is how I wired it into a real production app while keeping the architecture clean.

The key insight is to isolate the model behind a protocol so your views never import the framework directly.

```swift
import FoundationModels

protocol SummarizationService {
    func summarize(_ text: String) async throws -> String
}

final class FoundationModelSummarizer: SummarizationService {
    private let model = SystemLanguageModel.default

    func summarize(_ text: String) async throws -> String {
        let session = LanguageModelSession()
        let prompt = "Summarize in one sentence: \(text)"
        let response = try await session.respond(to: prompt)
        return response.content
    }
}
```

Inject `SummarizationService` via the environment and your SwiftUI previews remain fast, testable, and framework-free. Full post coming when the NDA lifts.
