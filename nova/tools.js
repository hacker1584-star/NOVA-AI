/* =========================================================
   NOVA AI — UNIFIED TOOL ENGINE
   =========================================================

   Local tools:
   - Calculator
   - Scientific calculator
   - Percentages
   - Unit conversion
   - Date / time
   - Date difference
   - Statistics
   - JSON formatter / validator
   - Number base conversion
   - Prime checker
   - GCD / LCM
   - Text analysis
   - Password generator

   Architecture:
   User
      ↓
   Tool detector
      ↓
   Tool registry
      ↓
   Tool execution
      ↓
   Result
      ↓
   NOVA
========================================================= */


/* =========================================================
   GLOBAL TOOL REGISTRY
========================================================= */

const NOVA_TOOL_REGISTRY = {

  calculator: {
    name: "calculator",
    description: "Performs arithmetic calculations.",
    category: "math",
    local: true
  },

  scientific: {
    name: "scientific",
    description: "Performs scientific calculations.",
    category: "math",
    local: true
  },

  percentage: {
    name: "percentage",
    description: "Calculates percentages.",
    category: "math",
    local: true
  },

  converter: {
    name: "converter",
    description: "Converts compatible units.",
    category: "utility",
    local: true
  },

  datetime: {
    name: "datetime",
    description: "Returns date and time information.",
    category: "utility",
    local: true
  },

  date_difference: {
    name: "date_difference",
    description: "Calculates the difference between dates.",
    category: "utility",
    local: true
  },

  statistics: {
    name: "statistics",
    description: "Analyzes a list of numbers.",
    category: "data",
    local: true
  },

  json: {
    name: "json",
    description: "Validates and formats JSON.",
    category: "developer",
    local: true
  },

  base_converter: {
    name: "base_converter",
    description: "Converts numbers between bases.",
    category: "developer",
    local: true
  },

  prime: {
    name: "prime",
    description: "Checks whether a number is prime.",
    category: "math",
    local: true
  },

  gcd_lcm: {
    name: "gcd_lcm",
    description: "Calculates greatest common divisor and least common multiple.",
    category: "math",
    local: true
  },

  text_analysis: {
    name: "text_analysis",
    description: "Analyzes text length, words and characters.",
    category: "text",
    local: true
  },

  password: {
    name: "password",
    description: "Generates a random password locally.",
    category: "security",
    local: true
  }

};


/* =========================================================
   GENERAL HELPERS
========================================================= */

function novaRound(value, decimals = 8) {

  if (!Number.isFinite(value)) {
    return value;
  }

  return Number(
    value.toFixed(decimals)
  );

}


function novaFormatNumber(value) {

  if (!Number.isFinite(value)) {
    return "Invalid result";
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return Number(
    value.toFixed(10)
  ).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 10
    }
  );

}


function novaNormalizeText(text) {

  return String(text || "")
    .trim()
    .replace(/\s+/g, " ");

}


/* =========================================================
   SAFE MATHEMATICAL TOKENIZER
========================================================= */

function novaTokenize(expression) {

  const tokens = [];

  let i = 0;

  while (i < expression.length) {

    const char = expression[i];


    if (/\s/.test(char)) {

      i++;

      continue;
    }


    if (/[0-9.]/.test(char)) {

      let number = "";

      while (
        i < expression.length &&
        /[0-9.eE]/.test(expression[i])
      ) {

        number += expression[i];

        i++;
      }


      const value = Number(number);


      if (!Number.isFinite(value)) {

        throw new Error(
          "Invalid number."
        );

      }


      tokens.push({
        type: "number",
        value
      });

      continue;
    }


    if (
      expression.startsWith(
        "**",
        i
      )
    ) {

      tokens.push({
        type: "operator",
        value: "^"
      });

      i += 2;

      continue;
    }


    if (
      "+-*/%^".includes(char)
    ) {

      tokens.push({
        type: "operator",
        value: char
      });

      i++;

      continue;
    }


    if (
      char === "(" ||
      char === ")"
    ) {

      tokens.push({
        type: char,
        value: char
      });

      i++;

      continue;
    }


    throw new Error(
      `Unsupported character: ${char}`
    );

  }


  return tokens;

}


/* =========================================================
   SAFE CALCULATOR PARSER
========================================================= */

