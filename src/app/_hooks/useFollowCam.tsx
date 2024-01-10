import {useFrame, useThree} from "@react-three/fiber";
import {Ref, RefObject, useEffect, useMemo} from "react";
import {Object3D, Quaternion, Vector3} from "three";

export default function useFollowCam(ref: RefObject<THREE.Object3D<THREE.Event>>, offset: number[]) {
  const {scene, camera} = useThree()

  const pivot = useMemo(() => new Object3D(), [])
  const alt = useMemo(() => new Object3D(), [])
  const yaw = useMemo(() => new Object3D(), [])
  const pitch = useMemo(() => new Object3D(), [])
  const worldPosition = useMemo(() => new Vector3(), [])
  const quot = useMemo(() => new Quaternion(), [])

  function onDocumentMouseMove(e: MouseEvent) {
    if (document.pointerLockElement) {
      e.preventDefault()
      yaw.rotation.y -= e.movementX * 0.002
      const v = pitch.rotation.x - e.movementY * 0.002
      if (v > -1 && v < 0.1) {
        pitch.rotation.x = v
      }
    }
  }

  function onDocumentMouseWheel(e: WheelEvent) {
    if (document.pointerLockElement) {
      e.preventDefault()
      const v = camera.position.z + e.deltaY * 0.005
      if (v >= 0.5 && v <= 5) {
        camera.position.z = v
      }
    }
  }

  useEffect(() => {
    scene.add(pivot)
    pivot.add(alt)
    alt.position.y = offset[1]
    alt.add(yaw)
    yaw.add(pitch)
    pitch.add(camera)
    pitch.rotation.x = -0.1;
    camera.position.set(offset[0], 0, offset[2])

    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('wheel', onDocumentMouseWheel, {passive: false})

    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove)
      document.removeEventListener('wheel', onDocumentMouseWheel)
    }
  }, [camera])

  useFrame((_, delta) => {
    ref.current?.getWorldPosition(worldPosition);
    ref.current?.getWorldQuaternion(quot);
    // pivot.position.lerp(worldPosition, delta * 5)
    pivot.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
    pivot.quaternion.set(quot.x, quot.y, quot.z, quot.w);
  })

  return {pivot, alt, yaw, pitch}
}
