import {createContext, useRef, useState} from "react";

type States = "displayingQr" | "capturingQr" | "start" | "connecting";
export type IGameContext = {
  steerAngle: number;
  isAccelerating: boolean;
  isBraking: boolean;

  isStarted: boolean;
  setStarted: (started: boolean) => void;

  localSdp: string | undefined;
  setLocalSdp: (sdp: string | undefined) => void;

  remoteSdp: string | undefined;
  setRemoteSdp: (sdp: string | undefined) => void;

  state: States;
  setState: (state: States) => void;
}

const defaultGameContext: IGameContext = {
  steerAngle: 0,
  isAccelerating: false,
  isBraking: false,
  isStarted: false,
  setStarted: () => {},
  localSdp: undefined,
  setLocalSdp: () => {},
  remoteSdp: undefined,
  setRemoteSdp: () => {},
  state: "displayingQr",
  setState: () => {},
}

export const GameContext = createContext<IGameContext>(defaultGameContext);

export default function useGameContext(): IGameContext {
  const steerAngle = useRef(0);
  const isAccelerating = useRef(false);
  const isBraking = useRef(false);
  const [isStarted, setStarted] = useState(false);
  const [localSdp, setLocalSdp] = useState<string | undefined>(undefined);
  const [remoteSdp, setRemoteSdp] = useState<string | undefined>(undefined);
  const [state, setState] = useState<States>("displayingQr");

  return {
    steerAngle: steerAngle.current,
    isAccelerating: isAccelerating.current,
    isBraking: isBraking.current,
    isStarted, setStarted,
    localSdp, setLocalSdp,
    remoteSdp, setRemoteSdp,
    state, setState,
  }
}