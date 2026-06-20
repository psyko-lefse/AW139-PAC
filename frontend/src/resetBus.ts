// Tiny event bus so the bottom tab bar's Reset button can clear the
// Calculator screen's state from outside the screen tree.
type Listener = () => void;

const listeners = new Set<Listener>();

export const resetBus = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  emit(): void {
    listeners.forEach((l) => l());
  },
};
