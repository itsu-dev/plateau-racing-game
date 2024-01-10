import React, {useCallback, useContext, useEffect, useMemo, useRef, VFC} from 'react';
import * as THREE from 'three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';
import {useGLTF} from '@react-three/drei';
import CannonUtils from "@/app/_utils/CannonUtils";
import {
  TrimeshArgs, Triplet,
  useBox, useCompoundBody,
  useContactMaterial,
  useConvexPolyhedron,
  useCylinder, useRaycastVehicle,
  useTrimesh, useSphere
} from "@react-three/cannon";
import {MeshNormalMaterial, Quaternion, Vector3} from "three";
import {Geometry} from "three-stdlib";
import useFollowCam from "@/app/_hooks/useFollowCam";
import {RootState, useFrame, useThree} from "@react-three/fiber";
import {lerp} from "three/src/math/MathUtils";
import {clamp} from "@react-spring/shared";
import * as CANNON from "cannon-es";
import {GameContext} from "@/app/_contexts/IGameContext";
import {a} from "@react-spring/three";
import {WheelInfoOptions} from "objects/WheelInfo";

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
const MAX_FORCE = 55.0;
const MAX_STEER_ANGLE = 40.0;
const MAX_SPEED = 200.0

export const Car: VFC<JSX.IntrinsicElements['group']> = props => {
  // @ts-ignore
  const {nodes, materials} = useGLTF(ModelPath) as GLTFResult;
  const [ref2, api] = useBox(() => ({
    args: [0, 0, 0],
    mass: MASS,
    position: [-1000, 10, 0],
    material: new CANNON.Material('slippery'),
    //linearDamping: 0.9,
    // @ts-ignore
  }), useRef());

  const width = 4.8;
  const height = 0;
  const front = 3;
  const back = -3;

  const [chassisBody, chassisBodyApi] = useBox(() => ({
    args: [4.8, 2, 12],
    mass: 500,
    position: [-1000, 3, 0],
    //linearDamping: 0.9,
    // @ts-ignore
  }), useRef());

  const wheelMaterial = useMemo(() => new CANNON.Material({
    restitution: 1,
  }), []);

  const quaternion = new Quaternion();
  quaternion.setFromAxisAngle(new Vector3(0, 0, 0), Math.PI / 2);

  const [wheel0, wheel0Api] = useSphere(() => ({
    args: [1.25],
    mass: 1,
    angularDamping: 0.8,
    material: wheelMaterial,
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    // @ts-ignore
  }), useRef());

  const [wheel1, wheel1Api] = useSphere(() => ({
    args: [1.25],
    mass: 1,
    angularDamping: 0.8,
    material: wheelMaterial,
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    // @ts-ignore
  }), useRef());

  const [wheel2, wheel2Api] = useSphere(() => ({
    args: [1.25],
    mass: 1,
    angularDamping: 0.8,
    material: wheelMaterial,
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    // @ts-ignore
  }), useRef());

  const [wheel3, wheel3Api] = useSphere(() => ({
    args: [1.25],
    mass: 1,
    angularDamping: 0.8,
    material: wheelMaterial,
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    // @ts-ignore
  }), useRef());

  const wheelInfo: WheelInfoOptions = {
    // @ts-ignore
    axleLocal: [1, 0, 0], // This is inverted for asymmetrical wheel models (left v. right sided)
    customSlidingRotationalSpeed: -30,
    dampingCompression: 4.4,
    dampingRelaxation: 10,
    // @ts-ignore
    directionLocal: [0, -1, 0], // set to same as Physics Gravity
    frictionSlip: 2,
    maxSuspensionForce: 1e4,
    maxSuspensionTravel: 0.3,
    radius: 1.25,
    suspensionRestLength: 0.3,
    suspensionStiffness: 30,
    useCustomSlidingRotationalSpeed: true,
  }

  const wheels = useMemo(() => [wheel0, wheel1, wheel2, wheel3], [wheel0, wheel1, wheel2, wheel3]);
  const wheelApis = useMemo(() => [wheel0Api, wheel1Api, wheel2Api, wheel3Api], [wheel0Api, wheel1Api, wheel2Api, wheel3Api]);

  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody,
    wheels,
    wheelInfos: [
      // @ts-ignore
      {
        ...wheelInfo,
        chassisConnectionPointLocal: [-width / 2, height, front],
        isFrontWheel: true,
      },
      // @ts-ignore
      {
        ...wheelInfo,
        chassisConnectionPointLocal: [width / 2, height, front],
        isFrontWheel: true,
      },
      // @ts-ignore
      {
        ...wheelInfo,
        chassisConnectionPointLocal: [-width / 2, height, back],
        isFrontWheel: false,
      },
      // @ts-ignore
      {
        ...wheelInfo,
        chassisConnectionPointLocal: [width / 2, height, back],
        isFrontWheel: false,
      },
    ]
    // @ts-ignore
  }), useRef());

  const game = useContext(GameContext);
  useContactMaterial(wheelMaterial, game.groundMaterial, {
    friction: 0.5,
    contactEquationStiffness: 1000,
  });

  const {yaw} = useFollowCam(chassisBody, [0, 4, 16]);

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
    const maxSteerVal = Math.PI / 8;
    const maxForce = 4000;

    // アクセルとブレーキの処理
    if (game.isAccelerating) {
      vehicleApi.applyEngineForce(maxForce, 2);
      vehicleApi.applyEngineForce(maxForce, 3);
      force.current += ACCELERATION * (MAX_FORCE / ((MAX_FORCE - force.current) !== 0 ? (MAX_FORCE - force.current) : 1)) * delta;
    } else if (game.isBraking) {
      vehicleApi.applyEngineForce(-maxForce, 2);
      vehicleApi.applyEngineForce(-maxForce, 3);
      force.current -= ACCELERATION * delta;
    } else {
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
      // 何も踏まれていないならば減速する
      force.current = lerp(force.current, 0, 0.2 * delta);
    }

    // ハンドル制御
    steerAngle.current = game.steerAngle * 2 > MAX_STEER_ANGLE ? MAX_STEER_ANGLE : game.steerAngle * 2 < -MAX_STEER_ANGLE ? -MAX_STEER_ANGLE : game.steerAngle * 2;
    //steerAngle.current = 10;
    angleQuat.current.setFromAxisAngle(new Vector3(0, 1, 0), steerAngle.current);
    //api.quaternion.set(angleQuat.current.x, angleQuat.current.y, angleQuat.current.z, angleQuat.current.w);

    vehicleApi.setSteeringValue(-steerAngle.current / MAX_STEER_ANGLE, 2);
    vehicleApi.setSteeringValue(-steerAngle.current / MAX_STEER_ANGLE, 3);
    // 速度制御
    // let normalizedAngle = steerAngle.current % (2 * Math.PI) < 0 ? steerAngle.current % (2 * Math.PI) + 2 * Math.PI : steerAngle.current % (2 * Math.PI);
    // let diffAngle = normalizedAngle % (Math.PI / 2) > Math.PI / 4 ? normalizedAngle % (Math.PI / 2) - Math.PI / 4 : normalizedAngle % (Math.PI / 2);
    // console.log(normalizedAngle * 180 / Math.PI);
    // let cos = 0 <= normalizedAngle && normalizedAngle < Math.PI / 2 || 1.5 * Math.PI < normalizedAngle
    //   ? Math.cos(diffAngle)
    //   : Math.PI / 2 < normalizedAngle && normalizedAngle < 1.5 * Math.PI
    //     ? -Math.cos(diffAngle)
    //     : 1;
    // cos = cos === 0 || cos === Infinity || isNaN(cos) ? 1 : cos;
    // //console.log(1/cos);
    force.current = force.current > MAX_FORCE ? MAX_FORCE : force.current < -MAX_FORCE ? -MAX_FORCE : force.current;
    //api.applyLocalImpulse([0, 0, -force.current], [0, 0, 0]);
    const velocity = new Vector3(0, 0, 0);
    velocity.applyQuaternion(angleQuat.current);
    //api.velocity.copy(velocity);
    //velocity.applyQuaternion(angleQuat.current);
    //api.velocity.set(velocity.x, velocity.y, velocity.z);
  });

  return (
    // @ts-ignore
    <group ref={vehicle} {...props}>
      {/*<mesh*/}
      {/*  castShadow*/}
      {/*  receiveShadow*/}
      {/*  geometry={nodes.Cadillac_CT4_V_2022_LowPoly.geometry}*/}
      {/*  material={materials['blinn1']}*/}
      {/*  rotation={[0, Math.PI, 0]}*/}
      {/*  scale={[1.39 * SCALE_RATE, SCALE_RATE, SCALE_RATE]}*/}
      {/*/>*/}

      {/*@ts-ignore*/}
      <mesh ref={chassisBody} castShadow receiveShadow>
        <boxBufferGeometry args={[4.8, 2, 12]} />
        <meshStandardMaterial color={0xffffff} />
      </mesh>

      {/*@ts-ignore*/}
      <mesh ref={wheel0} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.25]} />
        <meshStandardMaterial color={0x000000} />
      </mesh>

      {/*@ts-ignore*/}
      <mesh ref={wheel1} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
        <sphereGeometry args={[1.25]} />
        <meshStandardMaterial color={0x000000} />
      </mesh>

      {/*@ts-ignore*/}
      <mesh ref={wheel2} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <sphereGeometry args={[1.25]} />
        <meshStandardMaterial color={0x000000} />
      </mesh>

      {/*@ts-ignore*/}
      <mesh ref={wheel3} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow>
        <sphereGeometry args={[1.25]} />
        <meshStandardMaterial color={0x000000} />
      </mesh>
    </group>
  )
}