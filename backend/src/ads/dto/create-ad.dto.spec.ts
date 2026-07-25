import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdDto } from './create-ad.dto';
import { BulkCreateAdsDto } from './bulk-create-ads.dto';

// El pipe global usa whitelist + forbidNonWhitelisted (ver main.ts): una
// propiedad que el DTO no declare rechaza toda la petición, así que estas
// pruebas cubren el payload real de la importación por CSV.
async function errorsOf(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateAdDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

// department y category son obligatorios en el DTO (la importación siempre
// manda un valor por defecto).
const base = {
  title: 'Mecánico de motos',
  description: 'Prueba',
  department: 'SANTA_CRUZ',
  category: 'MECANICA',
  phone: '77900185',
  jobType: 'A_CONVENIR',
};

describe('CreateAdDto — campos de la importación de prensa', () => {
  it('acepta jornadas nuevas, rubros nuevos, rango, varios teléfonos y referencia', async () => {
    expect(
      await errorsOf({
        ...base,
        locationReference: 'Frente al mercado Los Pozos',
        salary: 3500,
        salaryMax: 4500,
        extraPhones: ['67894829', '3467010'],
        durationDays: 7,
      }),
    ).toEqual([]);
  });

  it('acepta las cuatro jornadas agregadas', async () => {
    for (const jobType of [
      'POR_CONTRATO',
      'PASANTIA',
      'FREELANCE',
      'A_CONVENIR',
    ]) {
      expect(await errorsOf({ ...base, jobType })).toEqual([]);
    }
  });

  it('acepta los tres rubros agregados', async () => {
    for (const category of ['AGROPECUARIA', 'MECANICA', 'MARKETING_DISENO']) {
      expect(await errorsOf({ ...base, category })).toEqual([]);
    }
  });

  it('rechaza un techo salarial sin mínimo o menor al mínimo', async () => {
    const sinMinimo = await errorsOf({ ...base, salaryMax: 4500 });
    expect(sinMinimo.join(' ')).toMatch(/salario máximo/i);
    const alRevés = await errorsOf({ ...base, salary: 4500, salaryMax: 3500 });
    expect(alRevés.join(' ')).toMatch(/salario máximo/i);
  });

  it('tolera un techo igual al mínimo (monto fijo, no rango)', async () => {
    expect(await errorsOf({ ...base, salary: 3500, salaryMax: 3500 })).toEqual(
      [],
    );
  });

  it('rechaza más teléfonos adicionales que el tope', async () => {
    const errors = await errorsOf({
      ...base,
      extraPhones: ['1', '2', '3', '4', '5'],
    });
    expect(errors.join(' ')).toMatch(/teléfonos adicionales/i);
  });

  it('el lote valida cada item con los campos nuevos', async () => {
    const dto = plainToInstance(BulkCreateAdsDto, {
      items: [
        { ...base, extraPhones: ['67894829'], salary: 3500, salaryMax: 4500 },
        { ...base, category: 'AGROPECUARIA' },
      ],
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors).toEqual([]);
  });
});
