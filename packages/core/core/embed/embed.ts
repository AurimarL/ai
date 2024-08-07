import { Embedding, EmbeddingModel } from '../types';
import { EmbeddingTokenUsage } from '../types/token-usage';
import { retryWithExponentialBackoff } from '../util/retry-with-exponential-backoff';

/**
Embed a value using an embedding model. The type of the value is defined by the embedding model.

@param model - The embedding model to use.
@param value - The value that should be embedded.

@param maxRetries - Maximum number of retries. Set to 0 to disable retries. Default: 2.
@param abortSignal - An optional abort signal that can be used to cancel the call.
@param headers - Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.

@returns A result object that contains the embedding, the value, and additional information.
 */
export async function embed<VALUE>({
  model,
  value,
  maxRetries,
  abortSignal,
  headers,
}: {
  /**
The embedding model to use.
     */
  model: EmbeddingModel<VALUE>;

  /**
The value that should be embedded.
   */
  value: VALUE;

  /**
Maximum number of retries per embedding model call. Set to 0 to disable retries.

@default 2
   */
  maxRetries?: number;

  /**
Abort signal.
 */
  abortSignal?: AbortSignal;

  /**
Additional headers to include in the request.
Only applicable for HTTP-based providers.
 */
  headers?: Record<string, string>;
}): Promise<EmbedResult<VALUE>> {
  const retry = retryWithExponentialBackoff({ maxRetries });

  const modelResponse = await retry(() =>
    model.doEmbed({ values: [value], abortSignal, headers }),
  );

  return new EmbedResult({
    value,
    embedding: modelResponse.embeddings[0],
    usage: modelResponse.usage ?? { tokens: NaN },
    rawResponse: modelResponse.rawResponse,
  });
}

/**
The result of a `embed` call.
It contains the embedding, the value, and additional information.
 */
export class EmbedResult<VALUE> {
  /**
The value that was embedded.
   */
  readonly value: VALUE;

  /**
The embedding of the value.
  */
  readonly embedding: Embedding;

  /**
The embedding token usage.
  */
  readonly usage: EmbeddingTokenUsage;

  /**
Optional raw response data.
   */
  readonly rawResponse?: {
    /**
Response headers.
     */
    headers?: Record<string, string>;
  };

  constructor(options: {
    value: VALUE;
    embedding: Embedding;
    usage: EmbeddingTokenUsage;
    rawResponse?: { headers?: Record<string, string> };
  }) {
    this.value = options.value;
    this.embedding = options.embedding;
    this.usage = options.usage;
    this.rawResponse = options.rawResponse;
  }
}
