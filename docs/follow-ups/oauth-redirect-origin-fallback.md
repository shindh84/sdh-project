# Google 로그인 리다이렉트 URL의 origin 폴백이 스킴을 잃을 수 있음

`lib/auth/actions.ts`의 `signInWithGoogleAction`에서 `origin`을
`headerList.get("origin") ?? headerList.get("x-forwarded-host")`로 구한다.
`origin` 헤더는 스킴을 포함하지만(`https://example.com`) `x-forwarded-host`는
호스트만 담고 있어(`example.com`), 이 폴백이 실제로 쓰이면
`redirectTo`가 `example.com/auth/callback?...`처럼 스킴 없는 문자열이 되어
OAuth 리다이렉트가 깨질 수 있다.

- 관찰: 코드 리뷰로 발견. 현재 로컬 개발과 실제 브라우저 로그인 흐름에서는
  모든 요청에 `origin` 헤더가 존재해 이 분기가 실제로 실행되는 것을
  재현하지는 못했다(최신 브라우저는 same-origin POST에도 Origin을 보낸다).
- 의심 원인: 일부 프록시나 로드밸런서가 `Origin` 헤더를 제거하고
  `x-forwarded-host`만 남기는 경우.
- 시도한 것: 없음 — 재현되지 않는 엣지 케이스라 이번 구현 범위에서는
  고치지 않았다(검증·리뷰 예산: 스펙이 요구하지 않는 엣지케이스 방어는 범위 밖).
- 제안: `x-forwarded-proto` 헤더(또는 기본값 `https`)를 함께 읽어
  `${proto}://${host}` 형태로 조합하거나, `request.nextUrl.origin`처럼
  이미 스킴이 포함된 다른 소스로 대체한다.
