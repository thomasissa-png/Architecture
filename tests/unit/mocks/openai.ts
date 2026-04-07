/**
 * Reusable OpenAI mock factory for unit tests.
 *
 * Usage:
 *   import { vi } from "vitest";
 *   import { mockOpenAI } from "../mocks/openai";
 *   vi.mock("openai", () => mockOpenAI({ chatJson: { ... } }));
 */
import { vi } from "vitest";

export interface MockOpenAIOptions {
  /** Object returned as JSON-stringified content from chat.completions.create */
  chatJson?: unknown;
  /** Plain string content (overrides chatJson) */
  chatContent?: string;
  /** If true, chat.completions.create throws */
  chatThrows?: boolean;
  /** If set, chat.completions.create hangs longer than this many ms */
  chatHangMs?: number;
  /** Mock for responses.create (gpt-image-1.5 image generation tool) */
  imageBase64?: string;
  /** If true, responses.create throws */
  responsesThrows?: boolean;
}

export function mockOpenAI(opts: MockOpenAIOptions = {}) {
  const chatCreate = vi.fn(async () => {
    if (opts.chatThrows) {
      throw new Error("Mock OpenAI chat error");
    }
    if (opts.chatHangMs) {
      await new Promise((r) => setTimeout(r, opts.chatHangMs));
    }
    const content = opts.chatContent ?? JSON.stringify(opts.chatJson ?? {});
    return {
      choices: [{ message: { content } }],
    };
  });

  const responsesCreate = vi.fn(async () => {
    if (opts.responsesThrows) {
      throw new Error("Mock OpenAI responses error");
    }
    return {
      output: [
        {
          type: "image_generation_call",
          result: opts.imageBase64 ?? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
        },
      ],
    };
  });

  const OpenAIClass = vi.fn().mockImplementation(() => ({
    chat: { completions: { create: chatCreate } },
    responses: { create: responsesCreate },
  }));

  return {
    default: OpenAIClass,
    __chatCreate: chatCreate,
    __responsesCreate: responsesCreate,
  };
}

/** Tiny 1×1 transparent PNG base64 — usable as fake input image. */
export const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";
