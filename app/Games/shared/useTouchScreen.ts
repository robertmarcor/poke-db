import { useSyncExternalStore } from "react";

const noChange = () => () => {};
const isTouchScreen = () => matchMedia("(pointer: coarse)").matches;

// Whether the device is a touch screen. Read straight from the browser (it is
// not state we set); a device doesn't change, so there is nothing to listen for.
// false on the server, where there is no browser to ask.
export const useTouchScreen = () => useSyncExternalStore(noChange, isTouchScreen, () => false);
