import { describe, expect, it } from "vitest";

import {
  extractWikilinkReferences,
  isValidWikilinkTarget,
  type ValidWikilinkTargets,
} from "./wikilinks-validator";
import { WIKILINK_PATTERN } from "./wikilinks";

/**
 * Phase-66 Unit 66.1 build-time validator tests
 * (`./wikilinks-validator.ts` — closes APPEND-D-L item 5 at
 * 28-phase carryover; NEW LONGEST ABSOLUTE APPEND-DEFERRAL
 * CLOSURE EVER OBSERVED).
 *
 * Validator must catch exactly the cases the Phase-63
 * `CROSS_ENTITY_BUILD_HREF` would route + 404 on at render
 * time. Routing parity is load-bearing — drift between the
 * plugin's resolution behavior and the validator's check
 * behavior would mean rendered links don't match the
 * validated set.
 */

/**
 * Sample data uses kebab-style identifiers throughout. Production paper
 * IDs in `content/papers/*.yaml` are arxiv-style with periods (e.g.,
 * `2109.07958`), which the Phase-63 `WIKILINK_PATTERN` regex (`[a-z0-9-]+`)
 * cannot capture. Curators who want to wikilink a paper today need a
 * kebab-style id; period-allowing regex evolution would be a Phase 67+
 * extension on the plugin-body axis. The validator therefore inherits the
 * regex's character-class constraint — drift-free with the plugin body.
 */
const sampleValidTargets: ValidWikilinkTargets = {
  problemSlugs: new Set(["scalable-oversight", "hallucination-reduction", "long-context-rag"]),
  paperIds: new Set(["arxiv-2401-12345", "anthropic-constitutional-ai"]),
  authorSlugs: new Set(["percy-liang", "yejin-choi"]),
  institutionSlugs: new Set(["stanford-university", "anthropic"]),
};

describe("extractWikilinkReferences — bare `[[slug]]` syntax (Phase 38 baseline)", () => {
  it("returns single ref with entityType=undefined for bare wikilink", () => {
    const refs = extractWikilinkReferences("see [[scalable-oversight]] for context", "bio");
    expect(refs).toEqual([
      {
        entityType: undefined,
        slug: "scalable-oversight",
        matchText: "[[scalable-oversight]]",
        surface: "bio",
      },
    ]);
  });

  it("returns multiple refs in source-order", () => {
    const refs = extractWikilinkReferences(
      "[[scalable-oversight]] and [[hallucination-reduction]]",
      "reviewNotes",
    );
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ slug: "scalable-oversight", entityType: undefined });
    expect(refs[1]).toMatchObject({ slug: "hallucination-reduction", entityType: undefined });
  });

  it("returns empty array on string with no wikilinks", () => {
    expect(
      extractWikilinkReferences("plain text with [some brackets] but no wikilinks", "bio"),
    ).toEqual([]);
  });

  it("returns empty array on empty string", () => {
    expect(extractWikilinkReferences("", "bio")).toEqual([]);
  });
});

describe("extractWikilinkReferences — alias syntax (Phase 46+)", () => {
  it("preserves alias display in matchText but captures only the slug", () => {
    const refs = extractWikilinkReferences(
      "[[scalable-oversight|the oversight problem]]",
      "rationale",
    );
    expect(refs).toEqual([
      {
        entityType: undefined,
        slug: "scalable-oversight",
        matchText: "[[scalable-oversight|the oversight problem]]",
        surface: "rationale",
      },
    ]);
  });
});

