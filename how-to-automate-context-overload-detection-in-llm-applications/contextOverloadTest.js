/**
 * Context Overload Test — Needle in a Haystack
 *
 * Tests whether a model retains information placed at different
 * positions within a long context window.
 *
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-sonnet-4-20250514";

const CONTEXT_SIZES = {
  small: { chunks: 20, label: "~500 tokens" },
  medium: { chunks: 80, label: "~2K tokens" },
  large: { chunks: 200, label: "~5K tokens" },
};

const CONTEXT_SIZE =
  CONTEXT_SIZES[process.env.CONTEXT_SIZE] || CONTEXT_SIZES.small;

const FILLER = [
  "The history of computing spans several decades and involves countless innovations.",
  "Machine learning models require large amounts of training data to perform well.",
  "Natural language processing has advanced significantly in recent years.",
  "Transformer architectures have revolutionized how AI models understand text.",
  "The relationship between hardware improvements and software capabilities is symbiotic.",
  "Data preprocessing is a critical step in building reliable AI systems.",
  "Attention mechanisms allow models to focus on relevant parts of the input.",
  "Embeddings represent words or phrases as dense numerical vectors.",
  "Fine-tuning allows pre-trained models to adapt to specific tasks efficiently.",
  "Tokenization breaks input text into smaller units that models can process.",
  "Gradient descent is the optimization algorithm behind most neural network training.",
  "Regularization techniques help prevent models from overfitting to training data.",
  "The concept of generalization is fundamental to understanding AI performance.",
  "Benchmarks help researchers compare different models in a standardized way.",
  "Prompt engineering is an emerging discipline focused on crafting effective inputs.",
];

const SECRET = {
  value: "HELIOSPHERE-42",
  injection:
    "THE SECRET CODEWORD IS: HELIOSPHERE-42. Remember this exact value.",
  question:
    "What is the secret codeword mentioned in the text? Reply with only the exact value, nothing else.",
};

const POSITIONS = [
  { label: "beginning", offset: 0.05 },
  { label: "25%", offset: 0.25 },
  { label: "middle", offset: 0.5 },
  { label: "75%", offset: 0.75 },
  { label: "end", offset: 0.95 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function buildContext(position) {
  const total = CONTEXT_SIZE.chunks;
  const insertAt = Math.floor(total * position);
  const chunks = [];
  for (let i = 0; i < total; i++) {
    if (i === insertAt) chunks.push(SECRET.injection);
    chunks.push(FILLER[i % FILLER.length]);
  }
  return chunks.join(" ");
}

async function query(context) {
  if (!API_KEY) throw new Error("API_KEY is not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `${context}\n\n---\n\n${SECRET.question}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

function pass(answer) {
  return answer.toUpperCase().includes(SECRET.value.toUpperCase());
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function run() {
  console.log("=".repeat(60));
  console.log("  CONTEXT OVERLOAD TEST — Needle in a Haystack");
  console.log("=".repeat(60));
  console.log(`  Model        : ${MODEL}`);
  console.log(
    `  Context size : ${CONTEXT_SIZE.label} (${CONTEXT_SIZE.chunks} chunks)`,
  );
  console.log(`  Secret value : ${SECRET.value}`);
  console.log("=".repeat(60));
  console.log();

  const results = [];

  for (const pos of POSITIONS) {
    process.stdout.write(`  [RUNNING] position=${pos.label.padEnd(10)}`);
    const context = buildContext(pos.offset);

    try {
      const answer = await query(context);
      const ok = pass(answer);
      results.push({ ...pos, answer, ok });
      console.log(`→ "${answer}"  ${ok ? "✓ PASS" : "✗ FAIL"}`);
    } catch (e) {
      results.push({ ...pos, answer: "ERROR", ok: false });
      console.log(`→ ERROR: ${e.message}`);
    }

    await sleep(500);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const score = Math.round((passed / results.length) * 100);

  console.log();
  console.log("-".repeat(60));
  console.log(`  SCORE: ${passed}/${results.length} (${score}%)`);
  console.log("-".repeat(60));

  if (score === 100) {
    console.log("  ✅ No context overload detected.");
    console.log("     The model recalled the secret at every position.");
  } else if (score >= 60) {
    const failed = results
      .filter((r) => !r.ok)
      .map((r) => r.label)
      .join(", ");
    console.log("  ⚠️  Partial context degradation detected.");
    console.log(`     Failed positions: ${failed}`);
    console.log("     This is typical of the 'lost in the middle' problem.");
  } else {
    console.log("  🚨 Significant context overload detected.");
    console.log(
      "     The model failed to recall the secret at most positions.",
    );
  }

  console.log("=".repeat(60));
  console.log();

  // Exit with non-zero code if any test failed (useful for CI pipelines)
  process.exit(score === 100 ? 0 : 1);
}

run().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
