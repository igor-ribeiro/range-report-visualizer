import { atom, atomFamily, UnwrapRecoilValue } from "recoil";

export const configState = atom<{
  file: string | null;
  groupActions: boolean;
  data: TransformResponse | null;
}>({
  key: "configState",
  default: {
    file: null,
    groupActions: false,
    data: null
  }
});

export const dialogState = atomFamily({
  key: "dialogState",
  default: {
    opened: false
  }
});

export const activeGroupsState = atom<string[]>({
  key: "activeGroupsState",
  default: []
});

export const savedFilesState = atom<string[]>({
  key: "savedFilesState",
  default: []
});

///

export type Range = {
  selected: boolean;
  weight: number[];
  hand: string;
  actions: string[];
};

export type TransformResponse = {
  positions: string[];
  actions: string[];
  ranges: Record<string, Range[]>;
};

export const weightState = atom({
  key: "weightState",
  default: 20
});

export const comboState = atomFamily<
  { selected: boolean; weight: number[]; actions: string[] },
  string
>({
  key: "selectedState",
  default: {
    actions: [],
    selected: false,
    weight: []
  }
});

export const selectionTypeState = atom<null | "add" | "remove">({
  key: "selectionTypeState",
  default: null
});

export const groupsState = atom({
  key: "groupsState",
  default: Array.from({ length: 4 }).map((_, i) => `Group ${i + 1}`)
});

export const groupState = atom({
  key: "groupState",
  default: 0
});

export const positionsState = atom<string[]>({
  key: "positionsState",
  default: []
});

export const positionState = atom({
  key: "positionState",
  default: ""
});

export const actionsState = atom<string[]>({
  key: "actionsState",
  default: []
});

export const actionState = atom({
  key: "actionState",
  default: ""
});

export const allRangesState = atom<string[]>({
  key: "allRanges",
  default: []
});

export const rangesByPosition = atomFamily<Range[], string>({
  key: "rangesByPosition",
  default: []
});
