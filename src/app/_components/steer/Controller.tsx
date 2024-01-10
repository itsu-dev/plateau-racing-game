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
  const { onAcceleratorDown, onAcceleratorUp, onBrakeDown, onBrakeUp } = useController(send);
  return (
    <Wrapper>
      <Pedal text={"ブレーキ"} color={"#FF5B5B"} onTouchStart={onBrakeDown} onTouchEnd={onBrakeUp} />
      <Pedal text={"アクセル"} color={"#333333"} onTouchStart={onAcceleratorDown} onTouchEnd={onAcceleratorUp} />
    </Wrapper>
  )
}