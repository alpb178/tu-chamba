import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdDto } from './create-ad.dto';
import { BulkCreateAdsDto } from './bulk-create-ads.dto';

// The global pipe uses whitelist + forbidNonWhitelisted (see main.ts): a
// property the DTO doesn't declare rejects the whole request, so these tests
// cover the real payload of the CSV import.
async function errorsOf(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateAdDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

// department and category are required in the DTO (the import always sends
// a default value).
const base = {
  title: 'Mecánico de motos',
  description: 'Prueba',
  department: 'SANTA_CRUZ',
  category: 'MECANICA',
  phone: '77900185',
  jobType: 'A_CONVENIR',
};

describe('CreateAdDto — newspaper import fields', () => {
  it('accepts new job types, new categories, a range, several phones and a reference', async () => {
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

  it('accepts the four added job types', async () => {
    for (const jobType of [
      'POR_CONTRATO',
      'PASANTIA',
      'FREELANCE',
      'A_CONVENIR',
    ]) {
      expect(await errorsOf({ ...base, jobType })).toEqual([]);
    }
  });

  it('accepts the three added categories', async () => {
    for (const category of ['AGROPECUARIA', 'MECANICA', 'MARKETING_DISENO']) {
      expect(await errorsOf({ ...base, category })).toEqual([]);
    }
  });

  it('rejects a salary ceiling without a minimum or below the minimum', async () => {
    const withoutMinimum = await errorsOf({ ...base, salaryMax: 4500 });
    expect(withoutMinimum.join(' ')).toMatch(/salario máximo/i);
    const reversed = await errorsOf({ ...base, salary: 4500, salaryMax: 3500 });
    expect(reversed.join(' ')).toMatch(/salario máximo/i);
  });

  it('tolerates a ceiling equal to the minimum (fixed amount, not a range)', async () => {
    expect(await errorsOf({ ...base, salary: 3500, salaryMax: 3500 })).toEqual(
      [],
    );
  });

  it('rejects more extra phones than the cap', async () => {
    const errors = await errorsOf({
      ...base,
      extraPhones: ['1', '2', '3', '4', '5'],
    });
    expect(errors.join(' ')).toMatch(/teléfonos adicionales/i);
  });

  it('the batch validates each item with the new fields', async () => {
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
