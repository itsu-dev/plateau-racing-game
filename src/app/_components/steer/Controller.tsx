import styled from "styled-components";
import Pedal from "@/app/_components/steer/Pedal";
import useController from "@/app/_hooks/useController";

type Props = {
  send: (data: any) => void;
}

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`;

export function Controller({ send }: Props) {
  const { onAcceleratorDown, onAcceleratorUp, onBrakeDown, onBrakeUp, gamma } = useController(send);
  return (
    <Wrapper>
      <Pedal text={"ブレーキ"} color={"red"} onTouchStart={onBrakeDown} onTouchEnd={onBrakeUp} />
      <Pedal text={`${gamma}`} color={"blue"} onTouchStart={onAcceleratorDown} onTouchEnd={onAcceleratorUp} />
    </Wrapper>
  )
}