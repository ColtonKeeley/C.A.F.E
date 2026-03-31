# V.I.S.O.R. 🛡️
### Visual Ingestion, Semantic Operations & Relational Labeling

> **Status: Pre-implementation RFC** — This document describes the proposed architecture for V.I.S.O.R. We are actively seeking collaborators, critique, and early contributors. No stable implementation exists yet.

V.I.S.O.R. is a proposed open-source framework that frames **local file classification as a vision problem**. Rather than feeding raw text into an LLM, V.I.S.O.R. renders files—emails, binaries, invoices, source code—into pixel-space and passes them through a Vision-Language Model (VLM) pipeline alongside structural pre-processing filters. The goal: classification that is faster, more private, and structurally-aware than text-only approaches, runnable on consumer-grade hardware.

---

## Motivation

Text-only LLM classifiers strip away a dimension of signal: the *visual structure* of a document. An email's layout, an invoice's tabular alignment, a binary's byte-density heatmap—these carry semantic information that tokenization discards.

Existing multimodal approaches either:
- Require cloud APIs (privacy concern, cost, latency), or
- Apply static image classification without grounding the visual representation in the file's underlying semantics

V.I.S.O.R. proposes a third path: **render the raw source, label from the render, and keep the two in sync.**

---

## Core Concept: The Synchronized Dual-Stream Pipeline

The central mechanism is a **Dual-Stream pipeline** that maintains a synchronized relationship between a file's raw source and its visual representation:

```
┌─────────────────────────────────────────────────────┐
│              Synchronized Dual-Stream                │
│                                                     │
│  Stream 1 (Raw Source)                              │
│  ├── Original file (HTML, .eml, binary, etc.)       │
│  └── Mutation applied (e.g., price jitter, padding) │
│                         │                           │
│                         ▼                           │
│  Stream 2 (Visual Render)                           │
│  ├── Re-render to PNG after each mutation           │
│  └── Ground-truth label updated atomically          │
└─────────────────────────────────────────────────────┘
```

**Why this matters for training data quality:**

Standard augmentation pipelines (random crop, flip, color jitter) operate purely in pixel-space and can break the semantic correspondence between an image and its label. For example, cropping an invoice image might remove the price field—but the label `$45.50` remains unchanged.

V.I.S.O.R. inverts this: mutations happen at the *source level*, and the render follows deterministically. This produces **counterfactual training pairs** where label accuracy is guaranteed by construction, not by annotation. The model must learn to associate visual layout features with semantic values rather than memorizing superficial pixel patterns. [citation needed]

This is related to work on **Multimodal Counterfactual Data Augmentation (CDA)**—specifically, extending text-space counterfactuals into the visual-structural domain. [citation needed]

---

## Proposed Architecture

### Phase 1 — C.A.F.E. Factory (Dataset Construction)

> *Collect · Augment · Filter · Export*

The C.A.F.E. Factory is the dataset construction backbone.

| Stage | Description |
|-------|-------------|
| **Collect** | Byte-to-image rendering for arbitrary file types. Any file becomes a fixed-resolution PNG via format-specific renderers. |
| **Augment** | Community-contributed Dual-Stream plugins perform *semantic jitter*—source-level mutations with deterministic label propagation. Example: an HTML price jitterer that rewrites a `<span>` value and re-renders. |
| **Filter** | Convolutional pre-processing (Sobel edge detection, Gabor filters) applied before VLM inference to surface structural features—borders, columns, table grids—that are otherwise low-contrast in raw renders. [citation needed] |
| **Export** | Multi-label support with Fast-Track import for existing annotated datasets (COCO, FUNSD, RVL-CDIP, etc.) |

### Phase 2 — Relational Specialization

Once a labeled dataset exists, Phase 2 focuses on building **relational structure** across documents:

- **Fine-tuned local VLMs**: Target [Qwen2-VL](https://github.com/QwenLM/Qwen2-VL) or similar open-weight models, fine-tuned on domain-specific visual textures (e.g., your company's invoice layout vs. a generic one).
- **Relational Linker**: A graph-construction module that links semantically related files into timelines or chains. Example: monthly subscription invoices from the same vendor → unified visual history.

This phase is designed to enable use cases like the one V.I.S.O.R. was originally built for: **subscription tracking via email ingestion**, where the same vendor sends structurally similar emails over time.

---

## Why Local VLMs, Not GPT-4o?

| Concern | Cloud API | V.I.S.O.R. (Local) |
|--------|-----------|---------------------|
| Privacy | Sends raw files off-device | Fully local inference |
| Latency | Network-bound | RAM/VRAM-bound |
| Cost | Per-token pricing | One-time hardware cost |
| Control | Model updates silently | Pinned model weights |
| Fine-tuning | Limited / expensive | Full access |

The tradeoff is capability: frontier VLMs outperform local models on out-of-distribution inputs. V.I.S.O.R.'s hypothesis is that domain-specific fine-tuning on structurally-grounded data closes this gap for narrow classification tasks. [citation needed]

---

## Open Questions (We Want Your Input)

This is a pre-implementation RFC. The following design decisions are unresolved:

1. **Renderer selection**: Format-specific renderers (Puppeteer for HTML, `python-docx` for DOCX) vs. a unified byte-visualization approach (e.g., Binvis-style space-filling curves for binaries). What's the right abstraction boundary?

2. **Convolutional filter placement**: Should Sobel/Gabor filters be applied as a pre-processing step before the VLM, or is it better to fine-tune the VLM's vision encoder directly on raw renders and let it learn structural features implicitly?

3. **Counterfactual pair diversity**: How many mutations per source document are needed before marginal returns on robustness diminish? Is there existing literature on this for document understanding specifically? [citation needed]

4. **Relational Linker graph structure**: Temporal chains are the obvious starting point, but what's the right graph schema for more complex relationships (e.g., a subscription that changes vendors mid-timeline)?

---

## Roadmap

- [ ] `v0.1` — Dual-Stream Price Jitterer (HTML → PNG, reference implementation)
- [ ] `v0.1` — Byte-to-image renderer for `.eml` / MIME files
- [ ] `v0.2` — C.A.F.E. Factory CLI
- [ ] `v0.3` — Sobel/Gabor pre-processing pipeline
- [ ] `v0.4` — Qwen2-VL fine-tuning scaffold
- [ ] `v0.5` — Relational Linker (temporal chains)
- [ ] `v1.0` — Benchmarks against text-only baselines on RVL-CDIP / FUNSD

---

## Contributing

V.I.S.O.R. is designed to be modular. The highest-leverage areas for early contribution:

- **Dual-Stream plugins**: Write a semantic jitterer for a new file type (PDF prices, calendar `.ics` dates, CSV numeric fields)
- **Renderer implementations**: Extend byte-to-image coverage to new formats
- **Literature review**: Help fill in the `[citation needed]` gaps above—especially around CDA for document understanding and optimal counterfactual pair counts

Open an issue to propose a plugin or start a discussion.

---

## Related Work

- [RVL-CDIP](https://adamharley.com/rvl-cdip/) — Document image classification benchmark
- [FUNSD](https://guillaumejaume.github.io/FUNSD/) — Form understanding in noisy scanned documents
- [Qwen2-VL](https://github.com/QwenLM/Qwen2-VL) — Target local VLM for fine-tuning
- [DocFormer](https://arxiv.org/abs/2106.11539) — Multimodal transformer for document understanding
- Counterfactual Data Augmentation in NLP [citation needed] — foundational CDA methodology this extends

---

## License

MIT
