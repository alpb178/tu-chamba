import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('accumulates requests, errors and latency for the last hour', () => {
    const m = new MetricsService();
    m.recordRequest(100, 200, 'u1');
    m.recordRequest(300, 200, 'u2');
    m.recordRequest(200, 500);

    const s = m.snapshot();
    expect(s.requestsLastHour).toBe(3);
    expect(s.errorsLastHour).toBe(1);
    expect(s.avgResponseMs).toBe(200);
    expect(s.connectedUsers).toBe(2);
  });

  it('the same user counts only once as connected', () => {
    const m = new MetricsService();
    m.recordRequest(10, 200, 'u1');
    m.recordRequest(10, 200, 'u1');
    expect(m.snapshot().connectedUsers).toBe(1);
  });

  it('exposes the last cron run', () => {
    const m = new MetricsService();
    expect(m.cronLastRun).toBeNull();
    m.markCronRun();
    expect(m.cronLastRun).toBeInstanceOf(Date);
  });
});
