
type EventListener = (data?: any) => void;

class EventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  subscribe(eventName: string, listener: EventListener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);

    // Return an unsubscribe function
    return () => {
      if (this.events[eventName]) {
        this.events[eventName] = this.events[eventName].filter(
          (l) => l !== listener
        );
      }
    };
  }

  emit(eventName: string, data?: any) {
    if (this.events[eventName]) {
      this.events[eventName].forEach((listener) => {
        listener(data);
      });
    }
  }
}

const eventBus = new EventEmitter();

export default eventBus;
