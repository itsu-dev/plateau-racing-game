import {useCallback, useEffect, useRef, useState} from "react";
import {
  TYPE_ACCELERATOR_DOWN,
  TYPE_ACCELERATOR_UP,
  TYPE_BRAKE_DOWN,
  TYPE_BRAKE_UP,
  TYPE_STEER
} from "@/app/_hooks/useRTCConnection";

export default function useController(send: (data: any) => void) {
  const onDeviceMotion = useCallback((e: DeviceOrientationEvent) => {
    send({
      type: TYPE_STEER,
      degree: e.beta
    })
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
  }
}