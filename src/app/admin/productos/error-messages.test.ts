import { describe, expect, it } from "vitest";
import { describeProductError } from "./error-messages";

describe("describeProductError", () => {
  it.each([
    [{ field: "name", code: "name_required" }, "Nombre: es obligatorio."],
    [
      { field: "optionGroups.1.values.0", code: "option_value_duplicate" },
      "Opción 2, valor 1: está repetido.",
    ],
    [{ field: "images.2", code: "image_invalid" }, "Foto 3: no es válida."],
  ] as const)("describes %j in Spanish", (error, message) => {
    expect(describeProductError(error)).toBe(message);
  });
});
