import cn from "clsx";
import produce from "immer";
import React, { useEffect, useRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { getGroup, GROUPS } from "./config";
import {
  actionState,
  activeGroupsState,
  comboState,
  configState,
  groupState,
  selectionTypeState,
  weightState
} from "./states";

const CARDS = Array.from({ length: 13 }, (_, i) => i + 2).reverse();

const CARD_DISPLAY: Record<number, string> = {
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A"
};

function getCard(
  index: number
): {
  display: string;
  value: number;
} {
  const value = CARDS[index];

  return {
    display: CARD_DISPLAY[value] || String(value),
    value
  };
}

const RANGE_TABLE: string[][] = [];

for (let y = 0; y < CARDS.length; y++) {
  const row = RANGE_TABLE[y] || [];
  const card1 = getCard(y);

  for (let x = 0; x < CARDS.length; x++) {
    const card2 = getCard(x);

    const combo = [card2, card1]
      .sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0))
      .map((hand) => hand.display);

    row.push(combo.join(""));
  }

  RANGE_TABLE.push(row);
}

export const COMBOS = RANGE_TABLE.reduce(
  (list, row, index) =>
    list.concat(
      row.map(
        (hand, handIndex) =>
          `${hand}${handIndex === index ? "" : handIndex < index ? "s" : "o"}`
      )
    ),
  []
);

function RangeCombo({
  combo,
  display = combo,
  pair = false
}: {
  combo: string;
  display?: string;
  pair?: boolean;
}) {
  const config = useRecoilValue(configState);
  const activeAction = useRecoilValue(actionState);
  const group = useRecoilValue(groupState);
  const activeGroups = useRecoilValue(activeGroupsState);
  const weight = useRecoilValue(weightState);
  const [state, setState] = useRecoilState(comboState(combo));
  const [selectionType, setSelectionType] = useRecoilState(selectionTypeState);
  const timeoutRef = useRef<number | null>(null);

  function select(selected: boolean) {
    setState((state) =>
      produce(state, (draft) => {
        draft.selected = selected;

        const totalWeight = draft.weight
          .filter((_, i) => i !== group)
          .reduce((total, weight) => total + weight, 0);

        if (selected) {
          draft.weight[group] =
            totalWeight > 0 ? Math.min(100 - totalWeight, weight) : weight;
        } else {
          draft.weight = [];
        }
      })
    );
  }

  return (
    <td
      className={cn("RangeCombo", {
        selected: state.selected,
        "suit-p": pair
      })}
      onMouseDown={(e) => {
        if (1) {
          return;
        }

        const { button } = e;

        if (timeoutRef.current != null) {
          clearTimeout(timeoutRef.current);
        }

        const type = button === 0 ? "add" : button === 2 ? "remove" : null;

        timeoutRef.current = setTimeout(() => {
          setSelectionType(type);
        }, 80);

        if (type == null) {
          return;
        }

        select(type === "add");
      }}
      onMouseUp={() => {
        if (1) {
          return;
        }

        if (timeoutRef.current != null) {
          clearTimeout(timeoutRef.current);
        }

        setSelectionType(null);
      }}
      onMouseOver={() => {
        if (1) {
          return;
        }

        if (selectionType == null) {
          return;
        }

        select(selectionType === "add");
      }}
    >
      <div className="RangeCombo-background">
        {state.actions.map((action, index) => {
          const weight = state.weight[index];
          const group = getGroup(action);

          if (config.groupActions && activeGroups.indexOf(group) < 0) {
            return null;
          }

          if (config.groupActions === false && action !== activeAction) {
            return null;
          }

          // const action = state.actions[group];

          return (
            <span
              key={action + group}
              title={`${weight}%`}
              data-action={action}
              data-group={group}
              className="RangeCombo-background-group"
              style={{
                display:
                  activeGroups.indexOf(group) < 0 ? "none" : "inline-block",
                backgroundColor: GROUPS[group],
                width: `${weight}%`
                // opacity: `${state.weight}%`
              }}
            />
          );
        })}
      </div>

      <div className="RangeCombo-display">{combo}</div>

      <div
        className={cn("RangeCombo-weights", {
          empty:
            state.actions
              .map((_, index) => state.weight[index])
              .reduce((count, weight) => count + weight, 0) === 0
        })}
      >
        {state.actions.map((action, index) => {
          const group = getGroup(action);
          const weight = state.weight[index];

          if (config.groupActions && activeGroups.indexOf(group) < 0) {
            return null;
          }

          if (config.groupActions === false && action !== activeAction) {
            return null;
          }

          return <div key={group + action}>{weight}</div>;
        })}
      </div>
    </td>
  );
}

export function RangeTable() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const setSelectionType = useSetRecoilState(selectionTypeState);

  useEffect(() => {
    function onBlur() {
      setSelectionType(null);
    }

    window.addEventListener("mouseup", onBlur);

    return () => {
      window.removeEventListener("mouseup", onBlur);
    };
  }, [setSelectionType]);

  return (
    <table
      className="RangeTable"
      onContextMenu={(e) => e.preventDefault()}
      ref={tableRef}
    >
      <tbody>
        {RANGE_TABLE.map((columns, rowIndex) => {
          return (
            <tr key={rowIndex}>
              {columns.map((hand, columnIndex) => {
                const suit =
                  columnIndex === rowIndex
                    ? ""
                    : columnIndex < rowIndex
                    ? "s"
                    : "o";

                const combo = hand + suit;

                return (
                  <RangeCombo
                    key={combo}
                    combo={combo}
                    display={hand}
                    pair={columnIndex === rowIndex}
                  />
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
