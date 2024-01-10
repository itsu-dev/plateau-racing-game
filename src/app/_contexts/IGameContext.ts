import {createContext, useEffect, useRef, useState} from "react";
import * as CANNON from "cannon-es";

type States = "displayingQr" | "displayingQr1" | "displayingQr2" | "capturingQr" | "connected" | "disconnected" | "connecting";
export type IGameContext = {
  steerAngle: number;
  setSteerAngle: (angle: number) => void;

  isAccelerating: boolean;
  setAccelerating: (accelerating: boolean) => void;

  isBraking: boolean;
  setBraking: (braking: boolean) => void;

  isStarted: boolean;
  setStarted: (started: boolean) => void;

  localSdp: string | undefined;
  setLocalSdp: (sdp: string | undefined) => void;

  remoteSdp: string | undefined;
  setRemoteSdp: (sdp: string | undefined) => void;

  state: States;
  setState: (state: States) => void;

  groundMaterial: CANNON.Material;
}

const defaultGameContext: IGameContext = {
  steerAngle: 0,
  setSteerAngle: () => {},
  isAccelerating: false,
  setAccelerating: () => {},
  isBraking: false,
  setBraking: () => {},
  isStarted: false,
  setStarted: () => {},
  localSdp: undefined,
  setLocalSdp: () => {},
  remoteSdp: undefined,
  setRemoteSdp: () => {},
  state: "displayingQr",
  setState: () => {},
  groundMaterial: new CANNON.Material("groundMaterial"),
}

export const GameContext = createContext<IGameContext>(defaultGameContext);

export default function useGameContext(): IGameContext {
  const [steerAngle, setSteerAngle] = useState(0);
  const [isAccelerating, setAccelerating] = useState(false);
  const [isBraking, setBraking] = useState(false);
  const [isStarted, setStarted] = useState(false);
  const [localSdp, setLocalSdp] = useState<string | undefined>(undefined);
  const [remoteSdp, setRemoteSdp] = useState<string | undefined>(undefined);
  const [state, setState] = useState<States>("displayingQr");
  const groundMaterial = useRef(new CANNON.Material("groundMaterial")).current;

  useEffect(() => {
    groundMaterial.restitution = 1.0;
  }, []);

  return {
    steerAngle, setSteerAngle,
    isAccelerating, setAccelerating,
    isBraking, setBraking,
    isStarted, setStarted,
    localSdp, setLocalSdp,
    remoteSdp, setRemoteSdp,
    state, setState,
    groundMaterial,
  }
}