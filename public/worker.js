const FILE = {
  header: [],
  actions: []
};

const CORE = ["position", "hand", "hands"];

function removeQuotes(data) {
  return data.replace(/(^"|"$)/gm, "").replace(/","/gm, ",");
}

function isCoreHeader(header) {
  if (header == null) {
    return false;
  }

  return CORE.indexOf(header.toLowerCase()) > -1;
}

function transformData({ data, options }) {
  const transformed = [];
  const lines = data.split(/[\r\n]/g).splice(1);

  for (const row of lines) {
    const columns = removeQuotes(row).split(",");

    const info = {
      actions: {}
    };

    for (let i = 0; i < columns.length; i++) {
      const header = FILE.header[i];
      const column = columns[i];

      if (column === "" || column == null || column === "-") {
        continue;
      }

      if (isCoreHeader(header)) {
        info[header.toLowerCase()] = column;
        continue;
      }

      const value = Math.round(Number(column)) || 0;

      if (Number.isNaN(value)) {
        continue;
      }

      info.actions[header] = options.calculateFrequencies
        ? Math.round((value * 100) / info.hands)
        : value;
    }

    if (Object.keys(info.actions).length > 0 && info.hand != null) {
      transformed.push(info);
    }
  }

  return transformed;
}

function parseHeader(data) {
  const regex = /(.+)(\r\n|\n)/;
  const result = regex.exec(data);

  if (result == null) {
    throw new Error("Unable to parse the header");
  }

  FILE.header = removeQuotes(result[1]).split(",");
  FILE.actions = FILE.header.filter((header) => isCoreHeader(header) === false);
}

self.onmessage = (event) => {
  const { type, data, ...options } = event.data;

  if (type === "IMPORT") {
    parseHeader(data);

    const response = {};
    const transformed = transformData({ data, options });

    const positions = {};

    for (const info of transformed) {
      if (info.position in positions) {
        continue;
      }

      positions[info.position] = true;
    }

    response.actions = FILE.actions;
    response.positions = Object.keys(positions);
    response.ranges = {};

    function getHand(range, weight) {
      return {
        hand: range.hand,
        selected: true,
        actions: Object.keys(range.actions),
        weight
      };
    }

    const byPosition = {};

    for (const range of transformed) {
      if (options.groupActions) {
        const key = range.position;

        if (key in byPosition === false) {
          byPosition[key] = [];
        }

        const weight = Object.keys(range.actions).map(
          (action) => range.actions[action] || 0
        );

        byPosition[key].push(getHand(range, weight));
      } else {
        const weight = Object.keys(range.actions).map(
          (action) => range.actions[action] || 0
        );

        for (const action in range.actions) {
          const key = range.position + action;

          if (key in byPosition === false) {
            byPosition[key] = [];
          }

          byPosition[key].push(getHand(range, weight));
        }
      }
    }

    function setRange(key) {
      const hands = byPosition[key];

      const hasHands =
        hands.filter(
          (hand) => hand.weight.filter((weight) => weight > 0).length > 0
        ).length > 0;

      if (hasHands) {
        response.ranges[key] = hands;
      }
    }

    for (const range of transformed) {
      if (options.groupActions) {
        const key = range.position;

        setRange(key);
      } else {
        for (const action in range.actions) {
          const key = range.position + action;

          setRange(key);
        }
      }
    }

    self.postMessage({ type: "IMPORT_RESPONSE", data: response });
  }
};