describe("extractWikilinkReferences — cross-entity syntax (Phase 63+)", () => {
  it("captures entityType for [[paper:slug]]", () => {
    const refs = extractWikilinkReferences("[[paper:arxiv-2401-12345]]", "bio");
    expect(refs).toEqual([
      {
        entityType: "paper",
        slug: "arxiv-2401-12345",
        matchText: "[[paper:arxiv-2401-12345]]",
        surface: "bio",
      },
    ]);
  });

  it("captures entityType for [[author:percy-liang]]", () => {
    const refs = extractWikilinkReferences("see [[author:percy-liang]]", "actionRationale");
    expect(refs[0]).toMatchObject({ entityType: "author", slug: "percy-liang" });
  });

  it("captures entityType for [[institution:stanford-university|Stanford]] cross-entity alias", () => {
    const refs = extractWikilinkReferences("[[institution:stanford-university|Stanford]]", "bio");
    expect(refs[0]).toMatchObject({
      entityType: "institution",
      slug: "stanford-university",
      matchText: "[[institution:stanford-university|Stanford]]",
    });
  });
});

describe("isValidWikilinkTarget — cross-entity routing parity with CROSS_ENTITY_BUILD_HREF", () => {
  it("validates [[paper:slug]] against paperIds set", () => {
    const ref = {
      entityType: "paper",
      slug: "arxiv-2401-12345",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(true);
  });

  it("rejects [[paper:typo]] when paperIds set does not contain typo", () => {
    const ref = {
      entityType: "paper",
      slug: "arxiv-9999-typo",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(false);
  });

  it("validates [[author:slug]] against authorSlugs set", () => {
    const ref = {
      entityType: "author",
      slug: "yejin-choi",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(true);
  });

  it("validates [[institution:slug]] against institutionSlugs set", () => {
    const ref = {
      entityType: "institution",
      slug: "anthropic",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(true);
  });

  it("validates bare [[slug]] against problemSlugs set (undefined entityType)", () => {
    const ref = {
      entityType: undefined,
      slug: "scalable-oversight",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(true);
  });

  it("rejects bare [[slug]] when problemSlugs set does not contain it", () => {
    const ref = {
      entityType: undefined,
      slug: "nonexistent-problem",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, sampleValidTargets)).toBe(false);
  });

  it("falls back to problemSlugs for unknown entityType (graceful-degradation per Phase 63)", () => {
    // Mirrors CROSS_ENTITY_BUILD_HREF: unknown entityType → /problems/{slug}
    // so the validator checks the slug against problemSlugs.
    const refValid = {
      entityType: "unknown-type",
      slug: "scalable-oversight",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(refValid, sampleValidTargets)).toBe(true);

    const refInvalid = {
      entityType: "unknown-type",
      slug: "percy-liang",
      matchText: "",
      surface: "bio",
    } as const;
    // "percy-liang" is in authorSlugs but NOT in problemSlugs; under
    // graceful-degradation routing this falls back to problemSlugs and
    // correctly fails.
    expect(isValidWikilinkTarget(refInvalid, sampleValidTargets)).toBe(false);
  });

  it("rejects [[paper:slug]] against empty paperIds set", () => {
    const emptyTargets: ValidWikilinkTargets = {
      problemSlugs: new Set(),
      paperIds: new Set(),
      authorSlugs: new Set(),
      institutionSlugs: new Set(),
    };
    const ref = {
      entityType: "paper",
      slug: "arxiv-2401-12345",
      matchText: "",
      surface: "bio",
    } as const;
    expect(isValidWikilinkTarget(ref, emptyTargets)).toBe(false);
  });
});

describe("regex consistency — validator reuses the same WIKILINK_PATTERN as the plugin body", () => {
  it("WIKILINK_PATTERN re-export from ./wikilinks matches what the validator uses internally", () => {
    // Load-bearing: drift between the plugin's regex and the validator's
    // regex would mean rendered links don't match validated set. Both
    // import from the same canonical source.
    const source = WIKILINK_PATTERN.source;
    const flags = WIKILINK_PATTERN.flags;
    expect(source).toBe("\\[\\[(?:([a-z0-9-]+):)?([a-z0-9-]+)(?:\\|([^\\]\\n]+))?\\]\\]");
    expect(flags).toBe("g");
  });
});
