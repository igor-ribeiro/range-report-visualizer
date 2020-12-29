import React, {
  ChangeEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  RecoilRoot,
  UnwrapRecoilValue,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from "recoil";
import { getGroup, GROUPS, POSITIONS } from "./config";
import { COMBOS, RangeTable } from "./RangeTable";
import {
  actionsState,
  actionState,
  activeGroupsState,
  allRangesState,
  comboState,
  configState,
  groupsState,
  positionsState,
  positionState,
  rangesByPosition,
  savedFilesState,
  TransformResponse,
  weightState
} from "./states";
import { Dialog, useUpdateDialog } from "./Dialog";
import "./styles.css";
import produce from "immer";

function GroupManager() {
  const config = useRecoilValue(configState);
  const action = useRecoilValue(actionState);
  const actions = useRecoilValue(actionsState);
  const [activeGroups, setActiveGroups] = useRecoilState(activeGroupsState);

  useEffect(() => {
    const groups = actions.map(getGroup);

    setActiveGroups(groups);
  }, [actions, setActiveGroups]);

  function onChange(e: ChangeEvent<HTMLInputElement>, group: string) {
    const active = e.target.checked;

    setActiveGroups((old) =>
      active ? old.concat(group) : old.filter((g) => g !== group)
    );
  }

  return (
    <aside className="Group">
      <h2>Groups</h2>

      {actions
        .filter((_action) => (config.groupActions ? true : _action === action))
        .map((action, index) => {
          const group = getGroup(action);

          return (
            <label
              className="Checkbox Group-checkbox"
              style={{ borderColor: GROUPS[group] }}
              key={action + group}
            >
              <input
                type="checkbox"
                name="group"
                checked={activeGroups.indexOf(group) > -1}
                onChange={(e) => onChange(e, group)}
              />
              <span>{action}</span>
            </label>
          );
        })}
    </aside>
  );
}

function WeightManager() {
  const [weight, setWeight] = useRecoilState(weightState);

  return (
    <aside className="Group">
      <h2>Weight</h2>

      <label style={{ marginRight: 16 }}>
        <input
          type="number"
          name="weight"
          value={weight}
          onChange={(e) => {
            setWeight(Number(e.target.value));
          }}
        />
      </label>
    </aside>
  );
}

function Importer() {
  const [config, setConfig] = useRecoilState(configState);
  const [saved, setSaved] = useRecoilState(savedFilesState);
  const [, _import] = useUpdateDialog("import");
  const [, save] = useUpdateDialog("save");

  const fileName = useMemo(() => config.file, [config.file]);

  useEffect(() => {
    const saved = localStorage.getItem("saved-files");

    if (saved != null) {
      setSaved(JSON.parse(saved));
    }
  }, [setSaved]);

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const config = localStorage.getItem(`config/${e.target.value}`);

    if (config == null) {
      return;
    }

    const configParsed = JSON.parse(config);

    setConfig(configParsed);

    window.dispatchEvent(new CustomEvent("reset-ranges", {}));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(
          new CustomEvent("apply-ranges", {
            detail: {
              data: configParsed.data
            }
          })
        );
      });
    });
  }

  return (
    <aside>
      <h2>{fileName || "(no range imported)"}</h2>
      <select name="saved" onChange={onChange}>
        <option value=""></option>

        {saved.map((name) => {
          return <option value={name}>{name}</option>;
        })}
      </select>
      <Spacing />
      <button onClick={() => _import.open()}>Import File</button>{" "}
      <button onClick={() => save.open()}>Save File</button>
    </aside>
  );
}

function PositionsManager() {
  const action = useRecoilValue(actionState);
  const allPositions = useRecoilValue(positionsState);
  const [position, setPosition] = useRecoilState(positionState);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);

  const setPositions = useRecoilCallback(
    ({ snapshot }) => async () => {
      const availablePositions: string[] = [];

      for await (const pos of allPositions) {
        const ranges = await snapshot.getPromise(
          rangesByPosition(pos + action)
        );

        if (ranges.length > 0) {
          availablePositions.push(pos);
        }
      }

      if (availablePositions.indexOf(position) < 0) {
        setPosition(availablePositions[0]);
      }

      setAvailablePositions(availablePositions);
    },
    [action, allPositions, position]
  );

  useEffect(() => {
    setPositions();
  }, [setPositions]);

  return (
    <aside>
      <h2>Positions</h2>

      {POSITIONS.map((_position) => {
        return (
          <Fragment key={_position}>
            <input
              className="Option-input"
              type="radio"
              name="position"
              id={`position-${_position}`}
              checked={_position === position}
              disabled={availablePositions.indexOf(_position) < 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setPosition(_position);
                }
              }}
            />

            <label className="Option-label" htmlFor={`position-${_position}`}>
              {_position}
            </label>
          </Fragment>
        );
      })}
    </aside>
  );
}

function ActionsManager() {
  const config = useRecoilValue(configState);
  const actions = useRecoilValue(actionsState);
  const [action, setAction] = useRecoilState(actionState);

  if (actions.length === 0) {
    return null;
  }

  if (config.groupActions) {
    return null;
  }

  return (
    <aside>
      <h2>Actions</h2>

      <select
        name="action"
        value={action}
        onChange={(e) => {
          setAction(e.target.value);
        }}
      >
        {actions.map((_action) => {
          return (
            <option value={_action} key={_action}>
              {_action}
            </option>
          );
        })}
      </select>
    </aside>
  );
}