function novaCalculate(expression) {

  const tokens =
    novaTokenize(expression);

  let position = 0;


  function peek() {

    return tokens[position];

  }


  function consume() {

    return tokens[position++];

  }


  function parsePrimary() {

    const token =
      peek();


    if (!token) {

      throw new Error(
        "Unexpected end of expression."
      );

    }


    if (
      token.type === "operator" &&
      (
        token.value === "+" ||
        token.value === "-"
      )
    ) {

      consume();

      const value =
        parsePrimary();

      return token.value === "-"
        ? -value
        : value;

    }


    if (
      token.type === "number"
    ) {

      consume();

      return token.value;

    }


    if (
      token.type === "("
    ) {

      consume();

      const value =
        parseAdditive();

      if (
        !peek() ||
        peek().type !== ")"
      ) {

        throw new Error(
          "Missing closing parenthesis."
        );

      }

      consume();

      return value;

    }


    throw new Error(
      "Invalid expression."
    );

  }


  function parsePower() {

    let left =
      parsePrimary();


    if (
      peek() &&
      peek().type === "operator" &&
      peek().value === "^"
    ) {

      consume();

      const right =
        parsePower();

      left =
        Math.pow(
          left,
          right
        );

    }


    return left;

  }


  function parseMultiplication() {

    let left =
      parsePower();


    while (
      peek() &&
      peek().type === "operator" &&
      (
        peek().value === "*" ||
        peek().value === "/" ||
        peek().value === "%"
      )
    ) {

      const operator =
        consume().value;

      const right =
        parsePower();


      if (operator === "*") {

        left *= right;

      }


      if (operator === "/") {

        if (right === 0) {

          throw new Error(
            "Cannot divide by zero."
          );

        }

        left /= right;

      }


      if (operator === "%") {

        if (right === 0) {

          throw new Error(
            "Cannot use zero as the modulus."
          );

        }

        left %= right;

      }

    }


    return left;

  }


  function parseAdditive() {

    let left =
      parseMultiplication();


    while (
      peek() &&
      peek().type === "operator" &&
      (
        peek().value === "+" ||
        peek().value === "-"
      )
    ) {

      const operator =
        consume().value;

      const right =
        parseMultiplication();


      if (operator === "+") {

        left += right;

      }


      if (operator === "-") {

        left -= right;

      }

    }


    return left;

  }


  const result =
    parseAdditive();


  if (
    position < tokens.length
  ) {

    throw new Error(
      "Unexpected part of expression."
    );

  }


  if (
    !Number.isFinite(result)
  ) {

    throw new Error(
      "Result is too large or invalid."
    );

  }


  return result;

}


/* =========================================================
   SCIENTIFIC CALCULATOR
========================================================= */

function novaScientific(expression) {

  let exp =
    String(expression)
      .toLowerCase()
      .trim();


  exp = exp
    .replace(/\s+/g, "");


  const functions = {

    sin: Math.sin,

    cos: Math.cos,

    tan: Math.tan,

    asin: Math.asin,

    acos: Math.acos,

    atan: Math.atan,

    sqrt: Math.sqrt,

    abs: Math.abs,

    floor: Math.floor,

    ceil: Math.ceil,

    round: Math.round,

    log: Math.log10,

    ln: Math.log,

    exp: Math.exp

  };


  const functionMatch =
    exp.match(
      /^([a-z]+)\((.+)\)$/
    );


  if (functionMatch) {

    const name =
      functionMatch[1];

    const inner =
      functionMatch[2];


    if (
      !functions[name]
    ) {

      throw new Error(
        "Unsupported scientific function."
      );

    }


    const value =
      novaCalculate(inner);


    const result =
      functions[name](value);


    if (
      !Number.isFinite(result)
    ) {

      throw new Error(
        "Scientific calculation produced an invalid result."
      );

    }


    return result;

  }


  // Factorial
  const factorialMatch =
    exp.match(
      /^(\d+(?:\.\d+)?)!$/
    );


  if (factorialMatch) {

    const number =
      Number(
        factorialMatch[1]
      );


    if (
      !Number.isInteger(number) ||
      number < 0 ||
      number > 170
    ) {

      throw new Error(
        "Factorial requires a whole number from 0 to 170."
      );

    }


    let result = 1;


    for (
      let i = 2;
      i <= number;
      i++
    ) {

      result *= i;

    }


    return result;

  }


  return novaCalculate(exp);

}


/* =========================================================
   PERCENTAGE TOOL
========================================================= */

