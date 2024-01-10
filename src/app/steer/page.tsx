"use client";

import useRTCConnection from "@/app/_hooks/useRTCConnection";
import {useEffect, useRef, useState} from "react";
import styled from "styled-components";
import useGameContext, {GameContext} from "@/app/_contexts/IGameContext";
import {createQRCode} from "@/app/_utils/connection";
import RTCQRCodes from "@/app/_components/steer/RTCQRCodes";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export default function Steer() {
  const game = useGameContext();

  const connection = useRTCConnection();
  const video = useRef(document.createElement('video'));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [[qr1, qr2], setQR] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [state, setState] = useState<"displayingQr1" | "displayingQr2" | "capturingQr" | "connecting">("displayingQr1");

  useEffect(() => {
    connection.startPeerConnection();
  }, []);

  useEffect(() => {
    if (!game.localSdp) {
      return;
    }
    (async () => {
      setQR(await createQRCode(game.localSdp!));
    })();
  }, [game.localSdp]);

  return (
    <GameContext.Provider value={game}>
      <RTCQRCodes />
    </GameContext.Provider>
  )
}