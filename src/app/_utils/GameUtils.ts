import {IGameContext} from "@/app/_contexts/IGameContext";

export const startGame = (game: IGameContext) => {
  game.setStarted(true);
}