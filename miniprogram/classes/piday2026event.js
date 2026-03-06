export class PiDay2026Event {
  eventId;
  active;
  capacity;
  name;
  registered;
  remaining;
  constructor(eventId, active, capacity, name, registered, remaining) {
    this.eventId = eventId;
    this.active = active;
    this.capacity = capacity;
    this.name = name;
    this.registered = registered;
    this.remaining = remaining;
  }
}