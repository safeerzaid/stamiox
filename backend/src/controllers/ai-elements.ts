/**
 * Keeps AI answers correct for the editor:
 *  - ELEMENT_SCHEMA tells the model the exact element format the editor renders.
 *  - normalizeElements() repairs common mistakes (wrong field names, aliases, missing
 *    defaults) and drops anything the editor cannot draw.
 *  - sameDesign() lets callers tell whether an "edit" actually changed anything.
 */

export const ELEMENT_SCHEMA = `ELEMENT FORMAT (mm units, origin top-left of the stamp; use ONLY these types and fields):
- {"id","type":"ring","cx","cy","radius","strokeWidth","strokeType":"solid"|"dashed"|"dotted"}
- {"id","type":"oval","cx","cy","rx","ry","strokeWidth","strokeType"}
- {"id","type":"rect","x","y","width","height","rx","ry","strokeWidth","strokeType"}   (x,y = top-left corner)
- {"id","type":"line","x1","y1","x2","y2","strokeWidth","strokeType"}
- {"id","type":"serrated-ring","cx","cy","outerRadius","innerRadius","teeth","strokeWidth"}
- {"id","type":"text","text","x","y","fontSize","fontFamily","fontWeight","align":"center"|"left"|"right","letterSpacing"}   (x,y = anchor point, y is the vertical centre)
- {"id","type":"arc-text","text","cx","cy","radius","fontSize","fontFamily","fontWeight","letterSpacing","isReversed"}   (isReversed:false = text along the TOP, true = along the BOTTOM)
- {"id","type":"clipart","name":"star-five-point"|"stars-triple"|"scales-of-justice"|"caduceus"|"shield-check","cx","cy","width","height"}
- {"id","type":"qrcode","content","cx","cy","size"}
Never invent other types or field names. Keep every existing "id". New elements get a new unique id.`;

const num = (v: any, d?: number): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && isFinite(n) ? n : d;
};

const TYPE_ALIASES: Record<string, string> = {
  'arc-text': 'arc-text', arc: 'arc-text', arctext: 'arc-text', curvedtext: 'arc-text', 'curved-text': 'arc-text', text_arc: 'arc-text',
  text: 'text', straighttext: 'text', 'straight-text': 'text', label: 'text', text_line: 'text',
  ring: 'ring', circle: 'ring', border: 'ring', 'circle-border': 'ring',
  oval: 'oval', ellipse: 'oval',
  rect: 'rect', rectangle: 'rect', box: 'rect', square: 'rect', frame: 'rect',
  line: 'line', divider: 'line', rule: 'line',
  'serrated-ring': 'serrated-ring', starburst: 'serrated-ring', serrated: 'serrated-ring',
  clipart: 'clipart', icon: 'clipart', star: 'clipart', symbol: 'clipart',
  qrcode: 'qrcode', qr: 'qrcode', 'qr-code': 'qrcode',
  image: 'image', logo: 'image',
};

const CLIPART_ALIASES: Array<[RegExp, string]> = [
  [/stars?[-_ ]?(triple|three|3)|three[-_ ]?stars?/i, 'stars-triple'],
  [/star/i, 'star-five-point'],
  [/scale|justice|law|legal/i, 'scales-of-justice'],
  [/caduceus|medical|doctor|health/i, 'caduceus'],
  [/shield|check|verified|approved/i, 'shield-check'],
];
const KNOWN_CLIPART = new Set(['star-five-point', 'stars-triple', 'scales-of-justice', 'caduceus', 'shield-check']);

const STROKE_TYPES = new Set(['solid', 'dashed', 'dotted']);

