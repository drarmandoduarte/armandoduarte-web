import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Lo que mandan «Ya transferí» y las acciones de Inscriptos — orden #27 C.
 *
 * Forma, no negocio: el mensaje claro al lado de cada campo lo da `@codice/core`
 * en la pantalla (`validarDeclaracion`, `validarResolucion`), y la última
 * palabra la tienen las policies del libro (003). Acá se frena lo que ni
 * siquiera tiene la forma de un pago, antes de gastar un viaje a la base.
 */
const NULO_O = (v: unknown) => v !== null && v !== undefined;

/**
 * La ruta que la pantalla subió a Storage: `<inscripcion_id>/<uuid>.<ext>`, con
 * las tres extensiones del bucket de la 006. Que la carpeta sea **la de esta
 * inscripción** lo comprueba el controlador (403 `RUTA_AJENA`): el DTO no sabe
 * comparar dos campos.
 */
export const PATRON_DE_RUTA_DE_COMPROBANTE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|pdf)$/;

export class DeclararDto {
  @IsUUID()
  inscripcion_id!: string;

  @IsString() @Matches(PATRON_DE_RUTA_DE_COMPROBANTE, { message: 'La ruta del comprobante no tiene la forma esperada.' })
  comprobante_path!: string;

  /* `date` en la base (003): la fecha que dice el comprobante, sin hora. */
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha va como AAAA-MM-DD.' })
  fecha_transferencia!: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
  monto!: number;

  @Matches(/^[A-Z]{3}$/)
  moneda!: string;

  @IsString() @Length(1, 80)
  banco!: string;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(40)
  ultimos4_o_folio?: string | null;
}

export class ResolverDto {
  @IsUUID()
  inscripcion_id!: string;

  @IsIn(['confirmado', 'rechazado', 'anulado'])
  tipo!: 'confirmado' | 'rechazado' | 'anulado';

  /* Si no viene, al confirmar se toma lo declarado. */
  @IsOptional() @ValidateIf(NULO_O) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  monto?: number | null;

  /* El motivo del rechazo o de la anulación: lo que el cliente va a leer. Que
     sea obligatorio en esos dos lo dice el controlador (400 `FALTA_MOTIVO`). */
  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(500)
  nota?: string | null;
}
