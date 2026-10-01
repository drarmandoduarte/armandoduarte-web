import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

/**
 * Lo que manda «Me anoto» — orden #24 B.
 *
 * Forma, no negocio: qué campos faltaban lo decide `@codice/core` en la
 * pantalla (`datosQueFaltan`), y el controlador comprueba el piso (ver allí por
 * qué no importa `core`). Los tres datos son opcionales porque solo viajan
 * **los que faltaban** en la ficha.
 */
export class InscribirmeDto {
  @IsUUID()
  edicion_id!: string;

  @IsOptional() @IsString() @MaxLength(80)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(80)
  apellido?: string;

  /* La misma forma que `telefonoParaWa()` de `core` acepta: de 8 a 15 dígitos,
     con `+`, espacios, guiones o paréntesis entre medio. */
  @IsOptional() @IsString() @MaxLength(30)
  @Matches(/^\+?[\d\s().-]*$/, { message: 'El WhatsApp lleva solo números.' })
  @Matches(/^(?:\D*\d){8,15}\D*$/, { message: 'El WhatsApp lleva de 8 a 15 dígitos.' })
  whatsapp?: string;
}
