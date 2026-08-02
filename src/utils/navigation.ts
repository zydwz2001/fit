import { useEffect, useRef } from 'react';

type BackHandler = () => boolean;

interface RegisteredBackHandler {
  id: symbol;
  priority: number;
  handler: () => boolean;
}

const backHandlers: RegisteredBackHandler[] = [];

export function useAppBack(handler: BackHandler, priority = 0): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const entry: RegisteredBackHandler = {
      id: Symbol('app-back-handler'),
      priority,
      handler: () => handlerRef.current(),
    };
    backHandlers.push(entry);

    return () => {
      const index = backHandlers.findIndex((item) => item.id === entry.id);
      if (index >= 0) backHandlers.splice(index, 1);
    };
  }, [priority]);
}

export function handleAppBack(): boolean {
  const handlers = [...backHandlers].sort((a, b) => b.priority - a.priority);
  return handlers.some((entry) => entry.handler());
}
