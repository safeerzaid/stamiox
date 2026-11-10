/**
 * "Open in Studio" transition: the clicked template's preview lifts out of its card,
 * grows smoothly to the centre over a soft white backdrop, then the editor opens and
 * the overlay fades away (the editor's own design-in animation plays underneath).
 *
 * Built with plain DOM + the Web Animations API so it survives the route change.
 */
export function playOpenTransition(opts: {
  /** id used on the card preview element: data-template-preview="<id>" */
  templateId: string;
  /** SVG markup of the stamp */
  svg: string;
  /** called when the zoom has finished — navigate to the editor here */
  onOpen: () => void;
  title?: string;
}) {
  const { templateId, svg, onOpen, title } = opts;
  if (typeof window === 'undefined') return onOpen();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('animate' in HTMLElement.prototype)) return onOpen();

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const src = document.querySelector<HTMLElement>(`[data-template-preview="${CSS.escape(templateId)}"]`);
  const from = src?.getBoundingClientRect();
  const size = Math.min(vw * 0.6, vh * 0.55, 440);
  const startSize = from ? Math.min(from.width, from.height) : size * 0.4;
  const startX = from ? from.left + from.width / 2 : vw / 2;
  const startY = from ? from.top + from.height / 2 : vh / 2;

  // overlay
  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';

  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 46%, #ffffff 0%, #f1f5f9 70%);opacity:0;';

  const stamp = document.createElement('div');
  stamp.style.cssText = `position:absolute;left:${vw / 2 - size / 2}px;top:${vh / 2 - size / 2 - 20}px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;will-change:transform,opacity;filter:drop-shadow(0 18px 40px rgba(15,23,42,0.18));`;
  stamp.innerHTML = svg.replace(/width="[^"]*mm"/, 'width="100%"').replace(/height="[^"]*mm"/, 'height="100%"');

  const caption = document.createElement('div');
  caption.style.cssText = `position:absolute;left:0;right:0;top:${vh / 2 + size / 2 + 4}px;text-align:center;font:500 13px/1.4 'Plus Jakarta Sans',system-ui,sans-serif;color:#64748b;opacity:0;`;
  caption.innerHTML = `<div style="font-weight:600;color:#0f172a;font-size:14px">${(title || '').replace(/[<>&]/g, '')}</div><div style="margin-top:2px;display:inline-flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border-radius:50%;border:2px solid #cbd5e1;border-top-color:#0d99ff;display:inline-block;animation:fxSpin .8s linear infinite"></span>Opening in Studio…</div>`;

  const style = document.createElement('style');
  style.textContent = '@keyframes fxSpin{to{transform:rotate(360deg)}}';

  root.append(style, backdrop, stamp, caption);
  document.body.appendChild(root);

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const dx = startX - vw / 2;
  const dy = startY - (vh / 2 - 20);
  const s0 = startSize / size;

  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
  stamp.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, opacity: 1 },
      { transform: 'translate(0, 0) scale(1.03)', opacity: 1, offset: 0.82 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    ],
    { duration: 1400, easing: ease, fill: 'forwards' }
  );
  caption.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], {
    duration: 600,
    delay: 900,
    easing: ease,
    fill: 'forwards',
  });

  // open the editor once the zoom has landed, then fade the overlay away
  window.setTimeout(() => {
    onOpen();
    window.setTimeout(() => {
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: 'ease-out', fill: 'forwards' });
      fade.onfinish = () => root.remove();
    }, 600);
  }, 1750);
}

/**
 * Card → preview window transition: the backdrop dims, the stamp slowly lifts out of
 * its card and glides to the centre, then the preview window unfolds around it.
 */
let previewBusy = false;

export function playPreviewTransition(opts: { templateId: string; svg: string; onOpen: () => void }) {
  const { templateId, svg, onOpen } = opts;
  if (typeof window === 'undefined') return onOpen();
  if (previewBusy) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('animate' in HTMLElement.prototype)) return onOpen();

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const src = document.querySelector<HTMLElement>(`[data-template-preview="${CSS.escape(templateId)}"]`);
  const from = src?.getBoundingClientRect();
  const size = Math.min(vw * 0.5, vh * 0.5, 360);
  const startSize = from ? Math.min(from.width, from.height) : size * 0.5;
  const startX = from ? from.left + from.width / 2 : vw / 2;
  const startY = from ? from.top + from.height / 2 : vh / 2;

  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';

  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(2,6,23,0.8);opacity:0;';

  const stamp = document.createElement('div');
  stamp.style.cssText = `position:absolute;left:${vw / 2 - size / 2}px;top:${vh / 2 - size / 2}px;width:${size}px;height:${size}px;padding:${size * 0.08}px;box-sizing:border-box;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;will-change:transform,opacity;box-shadow:0 30px 70px -20px rgba(0,0,0,0.55);`;
  stamp.innerHTML = svg.replace(/width="[^"]*mm"/, 'width="100%"').replace(/height="[^"]*mm"/, 'height="100%"');

  root.append(backdrop, stamp);
  document.body.appendChild(root);
  if (src) src.style.visibility = 'hidden';
  previewBusy = true;

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const dx = startX - vw / 2;
  const dy = startY - vh / 2;
  const s0 = startSize / size;

  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
  stamp.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, borderRadius: '16px' },
      { transform: `translate(${dx * 0.7}px, ${dy * 0.7 - 24}px) scale(${s0 * 1.08})`, offset: 0.25 },
      { transform: 'translate(0, 0) scale(1.03)', offset: 0.85 },
      { transform: 'translate(0, 0) scale(1)', borderRadius: '24px' },
    ],
    { duration: 1300, easing: ease, fill: 'forwards' }
  );

  // the preview window opens underneath, then the flying stamp dissolves into it
  window.setTimeout(() => {
    onOpen();
    if (src) src.style.visibility = '';
    window.setTimeout(() => {
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
      fade.onfinish = () => {
        root.remove();
        previewBusy = false;
      };
    }, 450);
  }, 1200);
}
