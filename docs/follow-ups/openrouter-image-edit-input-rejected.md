# OpenRouter 대체 경로가 이미지 편집 모델의 입력 이미지를 거부함

`lib/ai/retouch-exhibit-photo.ts`의 대체 경로(OpenRouter, `google/gemini-2.5-flash-image`)가
이미지 입력을 받는 순간 항상 실패한다:

```
AI_APICallError: [Google AI Studio] Unable to process input image.
Please retry or report in https://developers.generativeai.google/guide/troubleshooting
```

- 관찰: 실제 브라우저 조작으로 재현했다. 같은 이미지, 같은 프롬프트로 기본 경로(Vercel AI
  Gateway)를 직접 호출하는 독립 스크립트 테스트는 성공해 실제 편집된 이미지를 반환했다
  (물건은 보존되고 배경만 지시한 스타일로 바뀜). 즉 입력 이미지 자체는 정상이다.
- 시도한 것: AI SDK의 `file` part에 이미지를 원본 바이트(`Uint8Array`)로 넘기는 방식과
  `data:image/png;base64,...` 데이터 URL 문자열로 넘기는 방식을 모두 시도했지만 OpenRouter
  경로에서는 동일한 오류가 재현됐다. 같은 경로에서 `maxOutputTokens` 상한이 없어 계정이
  감당 못 할 토큰을 요청하던 문제는 별도로 발견해 고쳤다(`maxOutputTokens: 8192`로 제한).
- 의심 원인: `@openrouter/ai-sdk-provider`가 이 이미지 편집 모델의 멀티모달 입력을
  OpenRouter/Google AI Studio가 기대하는 형식으로 정확히 변환하지 못하는 것으로 보인다.
  OpenRouter 공식 문서는 이 모델의 이미지 입력을 `input_references`라는 전용 필드(최대 3장,
  base64 데이터 URL 또는 HTTPS URL)로 받는다고 설명하는데, AI SDK의 범용 `generateText` +
  `file` part 경로가 이 필드로 매핑되지 않을 가능성이 있다.
- 제안: `@openrouter/ai-sdk-provider`의 최신 버전에서 이 모델에 대한 처리가 달라졌는지
  확인하거나, 이 모델에 한해 OpenRouter Chat Completions API를 직접 호출해
  `input_references` 필드로 이미지를 넘기는 별도 경로를 만든다. 급하지 않다면 대체 경로용
  이미지 편집 모델을 OpenRouter가 정말 지원을 확인한 다른 모델로 바꾸는 것도 방법이다.
- 영향: [retouch-exhibit-photo 스펙](../specs/retouch-exhibit-photo/spec.md)의 "기본 경로와
  대체 경로가 모두 실패하면 원본을 보존하고 재시도할 수 있다"는 수용 기준(6번)은 실제로
  만족한다(이 상황에서 실제로 원본이 보존되고 재시도 버튼이 그대로 동작함을 확인했다).
  다만 대체 경로가 사실상 항상 실패하므로, 기본 경로(Vercel AI Gateway)가 막히면 이 기능은
  현재 재시도로 복구되지 않는다.
