import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('acumula solicitudes, errores y latencia de la última hora', () => {
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

  it('un mismo usuario cuenta una sola vez como conectado', () => {
    const m = new MetricsService();
    m.recordRequest(10, 200, 'u1');
    m.recordRequest(10, 200, 'u1');
    expect(m.snapshot().connectedUsers).toBe(1);
  });

  it('expone la última ejecución del cron', () => {
    const m = new MetricsService();
    expect(m.cronLastRun).toBeNull();
    m.markCronRun();
    expect(m.cronLastRun).toBeInstanceOf(Date);
  });
});