function novaPercentageTool(text) {

  const input =
    novaNormalizeText(text);


  let match =
    input.match(
      /^(-?\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(-?\d+(?:\.\d+)?)$/i
    );


  if (match) {

    const percentage =
      Number(match[1]);

    const amount =
      Number(match[2]);

    const result =
      (percentage / 100) * amount;


    return {
      success: true,
      tool: "percentage",
      operation: "percentage_of",
      percentage,
      amount,
      result,
      formatted:
        `${novaFormatNumber(result)}`
    };

  }


  match =
    input.match(
      /^(-?\d+(?:\.\d+)?)\s+is\s+what\s+percent\s+of\s+(-?\d+(?:\.\d+)?)$/i
    );


  if (match) {

    const value =
      Number(match[1]);

    const total =
      Number(match[2]);


    if (total === 0) {

      return {
        success: false,
        tool: "percentage",
        error:
          "The total cannot be zero."
      };

    }


    const result =
      (value / total) * 100;


    return {
      success: true,
      tool: "percentage",
      operation: "what_percent",
      value,
      total,
      result,
      formatted:
        `${novaFormatNumber(result)}%`
    };

  }


  match =
    input.match(
      /^(-?\d+(?:\.\d+)?)\s*(?:increase|decrease)\s*(?:by)\s*(-?\d+(?:\.\d+)?)%$/i
    );


  if (match) {

    const amount =
      Number(match[1]);

    const percentage =
      Number(match[2]);

    const isDecrease =
      /decrease/i.test(input);


    const multiplier =
      isDecrease
        ? 1 - percentage / 100
        : 1 + percentage / 100;


    const result =
      amount * multiplier;


    return {
      success: true,
      tool: "percentage",
      operation:
        isDecrease
          ? "decrease"
          : "increase",
      amount,
      percentage,
      result,
      formatted:
        novaFormatNumber(result)
    };

  }


  return {
    success: false,
    tool: "percentage",
    error:
      "I couldn't understand that percentage calculation."
  };

}


/* =========================================================
   UNIT CONVERTER
========================================================= */

const NOVA_UNIT_TABLE = {

  length: {

    meter: 1,
    meters: 1,
    m: 1,

    kilometer: 1000,
    kilometers: 1000,
    km: 1000,

    centimeter: 0.01,
    centimeters: 0.01,
    cm: 0.01,

    millimeter: 0.001,
    millimeters: 0.001,
    mm: 0.001,

    mile: 1609.344,
    miles: 1609.344,

    yard: 0.9144,
    yards: 0.9144,

    foot: 0.3048,
    feet: 0.3048,
    ft: 0.3048,

    inch: 0.0254,
    inches: 0.0254,
    in: 0.0254

  },


  mass: {

    kilogram: 1,
    kilograms: 1,
    kg: 1,

    gram: 0.001,
    grams: 0.001,
    g: 0.001,

    milligram: 0.000001,
    milligrams: 0.000001,
    mg: 0.000001,

    pound: 0.45359237,
    pounds: 0.45359237,
    lb: 0.45359237,
    lbs: 0.45359237,

    ounce: 0.028349523125,
    ounces: 0.028349523125,
    oz: 0.028349523125

  },


  volume: {

    liter: 1,
    liters: 1,
    l: 1,

    milliliter: 0.001,
    milliliters: 0.001,
    ml: 0.001,

    gallon: 3.785411784,
    gallons: 3.785411784,

    cup: 0.2365882365,
    cups: 0.2365882365

  },


  time: {

    second: 1,
    seconds: 1,
    sec: 1,

    minute: 60,
    minutes: 60,
    min: 60,

    hour: 3600,
    hours: 3600,
    hr: 3600,

    day: 86400,
    days: 86400

  }

};


function novaTemperature(
  value,
  from,
  to
) {

  let celsius;


  if (
    from === "c" ||
    from === "celsius"
  ) {

    celsius = value;

  }

  else if (
    from === "f" ||
    from === "fahrenheit"
  ) {

    celsius =
      (value - 32) * 5 / 9;

  }

  else if (
    from === "k" ||
    from === "kelvin"
  ) {

    celsius =
      value - 273.15;

  }

  else {

    throw new Error(
      "Unsupported temperature unit."
    );

  }


  if (
    to === "c" ||
    to === "celsius"
  ) {

    return celsius;

  }


  if (
    to === "f" ||
    to === "fahrenheit"
  ) {

    return (
      celsius * 9 / 5
    ) + 32;

  }


  if (
    to === "k" ||
    to === "kelvin"
  ) {

    return celsius + 273.15;

  }


  throw new Error(
    "Unsupported temperature unit."
  );

}


function novaFindUnitCategory(
  from,
  to
) {

  for (
    const category in NOVA_UNIT_TABLE
  ) {

    const table =
      NOVA_UNIT_TABLE[category];


    if (
      Object.prototype.hasOwnProperty.call(
        table,
        from
      ) &&
      Object.prototype.hasOwnProperty.call(
        table,
        to
      )
    ) {

      return category;

    }

  }


  return null;

}


function novaConvertUnits(
  value,
  from,
  to
) {

  const cleanFrom =
    from.toLowerCase().trim();

  const cleanTo =
    to.toLowerCase().trim();


  const temperatureUnits = [
    "c",
    "celsius",
    "f",
    "fahrenheit",
    "k",
    "kelvin"
  ];


  if (
    temperatureUnits.includes(cleanFrom) &&
    temperatureUnits.includes(cleanTo)
  ) {

    return novaTemperature(
      value,
      cleanFrom,
      cleanTo
    );

  }


  const category =
    novaFindUnitCategory(
      cleanFrom,
      cleanTo
    );


  if (!category) {

    throw new Error(
      "Those units cannot be converted together."
    );

  }


  const table =
    NOVA_UNIT_TABLE[category];


  const baseValue =
    value * table[cleanFrom];


  return (
    baseValue /
    table[cleanTo]
  );

}


function novaConverterTool(text) {

  const match =
    String(text).match(
      /(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)/i
    );


  if (!match) {

    return null;

  }


  try {

    const value =
      Number(match[1]);

    const from =
      match[2];

    const to =
      match[3];


    const result =
      novaConvertUnits(
        value,
        from,
        to
      );


    return {
      success: true,
      tool: "converter",
      value,
      from,
      to,
      result,
      formatted:
        novaFormatNumber(result)
    };

  }

  catch (error) {

    return {
      success: false,
      tool: "converter",
      error: error.message
    };

  }

}


/* =========================================================
   DATE / TIME
========================================================= */

function novaDateTimeTool() {

  const now =
    new Date();


  return {

    success: true,

    tool: "datetime",

    timestamp:
      now.getTime(),

    iso:
      now.toISOString(),

    date:
      now.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      ),

    time:
      now.toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }
      )

  };

}


