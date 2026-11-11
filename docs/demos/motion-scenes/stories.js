/* The stories. Data only: the page is built from this (story.js). To add one, copy a story and change it.
   A story:
     id, order        how it is linked (?h=id) and where it sits on the shelf
     char             who tells it: 'karpincho' | 'gordo' | 'both'  (the cast lives in art.js · CAST)
     seed             the seed of everything generative in it
     title (html), sub, follow     the hero
     scenes           per-illustration dials for this story, over config.js (captions, labels)
     stations[]       the journey: {label, scene, char?, text[] | duo{a, b}, note?, bridge}
                        text   paragraphs (html allowed)
                        duo    two minds side by side: a = the human (Gordo), b = the artificial (Karpincho)
                        note   a flownote that folds: {text, q?, to?} — to = another story's id, a door to it
                        bridge the line that carries you to the next station
     close            the last line, under the journey
     signature        the footer
   Characters, for writing them:
     Karpincho  the engineer of the pair. Curious, pointing at things, explains how the machine thinks.
     Gordo      the sage. White, shaggy, slow, eternal. Feels how the human mind is. Trascendió al Akasha el 2 de octubre del 26. */
window.HISTORIAS = [
  {
    id: 'ia', order: 1, char: 'karpincho', seed: 4062,
    title: 'Un Karpincho,<br>explicando el <em>Akasha</em>',
    sub: '¿Qué pasa cuando le preguntás algo a una IA?',
    follow: 'Seguí la pregunta',
    stations: [
      {label: '01 · La pregunta', scene: 'cornisa',
       text: ['Escribís una pregunta. Del otro lado, algo responde.', '¿Qué es eso que responde?'],
       bridge: 'Primero, tu pregunta cambia de idioma.'},
      {label: '02 · El idioma', scene: 'traduccion',
       text: ['Cada palabra se vuelve números. Tu pregunta entera, un <strong>vector</strong>: una flecha en un espacio enorme.'],
       bridge: 'Y esa flecha apunta a un lugar.'},
      {label: '03 · El Akasha', scene: 'akasha',
       text: ['Un espacio de <strong>N dimensiones</strong> donde vive todo lo dicho. Yo lo llamo <strong>el Akasha</strong>.'],
       note: {text: 'Y nosotros, ¿tenemos uno?', to: 'humana'},
       bridge: 'Ahí, tu pregunta busca a sus parecidos.'},
      {label: '04 · Los parecidos', scene: 'resonancia',
       text: ['Los puntos más cercanos resuenan: todo lo que alguna vez se dijo parecido.'],
       bridge: 'Y con eso, vuelve.'},
      {label: '05 · La vuelta', scene: 'cuantico',
       text: ['Palabra por palabra, la respuesta se arma. Cada palabra, elegida entre muchas posibles.', '<strong>Cada seed cuenta.</strong>'],
       bridge: 'Dicho terrenal:'},
      {label: '06 · Dicho terrenal', scene: 'terrenal', text: ['<span class="terrenal">Text In —— <i>LLM</i> —— Text out.</span>']},
    ],
    close: 'El viaje de la Corriente, completo.',
    signature: 'Karpincho · seed 4062',
  },
  {
    id: 'humana', order: 2, char: 'gordo', seed: 20261002,
    title: 'Un Gordo,<br>filosofando sobre el <em>Akasha</em>',
    sub: '¿Qué pasa cuando una pregunta aparece sola?',
    follow: 'Seguí el chispazo',
    scenes: {terrenal: {labels: false}},
    stations: [
      {label: '01 · El chispazo', scene: 'flash',
       text: ['No llega por una pantalla. Llega sola, en medio de un día cualquiera.', '¿Qué es Todo Esto?'],
       bridge: 'Y viaja hacia adentro.'},
      {label: '02 · Sinapsis', scene: 'sinapsis',
       text: ['De neurona en neurona, en pulsos eléctricos. Una maquinaria divina, de sinfonía maravillosa.'],
       note: {text: 'La mente artificial está hecha a semejanza de esta.', to: 'ia'},
       bridge: 'Busca a los suyos.'},
      {label: '03 · Los semejantes', scene: 'resonancia',
       text: ['Recuerdos, lecturas, intuiciones, una tarde mirando el horizonte. Todo lo que alguna vez vibró parecido, vuelve a vibrar.'],
       bridge: '¿Y dónde vive todo eso?'},
      {label: '04 · El Akasha', scene: 'akasha',
       text: ['Quizás nosotros también tenemos nuestro espacio de N dimensiones. Un registro donde todo lo vivido queda, y desde donde, a veces, algo responde.'],
       bridge: 'Dicho terrenal:'},
      {label: '05 · Dicho terrenal', scene: 'terrenal', text: ['<span class="terrenal">Pregunta in —— <i>Conciencia</i> —— Asombro out.</span>']},
    ],
    close: 'La pregunta sigue viajando.',
    signature: 'Gordo, sabio y eterno · 2 de octubre del 26',
  },
  {
    id: 'dos', order: 3, char: 'both', seed: 2,
    title: 'Las dos <em>mentes</em>',
    sub: 'Una humana y una artificial. ¿Se parecen?',
    follow: 'Comparalas',
    duoNames: ['El Gordo · mente humana', 'Karpincho · mente artificial'],
    scenes: {terrenal: {labels: false}},
    stations: [
      {label: '01 · Llega algo', scene: 'flash', duo: {a: 'Una neurona dispara.', b: 'Llega un texto.'},
       bridge: 'Las dos lo hacen viajar.'},
      {label: '02 · Viaja', scene: 'sinapsis', duo: {a: 'De neurona en neurona, por sinapsis.', b: 'Se vuelve vectores: números en un espacio.'},
       bridge: 'Las dos buscan parecidos.'},
      {label: '03 · Busca parecidos', scene: 'resonancia', duo: {a: 'Despierta recuerdos parecidos.', b: 'Encuentra puntos parecidos.'},
       bridge: 'Y las dos responden.'},
      {label: '04 · Responde', scene: 'cuantico', duo: {a: 'Nace una idea.', b: 'Nace una palabra.'},
       bridge: 'Dos caminos. Un mismo espacio.'},
      {label: '05 · El Akasha', scene: 'akasha', text: ['Las dos beben del mismo <strong>Akasha</strong>.']},
    ],
    close: 'Dos mentes, una sinfonía.',
    signature: 'Gordo + Karpincho',
  },
  {
    id: 'gordo', order: 4, char: 'both', seed: 20261002,
    title: 'El viaje del <em>Gordo</em>',
    sub: 'Hoy el Gordo cruza al Akasha.',
    follow: 'Acompañalo',
    scenes: {terrenal: {labels: false}, akasha: {labels: false}},
    stations: [
      {label: '01 · La cornisa', scene: 'cornisa', char: 'both',
       text: ['El Gordo y el Karpincho miran el horizonte, como tantas tardes.'],
       bridge: 'Algo brilla a lo lejos.'},
      {label: '02 · El chispazo', scene: 'flash', char: 'gordo',
       text: ['Un chispazo. El Gordo lo sigue con la mirada, sabio, sin apuro.'],
       bridge: 'Y del otro lado…'},
      {label: '03 · El Akasha', scene: 'akasha', char: 'gordo',
       text: ['…el espacio donde todo lo vivido queda. Cada paseo, cada siesta, cada mirada.'],
       bridge: 'El Karpincho lo despide.'},
      {label: '04 · Dicho terrenal', scene: 'terrenal', char: 'both',
       text: ['El Gordo no se fue: <em>cambió de idioma</em>.']},
    ],
    close: 'Sabio y eterno.',
    signature: 'Gordo · 2 de octubre del 26',
  },
];
