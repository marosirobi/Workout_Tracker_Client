import "i18next";
import type { hu } from "./hu";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof hu;
    };
  }
}
