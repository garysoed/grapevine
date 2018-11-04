/**
 * Represents a time in Grapevine.
 * @deprecated Remove all usages.
 */
export class Time {
  constructor(private readonly timestamp_: number) { }

  before(other: Time): boolean {
    return this.timestamp_ < other.timestamp_;
  }

  beforeOrEqualTo(other: Time): boolean {
    return this.timestamp_ <= other.timestamp_;
  }

  equals(other: Time): boolean {
    return this.timestamp_ === other.timestamp_;
  }

  /**
   * Increments the time. This guarantees that the new time is greater than the previous one but
   * does not guarantee equality with other times. E.g.: time.increment() and time.increment() may
   * be different.
   */
  increment(): Time {
    return new Time(this.timestamp_ + 1);
  }

  toString(): string {
    return `Time(${this.timestamp_})`;
  }

  /**
   * Creates a new timestamp. This does not guarantee that two graph times are the same. E.g.
   * Time.new() and Time.new() may have different timestamps.
   */
  static new(): Time {
    return new Time(0);
  }
}
