import { NativeModule, requireOptionalNativeModule } from "expo";

import type {
    WorkoutNotificationData,
    WorkoutNotificationEvents,
} from "./WorkoutNotification.types";

declare class WorkoutNotificationModule extends NativeModule<WorkoutNotificationEvents> {
  show(data: WorkoutNotificationData): void;
  hide(): void;
  canUsePromoted(): boolean;
  openPromotedSettings(): void;
}

export default requireOptionalNativeModule<WorkoutNotificationModule>(
  "WorkoutNotification",
);
