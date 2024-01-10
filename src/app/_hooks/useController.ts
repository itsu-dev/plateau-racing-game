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
    // @ts-ignore
    if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ の Safari
      // 許可を取得
      // @ts-ignore
      DeviceOrientationEvent.requestPermission().then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener("deviceorientation", onDeviceMotion);
          } else {
            alert("許可が必要です！");
          }
        })
        .catch(console.error) // https通信でない場合などで許可を取得できなかった場合
    } else {
      window.addEventListener("deviceorientation", onDeviceMotion);
    }

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