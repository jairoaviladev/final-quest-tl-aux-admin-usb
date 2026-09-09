/**
 * Reloj de cuenta regresiva. Emite un tick cada segundo con los
 * segundos restantes y avisa cuando el tiempo se agota.
 */
export interface CountdownHandlers {
  onTick: (secondsLeft: number) => void;
  onExpire: () => void;
}

export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export class Countdown {
  private intervalId: number | null = null;
  private expired = false;

  constructor(
    private readonly endsAt: Date,
    private readonly handlers: CountdownHandlers,
  ) {}

  private computeLeft(): number {
    return Math.max(0, Math.round((this.endsAt.getTime() - Date.now()) / 1000));
  }

  start(): void {
    this.tick();
    this.intervalId = window.setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    const left = this.computeLeft();
    this.handlers.onTick(left);
    if (left <= 0 && !this.expired) {
      this.expired = true;
      this.stop();
      this.handlers.onExpire();
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
