import type { LiveWorkoutDisplay } from "./types";

export const liveDisplay: LiveWorkoutDisplay = {
  async requestPermission() {
    return true;
  },
  async show() {},
  async hide() {},
  addActionListener() {
    return () => {};
  },
};
