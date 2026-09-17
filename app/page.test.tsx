import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 제품 소개와 전시 시작 링크를 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "평범한 물건 박물관" })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /내 물건 전시하기/ })).toHaveAttribute(
    "href",
    "/exhibits/new"
  );
});
