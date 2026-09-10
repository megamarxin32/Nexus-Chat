export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'triv_1',
    category: 'Tecnología & IA',
    question: '¿Qué significa la sigla "E2EE" en mensajería moderna?',
    options: ['End-to-End Encryption', 'Easy-to-Email Engine', 'Electronic Edge Entry', 'Enhanced Encryption Entity'],
    correctIndex: 0,
    explanation: 'El cifrado de extremo a extremo (End-to-End Encryption) garantiza que solo emisor y receptor lean el mensaje.',
  },
  {
    id: 'triv_2',
    category: 'Videojuegos',
    question: '¿En qué año se lanzó el primer juego de The Legend of Zelda?',
    options: ['1986', '1989', '1992', '1983'],
    correctIndex: 0,
    explanation: 'Shigeru Miyamoto y Takashi Tezuka lanzaron el primer Zelda para Famicom Disk System en Japón en 1986.',
  },
  {
    id: 'triv_3',
    category: 'Ciencia',
    question: '¿Cuál es el elemento químico más abundante en el universo observable?',
    options: ['Hidrógeno', 'Helio', 'Oxígeno', 'Carbono'],
    correctIndex: 0,
    explanation: 'El hidrógeno constituye aproximadamente el 75% de la masa de la materia bariónica del universo.',
  },
  {
    id: 'triv_4',
    category: 'Cine & Series',
    question: '¿Qué actor interpretó a Neo en la saga cinematográfica The Matrix?',
    options: ['Keanu Reeves', 'Tom Cruise', 'Brad Pitt', 'Christian Bale'],
    correctIndex: 0,
    explanation: 'Keanu Reeves protagonizó a Neo (Thomas Anderson) en la aclamada saga de las hermanas Wachowski.',
  },
  {
    id: 'triv_5',
    category: 'Cultura General',
    question: '¿Cuál es el río más largo del planeta Tierra?',
    options: ['Río Amazonas', 'Río Nilo', 'Río Yangtsé', 'Río Misisipi'],
    correctIndex: 0,
    explanation: 'Estudios geográficos satelitales confirman al Río Amazonas como el más largo y caudaloso del mundo.',
  },
  {
    id: 'triv_6',
    category: 'Tecnología',
    question: '¿Quién es considerado el padre de la computación teórica y la inteligencia artificial?',
    options: ['Alan Turing', 'Ada Lovelace', 'Steve Jobs', 'John von Neumann'],
    correctIndex: 0,
    explanation: 'Alan Turing sentó las bases de los algoritmos y la máquina de Turing, clave para la informática moderna.',
  },
  {
    id: 'triv_7',
    category: 'Videojuegos',
    question: '¿Cuál es el bloque más resistente en Minecraft en modo supervivencia estándar?',
    options: ['Obsidiana', 'Piedra base (Bedrock)', 'Diamante', 'Hierro reforzado'],
    correctIndex: 0,
    explanation: 'En modo supervivencia normal, la Obsidiana es el bloque minable más resistente a explosiones de TNT y Creepers.',
  },
  {
    id: 'triv_8',
    category: 'Historia',
    question: '¿En qué año llegó el ser humano a la Luna por primera vez con la misión Apolo 11?',
    options: ['1969', '1965', '1972', '1961'],
    correctIndex: 0,
    explanation: 'Neil Armstrong y Buzz Aldrin pisaron la superficie lunar el 20 de julio de 1969.',
  },
  {
    id: 'triv_9',
    category: 'Cine',
    question: '¿Quién compuso la icónica banda sonora de Interstellar y El Origen (Inception)?',
    options: ['Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Ludwig Göransson'],
    correctIndex: 0,
    explanation: 'Hans Zimmer creó las memorables bandas sonoras de las películas dirigidas por Christopher Nolan.',
  },
  {
    id: 'triv_10',
    category: 'Ciencia',
    question: '¿Qué partícula subatómica tiene carga eléctrica negativa?',
    options: ['Electrón', 'Protón', 'Neutrón', 'Fotón'],
    correctIndex: 0,
    explanation: 'Los electrones orbitan el núcleo del átomo y poseen carga eléctrica elemental negativa (-1).',
  },
];

export const WORDLE_WORDS = [
  'PLAYA',
  'NOCHE',
  'MUNDO',
  'CIELO',
  'FUEGO',
  'VERDE',
  'RELOJ',
  'TIGRE',
  'RATON',
  'LLAVE',
  'BARCO',
  'MOTOR',
  'ROBOT',
  'DISCO',
  'AUDIO',
  'PIANO',
  'LUCES',
  'SOLAR',
  'NEXUS',
  'VALOR',
];
