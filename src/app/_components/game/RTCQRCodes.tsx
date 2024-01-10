import {useContext, useEffect, useRef, useState} from "react";
import useRTCConnection from "@/app/_hooks/useRTCConnection";
import {GameContext} from "@/app/_contexts/IGameContext";
import {createQRCode} from "@/app/_utils/connection";
import styled from "styled-components";
import QRCard from "@/app/_components/game/QRCard";
import jsQR from "jsqr";
import Button from "@/app/_components/game/Button";

const Wrapper = styled.div`
  position: absolute;
  top: calc(50% - 300px);
  left: calc(50% - 500px);
  width: 1000px;
  height: 600px;
  z-index: 20;
  background-color: #ffffff88;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 15px -5px #777777;
  border-radius: 16px;
  padding: 32px 48px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const QRCards = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex: 1;
  width: 100%;
`;

export default function RTCQRCodes() {
  const connection = useRTCConnection();
  const game = useContext(GameContext);

  const video = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [[qr1, qr2], setQR] = useState<[string | undefined, string | undefined]>([undefined, undefined]);

  useEffect(() => {
    video.current = document.createElement('video');
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

  useEffect(() => {
    if (game.state === "capturingQr" && canvasRef.current) {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        alert("このブラウザではカメラを使用できません。");
        return;
      }

      const cameraSetting = {
        audio: false,
        video: {
          width: 800,
          height: 400,
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

            connection.setRemoteSdp(remoteSdpCache! + code.data);
            game.setState("connecting");
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
  }, [game.state]);

  return (
    <Wrapper>
      {qr1 == null && <p>読み込み中...</p>}
      {qr1 && qr2 && game.state === "displayingQr" &&
          <>
              <p>このゲームでは、スマートフォンをハンドルとして使用します。スマートフォンで<a href={"/steer"}>/steer</a>を開き、以下のQRコードを順番に読み込んでください。
              </p>
              <QRCards>
                  <QRCard index={1} src={qr1}/>
                  <QRCard index={2} src={qr2}/>
              </QRCards>
              <Button onClick={() => game.setState("capturingQr")}>ハンドルのQRコードを読み込む</Button>
          </>
      }
      {qr1 && qr2 && game.state === "capturingQr" &&
          <>
              <p>スマートフォンに表示されたQRコードを順番に読み込んでください。</p>
              <canvas ref={canvasRef} width={800} height={400}></canvas>
              <Button onClick={() => game.setState("displayingQr")}>スマホ用のQRコードを表示する</Button>
          </>
      }
      {qr1 && qr2 && game.state === "connecting" &&
          <>
              <p>接続しています。まだスマートフォンでQRコードを読み込んでいない場合は、スマートフォンで<a href={"/steer"}>/steer</a>を開き、以下のQRコードを順番に読み込んでください。</p>
              <QRCards>
                  <QRCard index={1} src={qr1}/>
                  <QRCard index={2} src={qr2}/>
              </QRCards>
          </>
      }
    </Wrapper>
  )
}