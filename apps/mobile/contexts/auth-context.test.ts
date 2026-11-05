import { getSignInErrorMessage } from "./auth-context";

describe("getSignInErrorMessage", () => {
  it("未確認 error をメール再送と Web 継続の案内へ変換する", () => {
    expect(
      getSignInErrorMessage(403, { code: "EMAIL_NOT_VERIFIED" }),
    ).toContain("確認メールを再送しました");
    expect(
      getSignInErrorMessage(403, { code: "EMAIL_NOT_VERIFIED" }),
    ).toContain("Web で開いて");
  });

  it("配送失敗では成功を断定せず再試行を案内する", () => {
    const message = getSignInErrorMessage(503, {
      code: "EMAIL_DELIVERY_UNAVAILABLE",
    });
    expect(message).toContain("送信できませんでした");
    expect(message).not.toContain("再送しました");
  });
});
