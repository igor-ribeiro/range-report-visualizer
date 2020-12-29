import React, {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useMemo
} from "react";
import cn from "clsx";
import {
  UnwrapRecoilValue,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from "recoil";
import { dialogState } from "./states";
import produce, { Draft } from "immer";

type DState = UnwrapRecoilValue<ReturnType<typeof dialogState>>;
type DSet = (updater: (draft: Draft<DState>) => void) => void;

export function useUpdateDialog(
  id: string
): [DSet, { close: () => void; open: () => void }] {
  const setState = useSetRecoilState(dialogState(id));

  const set = useCallback<DSet>(
    (updater) => {
      setState((old) => produce(old, updater));
    },
    [setState]
  );

  const open = useCallback(() => {
    set((draft) => {
      draft.opened = true;
    });
  }, [set]);

  const close = useCallback(() => {
    set((draft) => {
      draft.opened = false;
    });
  }, [set]);

  return useMemo(() => [set, { open, close }], [set, open, close]);
}

export function Dialog({
  id,
  title,
  children,
  actions = []
}: PropsWithChildren<{ id: string; title: string; actions: ReactNode }>) {
  const state = useRecoilValue(dialogState(id));
  const [, { close }] = useUpdateDialog(id);

  return (
    <>
      <div id={id} className={cn("Dialog", { opened: state.opened })}>
        <header className="Dialog-header">
          <h2>{title}</h2>
        </header>

        <div className="Dialog-content">{children}</div>

        <footer className="Dialog-footer">{actions}</footer>
      </div>

      <div className="Dialog-overlay" onClick={() => close()} />
    </>
  );
}
