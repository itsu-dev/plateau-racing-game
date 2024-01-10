import React, {useContext, useEffect, useMemo, useRef, VFC} from 'react';
import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';
import {useGLTF} from '@react-three/drei';
import CannonUtils from "@/app/_utils/CannonUtils";
import {TrimeshArgs, useBox, useConvexPolyhedron, useTrimesh} from "@react-three/cannon";
import {MeshNormalMaterial, Quaternion, Vector3} from "three";
import {Geometry} from "three-stdlib";
import useFollowCam from "@/app/_hooks/useFollowCam";
import {RootState, useFrame} from "@react-three/fiber";
import {lerp} from "three/src/math/MathUtils";
import {clamp} from "@react-spring/shared";
import * as CANNON from "cannon-es";
import {GameContext} from "@/app/_contexts/IGameContext";
import {a} from "@react-spring/three";

const ModelPath = 'assets/car2.glb'

type GLTFResult = GLTF & {
  nodes: {
    Cadillac_CT4_V_2022_LowPoly: THREE.Mesh
  }
  materials: {
    ['blinn1']: THREE.MeshStandardMaterial
  }
}

const MASS = 2.0;  // 車の質量
const SCALE_RATE = 0.0001;  // 車のスケール
const ACCELERATION = 35.0;  // 加速度性能
const MAX_ACCELERATION = 100.0;
const MAX_FORCE = 76.0;
const MAX_STEER_ANGLE = 30.0;
const MAX_SPEED = 200.0

export const Car: VFC<JSX.IntrinsicElements['group']> = props => {
  // @ts-ignore
  const {nodes, materials} = useGLTF(ModelPath) as GLTFResult;
  const [ref2, api] = useBox(() => ({
    args: [0, 0, 0],
    mass: MASS,
    position: [-1000, 0, 0],
    material: new CANNON.Material('slippery'),
    linearDamping: 0
    // @ts-ignore
  }), useRef());
  const {yaw} = useFollowCam(ref2, [0, 4, 16]);

  const game = useContext(GameContext);

  /**
   * 現在の前に進ませる力
   */
  const force = useRef(0);

  /**
   * 車の向き
   */
  const angleQuat = useRef(new Quaternion());

  const steerAngle = useRef(0);

  useFrame((state: RootState, delta: number) => {
    // アクセルとブレーキの処理
    if (game.isAccelerating) {
      force.current += ACCELERATION * (MAX_FORCE / ((MAX_FORCE - force.current) !== 0 ?  (MAX_FORCE - force.current) : 1)) * delta;
    } else if (game.isBraking) {
      force.current -= ACCELERATION * delta;
    } else {
      // 何も踏まれていないならば減速する
      force.current = lerp(force.current, 0, 0.2 * delta);
    }

    // ハンドル制御
    steerAngle.current += -Math.PI * ((game.steerAngle > MAX_STEER_ANGLE ? MAX_STEER_ANGLE : game.steerAngle < -MAX_STEER_ANGLE ? -MAX_STEER_ANGLE : game.steerAngle) * delta) / 180;
    angleQuat.current.setFromAxisAngle(new Vector3(0,1,0), steerAngle.current);
    api.quaternion.set(angleQuat.current.x, angleQuat.current.y, angleQuat.current.z, angleQuat.current.w);

    // 速度制御
    force.current = force.current > MAX_FORCE ? MAX_FORCE : force.current < -MAX_FORCE ? -MAX_FORCE : force.current;
    api.applyLocalImpulse([-force.current * Math.sin(steerAngle.current), 0, -force.current * Math.cos(steerAngle.current)], [0, 0, 0]);
  });

  return (
    // @ts-ignore
    <group ref={ref2} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cadillac_CT4_V_2022_LowPoly.geometry}
        material={materials['blinn1']}
        rotation={[0, Math.PI, 0]}
        scale={[1.39 * SCALE_RATE, SCALE_RATE, SCALE_RATE]}
      />
    </group>
  )
}