import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  
  p {
    text-align: center;
    font-size: 2.0rem;
    margin-bottom: 0;
  }
`;

type Props = {
  index: number;
  src: string;
}

export default function QRCard({ index, src }: Props) {
  return (
    <Wrapper>
      <img src={src} width={300} />
      <p>{index}</p>
    </Wrapper>
  )
}