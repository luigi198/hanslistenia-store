import type {
  ProductErrorCode,
  ProductValidationError,
} from "@/domain/products/product";

const MESSAGES: Record<ProductErrorCode, string> = {
  name_required: "es obligatorio.",
  name_too_long: "es demasiado largo.",
  description_too_long: "es demasiado larga.",
  production_note_too_long: "es demasiado largo.",
  price_invalid: "debe ser un número entero de colones mayor que cero.",
  too_many_option_groups: "hay demasiadas opciones.",
  option_group_name_required: "falta el nombre de la opción.",
  option_group_duplicate: "ya existe otra opción con ese nombre.",
  option_values_required: "agregue al menos un valor.",
  too_many_option_values: "tiene demasiados valores.",
  option_value_label_required: "falta el texto del valor.",
  option_value_duplicate: "está repetido.",
  option_text_too_long: "el texto es demasiado largo.",
  price_delta_invalid: "el precio extra debe ser un entero de 0 o más.",
  too_many_images: "hay demasiadas fotos.",
  image_invalid: "no es válida.",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  description: "Descripción",
  basePrice: "Precio base",
  productionNote: "Tiempo de producción",
  optionGroups: "Opciones",
  images: "Fotos",
};

function fieldLabel(field: string): string {
  const [root, index, sub, subIndex] = field.split(".");
  if (root === "optionGroups" && index !== undefined) {
    const group = `Opción ${Number(index) + 1}`;
    return sub === "values" ? `${group}, valor ${Number(subIndex) + 1}` : group;
  }
  if (root === "images" && index !== undefined) {
    return `Foto ${Number(index) + 1}`;
  }
  return FIELD_LABELS[root] ?? root;
}

/** One user-facing Spanish sentence for a domain validation error. */
export function describeProductError(error: ProductValidationError): string {
  return `${fieldLabel(error.field)}: ${MESSAGES[error.code]}`;
}
