/**
 * The coach's bio, written by him. Proofread only: keep his wording.
 * Paragraph strings may wrap foreign terms in *asterisks* for italics.
 */

export type BioSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const BIO_NAME = "Hans Barrantes";

export const BIO_TAGLINE =
  "Hanslistenia | Promotor, atleta, instructor y fundador de Conatus Centro de Movimiento Integral";

export const BIO_SECTIONS: BioSection[] = [
  {
    id: "mi-historia",
    title: "Mi historia: encontrar un propósito en el movimiento",
    paragraphs: [
      "Mi nombre es Hans Barrantes, aunque muchos me conocen como Hanslistenia.",
      "Mi historia con la calistenia comenzó a los 27 años, en una etapa particularmente difícil de mi vida.",
      "Atravesaba una depresión profunda y sentía que, mientras las personas a mi alrededor parecían haber encontrado sus motivaciones y caminos, yo todavía no había descubierto el mío.",
      "Entrenaba en un gimnasio convencional, pero había algo que no terminaba de conectar conmigo.",
      "Durante muchos años había practicado *skateboarding*. El *skate* había sido una parte importante de mi identidad. La calle era mi espacio, el lugar donde podía expresarme, aprender, equivocarme, volver a intentarlo y sentirme libre.",
      "Cuando descubrí la calistenia, encontré algo familiar.",
      "Las barras, los parques, el movimiento y la posibilidad de superar desafíos utilizando únicamente mi propio cuerpo me devolvieron esa conexión con la cultura de calle que había formado parte de mi vida durante tantos años.",
      "Pero esta vez significaba algo más.",
      "La calistenia se convirtió en una motivación, un sentido de dirección y una nueva oportunidad de crecimiento personal.",
      "No resolvió mágicamente mis dificultades, pero me permitió construir nuevos objetivos, desarrollar disciplina y encontrar una actividad que realmente me apasionaba.",
      "Lo que comenzó como una búsqueda personal terminó convirtiéndose en una parte fundamental de mi vida.",
    ],
  },
  {
    id: "ensenar",
    title: "Del aprendizaje personal a enseñar a otros",
    paragraphs: [
      "Con el paso de los años, mi curiosidad por el movimiento se transformó en un interés cada vez más profundo por comprender el funcionamiento del cuerpo humano.",
      "Comencé a estudiar, capacitarme y explorar los principios del entrenamiento de fuerza, la biomecánica, la fisiología y el desarrollo de habilidades.",
      "En 2021 inicié formalmente mi camino como entrenador.",
      "Descubrí que enseñar también era una manera de continuar aprendiendo y, sobre todo, de compartir con otras personas aquello que había encontrado en la calistenia.",
      "Mi objetivo nunca ha sido simplemente enseñar a alguien a hacer una dominada, un *muscle-up* o un *handstand*.",
      "Quiero que las personas comprendan su proceso, descubran sus capacidades y desarrollen una relación más consciente con el movimiento.",
    ],
  },
  {
    id: "conatus",
    title: "CONATUS: una idea que se convirtió en comunidad",
    paragraphs: [
      "En 2023 nació CONATUS, Centro de Movimiento Integral.",
      "Un proyecto que representa mucho más que un espacio para entrenar.",
      "CONATUS nace de mi convicción de que el entrenamiento debe combinar conocimiento, progresión, libertad de movimiento y comunidad.",
      "Mi metodología se fundamenta en cinco pilares: progresión inteligente, multiestímulo, transferencia, conciencia de movimiento y cultura de calle.",
      "Estos principios reflejan tanto mi formación profesional como mis experiencias personales.",
      "Creo que el entrenamiento debe ser desafiante, pero también adaptable. Que la fuerza es importante, pero no debe desarrollarse a costa del movimiento. Y que aprender una habilidad puede ser tan valioso como mejorar una marca personal.",
    ],
  },
  {
    id: "mision",
    title: "Mi misión",
    paragraphs: [
      "Mi misión es acercar la calistenia a más personas, independientemente de su edad, experiencia o condición física.",
      "Quiero contribuir a que la calistenia en Costa Rica continúe creciendo como una disciplina seria, accesible y respaldada por el conocimiento científico, sin perder su identidad de calle.",
      "Aspiro a construir una comunidad donde las personas puedan entrenar, aprender, compartir y desarrollar sus propias capacidades.",
      "También quiero seguir creciendo como atleta y entrenador, porque entiendo que el aprendizaje es un proceso que nunca termina.",
    ],
  },
  {
    id: "calistenia",
    title: "Lo que representa la calistenia para mí",
    paragraphs: [
      "Hoy, después de más de una década practicando esta disciplina, sigo encontrando nuevos desafíos.",
      "La calistenia me ha enseñado que el progreso no siempre es lineal, que las frustraciones forman parte del aprendizaje y que siempre existe algo nuevo por descubrir.",
      "Pero, sobre todo, me recuerda a aquella persona de 27 años que todavía no encontraba su camino.",
      "No puedo decir que la calistenia tenga todas las respuestas, pero sí puedo decir que me ayudó a encontrar nuevas preguntas, nuevas metas y una razón para seguir construyendo.",
    ],
  },
];

/** The closing lines, set apart as the page's final statement. */
export const BIO_CLOSING =
  "Comencé buscando un propósito para mí. Hoy, a través de CONATUS, quiero ayudar a otras personas a descubrir de qué son capaces.";
