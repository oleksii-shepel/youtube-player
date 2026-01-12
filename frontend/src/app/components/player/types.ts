import { Stream } from '@epikodelabs/streamix';

export interface IPlayerOutputs {
  ready?: Stream<YT.Player>;
  change?: Stream<YT.PlayerEvent>;
}

export interface IPlayerSize {
  height?: number;
  width?: number;
}

export interface IPlayerApiScriptOptions {
  protocol?: string;
}
