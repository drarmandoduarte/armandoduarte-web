import {
  IsIn,
  IsInt,
  IsISO8601,
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
 * La forma de lo que el panel manda — orden #24 A.
 *
 * Esto valida **forma**, no negocio: el mensaje claro al lado de cada campo lo
 * da `@codice/core` en la pantalla (`validarCurso`, `validarEdicion`), y la última
 * palabra la tienen los `check` de la base (002). Acá se frena lo que ni
 * siquiera tiene la forma de un curso, antes de gastar un viaje a la base.
 *
 * Los valores de las listas (`borrador`, `presencial`, `abierta`…) son los de
 * los `check` de la 002. Si la base suma uno, se suma acá y en `core`: los tres
 * lugares fallan en rojo si no coinciden (el test de la 002 en el banco y el de
 * `core`).
 */
const NULO_O = (v: unknown) => v !== null && v !== undefined;

export class CursoDto {
  @IsString() @Length(1, 140)
  titulo!: string;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(280)
  bajada?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(8000)
  descripcion?: string | null;

  @IsIn(['presencial', 'en_linea'])
  modalidad!: string;

  @IsString() @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'El slug lleva minúsculas, números y guiones.' })
  slug!: string;

  @IsIn(['borrador', 'publicado', 'archivado'])
  estado!: string;
}

export class EdicionDto {
  @IsISO8601({ strict: true })
  inicio!: string;

  @IsISO8601({ strict: true })
  fin!: string;

  /* IANA, nunca un offset (D15). La base lo vuelve a mirar con `es_zona_iana()`. */
  @IsString() @Matches(/^[A-Za-z]+(\/[A-Za-z0-9_+-]+)+$/, { message: 'La zona es un nombre IANA, como America/Merida.' })
  zona!: string;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(200)
  sede?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(120)
  ciudad?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @Matches(/^[A-Z]{2}$/)
  pais?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsInt() @Min(1)
  cupo?: number | null;

  @IsOptional() @ValidateIf(NULO_O) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precio_monto?: number | null;

  @IsOptional() @ValidateIf(NULO_O) @Matches(/^[A-Z]{3}$/)
  precio_moneda?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsISO8601({ strict: true })
  inscripciones_hasta?: string | null;

  @IsIn(['abierta', 'cerrada', 'realizada'])
  estado!: string;
}

export class EdicionNuevaDto extends EdicionDto {
  @IsUUID()
  curso_id!: string;
}

export class SumarAlEquipoDto {
  @IsUUID()
  persona_id!: string;

  @IsIn(['mexico', 'internacional', 'todos'])
  territorio!: string;
}