/* =========================================================
   DATE DIFFERENCE
========================================================= */

function novaDateDifference(
  first,
  second
) {

  const date1 =
    new Date(first);

  const date2 =
    new Date(second);


  if (
    Number.isNaN(date1.getTime()) ||
    Number.isNaN(date2.getTime())
  ) {

    return {
      success: false,
      tool: "date_difference",
      error:
        "One or both dates are invalid."
    };

  }


  const milliseconds =
    Math.abs(
      date2.getTime() -
      date1.getTime()
    );


  const seconds =
    milliseconds / 1000;

  const minutes =
    seconds / 60;

  const hours =
    minutes / 60;

  const days =
    hours / 24;


  return {

    success: true,

    tool:
      "date_difference",

    milliseconds,

    seconds:
      novaRound(seconds, 2),

    minutes:
      novaRound(minutes, 2),

    hours:
      novaRound(hours, 2),

    days:
      novaRound(days, 2)

  };

}


/* =========================================================
   STATISTICS
========================================================= */

function novaStatistics(
  values
) {

  const numbers =
    values
      .map(Number)
      .filter(
        Number.isFinite
      );


  if (!numbers.length) {

    return {
      success: false,
      tool: "statistics",
      error:
        "No valid numbers were provided."
    };

  }


  const sorted =
    [...numbers].sort(
      (a, b) => a - b
    );


  const sum =
    numbers.reduce(
      (total, value) =>
        total + value,
      0
    );


  const mean =
    sum / numbers.length;


  const medianIndex =
    Math.floor(
      sorted.length / 2
    );


  const median =
    sorted.length % 2 === 0
      ? (
          sorted[medianIndex - 1] +
          sorted[medianIndex]
        ) / 2
      : sorted[medianIndex];


  const variance =
    numbers.reduce(
      (total, value) =>
        total +
        Math.pow(
          value - mean,
          2
        ),
      0
    ) / numbers.length;


  const standardDeviation =
    Math.sqrt(
      variance
    );


  return {

    success: true,

    tool:
      "statistics",

    count:
      numbers.length,

    sum:
      novaRound(sum),

    mean:
      novaRound(mean),

    median:
      novaRound(median),

    minimum:
      Math.min(...numbers),

    maximum:
      Math.max(...numbers),

    range:
      Math.max(...numbers) -
      Math.min(...numbers),

    variance:
      novaRound(variance),

    standardDeviation:
      novaRound(
        standardDeviation
      )

  };

}


/* =========================================================
   JSON TOOL
========================================================= */

function novaJSONTool(
  text
) {

  try {

    const parsed =
      JSON.parse(text);


    return {

      success: true,

      tool: "json",

      valid: true,

      formatted:
        JSON.stringify(
          parsed,
          null,
          2
        )

    };

  }

  catch (error) {

    return {

      success: false,

      tool: "json",

      valid: false,

      error:
        error.message

    };

  }

}


/* =========================================================
   NUMBER BASE CONVERTER
========================================================= */

