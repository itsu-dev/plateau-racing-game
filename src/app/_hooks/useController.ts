import {useCallback, useEffect, useRef, useState} from "react";

const TYPE_ACCELERATOR_DOWN = 0;
const TYPE_ACCELERATOR_UP = 1;
const TYPE_BRAKE_DOWN = 2;
const TYPE_BRAKE_UP = 3;

export default function useController(send: (data: any) => void) {
  const [gamma, _setGamma] = useState<number>(0);
  const setGamma = useRef(_setGamma);

  const onDeviceMotion = useCallback((e: DeviceOrientationEvent) => {
    alert(e);
    setGamma.current(e.gamma ?? 0);
  }, []);

  useEffect(() => {
    window.addEventListener("deviceorientation", onDeviceMotion);
    return () => {
      window.removeEventListener("deviceorientation", onDeviceMotion);
    }
  }, []);

  const onAcceleratorDown = useCallback(() => {
    send({type: TYPE_ACCELERATOR_DOWN});
  }, [send]);

  const onAcceleratorUp = useCallback(() => {
    send({type: TYPE_ACCELERATOR_UP});
  }, [send]);

  const onBrakeDown = useCallback(() => {
    send({type: TYPE_BRAKE_DOWN});
  }, [send]);

  const onBrakeUp = useCallback(() => {
    send({type: TYPE_BRAKE_UP});
  }, [send]);

  return {
    onAcceleratorDown,
    onAcceleratorUp,
    onBrakeDown,
    onBrakeUp,
    gamma
  }
}