/* The story's dials. Decisions live here, not in the scenes: change a value, reload.
   scenes.<name>  per illustration (hero, flash, cornisa, sinapsis, akasha, traduccion, resonancia, cuantico, terrenal):
     captions  the subtitles that land at the bottom of the drawing
     labels    the small words inside the drawing (axes, coordinates, the Akasha's seal…)
   'default' applies to every illustration; a named one overrides it.
   palette    the colours of the drawn scenes: calm, never at the extremes of brightness, one line with the hero. */
window.STORY = {
  scenes: {
    default:  {captions: false, labels: true},
    sinapsis: {captions: false},
    akasha:   {labels: false},
  },
  caption: {size: 50},
  palette: {
    night: '#0E1252', deep: '#0A0D3E', cobalt: '#1E2788', royal: '#2C37A8', card: '#11165E', card2: '#18207A', rule: '#3A43A6',
    steel: '#8F97C6', ice: '#CDD6EE', text: '#DCE1F2', white: '#F4F1EA',
    mint: '#8CD6C3', aqua: '#9CCAD9', teal: '#5FA597', lav: '#AEB4DC', violet: '#8A86C8',
    orange: '#C9A48A', coral: '#C4907E', amber: '#D2B98E', plum: '#7E4E70',
    bubble: '#E9E4DA',
    sky: ['#0A0D45', '#131A6A', '#1B2382'], glow: ['#B9E6DA', '#8CCFBF', '#67AE9F'],
  },
};
