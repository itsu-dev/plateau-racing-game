import useRTCConnection from "@/app/_hooks/useRTCConnection";
import {useContext, useEffect, useRef, useState} from "react";
import {createQRCode} from "@/app/_utils/connection";
import styled from "styled-components";
import QRCard from "@/app/_components/game/QRCard";
import Button from "@/app/_components/game/Button";
import {GameContext} from "@/app/_contexts/IGameContext";
import jsQR from "jsqr";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
`;

export default function RTCQRCodes() {
  const game = useContext(GameContext);
  const connection = useRTCConnection();
  const video = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [[qr1, qr2], setQR] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [state, setState] = useState<"displayingQr1" | "displayingQr2" | "capturingQr" | "connecting">("capturingQr");

  useEffect(() => {
    video.current = document.createElement('video');
  }, []);

  useEffect(() => {
    if (!game.localSdp) {
      return;
    }
    (async () => {
      setQR(await createQRCode(game.localSdp!));
    })();
  }, [game.localSdp]);

  useEffect(() => {
    if (game.remoteSdp) {
      game.setState("connecting");
      connection.setRemoteSdp();
    }
  }, [game.remoteSdp]);

  useEffect(() => {
    if (state === "capturingQr" && canvasRef.current) {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        alert("このブラウザではカメラを使用できません。");
        return;
      }

      const cameraSetting = {
        audio: false,
        video: {
          width: 300,
          height: 500,
          facingMode: "environment",
        }
      }

      let remoteSdpCache: string | undefined = undefined;

      const tick = () => {
        if (video.current!.readyState === video.current!.HAVE_ENOUGH_DATA && canvasRef.current) {
          const ctx = canvasRef.current!.getContext('2d')!;
          canvasRef.current!.height = video.current!.videoHeight;
          canvasRef.current!.width = video.current!.videoWidth;
          ctx.drawImage(video.current!, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

          let img = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);

          let code = jsQR(img.data, img.width, img.height, {inversionAttempts: "dontInvert"});

          if (code && !remoteSdpCache) {
            remoteSdpCache = code.data;
            alert("1番目のQRコードを読み込みました。2番目のQRコードを読み込んでください。")
          } else if (code && remoteSdpCache && remoteSdpCache !== code.data) {
            game.setRemoteSdp(remoteSdpCache! + code.data);
            (video.current!.srcObject as MediaStream).getTracks().forEach(track => track.stop());

            connection.setRemoteSdp();
            setState("displayingQr1");
          }
        }
        setTimeout(tick, 200);
      }

      navigator.mediaDevices.getUserMedia(cameraSetting)
        .then((mediaStream) => {
          video.current!.srcObject = mediaStream;
          video.current!.setAttribute("playsinline", "true");
          void video.current!.play();
          tick();
        })
        .catch((err) => {
          console.log(err.toString());
        });
    }
  }, [game, state]);

  return (
    <Wrapper>
      {qr1 == null && <p>読み込み中...</p>}
      {qr1 && qr2 && (state === "displayingQr1" || state === "displayingQr2") &&
          <>
              <p>PCで<a href={"/"}>/</a>を開き、以下のQRコードを順番に読み込んでください。 </p>
            {state === "displayingQr1" &&
                <QRCard index={1} src={qr1}/>
            }
            {state === "displayingQr2" &&
                <QRCard index={2} src={qr2}/>
            }
              <Button onClick={() => setState(state === "displayingQr1" ? "displayingQr2" : "displayingQr1")}>もう片方のQRコードを読み取る</Button>
              {/*<Button onClick={() => setState("capturingQr")}>PCのQRコードを読み取る</Button>*/}
          </>
      }
      {qr1 && qr2 && state === "capturingQr" &&
          <>
              <p>PCに表示されているQRコードを順番に読み込んでください。</p>
              <canvas ref={canvasRef} width={300} height={500}></canvas>
              {/*<Button onClick={() => setState("displayingQr1")}>PC用のQRコードを表示する</Button>*/}
          </>
      }
    </Wrapper>
  )
}