import { h } from '../ui/uikit'

export default ({ size = 24, color = 'currentColor', weight = 2 }) => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
}, [
  h('path', {
    d: 'M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z',
    fill: 'none',
    stroke: color,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': weight + '',
  }),

  h('polyline', {
    points: '2.32 6.16 12 11 21.68 6.16',
    fill: 'none',
    stroke: color,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': weight + '',
  }),

  h('line', {
    x1: '12',
    y1: '22.76',
    x2: '12',
    y2: '11',
    fill: 'none',
    stroke: color,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': weight + '',
  }),
])