function novaBaseConverter(
  value,
  fromBase,
  toBase
) {

  try {

    const decimal =
      parseInt(
        String(value),
        Number(fromBase)
      );


    if (
      Number.isNaN(decimal)
    ) {

      throw new Error(
        "Invalid number for the selected base."
      );

    }


    const result =
      decimal.toString(
        Number(toBase)
      ).toUpperCase();


    return {

      success: true,

      tool:
        "base_converter",

      input:
        value,

      fromBase:
        Number(fromBase),

      toBase:
        Number(toBase),

      result

    };

  }

  catch (error) {

    return {

      success: false,

      tool:
        "base_converter",

      error:
        error.message

    };

  }

}


/* =========================================================
   PRIME CHECKER
========================================================= */

function novaPrimeTool(
  value
) {

  const number =
    Number(value);


  if (
    !Number.isInteger(number) ||
    number < 0
  ) {

    return {

      success: false,

      tool: "prime",

      error:
        "Prime checking requires a non-negative whole number."

    };

  }


  if (number < 2) {

    return {

      success: true,

      tool: "prime",

      number,

      prime: false

    };

  }


  if (number === 2) {

    return {

      success: true,

      tool: "prime",

      number,

      prime: true

    };

  }


  if (number % 2 === 0) {

    return {

      success: true,

      tool: "prime",

      number,

      prime: false

    };

  }


  const limit =
    Math.sqrt(number);


  for (
    let i = 3;
    i <= limit;
    i += 2
  ) {

    if (
      number % i === 0
    ) {

      return {

        success: true,

        tool: "prime",

        number,

        prime: false

      };

    }

  }


  return {

    success: true,

    tool: "prime",

    number,

    prime: true

  };

}


/* =========================================================
   GCD / LCM
========================================================= */

function novaGCD(
  a,
  b
) {

  a = Math.abs(a);
  b = Math.abs(b);


  while (b !== 0) {

    const temp =
      b;

    b =
      a % b;

    a =
      temp;

  }


  return a;

}


function novaGCDLCM(
  a,
  b
) {

  a =
    Number(a);

  b =
    Number(b);


  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b)
  ) {

    return {

      success: false,

      tool:
        "gcd_lcm",

      error:
        "GCD and LCM require whole numbers."

    };

  }


  const gcd =
    novaGCD(a, b);


  const lcm =
    gcd === 0
      ? 0
      : Math.abs(
          (a * b) / gcd
        );


  return {

    success: true,

    tool:
      "gcd_lcm",

    a,

    b,

    gcd,

    lcm

  };

}


/* =========================================================
   TEXT ANALYSIS
========================================================= */

function novaTextAnalysis(
  text
) {

  const clean =
    String(text || "");


  const characters =
    clean.length;


  const charactersNoSpaces =
    clean.replace(
      /\s/g,
      ""
    ).length;


  const words =
    clean.trim()
      ? clean
          .trim()
          .split(/\s+/)
          .length
      : 0;


  const lines =
    clean
      ? clean.split(/\r?\n/).length
      : 0;


  const sentences =
    clean
      .split(/[.!?]+/)
      .filter(
        part => part.trim()
      ).length;


  return {

    success: true,

    tool:
      "text_analysis",

    characters,

    charactersNoSpaces,

    words,

    lines,

    sentences

  };

}


/* =========================================================
   PASSWORD GENERATOR
========================================================= */

function novaPasswordTool(
  length = 16,
  options = {}
) {

  length =
    Math.max(
      4,
      Math.min(
        128,
        Number(length) || 16
      )
    );


  const lowercase =
    "abcdefghijklmnopqrstuvwxyz";

  const uppercase =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const numbers =
    "0123456789";

  const symbols =
    "!@#$%^&*()-_=+[]{};:,.?/";


  let characters =
    lowercase +
    uppercase +
    numbers;


  if (
    options.symbols !== false
  ) {

    characters +=
      symbols;

  }


  const randomValues =
    new Uint32Array(
      length
    );


  crypto.getRandomValues(
    randomValues
  );


  let password = "";


  for (
    let i = 0;
    i < length;
    i++
  ) {

    password +=
      characters[
        randomValues[i] %
        characters.length
      ];

  }


  return {

    success: true,

    tool:
      "password",

    length,

    password

  };

}


/* =========================================================
   TOOL DETECTION
========================================================= */

