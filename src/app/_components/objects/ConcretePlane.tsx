import React, {useContext, useEffect, useRef} from "react";
import {useBox, usePlane} from "@react-three/cannon";
import {DoubleSide, RepeatWrapping, TextureLoader} from "three";
import * as CANNON from "cannon-es";
import {GameContext} from "@/app/_contexts/IGameContext";

export default function ConcretePlane() {
  // const texture = new TextureLoader().load('assets/concrete.png');
  // useEffect(() => {
  //   texture.repeat.set(1000, 1000);
  //   texture.wrapT = RepeatWrapping;
  //   texture.wrapS = RepeatWrapping;
  // }, []);
  const game = useContext(GameContext);

  const [ref] = usePlane(() => ({
    args: [1000, 1000],
    mass: 0,
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
    material: game.groundMaterial,
    // @ts-ignore
  }), useRef())

  return (
    // <Plane
    //   // @ts-ignore
    //   ref={ref}
    //   args={[1e5, 1e5]}
    //   position={[0, 12, 0]}
    //   rotation={[-Math.PI / 2, 0, 0]}
    //   receiveShadow
    // >
    //   <planeGeometry args={[25, 25]} />
    //   <meshStandardMaterial color={'white'}/>
    // </Plane>
    // @ts-ignore
    <mesh ref={ref} receiveShadow>
      {/*
        The thing that gives the mesh its shape
        In this case the shape is a flat plane
      */}
      <planeGeometry args={[10000, 10000, 1]} />
      {/*
        The material gives a mesh its texture or look.
        In this case, it is just a uniform green
      */}
      <meshStandardMaterial color="#444444" roughness={1} side={DoubleSide} />
    </mesh>
  )
}