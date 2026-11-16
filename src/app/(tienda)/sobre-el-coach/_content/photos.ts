import type { StaticImageData } from "next/image";
import barraGrafiti from "../_photos/barra-grafiti.jpg";
import charla from "../_photos/charla.jpg";
import espaldaCalistenia from "../_photos/espalda-calistenia.jpg";
import paradaDeManosEstudio from "../_photos/parada-de-manos-estudio.jpg";
import paradaDeManosVentana from "../_photos/parada-de-manos-ventana.jpg";
import posteParque from "../_photos/poste-parque.jpg";
import retrato from "../_photos/retrato.jpg";

/**
 * Photos for the bio, provided by the coach. The files are resized copies
 * with all camera/GPS metadata stripped.
 */

export type BioPhoto = {
  src: StaticImageData;
  alt: string;
};

export const PORTRAIT: BioPhoto = {
  src: retrato,
  alt: "Hans Barrantes con una camiseta que dice «Calistenia»",
};

/** Keyed by `BioSection.id`. */
export const SECTION_PHOTOS: Record<string, BioPhoto> = {
  "mi-historia": {
    src: barraGrafiti,
    alt: "Hans colgado de una barra en un parque, frente a un mural de grafiti",
  },
  ensenar: {
    src: charla,
    alt: "Hans hablando con un micrófono en un evento al aire libre",
  },
  conatus: {
    src: paradaDeManosEstudio,
    alt: "Hans en parada de manos sobre paralelas de madera, dentro de un estudio",
  },
  mision: {
    src: posteParque,
    alt: "Hans sosteniéndose en horizontal de un poste, en un parque",
  },
  calistenia: {
    src: paradaDeManosVentana,
    alt: "Hans en parada de manos a contraluz frente a una ventana, en blanco y negro",
  },
};

export const CLOSING_PHOTO: BioPhoto = {
  src: espaldaCalistenia,
  alt: "Hans de espaldas, con una camiseta amarilla que dice «Calistenia»",
};
