import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ESTADOS_DE_CURSO, MODALIDADES, cursoParaGuardar, slugDesdeTitulo, validarCurso,
  type CursoEntrada, type Errores,
} from '@codice/core';
import { api, ErrorDeApi } from '../comun/api';
import { AreaDeTexto, BotonPrincipal, Campo, Selector } from '../comun/Piezas';
import type { CursoDelPanel } from './tipos';

/**
 * Crear o editar un curso (orden #24 A.1).
 *
 * El slug se propone solo desde el título **mientras nadie lo haya tocado**: al
 * editarlo a mano deja de seguir al título, y en un curso que ya existe no se
 * mueve (cambiarlo rompe los enlaces que ya se compartieron).
 *
 * Los errores salen de `validarCurso()` (`@codice/core`) y se muestran al lado
 * de cada campo. Un slug repetido lo dice la base (409 `SLUG_REPETIDO`) y se
 * muestra en el mismo lugar.
 */
export function FormularioDeCurso({
  curso,
  alGuardar,
  alCancelar,
}: {
  curso: CursoDelPanel | null;
  alGuardar: () => Promise<void>;
  alCancelar: () => void;
}) {
  const { t } = useTranslation();
  const [e, setE] = useState<CursoEntrada>({
    titulo: curso?.titulo ?? '',
    bajada: curso?.bajada ?? '',
    descripcion: curso?.descripcion ?? '',
    modalidad: curso?.modalidad ?? 'presencial',
    slug: curso?.slug ?? '',
    estado: curso?.estado ?? 'borrador',
  });
  const [slugAMano, setSlugAMano] = useState(curso !== null);
  const [errores, setErrores] = useState<Errores<keyof CursoEntrada>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const poner = (campo: keyof CursoEntrada, valor: string) => {
    setE((previo) => {
      const nuevo = { ...previo, [campo]: valor };
      if (campo === 'titulo' && !slugAMano) nuevo.slug = slugDesdeTitulo(valor);
      return nuevo;
    });
  };

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setGeneral(null);
    const encontrados = validarCurso(e);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setGuardando(true);
    try {
      await api(curso ? `equipo/cursos/${curso.id}` : 'equipo/cursos', { metodo: 'POST', cuerpo: cursoParaGuardar(e) });
      await alGuardar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorDeApi ? fallo.codigoDelServidor : undefined;
      if (codigo === 'SLUG_REPETIDO') setErrores({ slug: 'equipo.errores.slugRepetido' });
      else setGeneral(t(codigo === 'SIN_PERMISO' ? 'equipo.errores.sinPermiso' : 'equipo.errores.generico'));
    } finally {
      setGuardando(false);
    }
  }

  const error = (campo: keyof CursoEntrada) => (errores[campo] ? t(errores[campo] as string) : null);

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h3 className="subtitulo">{t(curso ? 'equipo.curso.tituloEditar' : 'equipo.curso.tituloNuevo')}</h3>
      <div className="formulario__rejilla">
        <Campo id="curso-titulo" rotulo={t('equipo.curso.titulo')} value={e.titulo} error={error('titulo')}
          onChange={(x) => poner('titulo', x.target.value)} autoFocus />
        <Campo id="curso-slug" rotulo={t('equipo.curso.slug')} ayuda={t('equipo.curso.slugAyuda')} value={e.slug}
          error={error('slug')} onChange={(x) => { setSlugAMano(true); poner('slug', x.target.value); }} />
        <Campo id="curso-bajada" rotulo={t('equipo.curso.bajada')} ayuda={t('equipo.curso.bajadaAyuda')} value={e.bajada}
          error={error('bajada')} onChange={(x) => poner('bajada', x.target.value)} />
        <Selector id="curso-modalidad" rotulo={t('equipo.curso.modalidad')} value={e.modalidad} error={error('modalidad')}
          onChange={(x) => poner('modalidad', x.target.value)}
          opciones={MODALIDADES.map((m) => ({ valor: m, texto: t(`equipo.modalidades.${m}`) }))} />
        <Selector id="curso-estado" rotulo={t('equipo.curso.estado')} value={e.estado} error={error('estado')}
          onChange={(x) => poner('estado', x.target.value)}
          opciones={ESTADOS_DE_CURSO.map((m) => ({ valor: m, texto: t(`equipo.estadosCurso.${m}`) }))} />
      </div>
      <AreaDeTexto id="curso-descripcion" rotulo={t('equipo.curso.descripcion')} value={e.descripcion} rows={4}
        onChange={(x) => poner('descripcion', x.target.value)} />
      {general ? <p className="error" role="alert">{general}</p> : null}
      <div className="formulario__botones">
        <BotonPrincipal cargando={guardando} textoCargando={t('equipo.guardando')}>{t('equipo.guardar')}</BotonPrincipal>
        <button type="button" className="btn" onClick={alCancelar}>{t('equipo.cancelar')}</button>
      </div>
    </form>
  );
}
