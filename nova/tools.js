/* =========================================================
   NOVA AI — LOCAL TOOL ENGINE
   Browser-safe utilities.
========================================================= */

(function () {
  "use strict";

  const registry = {};

  function register(name, description, detector, runner) {
    registry[name] = {
      name,
      description,
      detector,
      runner
    };
  }


  /* =======================================================
     SAFE NUMBER PARSING
  ======================================================= */

  function number(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
      throw new Error("Invalid number.");
    }

    return n;
  }


  function formatNumber(value, maximumFractionDigits = 8) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits
    }).format(value);
  }


  /* =======================================================
     CALCULATOR
  ======================================================= */

  function normalizeExpression(expression) {

    return expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/,/g, "")
      .replace(/\^/g, "**")
      .trim();
  }


  function safeCalculate(expression) {

    const clean = normalizeExpression(expression);

    if (!clean) {
      throw new Error("No expression supplied.");
    }

    if (clean.length > 300) {
      throw new Error("Expression is too long.");
    }

    if (!/^[0-9+\-*/%().\s*]+$/.test(clean)) {
      throw new Error(
        "Only basic arithmetic is supported by the calculator."
      );
    }

    if (clean.includes("**")) {
      const pieces = clean.split("**");

      if (pieces.length !== 2) {
        throw new Error("Invalid exponent expression.");
      }
    }

    const result = Function(
      `"use strict"; return (${clean});`
    )();

    if (!Number.isFinite(result)) {
      throw new Error("The result is not a finite number.");
    }

    return result;
  }


  register(
    "calculator",
    "Basic arithmetic calculations.",
    text =>
      /(?:calculate|compute|solve|what is)\s+[-+*/().\d\s%×÷−^]+$/i.test(
        text.trim()
      ),
    text => {

      const expression = text
        .replace(
          /^(?:calculate|compute|solve|what is)\s+/i,
          ""
        )
        .replace(/\?+$/, "")
        .trim();

      return {
        type: "calculator",
        result: safeCalculate(expression)
      };
    }
  );


  /* =======================================================
     PERCENTAGE
  ======================================================= */

  register(
    "percentage",
    "Percentage calculations.",
    text =>
      /\b\d+(?:\.\d+)?\s*%\s*(?:of|off)\s*\d+/i.test(text) ||
      /\bwhat\s+percent/i.test(text),
    text => {

      const ofMatch = text.match(
        /(\d+(?:\.\d+)?)\s*%\s*(?:of|off)\s*(\d+(?:\.\d+)?)/i
      );

      if (ofMatch) {

        const percent = number(ofMatch[1]);
        const value = number(ofMatch[2]);

        const amount =
          value * (percent / 100);

        return {
          type: "percentage",
          percent,
          value,
          result: amount
        };
      }

      const percentMatch = text.match(
        /(\d+(?:\.\d+)?)\s*(?:is|of)\s*(\d+(?:\.\d+)?)/i
      );

      if (percentMatch) {

        const a = number(percentMatch[1]);
        const b = number(percentMatch[2]);

        if (b === 0) {
          throw new Error("Cannot divide by zero.");
        }

        return {
          type: "percentage",
          result: (a / b) * 100
        };
      }

      return null;
    }
  );


  /* =======================================================
     UNIT CONVERTER
  ======================================================= */

  const units = {

    meters: 1,
    meter: 1,
    m: 1,

    kilometers: 1000,
    kilometer: 1000,
    km: 1000,

    centimeters: 0.01,
    centimeter: 0.01,
    cm: 0.01,

    millimeters: 0.001,
    millimeter: 0.001,
    mm: 0.001,

    miles: 1609.344,
    mile: 1609.344,
    mi: 1609.344,

    yards: 0.9144,
    yard: 0.9144,
    yd: 0.9144,

    feet: 0.3048,
    foot: 0.3048,
    ft: 0.3048,

    inches: 0.0254,
    inch: 0.0254,
    in: 0.0254,

    kilograms: 1,
    kilogram: 1,
    kg: 1,

    grams: 0.001,
    gram: 0.001,
    g: 0.001,

    pounds: 0.45359237,
    pound: 0.45359237,
    lb: 0.45359237,

    ounces: 0.028349523125,
    ounce: 0.028349523125,
    oz: 0.028349523125
  };


  function convertTemperature(value, from, to) {

    const f = from.toLowerCase();
    const t = to.toLowerCase();

    let celsius;

    if (
      f === "c" ||
      f === "celsius"
    ) {
      celsius = value;
    } else if (
      f === "f" ||
      f === "fahrenheit"
    ) {
      celsius =
        (value - 32) * 5 / 9;
    } else if (
      f === "k" ||
      f === "kelvin"
    ) {
      celsius =
        value - 273.15;
    } else {
      throw new Error("Unsupported temperature unit.");
    }

    if (
      t === "c" ||
      t === "celsius"
    ) {
      return celsius;
    }

    if (
      t === "f" ||
      t === "fahrenheit"
    ) {
      return celsius * 9 / 5 + 32;
    }

    if (
      t === "k" ||
      t === "kelvin"
    ) {
      return celsius + 273.15;
    }

    throw new Error("Unsupported temperature unit.");
  }


  register(
    "unit_converter",
    "Convert common units.",
    text =>
      /\b\d+(?:\.\d+)?\s*[a-z]+\s+(?:to|in)\s+[a-z]+\b/i.test(text),
    text => {

      const match = text.match(
        /(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)/i
      );

      if (!match) {
        return null;
      }

      const value = number(match[1]);
      const from = match[2];
      const to = match[3];

      const temperatureUnits = [
        "c",
        "f",
        "k",
        "celsius",
        "fahrenheit",
        "kelvin"
      ];

      if (
        temperatureUnits.includes(from.toLowerCase()) &&
        temperatureUnits.includes(to.toLowerCase())
      ) {

        return {
          type: "unit_converter",
          value,
          from,
          to,
          result:
            convertTemperature(
              value,
              from,
              to
            )
        };
      }

      const fromFactor =
        units[from.toLowerCase()];

      const toFactor =
        units[to.toLowerCase()];

      if (
        fromFactor === undefined ||
        toFactor === undefined
      ) {
        return null;
      }

      return {
        type: "unit_converter",
        value,
        from,
        to,
        result:
          value * fromFactor / toFactor
      };
    }
  );


  /* =======================================================
     STATISTICS
  ======================================================= */

  register(
    "statistics",
    "Calculate count, sum, mean, median, minimum and maximum.",
    text =>
      /\b(mean|average|median|statistics|std deviation|standard deviation)\b/i.test(
        text
      ),
    text => {

      const numbers =
        text.match(
          /-?\d+(?:\.\d+)?/g
        )?.map(Number) || [];

      if (numbers.length < 2) {
        throw new Error(
          "Provide at least two numbers."
        );
      }

      const sorted =
        [...numbers].sort((a, b) => a - b);

      const sum =
        numbers.reduce(
          (a, b) => a + b,
          0
        );

      const mean =
        sum / numbers.length;

      const middle =
        Math.floor(sorted.length / 2);

      const median =
        sorted.length % 2
          ? sorted[middle]
          : (sorted[middle - 1] + sorted[middle]) / 2;

      const variance =
        numbers.reduce(
          (total, value) =>
            total + Math.pow(value - mean, 2),
          0
        ) / numbers.length;

      return {
        type: "statistics",
        count: numbers.length,
        sum,
        mean,
        median,
        minimum: sorted[0],
        maximum: sorted[sorted.length - 1],
        standardDeviation:
          Math.sqrt(variance)
      };
    }
  );


  /* =======================================================
     DATE DIFFERENCE
  ======================================================= */

  register(
    "date_difference",
    "Calculate the number of days between two dates.",
    text =>
      /\b(days?\s+between|difference between|date difference)\b/i.test(
        text
      ),
    text => {

      const dates =
        text.match(
          /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g
        ) || [];

      if (dates.length < 2) {
        throw new Error(
          "Use two dates such as 2026-01-01 and 2026-12-31."
        );
      }

      const a =
        new Date(
          dates[0].replace(/\//g, "-")
        );

      const b =
        new Date(
          dates[1].replace(/\//g, "-")
        );

      if (
        Number.isNaN(a.getTime()) ||
        Number.isNaN(b.getTime())
      ) {
        throw new Error("Invalid date.");
      }

      const days =
        Math.round(
          Math.abs(
            b.getTime() - a.getTime()
          ) / 86400000
        );

      return {
        type: "date_difference",
        firstDate: dates[0],
        secondDate: dates[1],
        days
      };
    }
  );


  /* =======================================================
     PRIME
  ======================================================= */

  register(
    "prime",
    "Check whether a number is prime.",
    text =>
      /\b(is|check)\s+\d+\s+(a\s+)?prime\b/i.test(text),
    text => {

      const match =
        text.match(/\b\d+\b/);

      if (!match) {
        return null;
      }

      const n =
        Number(match[0]);

      if (!Number.isInteger(n) || n < 0) {
        throw new Error(
          "Use a non-negative integer."
        );
      }

      if (n < 2) {
        return {
          type: "prime",
          number: n,
          prime: false
        };
      }

      for (
        let i = 2;
        i <= Math.sqrt(n);
        i++
      ) {

        if (n % i === 0) {

          return {
            type: "prime",
            number: n,
            prime: false,
            divisor: i
          };
        }
      }

      return {
        type: "prime",
        number: n,
        prime: true
      };
    }
  );


  /* =======================================================
     GCD / LCM
  ======================================================= */

  function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

      const temp = b;

      b = a % b;

      a = temp;
    }

    return a;
  }


  register(
    "gcd_lcm",
    "Calculate greatest common divisor or least common multiple.",
    text =>
      /\b(gcd|lcm|greatest common divisor|least common multiple)\b/i.test(
        text
      ),
    text => {

      const values =
        text.match(
          /-?\d+(?:\.\d+)?/g
        )?.map(Number) || [];

      if (values.length < 2) {
        throw new Error(
          "Provide at least two numbers."
        );
      }

      if (
        values.some(
          value =>
            !Number.isInteger(value)
        )
      ) {
        throw new Error(
          "GCD/LCM requires integers."
        );
      }

      const g =
        values.reduce(
          (a, b) => gcd(a, b)
        );

      const l =
        Math.abs(
          values.reduce(
            (a, b) =>
              (a / gcd(a, b)) * b
          )
        );

      return {
        type: "gcd_lcm",
        gcd: g,
        lcm: l
      };
    }
  );


  /* =======================================================
     JSON
  ======================================================= */

  register(
    "json",
    "Format and validate JSON.",
    text =>
      /\b(json|validate json|format json|pretty print json)\b/i.test(
        text
      ),
    text => {

      const firstBrace =
        Math.min(
          ...[
            text.indexOf("{"),
            text.indexOf("[")
          ].filter(
            n => n >= 0
          )
        );

      if (!Number.isFinite(firstBrace)) {
        return null;
      }

      const jsonText =
        text.slice(firstBrace);

      try {

        const parsed =
          JSON.parse(jsonText);

        return {
          type: "json",
          valid: true,
          formatted:
            JSON.stringify(
              parsed,
              null,
              2
            )
        };

      } catch (error) {

        return {
          type: "json",
          valid: false,
          error: error.message
        };
      }
    }
  );


  /* =======================================================
     TEXT ANALYSIS
  ======================================================= */

  register(
    "text_analysis",
    "Count words, characters and sentences.",
    text =>
      /\b(word count|character count|analyze this text|text analysis)\b/i.test(
        text
      ),
    text => {

      const content =
        text
          .replace(
            /^(?:word count|character count|analyze this text|text analysis)\s*:?\s*/i,
            ""
          )
          .trim();

      const words =
        content.match(/\b[\w'-]+\b/g) || [];

      const sentences =
        content
          .split(/[.!?]+/)
          .filter(Boolean);

      return {
        type: "text_analysis",
        characters: content.length,
        charactersWithoutSpaces:
          content.replace(/\s/g, "").length,
        words: words.length,
        sentences: sentences.length,
        lines:
          content
            ? content.split(/\n/).length
            : 0
      };
    }
  );


  /* =======================================================
     NUMBER BASE
  ======================================================= */

  register(
    "number_base",
    "Convert binary, decimal, hexadecimal and octal numbers.",
    text =>
      /\b(binary|decimal|hexadecimal|hex|octal)\b.*\b(to|convert)\b/i.test(
        text
      ),
    text => {

      const match =
        text.match(
          /(?:binary|decimal|hexadecimal|hex|octal)\s+([0-9a-fA-F]+)\s+(?:to|into)\s+(binary|decimal|hexadecimal|hex|octal)/i
        );

      if (!match) {
        return null;
      }

      const source =
        text.match(
          /\b(binary|decimal|hexadecimal|hex|octal)\s+/i
        )?.[1]
        ?.toLowerCase();

      const value =
        match[1];

      const target =
        match[2].toLowerCase();

      const radix = {
        binary: 2,
        decimal: 10,
        hexadecimal: 16,
        hex: 16,
        octal: 8
      };

      const decimal =
        parseInt(
          value,
          radix[source]
        );

      if (Number.isNaN(decimal)) {
        throw new Error(
          "Invalid number for the selected base."
        );
      }

      return {
        type: "number_base",
        source,
        value,
        target,
        result:
          decimal.toString(
            radix[target]
          ).toUpperCase()
      };
    }
  );


  /* =======================================================
     SCIENTIFIC CALCULATOR
  ======================================================= */

  register(
    "scientific",
    "Scientific calculations such as sqrt, sin, cos, tan, log and powers.",
    text =>
      /\b(sqrt|square root|sin|cos|tan|log|ln|power|factorial)\b/i.test(
        text
      ),
    text => {

      const lower =
        text.toLowerCase();

      const valueMatch =
        text.match(
          /-?\d+(?:\.\d+)?/
        );

      if (!valueMatch) {
        return null;
      }

      const value =
        Number(valueMatch[0]);

      let result;

      if (
        lower.includes("square root") ||
        lower.includes("sqrt")
      ) {

        if (value < 0) {
          throw new Error(
            "Square root of a negative number is not supported."
          );
        }

        result =
          Math.sqrt(value);

      } else if (lower.includes("sin")) {

        result =
          Math.sin(
            value * Math.PI / 180
          );

      } else if (lower.includes("cos")) {

        result =
          Math.cos(
            value * Math.PI / 180
          );

      } else if (lower.includes("tan")) {

        result =
          Math.tan(
            value * Math.PI / 180
          );

      } else if (lower.includes("log")) {

        if (value <= 0) {
          throw new Error(
            "Logarithm requires a positive number."
          );
        }

        result =
          Math.log10(value);

      } else if (lower.includes("ln")) {

        if (value <= 0) {
          throw new Error(
            "Natural logarithm requires a positive number."
          );
        }

        result =
          Math.log(value);

      } else if (
        lower.includes("factorial")
      ) {

        if (
          !Number.isInteger(value) ||
          value < 0 ||
          value > 170
        ) {
          throw new Error(
            "Factorial requires an integer from 0 to 170."
          );
        }

        result = 1;

        for (
          let i = 2;
          i <= value;
          i++
        ) {
          result *= i;
        }

      } else {
        return null;
      }

      return {
        type: "scientific",
        input: value,
        result
      };
    }
  );


  /* =======================================================
     TOOL DETECTION
  ======================================================= */

  function detectTool(text) {

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return null;
    }

    const candidates =
      Object.values(registry);

    for (const tool of candidates) {

      try {

        if (tool.detector(text)) {
          return tool.name;
        }

      } catch (_) {}

    }

    return null;
  }


  /* =======================================================
     TOOL EXECUTION
  ======================================================= */

  function runTool(
    toolName,
    text
  ) {

    const tool =
      registry[toolName];

    if (!tool) {
      return null;
    }

    try {

      const result =
        tool.runner(text);

      if (!result) {
        return null;
      }

      return {
        ...result,
        tool: toolName
      };

    } catch (error) {

      return {
        type: "error",
        tool: toolName,
        error:
          error?.message ||
          "Tool failed."
      };
    }
  }


  function runToolFromMessage(text) {

    const toolName =
      detectTool(text);

    if (!toolName) {
      return null;
    }

    return runTool(
      toolName,
      text
    );
  }


  /* =======================================================
     RESULT FORMATTING
  ======================================================= */

  function formatResult(result) {

    if (!result) {
      return "";
    }

    if (result.type === "error") {
      return `**Tool error:** ${result.error}`;
    }


    if (result.type === "calculator") {
      return `**Result:** ${formatNumber(result.result)}`;
    }


    if (result.type === "percentage") {

      if (
        result.percent !== undefined &&
        result.value !== undefined
      ) {

        return (
          `**${formatNumber(result.percent)}% of ` +
          `${formatNumber(result.value)} = ` +
          `${formatNumber(result.result)}**`
        );
      }

      return `**Result:** ${formatNumber(result.result)}%`;
    }


    if (result.type === "unit_converter") {

      return (
        `**${formatNumber(result.value)} ${result.from} ` +
        `= ${formatNumber(result.result)} ${result.to}**`
      );
    }


    if (result.type === "statistics") {

      return [
        "**Statistics**",
        "",
        `- Count: ${result.count}`,
        `- Sum: ${formatNumber(result.sum)}`,
        `- Mean: ${formatNumber(result.mean)}`,
        `- Median: ${formatNumber(result.median)}`,
        `- Minimum: ${formatNumber(result.minimum)}`,
        `- Maximum: ${formatNumber(result.maximum)}`,
        `- Standard deviation: ${formatNumber(result.standardDeviation)}`
      ].join("\n");
    }


    if (result.type === "date_difference") {

      return (
        `**Difference:** ${result.days} day` +
        `${result.days === 1 ? "" : "s"}`
      );
    }


    if (result.type === "prime") {

      if (result.prime) {
        return `**${result.number} is prime.**`;
      }

      if (result.divisor) {
        return (
          `**${result.number} is not prime.** ` +
          `It is divisible by ${result.divisor}.`
        );
      }

      return `**${result.number} is not prime.**`;
    }


    if (result.type === "gcd_lcm") {

      return [
        "**GCD / LCM**",
        "",
        `- GCD: ${result.gcd}`,
        `- LCM: ${result.lcm}`
      ].join("\n");
    }


    if (result.type === "json") {

      if (!result.valid) {
        return (
          `**Invalid JSON.**\n\n` +
          `${result.error}`
        );
      }

      return (
        "```json\n" +
        result.formatted +
        "\n```"
      );
    }


    if (result.type === "text_analysis") {

      return [
        "**Text analysis**",
        "",
        `- Characters: ${result.characters}`,
        `- Characters without spaces: ${result.charactersWithoutSpaces}`,
        `- Words: ${result.words}`,
        `- Sentences: ${result.sentences}`,
        `- Lines: ${result.lines}`
      ].join("\n");
    }


    if (result.type === "number_base") {

      return (
        `**${result.value} (${result.source}) ` +
        `= ${result.result} (${result.target})**`
      );
    }


    if (result.type === "scientific") {

      return (
        `**Result:** ${formatNumber(result.result)}`
      );
    }


    return "";
  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.NOVA_TOOLS = {

    registry,

    detect: detectTool,

    run: runTool,

    runFromMessage: runToolFromMessage,

    format: formatResult,

    list: () =>
      Object.values(registry).map(
        tool => ({
          name: tool.name,
          description: tool.description
        })
      )
  };

  window.novaDetectTool = detectTool;
  window.novaRunTool = runTool;
  window.novaRunToolFromMessage = runToolFromMessage;
  window.novaFormatToolResult = formatResult;
  window.novaGetAvailableTools =
    window.NOVA_TOOLS.list;

})();
