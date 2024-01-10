"use client";

import {OrbitControls, PerspectiveCamera, Plane} from '@react-three/drei'
import {Canvas} from '@react-three/fiber'
import {EffectComposer, SSAO} from '@react-three/postprocessing'
import React from 'react'
import {PlateauTilesetTransform} from "@/app/_components/plateau/PlateauTilesetTransform";
import {PlateauTileset} from "@/app/_components/plateau/PlateauTileset";
import ConcretePlane from "@/app/_components/objects/ConcretePlane";
import {Physics} from "@react-three/cannon";
import MyBox from "@/app/_components/objects/MyBox";
import {Car} from "@/app/_components/objects/Car";
import useGameContext, {GameContext} from "@/app/_contexts/IGameContext";
import RTCQRCodes from "@/app/_components/game/RTCQRCodes";
import styled from "styled-components";

const Background = styled.div`
  width: 100vw;
  height: 100vh;
  background: rgb(238,174,202);
  background: radial-gradient(circle, rgba(238,174,202,1) 0%, rgba(148,187,233,1) 100%);
`;

const Description = styled.p`
  position: fixed;
  bottom: 0;
  right: 32px;
;`

export default function Home() {
  const game = useGameContext();
  return (
    <GameContext.Provider value={game}>
      { game.state === "connected" && <Canvas shadows>
        <fogExp2 attach='fog' color='white' density={0.0002}/>
        <PerspectiveCamera
          makeDefault
          position={[2, 2, 2]}
        />
        {/*<OrbitControls position={[0, 0, 0]}/>*/}
        <ambientLight intensity={0.5}/>
        <directionalLight
          position={[500, 1000, 1000]}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        >
        </directionalLight>
        <Physics gravity={[0, -9.8, 0]}>
          <ConcretePlane />
          {/*<MyBox />*/}
          <Car />
          <PlateauTilesetTransform>
            <PlateauTileset
              path='bldg/13100_tokyo/13101_chiyoda-ku/notexture'
              center
            />
            <PlateauTileset path='bldg/13100_tokyo/13102_chuo-ku/notexture'/>
          </PlateauTilesetTransform>
        </Physics>
      </Canvas>
      }
      { game.state !== "connected" &&
          <>
              <Background />
              <Description>このゲームは国土交通省による3D都市データ（<a href={"https://www.mlit.go.jp/plateau/"}>Plateau</a>）を使用しております</Description>
              <RTCQRCodes />
          </>
      }
    </GameContext.Provider>
  )
}

export const runtime = 'edge';