function novaDetectTool(
  text
) {

  const input =
    String(text || "").trim();

  const lower =
    input.toLowerCase();


  /* -----------------------------------------
     DATE / TIME
  ----------------------------------------- */

  if (
    lower === "time" ||
    lower === "date" ||
    lower.includes(
      "what time is it"
    ) ||
    lower.includes(
      "current time"
    ) ||
    lower.includes(
      "what is today's date"
    ) ||
    lower.includes(
      "what's today's date"
    )
  ) {

    return {
      name: "datetime"
    };

  }


  /* -----------------------------------------
     PASSWORD
  ----------------------------------------- */

  if (
    lower.includes(
      "generate a password"
    ) ||
    lower.includes(
      "generate password"
    ) ||
    lower.includes(
      "create a password"
    )
  ) {

    return {
      name: "password"
    };

  }


  /* -----------------------------------------
     JSON
  ----------------------------------------- */

  if (
    lower.startsWith(
      "format json"
    ) ||
    lower.startsWith(
      "validate json"
    )
  ) {

    return {
      name: "json"
    };

  }


  /* -----------------------------------------
     PRIME
  ----------------------------------------- */

  if (
    lower.match(
      /is\s+\d+\s+(a\s+)?prime/
    ) ||
    lower.startsWith(
      "check if"
    ) &&
    lower.includes(
      "prime"
    )
  ) {

    return {
      name: "prime"
    };

  }


  /* -----------------------------------------
     GCD / LCM
  ----------------------------------------- */

  if (
    lower.includes("gcd") ||
    lower.includes(
      "greatest common divisor"
    ) ||
    lower.includes("lcm") ||
    lower.includes(
      "least common multiple"
    )
  ) {

    return {
      name: "gcd_lcm"
    };

  }


  /* -----------------------------------------
     STATISTICS
  ----------------------------------------- */

  if (
    lower.includes(
      "mean of"
    ) ||
    lower.includes(
      "median of"
    ) ||
    lower.includes(
      "standard deviation"
    ) ||
    lower.includes(
      "statistics for"
    ) ||
    lower.includes(
      "analyze these numbers"
    )
  ) {

    return {
      name: "statistics"
    };

  }


  /* -----------------------------------------
     TEXT ANALYSIS
  ----------------------------------------- */

  if (
    lower.startsWith(
      "analyze this text"
    ) ||
    lower.startsWith(
      "count the words"
    ) ||
    lower.startsWith(
      "count words"
    ) ||
    lower.startsWith(
      "word count"
    )
  ) {

    return {
      name: "text_analysis"
    };

  }


  /* -----------------------------------------
     NUMBER BASE
  ----------------------------------------- */

  if (
    lower.includes(
      "binary"
    ) ||
    lower.includes(
      "hexadecimal"
    ) ||
    lower.includes(
      "decimal to binary"
    ) ||
    lower.includes(
      "binary to decimal"
    )
  ) {

    return {
      name: "base_converter"
    };

  }


  /* -----------------------------------------
     PERCENTAGE
  ----------------------------------------- */

  if (
    /\d+(\.\d+)?\s*%\s*of\s*\d+/i.test(
      input
    ) ||
    /\d+(\.\d+)?\s+is\s+what\s+percent\s+of/i.test(
      input
    ) ||
    /\d+(\.\d+)?\s+(increase|decrease)\s+by\s+\d+(\.\d+)?%/i.test(
      input
    )
  ) {

    return {
      name: "percentage"
    };

  }


  /* -----------------------------------------
     UNIT CONVERSION
  ----------------------------------------- */

  if (
    /\d+(?:\.\d+)?\s*[a-zA-Z]+\s+(to|in)\s+[a-zA-Z]+/i.test(
      input
    )
  ) {

    return {
      name: "converter"
    };

  }


  /* -----------------------------------------
     SCIENTIFIC
  ----------------------------------------- */

  if (
    /^(sin|cos|tan|asin|acos|atan|sqrt|abs|floor|ceil|round|log|ln|exp)\(/i.test(
      lower
    ) ||
    /^\d+!$/.test(
      lower.replace(
        /\s/g,
        ""
      )
    )
  ) {

    return {
      name: "scientific"
    };

  }


  /* -----------------------------------------
     STANDARD CALCULATOR
  ----------------------------------------- */

  if (
    /\d+\s*[\+\-\*\/\%\^]\s*\d+/.test(
      input
    ) ||
    lower.startsWith(
      "calculate "
    ) ||
    lower.startsWith(
      "compute "
    ) ||
    lower.startsWith(
      "solve "
    ) ||
    lower.startsWith(
      "what is "
    ) ||
    lower.startsWith(
      "what's "
    )
  ) {

    return {
      name: "calculator"
    };

  }


  return null;

}


/* =========================================================
   EXTRACT NUMBERS
========================================================= */

function novaExtractNumbers(
  text
) {

  return String(text)
    .match(
      /-?\d+(?:\.\d+)?/g
    )
    ?.map(Number) || [];

}


/* =========================================================
   RUN TOOL
========================================================= */

function novaRunTool(
  toolName,
  text
) {

  const input =
    String(text || "").trim();


  try {

    switch (toolName) {


      /* -----------------------------------------
         CALCULATOR
      ----------------------------------------- */

      case "calculator": {

        let expression =
          input
            .replace(
              /^calculate\s*/i,
              ""
            )
            .replace(
              /^compute\s*/i,
              ""
            )
            .replace(
              /^solve\s*/i,
              ""
            )
            .replace(
              /^what('?s)?\s*/i,
              ""
            )
            .trim();


        expression =
          expression
            .replace(
              /₦|\$|€|£/g,
              ""
            )
            .replace(
              /,/g,
              ""
            );


        const result =
          novaCalculate(
            expression
          );


        return {

          success: true,

          tool:
            "calculator",

          expression,

          result,

          formatted:
            novaFormatNumber(
              result
            )

        };

      }


      /* -----------------------------------------
         SCIENTIFIC
      ----------------------------------------- */

      case "scientific": {

        let expression =
          input
            .replace(
              /^calculate\s*/i,
              ""
            )
            .replace(
              /^compute\s*/i,
              ""
            )
            .trim();


        const result =
          novaScientific(
            expression
          );


        return {

          success: true,

          tool:
            "scientific",

          expression,

          result,

          formatted:
            novaFormatNumber(
              result
            )

        };

      }


      /* -----------------------------------------
         PERCENTAGE
      ----------------------------------------- */

      case "percentage": {

        return novaPercentageTool(
          input
        );

      }


      /* -----------------------------------------
         CONVERTER
      ----------------------------------------- */

      case "converter": {

        return novaConverterTool(
          input
        );

      }


      /* -----------------------------------------
         DATE / TIME
      ----------------------------------------- */

      case "datetime": {

        return novaDateTimeTool();

      }


      /* -----------------------------------------
         DATE DIFFERENCE
      ----------------------------------------- */

      case "date_difference": {

        const dates =
          input.match(
            /\d{4}-\d{1,2}-\d{1,2}/g
          );


        if (
          !dates ||
          dates.length < 2
        ) {

          return {

            success: false,

            tool:
              "date_difference",

            error:
              "Use two dates such as 2026-01-01 and 2026-12-31."

          };

        }


        return novaDateDifference(
          dates[0],
          dates[1]
        );

      }


      /* -----------------------------------------
         STATISTICS
      ----------------------------------------- */

      case "statistics": {

        const numbers =
          novaExtractNumbers(
            input
          );


        return novaStatistics(
          numbers
        );

      }


      /* -----------------------------------------
         JSON
      ----------------------------------------- */

      case "json": {

        const jsonText =
          input
            .replace(
              /^format json\s*/i,
              ""
            )
            .replace(
              /^validate json\s*/i,
              ""
            )
            .trim();


        return novaJSONTool(
          jsonText
        );

      }


      /* -----------------------------------------
         BASE CONVERTER
      ----------------------------------------- */

      case "base_converter": {

        const binaryMatch =
          input.match(
            /(\d+)\s+(?:from\s+)?binary\s+to\s+decimal/i
          );


        if (binaryMatch) {

          return novaBaseConverter(
            binaryMatch[1],
            2,
            10
          );

        }


        const decimalBinary =
          input.match(
            /(\d+)\s+(?:from\s+)?decimal\s+to\s+binary/i
          );


        if (decimalBinary) {

          return novaBaseConverter(
            decimalBinary[1],
            10,
            2
          );

        }


        const hexDecimal =
          input.match(
            /([0-9a-f]+)\s+(?:from\s+)?hex(?:adecimal)?\s+to\s+decimal/i
          );


        if (hexDecimal) {

          return novaBaseConverter(
            hexDecimal[1],
            16,
            10
          );

        }


        return {

          success: false,

          tool:
            "base_converter",

          error:
            "Use formats like '1010 binary to decimal' or '42 decimal to binary'."

        };

      }


      /* -----------------------------------------
         PRIME
      ----------------------------------------- */

      case "prime": {

        const numbers =
          novaExtractNumbers(
            input
          );


        if (!numbers.length) {

          return {

            success: false,

            tool:
              "prime",

            error:
              "No number was found."

          };

        }


        return novaPrimeTool(
          numbers[0]
        );

      }


      /* -----------------------------------------
         GCD / LCM
      ----------------------------------------- */

      case "gcd_lcm": {

        const numbers =
          novaExtractNumbers(
            input
          );


        if (
          numbers.length < 2
        ) {

          return {

            success: false,

            tool:
              "gcd_lcm",

            error:
              "I need two whole numbers."

          };

        }


        return novaGCDLCM(
          numbers[0],
          numbers[1]
        );

      }


      /* -----------------------------------------
         TEXT ANALYSIS
      ----------------------------------------- */

      case "text_analysis": {

        const text =
          input
            .replace(
              /^analyze this text\s*:?\s*/i,
              ""
            )
            .replace(
              /^count the words\s*:?\s*/i,
              ""
            )
            .replace(
              /^word count\s*:?\s*/i,
              ""
            );


        return novaTextAnalysis(
          text
        );

      }


      /* -----------------------------------------
         PASSWORD
      ----------------------------------------- */

      case "password": {

        const numbers =
          novaExtractNumbers(
            input
          );


        const length =
          numbers.length
            ? numbers[0]
            : 16;


        return novaPasswordTool(
          length
        );

      }


      default:

        return null;

    }

  }

  catch (error) {

    return {

      success: false,

      tool:
        toolName,

      error:
        error.message ||
        "Tool execution failed."

    };

  }

}


/* =========================================================
   ONE FUNCTION FOR NOVA
========================================================= */

function novaRunToolFromMessage(
  text
) {

  const detected =
    novaDetectTool(
      text
    );


  if (!detected) {

    return null;

  }


  return novaRunTool(
    detected.name,
    text
  );

}


/* =========================================================
   HUMAN-READABLE TOOL RESPONSE
========================================================= */

function novaFormatToolResult(
  result
) {

  if (!result) {

    return "";

  }


  if (!result.success) {

    return `I couldn't complete that tool operation: ${result.error}`;

  }


  switch (
    result.tool
  ) {


    case "calculator":

      return (
        `🧮 ${result.expression} = ${result.formatted}`
      );


    case "scientific":

      return (
        `🔬 ${result.expression} = ${result.formatted}`
      );


    case "percentage":

      if (
        result.operation ===
        "percentage_of"
      ) {

        return (
          `📊 ${result.percentage}% of ${novaFormatNumber(result.amount)} = ${novaFormatNumber(result.result)}`
        );

      }


      if (
        result.operation ===
        "what_percent"
      ) {

        return (
          `📊 ${novaFormatNumber(result.value)} is ${novaFormatNumber(result.result)}% of ${novaFormatNumber(result.total)}`
        );

      }


      return (
        `📊 Result = ${novaFormatNumber(result.result)}`
      );


    case "converter":

      return (
        `🔄 ${novaFormatNumber(result.value)} ${result.from} = ${result.formatted} ${result.to}`
      );


    case "datetime":

      return (
        `🕐 ${result.time} — ${result.date}`
      );


    case "date_difference":

      return (
        `📅 The difference is ${novaFormatNumber(result.days)} days (${novaFormatNumber(result.hours)} hours).`
      );


    case "statistics":

      return (
        `📊 Count: ${result.count}\n` +
        `Sum: ${novaFormatNumber(result.sum)}\n` +
        `Mean: ${novaFormatNumber(result.mean)}\n` +
        `Median: ${novaFormatNumber(result.median)}\n` +
        `Minimum: ${novaFormatNumber(result.minimum)}\n` +
        `Maximum: ${novaFormatNumber(result.maximum)}\n` +
        `Range: ${novaFormatNumber(result.range)}\n` +
        `Standard deviation: ${novaFormatNumber(result.standardDeviation)}`
      );


    case "json":

      return (
        result.valid
          ? `🧾 Valid JSON:\n\n${result.formatted}`
          : `🧾 Invalid JSON: ${result.error}`
      );


    case "base_converter":

      return (
        `🔢 ${result.input} (base ${result.fromBase}) = ${result.result} (base ${result.toBase})`
      );


    case "prime":

      return (
        `🔢 ${novaFormatNumber(result.number)} is ` +
        `${result.prime ? "" : "not "}a prime number.`
      );


    case "gcd_lcm":

      return (
        `🧮 GCD: ${novaFormatNumber(result.gcd)}\n` +
        `LCM: ${novaFormatNumber(result.lcm)}`
      );


    case "text_analysis":

      return (
        `📝 Words: ${result.words}\n` +
        `Characters: ${result.characters}\n` +
        `Characters without spaces: ${result.charactersNoSpaces}\n` +
        `Sentences: ${result.sentences}\n` +
        `Lines: ${result.lines}`
      );


    case "password":

      return (
        `🔐 Generated password:\n\n${result.password}`
      );


    default:

      return JSON.stringify(
        result,
        null,
        2
      );

  }

}


/* =========================================================
   PUBLIC TOOL LIST
========================================================= */

function novaGetAvailableTools() {

  return Object.values(
    NOVA_TOOL_REGISTRY
  );

}


/* =========================================================
   DEBUG HELPER
========================================================= */

window.NOVA_TOOLS = {

  registry:
    NOVA_TOOL_REGISTRY,

  detect:
    novaDetectTool,

  run:
    novaRunTool,

  runFromMessage:
    novaRunToolFromMessage,

  format:
    novaFormatToolResult,

  list:
    novaGetAvailableTools

};
