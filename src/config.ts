export const GROUPS: Record<string, string> = {
  CALL: "#01579b",
  CHECK: "#2e7d32",
  FOLD: "#455a64",
  "BET 1": "#f44336",
  "BET 2": "#d32f2f",
  "BET 3": "#b71c1c"
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

  if (/raise/i.test(action)) {
    return "BET 1";
  }

  if (/(raise|2bet|pfr)/i.test(action)) {
    return "BET 2";
  }

  if (/(3bet|4bet|5bet)/i.test(action)) {
    return "BET 3";
  }

  return "BET 1";
}

// export const GROUPS = ["CALL", "CHECK", "FOLD", "BET 1", "BET 2", "BET 3"];

export const POSITIONS = ["SB", "BB", "EP", "MP", "CO", "BTN"];
