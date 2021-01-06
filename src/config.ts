export const GROUPS: Record<string, string> = {
  CALL: "#01579b",
  CHECK: "#2e7d32",
  FOLD: "#455a64",
  "BET 1": "#f44336",
  "BET 2": "#c62828",
  "BET 3": "#a61515",
  "BET 4": "#8e0000",
  "BET 5": "#5e0101"
};

export function getGroup(action: string): string {
  if (/fold/i.test(action)) {
    return "FOLD";
  }

  if (/check/i.test(action)) {
    return "CHECK";
  }

  if (/call/i.test(action)) {
    return "CALL";
  }

  if (/(raise|pfr)/i.test(action)) {
    return "BET 1";
  }

  if (/2bet/i.test(action)) {
    return "BET 2";
  }

  if (/3bet/i.test(action)) {
    return "BET 3";
  }

  if (/4bet/i.test(action)) {
    return "BET 4";
  }

  if (/5bet/i.test(action)) {
    return "BET 5";
  }

  return "BET 1";
}

// export const GROUPS = ["CALL", "CHECK", "FOLD", "BET 1", "BET 2", "BET 3"];

export const POSITIONS = ["SB", "BB", "EP", "MP", "CO", "BTN"];
