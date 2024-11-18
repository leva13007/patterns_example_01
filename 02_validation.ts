import { z as zod } from 'zod';

import { _NAME_MAX_SIZE } from 'config';
import { type Vocab } from 'app/i18n/types';

const channelVarNames: string[] = [
  'first',
  '...others',
];
const systemVarNames: string[] = [
  'first',
  '...others',
];

export const getMemorySchema = (
  tLocal: Vocab,
): zod.ZodType<{
  name: string;
  fieldList: Array<{ key: string; value: string }>;
}> => {
  return zod.object({
    name: zod
      .string()
      .trim()
      .min(1, { message: tLocal.errorEmptyName })
      .max(_NAME_MAX_SIZE, { message: tLocal.errorNameMaxLength }),
    fieldList: zod
      .array(
        zod.object({
          key: zod.string(),
          value: zod.string(),
        }),
      )
      .superRefine((data, ctx) => {
        const allEmpty = data.every(({ key, value }) => key === '' && value === '');
        if (allEmpty) {
          data.forEach((__, index) => {
            ctx.addIssue({
              path: [index, 'key'],
              message: tLocal.errorEmptyContextVariable,
              code: 'custom',
            });
            ctx.addIssue({
              path: [index, 'value'],
              message: tLocal.errorEmptyContextVariableValue,
              code: 'custom',
            });
          });
        }
      })
      .superRefine((data, ctx) => {
        data.forEach(({ key, value }, index) => {
          key = key.trim();
          value = value.trim();
          if (!(key === '' && value === '')) {
            if (key === '') {
              ctx.addIssue({
                path: [index, 'key'],
                message: tLocal.errorEmptyContextVariable,
                code: 'custom',
              });
            }
            if (value === '') {
              ctx.addIssue({
                path: [index, 'value'],
                message: tLocal.errorEmptyContextVariableValue,
                code: 'custom',
              });
            }
            if (key.length > 128) {
              ctx.addIssue({
                path: [index, 'key'],
                message: tLocal.errorNotValidContextVariableName,
                code: 'custom',
              });
            }
            if (!/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/g.test(key)) {
              ctx.addIssue({
                path: [index, 'key'],
                message: tLocal.errorNotValidContextVariableName,
                code: 'custom',
              });
            }
            if (channelVarNames.includes(key) || systemVarNames.includes(key)) {
              ctx.addIssue({
                path: [index, 'key'],
                message: tLocal.errorContextVariableNameNotLegal,
                code: 'custom',
              });
            }
            if (value.length > 1000) {
              ctx.addIssue({
                path: [index, 'value'],
                message: tLocal.errorNotValidValue,
                code: 'custom',
              });
            }
          }
        });
      })
      .superRefine((data, ctx) => {
        const keys = data.map(({ key }) => key).filter((key) => key !== '');
        const duplicates = keys.filter((key, index, array) => array.indexOf(key) !== index);
        if (duplicates.length > 0) {
          data.forEach(({ key }, index) => {
            if (duplicates.includes(key)) {
              ctx.addIssue({
                path: [index, 'key'],
                message: tLocal.errorDuplicateKey,
                code: 'custom',
              });
            }
          });
        }
      }),
  });
};

export type errorsMemory = {
  name: { _errors: string[] };
  fieldList: Record<number, { key?: { _errors: string[] }; value?: { _errors: string[] } }>;
} | null;
