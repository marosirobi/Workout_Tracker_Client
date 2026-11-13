import {
  checkPassword,
  getPasswordChecks,
  isValidEmail,
  PASSWORD_MAX_LENGTH,
} from "@/utils/authValidation";

describe("checkPassword", () => {
  test.each([
    ["Password1!", null],
    ["Árvíztűrő9_", null],
    ["Ab1!", "tooShort"],
    ["Aa1!" + "a".repeat(PASSWORD_MAX_LENGTH), "tooLong"],
    ["12345678!", "noLetter"],
    ["Passwordd!", "noDigit"],
    ["Password123", "noSpecial"],
    ["Password 123", "noSpecial"],
  ])("%s -> %s", (password, expected) => {
    expect(checkPassword(password)).toBe(expected);
  });
});

describe("getPasswordChecks", () => {
  test("empty password fails every check", () => {
    expect(getPasswordChecks("")).toEqual({
      length: false,
      letter: false,
      digit: false,
      special: false,
    });
  });

  test("checks are independent", () => {
    expect(getPasswordChecks("abc1")).toEqual({
      length: false,
      letter: true,
      digit: true,
      special: false,
    });
  });

  test("strong password passes every check", () => {
    expect(Object.values(getPasswordChecks("Password1!"))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});

describe("isValidEmail", () => {
  test.each([
    ["user@gmail.com", true],
    ["first.last@sub.domain.hu", true],
    ["user@gmail", false],
    ["user gmail.com", false],
    ["@gmail.com", false],
    ["user@@gmail.com", false],
    ["", false],
  ])("%s -> %s", (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});
