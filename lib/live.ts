import { createContext, useContext } from "react";

/** Is the 3D object this component belongs to currently on screen? Hidden objects stay built but skip their per-frame work. */
export const LiveCtx = createContext<{ current: boolean }>({ current: true });
export const useLive = () => useContext(LiveCtx);
