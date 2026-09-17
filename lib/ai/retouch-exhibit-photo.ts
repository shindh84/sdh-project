import "server-only";
import { generateText, type LanguageModel } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// ai-gateway 결정: 사진 보정도 문구 생성과 같은 원칙을 따른다.
// Vercel AI Gateway를 기본 경로로, OpenRouter를 대체 경로로 쓴다.
const MODEL_ID = "google/gemini-2.5-flash-image";

type MuseumStyle = {
  label: string;
  instruction: string;
};

// retouch-exhibit-photo 스펙 가정: 참고 사진 세 장에서 착안한 스타일 세 가지를 기본값으로 둔다.
const MUSEUM_STYLES: MuseumStyle[] = [
  {
    label: "유리 진열장",
    instruction:
      "물건을 어두운 배경의 유리 진열장 안에 놓고 스포트라이트 조명을 받는 모습으로 바꿔라. 진열장 유리의 은은한 반사와 설명 라벨이 있을 법한 조명 느낌을 살려라.",
  },
  {
    label: "조명 받는 받침대",
    instruction:
      "물건을 단순한 그라데이션 배경 앞, 조명을 받는 받침대 위에 놓인 모습으로 바꿔라. 은은한 그림자와 스튜디오 조명을 살려라.",
  },
  {
    label: "박물관 전시실",
    instruction:
      "물건을 박물관 전시실 안 받침대나 진열대 위에 놓고, 배경으로 다른 전시물과 은은한 조명이 흐릿하게 보이는 모습으로 바꿔라.",
  },
];

function pickRandomStyle(): MuseumStyle {
  return MUSEUM_STYLES[Math.floor(Math.random() * MUSEUM_STYLES.length)];
}

function buildPrompt(style: MuseumStyle) {
  return `너는 사진 편집 전문가다. 첨부한 사진 속 물건을 실제 박물관에 전시된 소장품처럼 보이도록 배경과 분위기만 바꿔라.

절대 규칙:
- 물건 자체의 형태, 비율, 색, 재질, 표면의 흠집이나 특징은 원본과 똑같이 유지한다. 다른 물건으로 바뀌거나 형태가 달라지면 안 된다.
- 배경, 조명, 받침대나 진열장 같은 주변 맥락만 아래 지시대로 바꾼다.
- 그 외에는 아무것도 더하거나 지어내지 않는다.

지시: ${style.instruction}

결과는 수정된 사진 한 장으로만 응답한다.`;
}

export type RetouchInput = {
  imageBytes: Uint8Array;
  mediaType: string;
};

export type RetouchOutput = {
  imageBytes: Uint8Array;
  mediaType: string;
  styleLabel: string;
};

async function callModel(
  model: LanguageModel,
  input: RetouchInput,
  options?: { maxOutputTokens?: number },
): Promise<RetouchOutput> {
  const style = pickRandomStyle();
  const result = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(style) },
          { type: "file", data: input.imageBytes, mediaType: input.mediaType },
        ],
      },
    ],
    ...(options?.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
  });

  const imageFile = result.files.find((file) => file.mediaType?.startsWith("image/"));
  if (!imageFile) {
    throw new Error("AI가 보정된 이미지를 반환하지 않았습니다.");
  }

  return {
    imageBytes: imageFile.uint8Array,
    mediaType: imageFile.mediaType ?? "image/png",
    styleLabel: style.label,
  };
}

export async function retouchExhibitPhoto(input: RetouchInput): Promise<RetouchOutput> {
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
      // OpenRouter는 상한을 두지 않으면 이 계정이 감당할 수 없는 토큰 예산을 기본으로 요청한다.
      return await callModel(openrouter(MODEL_ID), input, { maxOutputTokens: 8192 });
    } catch (openRouterError) {
      throw new Error(
        `AI 사진 보정이 두 경로 모두에서 실패했습니다. gateway: ${String(gatewayError)}, openrouter: ${String(openRouterError)}`,
      );
    }
  }
}