function SetRange() {
  const config = useRecoilValue(configState);
  const position = useRecoilValue(positionState);
  const action = useRecoilValue(actionState);

  const ranges = useRecoilValue(
    rangesByPosition(config.groupActions ? position : position + action)
  );

  const setRanges = useRecoilCallback(
    ({ set, reset }) => (
      ranges: UnwrapRecoilValue<ReturnType<typeof rangesByPosition>>
    ) => {
      for (const range of ranges) {
        const { hand, ...state } = range;

        set(comboState(hand), state);
      }
    },
    []
  );

  useEffect(() => {
    if (ranges.length > 0) {
      setRanges(ranges);
    }
  }, [ranges, setRanges]);
  return null;
}

function Spacing() {
  return <div className="Spacing" />;
}

function ImportDialog() {
  const [config, setConfig] = useRecoilState(configState);
  const allRanges = useRecoilValue(allRangesState);
  const [, { close }] = useUpdateDialog("import");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [response, setResponse] = useState<null | TransformResponse>(null);
  const [groupActions, setGroupActions] = useState(false);
  const [calculate, setCalculate] = useState(false);

  const applyResponse = useRecoilCallback(
    ({ set }) => (transformed: TransformResponse) => {
      set(positionsState, transformed.positions);
      set(actionsState, transformed.actions);
      set(activeGroupsState, transformed.actions.map(getGroup));
      set(positionState, transformed.positions[0]);

      if (config.groupActions === false) {
        set(actionState, transformed.actions[0]);
      }

      const all: string[] = [];

      for (const key in transformed.ranges) {
        all.push(key);
        set(rangesByPosition(key), transformed.ranges[key]);
      }

      set(allRangesState, all);

      close();
    },
    [close, config.groupActions]
  );

  const reset = useRecoilCallback(
    ({ reset }) => () => {
      reset(positionsState);
      reset(actionsState);
      reset(activeGroupsState);
      reset(actionState);
      reset(positionState);

      for (const combo of COMBOS) {
        reset(comboState(combo));
      }

      for (const key of allRanges) {
        reset(rangesByPosition(key));
      }

      reset(allRangesState);
    },
    [allRanges]
  );

  const workerRef = useRef<null | Worker>(null);

  useEffect(() => {
    const worker = new Worker("/worker.js");

    worker.addEventListener("message", (event) => {
      const { type, data } = event.data;

      if (type === "IMPORT_RESPONSE") {
        setResponse(data);
      }
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();

      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    function onApply(e: CustomEvent<{ data: TransformResponse }>): void {
      applyResponse(e.detail.data);
    }

    // @ts-ignore
    window.addEventListener("apply-ranges", onApply);

    // @ts-ignore
    return () => window.removeEventListener("apply-ranges", onApply);
  }, [applyResponse]);

  useEffect(() => {
    function onReset(e: CustomEvent): void {
      reset();
    }

    // @ts-ignore
    window.addEventListener("reset-ranges", onReset);

    // @ts-ignore
    return () => window.removeEventListener("reset-ranges", onReset);
  }, [reset]);

  useEffect(() => {
    if (response != null) {
      setConfig((old) =>
        produce(old, (draft) => {
          draft.data = response;
        })
      );

      window.dispatchEvent(
        new CustomEvent("apply-ranges", {
          detail: {
            data: response
          }
        })
      );
    }
  }, [response, setConfig]);

  async function onConfirm() {
    const file = fileRef.current?.files?.[0];

    if (file == null) {
      return;
    }

    reset();

    const data = await file.text();

    workerRef.current?.postMessage({
      type: "IMPORT",
      data,
      groupActions: groupActions,
      calculateFrequencies: calculate
    });

    setConfig((old) =>
      produce(old, (draft) => {
        draft.groupActions = groupActions;
        draft.file = file.name.replace(/.\w+$/, "")?.replace(/[-_]/g, " ");
      })
    );
  }

  return (
    <Dialog
      id="import"
      title="Import"
      actions={[
        <button onClick={() => close()} className="Button-secondary">
          Cancel
        </button>,
        <button onClick={onConfirm}>Confirm</button>
      ]}
    >
      <input type="file" name="file" ref={fileRef} />

      <Spacing />

      <label className="Checkbox">
        <input
          type="checkbox"
          name="group_actions"
          checked={groupActions}
          onChange={(e) => setGroupActions(e.target.checked)}
        />
        <span>Group actions</span>
      </label>

      <Spacing />

      <label className="Checkbox">
        <input
          type="checkbox"
          name="calculate"
          checked={calculate}
          onChange={(e) => setCalculate(e.target.checked)}
        />
        <span>Calculate Frequencies</span>
      </label>
    </Dialog>
  );
}

function SaveDialog() {
  const [savedFiles, setSavedFiles] = useRecoilState(savedFilesState);
  const config = useRecoilValue(configState);
  const [, { close }] = useUpdateDialog("save");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onConfirm() {
    if (fileRef.current == null) {
      return;
    }

    const name = fileRef.current.value;

    const files = Array.from(new Set(savedFiles.concat(name)));

    localStorage.setItem("saved-files", JSON.stringify(files));

    localStorage.setItem(`config/${name}`, JSON.stringify(config));

    setSavedFiles(files);
  }

  return (
    <Dialog
      id="save"
      title="Save"
      actions={[
        <button
          onClick={() => close()}
          className="Button-secondary"
          key="cancel"
        >
          Cancel
        </button>,
        <button onClick={onConfirm} key="confirm">
          Confirm
        </button>
      ]}
    >
      <input
        type="text"
        name="name"
        defaultValue={config.file || ""}
        ref={fileRef}
      />

      <Spacing />
    </Dialog>
  );
}

function Main() {
  return (
    <div className="App">
      <div className="Column">
        <RangeTable />
      </div>

      <div className="Sidebar">
        <SetRange />
        <Importer />
        <ActionsManager />
        <PositionsManager />
        <GroupManager />
      </div>

      <ImportDialog />
      <SaveDialog />
    </div>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <Main />
    </RecoilRoot>
  );
}
