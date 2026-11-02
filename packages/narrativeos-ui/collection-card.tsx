"use client";

import * as Popover from "@radix-ui/react-popover";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";

export type CardAction = {
  id: string;
  label: string;
  href?: string;
  newTab?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type Props = ComponentPropsWithoutRef<"article"> & {
  actions?: CardAction[];
  menuLabel?: string;
};

export function CollectionCard({ children, className = "", actions = [], menuLabel = "更多操作", onContextMenu, onKeyDown, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const article = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const interactedOutside = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const isEditable = (target: EventTarget) => target instanceof HTMLElement && Boolean(target.closest("input, textarea, [contenteditable]:not([contenteditable=false])"));
  function prepareOpen(origin: HTMLElement | null) {
    interactedOutside.current = false;
    returnFocus.current = origin;
  }
  const content = <article {...props} ref={article} className={`nos-collection-card ${className}`} tabIndex={actions.length ? 0 : props.tabIndex}
    onContextMenu={event => {
      onContextMenu?.(event);
      if (event.defaultPrevented || !actions.length || isEditable(event.target)) return;
      event.preventDefault();
      prepareOpen(article.current);
      setPoint({ x: event.clientX, y: event.clientY });
      setOpen(true);
    }}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && !isEditable(event.target) && actions.length && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
        event.preventDefault(); prepareOpen(event.target as HTMLElement); setPoint(null); setOpen(true);
      }
    }}>
    {children}
    {actions.length > 0 && <Popover.Trigger asChild><button ref={trigger} className="nos-card-more" type="button" aria-label={menuLabel} onClick={() => { prepareOpen(trigger.current); setPoint(null); }}>⋯</button></Popover.Trigger>}
  </article>;
  if (!actions.length) return content;
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Anchor virtualRef={{ current: { getBoundingClientRect: () => point
      ? new DOMRect(point.x, point.y, 0, 0)
      : trigger.current?.getBoundingClientRect() || new DOMRect() } }} />
    {content}
    <Popover.Portal><Popover.Content ref={menu} className="nos-card-menu" role="menu" aria-label={menuLabel} align="start" sideOffset={6} collisionPadding={10}
      onOpenAutoFocus={event => {
        event.preventDefault();
        menu.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
      }}
      onInteractOutside={() => { interactedOutside.current = true; }}
      onCloseAutoFocus={event => {
        event.preventDefault();
        const active = document.activeElement;
        // Preserve focus intentionally moved to another card, an input or a dialog.
        if (!interactedOutside.current && (active === document.body || (active instanceof Element && menu.current?.contains(active)))) {
          returnFocus.current?.focus({ preventScroll: true });
        }
      }}
      onKeyDown={event => {
        if (event.key === "Tab") {
          event.preventDefault();
          const stops = Array.from(document.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]'))
            .filter(item => item.tabIndex >= 0 && item.getClientRects().length > 0 && !menu.current?.contains(item));
          const index = stops.indexOf(trigger.current!);
          interactedOutside.current = true;
          setOpen(false);
          stops[index + (event.shiftKey ? -1 : 1)]?.focus();
          return;
        }
        if (event.key === " " && event.target instanceof HTMLAnchorElement) {
          event.preventDefault(); event.target.click(); return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
        const current = items.indexOf(document.activeElement as HTMLElement);
        const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[index]?.focus();
      }}>
      {actions.map(action => {
        const attributes = { role: "menuitem", tabIndex: -1, "aria-disabled": action.disabled || undefined, "data-destructive": action.destructive || undefined,
          onClick: (event: React.MouseEvent) => { if (action.disabled) { event.preventDefault(); return; } action.onSelect?.(); setOpen(false); } };
        return action.href && !action.disabled
          ? <a key={action.id} {...attributes} href={action.href} target={action.newTab ? "_blank" : undefined} rel={action.newTab ? "noopener noreferrer" : undefined}>{action.label}</a>
          : <button key={action.id} {...attributes} type="button" disabled={action.disabled}>{action.label}</button>;
      })}
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
