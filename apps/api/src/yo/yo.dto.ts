import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

/**
 * Lo que guarda «Tus datos» — orden #27 D.2.
 *
 * Todo opcional y todo **nulable**: `null` borra el dato (nada es obligatorio,
 * D.1). Forma, no negocio: el mensaje claro al lado de cada campo lo da
 * `@codice/core` (`validarPerfil`) y la última palabra la tienen los `check` de
 * la 001 y la 011. El tope del año («hace 14 años») lo mira el controlador,
 * porque depende de hoy.
 */
const NULO_O = (v: unknown) => v !== null && v !== undefined;

export const NIVELES = ['primaria', 'secundaria', 'preparatoria', 'licenciatura', 'posgrado', 'prefiero_no_decir'] as const;

export class PerfilDto {
  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(80)
  nombre?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(80)
  apellido?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(30)
  @Matches(/^\+?[\d\s().-]*$/, { message: 'El WhatsApp lleva solo números.' })
  @Matches(/^(?:\D*\d){8,15}\D*$/, { message: 'El WhatsApp lleva de 8 a 15 dígitos.' })
  whatsapp?: string | null;

  /* ISO-2, como el `check` de la 001. */
  @IsOptional() @ValidateIf(NULO_O) @Matches(/^[A-Z]{2}$/)
  pais?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsString() @MaxLength(120)
  ciudad?: string | null;

  @IsOptional() @ValidateIf(NULO_O) @IsInt() @Min(1920) @Max(9999)
  anio_nacimiento?: number | null;

  @IsOptional() @ValidateIf(NULO_O) @IsIn(NIVELES)
  nivel_educativo?: string | null;

  /** #34 B.3: Ajustes → Notificaciones. Sí o no; `null` no (la columna es `not null`). */
  @IsOptional() @IsBoolean()
  avisos_por_correo?: boolean;
}