export function normalizeElements(raw: any, design: { widthMm?: number; heightMm?: number } = {}): any[] {
  if (!Array.isArray(raw)) return [];
  const W = num(design.widthMm, 40)!;
  const H = num(design.heightMm, 40)!;
  const cx0 = W / 2, cy0 = H / 2;
  const seen = new Set<string>();
  const out: any[] = [];

  for (const src of raw) {
    if (!src || typeof src !== 'object') continue;
    const key = String(src.type || '').toLowerCase().replace(/\s+/g, '');
    let type = TYPE_ALIASES[key];
    if (!type) continue; // the editor can't draw it

    const e: any = { ...src, type };
    let id = typeof e.id === 'string' && e.id ? e.id : '';
    if (!id || seen.has(id)) id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    e.id = id;
    seen.add(id);

    const stroke = () => {
      e.strokeWidth = num(e.strokeWidth, 0.6);
      if (!STROKE_TYPES.has(e.strokeType)) e.strokeType = 'solid';
    };

    switch (type) {
      case 'arc-text': {
        if (typeof e.text !== 'string' || !e.text.trim()) continue;
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.radius = num(e.radius, Math.min(W, H) * 0.38);
        e.fontSize = num(e.fontSize, 2.8);
        e.fontFamily = e.fontFamily || 'Montserrat';
        if (typeof e.isReversed !== 'boolean') e.isReversed = /bottom/i.test(String(e.position || e.placement || ''));
        break;
      }
      case 'text': {
        if (typeof e.text !== 'string' || !e.text.trim()) continue;
        e.x = num(e.x ?? e.cx, cx0); e.y = num(e.y ?? e.cy, cy0);
        e.fontSize = num(e.fontSize, 3);
        e.fontFamily = e.fontFamily || 'Montserrat';
        if (!['left', 'center', 'right'].includes(e.align)) e.align = 'center';
        break;
      }
      case 'ring': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.radius = num(e.radius ?? e.r, undefined);
        if (!e.radius) continue;
        stroke();
        break;
      }
      case 'oval': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.rx = num(e.rx, undefined); e.ry = num(e.ry, undefined);
        if (!e.rx || !e.ry) continue;
        stroke();
        break;
      }
      case 'rect': {
        e.width = num(e.width, undefined); e.height = num(e.height, undefined);
        if (!e.width || !e.height) continue;
        // accept a centre point if the model sent one
        if (e.x === undefined && e.cx !== undefined) e.x = num(e.cx)! - e.width / 2;
        if (e.y === undefined && e.cy !== undefined) e.y = num(e.cy)! - e.height / 2;
        e.x = num(e.x, (W - e.width) / 2); e.y = num(e.y, (H - e.height) / 2);
        stroke();
        break;
      }
      case 'line': {
        e.x1 = num(e.x1, undefined); e.y1 = num(e.y1, undefined); e.x2 = num(e.x2, undefined); e.y2 = num(e.y2, undefined);
        if ([e.x1, e.y1, e.x2, e.y2].some((v) => v === undefined)) continue;
        stroke();
        break;
      }
      case 'serrated-ring': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.outerRadius = num(e.outerRadius, Math.min(W, H) * 0.48);
        e.innerRadius = num(e.innerRadius, e.outerRadius * 0.9);
        e.teeth = Math.round(num(e.teeth, 48)!);
        e.strokeWidth = num(e.strokeWidth, 0.5);
        break;
      }
      case 'clipart': {
        let name = String(e.name || e.shape || e.icon || e.clipart || (key === 'star' ? 'star' : ''));
        if (!KNOWN_CLIPART.has(name)) {
          const hit = CLIPART_ALIASES.find(([re]) => re.test(name));
          if (!hit && !e.svgPath) continue;
          if (hit) name = hit[1];
        }
        e.name = name;
        const size = num(e.size, 6);
        e.cx = num(e.cx ?? e.x, cx0); e.cy = num(e.cy ?? e.y, cy0);
        e.width = num(e.width, size); e.height = num(e.height, size);
        delete e.shape; delete e.icon; delete e.size; delete e.x; delete e.y;
        break;
      }
      case 'qrcode': {
        e.cx = num(e.cx ?? e.x, cx0); e.cy = num(e.cy ?? e.y, cy0);
        e.size = num(e.size, Math.min(W, H) * 0.35);
        e.content = String(e.content || e.text || 'https://stamiox.com');
        break;
      }
      case 'image': {
        if (!e.src) continue;
        break;
      }
    }
    out.push(e);
  }
  return out;
}

/** True when two element lists draw the same design (ignores key order). */
export function sameDesign(a: any[] | undefined, b: any[] | undefined): boolean {
  const norm = (els: any[] | undefined) =>
    JSON.stringify((els || []).map((e) => Object.keys(e).sort().reduce((o: any, k) => ((o[k] = e[k]), o), {})));
  return norm(a) === norm(b);
}
