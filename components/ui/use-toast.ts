'use client';

import * as React from 'react';

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

type ToasterState = ToasterToast[];

const TOAST_REMOVE_DELAY = 1000;

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

type Action =
  | {
      type: 'ADD_TOAST';
      toast: ToasterToast;
    }
  | {
      type: 'UPDATE_TOAST';
      toast: Partial<ToasterToast>;
    }
  | {
      type: 'DISMISS_TOAST';
      toastId?: string;
    }
  | {
      type: 'REMOVE_TOAST';
      toastId?: string;
    };

const reducer = (state: ToasterState, action: Action): ToasterState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [action.toast, ...state].slice(0, 5);
    case 'UPDATE_TOAST':
      return state.map((toast) =>
        toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
      );
    case 'DISMISS_TOAST': {
      const toastId = action.toastId;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return state.map((toast) =>
        toast.id === toastId || toastId === undefined
          ? {
              ...toast,
            }
          : toast,
      );
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return [];
      }
      return state.filter((toast) => toast.id !== action.toastId);
    default:
      return state;
  }
};

const listeners: Array<(state: ToasterState) => void> = [];

let memoryState: ToasterState = [];

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

function toast({ ...props }: Toast) {
  const id = (Math.random() + 1).toString(36).substring(7);

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () =>
    dispatch({
      type: 'DISMISS_TOAST',
      toastId: id,
    });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<ToasterState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toast,
    toasts: state,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { toast, useToast };
