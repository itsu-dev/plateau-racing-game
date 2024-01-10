import styled from "styled-components";

const BaseButton = styled.button`
  padding: 12px 32px;
  background-color: #673AB7;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  cursor: pointer;
  margin: 16px;

  &:focus {
    outline: none;
  }

  &:hover {
    background-color: #512DA8;
  }
`;

type Props = {
  children: string;
} & React.ComponentProps<'button'>;

export default function Button ({children, ...props }: Props) {
  return (
    <BaseButton {...props}>
      {children}
    </BaseButton>
  )
}