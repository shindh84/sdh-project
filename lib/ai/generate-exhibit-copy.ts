import "server-only";
import { generateObject, type LanguageModel } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { MOOD_LABEL, type Mood } from "@/lib/exhibits/types";

// ai-gateway 결정: 문구 생성은 Vercel AI Gateway를 기본 경로로, OpenRouter를 대체 경로로 쓴다.
// 모델 문자열을 그대로 넘기면 AI SDK가 기본으로 Vercel AI Gateway를 통해 호출한다.
const MODEL_ID = "anthropic/claude-sonnet-5";

const MOOD_INSTRUCTIONS: Record<Mood, string> = {
  playful:
    "장난기 있고 위트 있는 말투를 쓴다. 가벼운 농담과 과장된 비유를 적극 쓰되, 물건을 실제 박물관 소장품처럼 정중히 소개하는 태도는 유지한다.",
  warm: "다정하고 따뜻한 말투를 쓴다. 물건과 사용자가 함께한 시간을 애정 어린 시선으로 보되, 과장하지 않고 담담하게 적는다.",
  curator:
    "실제 박물관 도슨트가 소장품 설명 카드를 쓰듯 격식 있고 진지한 어조를 유지한다. 유머는 배제하고 분석적이며 위엄 있는 문장을 쓴다.",
};

const exhibitCopySchema = z.object({
  titles: z
    .array(z.string().min(1).max(60))
    .length(3)
    .describe("전시 제목 후보 세 개. 서로 다른 표현이어야 한다."),
  description: z.string().min(1).max(1200).describe("전시 설명 한 편."),
});

export type ExhibitCopy = z.infer<typeof exhibitCopySchema>;

export type ExhibitCopyInput = {
  itemName: string;
  story: string;
  mood: Mood;
  period?: string;
  feature?: string;
};

function buildPrompt(input: ExhibitCopyInput) {
  const facts = [
    `물건 이름: ${input.itemName}`,
    `사연: ${input.story}`,
    input.period ? `사용 기간: ${input.period}` : null,
    input.feature ? `특별한 특징: ${input.feature}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const system = `너는 "평범한 물건 박물관"이라는 서비스의 전속 큐레이터다. 사용자가 건넨 평범한 물건 하나를 마치 박물관에 전시된 예술품인 것처럼 소개하는 전시 제목 후보 3개와 설명 한 편을 짓는다.

절대 규칙:
- 사용자가 알려준 사실 밖의 어떤 구체적 사실도 지어내지 않는다. 구매 연도, 준 사람, 장소, 가격처럼 사용자가 적지 않은 정보는 등장시키지 않는다.
- 사용자가 사연이나 선택 항목에 적은 사용 기간과 특징은 자유롭게 활용해도 된다.
- 문체: ${MOOD_INSTRUCTIONS[input.mood]} (분위기 이름: ${MOOD_LABEL[input.mood]})
- 평범한 물건을 박물관 소장품처럼 다루는 큐레이터 어조를 항상 유지한다.
- 한국어로 쓴다.`;

  const prompt = `${facts}\n\n위 정보만 근거로 삼아 전시 제목 후보 3개와 설명 한 편을 써줘.`;

  return { system, prompt };
}

async function callModel(model: LanguageModel, input: ExhibitCopyInput) {
  const { system, prompt } = buildPrompt(input);
  const { object } = await generateObject({
    model,
    schema: exhibitCopySchema,
    system,
    prompt,
    maxOutputTokens: 2000,
  });
  return object;
}

export async function generateExhibitCopy(
  input: ExhibitCopyInput,
): Promise<ExhibitCopy> {
  try {
    // 모델 문자열만 넘기면 AI SDK가 Vercel AI Gateway로 라우팅한다 (AI_GATEWAY_API_KEY 사용).
    return await callModel(MODEL_ID, input);
  } catch (gatewayError) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw gatewayError;
    }
    try {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      return await callModel(openrouter(MODEL_ID), input);
    } catch (openRouterError) {
      throw new Error(
        `AI 문구 생성이 두 경로 모두에서 실패했습니다. gateway: ${String(gatewayError)}, openrouter: ${String(openRouterError)}`,
      );
    }
  }
}
