/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  endOfLine: "lf",
  // Don't rewrap markdown prose — Keep-a-Changelog formatting in CHANGELOG.md
  // and the long ADR / THINK docs care about line breaks for diffability.
  proseWrap: "preserve",
  plugins: ["prettier-plugin-tailwindcss"],
};
