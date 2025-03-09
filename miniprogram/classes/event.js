export class Event {
  eventId;
  eventName;
  eventHost;
  points;
  constructor(eventId, eventName, eventHost, points) {
    this.eventId = eventId;
    this.eventName = eventName;
    this.eventHost = eventHost;
    this.points = points;
  }
}