import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { env } from "@/lib/env";
import { EMBED_DIMENSIONS } from "@/lib/rag/constants";
import type { PreparedChunk } from "@/lib/rag/extract";

function getEmbeddingModel() {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }

  return google.embeddingModel(env.GEMINI_EMBED_MODEL);
}

function buildProviderOptions(chunks: PreparedChunk[]) {
  const hasMultimodal = chunks.some((chunk) => chunk.inlineData != null);
  if (!hasMultimodal) {
    return {
      google: {
        outputDimensionality: EMBED_DIMENSIONS,
      },
    };
  }

  return {
    google: {
      outputDimensionality: EMBED_DIMENSIONS,
      content: chunks.map((chunk) =>
        chunk.inlineData
          ? [
              {
                inlineData: {
                  mimeType: chunk.inlineData.mimeType,
                  data: chunk.inlineData.data,
                },
              },
            ]
          : null,
      ),
    },
  };
}

export async function embedChunks(
  chunks: PreparedChunk[],
): Promise<number[][]> {
  if (chunks.length === 0) {
    return [];
  }

  const model = getEmbeddingModel();
  const values = chunks.map((chunk) => chunk.content);
  const providerOptions = buildProviderOptions(chunks);

  if (chunks.length === 1) {
    const { embedding } = await embed({
      model,
      value: values[0] ?? "",
      providerOptions,
    });
    return [embedding];
  }

  const { embeddings } = await embedMany({
    model,
    values,
    providerOptions,
  });

  return embeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: EMBED_DIMENSIONS,
      },
    },
  });

  return embedding;
}
