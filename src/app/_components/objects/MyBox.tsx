import {useRef} from "react";
import {useBox} from "@react-three/cannon";

export default function MyBox() {
  // @ts-ignore
  const [ref] = useBox(() => ({ args: [1, 1, 1], mass: 1, position: [0, 20, 0] }), useRef())

  return (
    // @ts-ignore
    <mesh ref={ref} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  )
}