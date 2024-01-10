import styled from "styled-components";

const Wrapper = styled.div<{color: string}>`
  background-color: ${props => props.color};
  color: white;
  font-size: 2.0rem;
  width: 100%;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  p {
    transform: rotateZ(90deg);
  }
`;

type Props = {
  text: string;
  color: string;
} & React.ComponentProps<'div'>;

export default function Pedal({ text, color, ...props }: Props) {
  return (
    <Wrapper color={color} {...props}>
      <p>{text}</p>
    </Wrapper>
  )
}