// src/components/ReportGenerator.js - GENERADOR COMPLETO DE REPORTES PDF
const { useState, useEffect } = React;

const ReportGenerator = ({ tipo, datos, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});

  // Información de la empresa
  const COMPANY_INFO = {
    nombre: 'CONSTRUCCIÓN PRO S.A.',
    direccion: 'Av. Corrientes 1234, CABA, Argentina',
    telefono: '+54 11 4567-8900',
    email: 'info@construccionpro.com.ar',
    cuit: '30-12345678-9',
    web: 'www.construccionpro.com.ar'
  };

  // Logo SVG de la empresa (personalizable)
  const COMPANY_LOGO_SVG = `
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" fill="#667eea" rx="8"/>
      <path d="M20 25h80v5H20zm0 10h60v5H20zm0 10h70v5H20z" fill="white"/>
      <circle cx="85" cy="50" r="15" fill="white" opacity="0.8"/>
      <path d="M85 40l8 10-8 10-8-10z" fill="#667eea"/>
      <text x="60" y="70" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">
        CONSTRUCCIÓN PRO
      </text>
    </svg>
  `;

  // Configuraciones por tipo de reporte
  const REPORT_CONFIGS = {
    relevamiento: {
      titulo: 'RELEVAMIENTO FOTOGRÁFICO DE OBRA',
      subtitulo: 'Documentación visual del progreso de construcción',
      incluir: ['info_obra', 'fotos', 'ubicacion', 'fecha', 'observaciones', 'personal'],
      formato: 'A4_portrait',
      color: '#3B82F6'
    },
    informe_final: {
      titulo: 'INFORME FINAL DE OBRA',
      subtitulo: 'Reporte completo de finalización de proyecto',
      incluir: ['resumen_ejecutivo', 'materiales_usados', 'personal_participante', 'timeline', 'fotos_finales', 'certificaciones'],
      formato: 'A4_portrait',
      color: '#10B981'
    },
    presupuesto: {
      titulo: 'PRESUPUESTO DE OBRA',
      subtitulo: 'Cotización detallada de materiales y mano de obra',
      incluir: ['detalle_materiales', 'costos_mano_obra', 'subtotales', 'impuestos', 'total_general', 'condiciones_comerciales'],
      formato: 'A4_portrait',
      color: '#F59E0B'
    },
    informe_obra: {
      titulo: 'INFORME DIARIO DE OBRA',
      subtitulo: 'Reporte de actividades y avance diario',
      incluir: ['fecha_trabajo', 'personal_presente', 'tareas_realizadas', 'materiales_utilizados', 'avance_porcentual', 'observaciones_diarias'],
      formato: 'A4_portrait',
      color: '#8B5CF6'
    },
    reporte_personal: {
      titulo: 'REPORTE DE GESTIÓN DE PERSONAL',
      subtitulo: 'Análisis de rendimiento y asignaciones',
      incluir: ['estadisticas_generales', 'rendimiento_individual', 'asignaciones_actuales', 'historial_obras', 'evaluaciones'],
      formato: 'A4_portrait',
      color: '#EF4444'
    },
    estadisticas: {
      titulo: 'REPORTE DE ESTADÍSTICAS GENERALES',
      subtitulo: 'Métricas de productividad y rendimiento empresarial',
      incluir: ['metricas_obras', 'eficiencia_personal', 'uso_materiales', 'tendencias_temporales', 'kpis_principales'],
      formato: 'A4_portrait',
      color: '#06B6D4'
    },
    trabajo_diario: {
      titulo: 'REPORTE DE TRABAJOS POR PERÍODO',
      subtitulo: 'Análisis de actividades por fecha y empleado',
      incluir: ['periodo_analizado', 'trabajos_por_fecha', 'trabajos_por_empleado', 'resumen_actividades', 'conclusiones'],
      formato: 'A4_portrait',
      color: '#84CC16'
    },
    informe_obras: {
      titulo: 'REPORTE GENERAL DE OBRAS',
      subtitulo: 'Estado integral de todos los proyectos',
      incluir: ['resumen_general', 'obras_activas', 'obras_completadas', 'asignaciones_personal', 'cronogramas'],
      formato: 'A4_portrait',
      color: '#F97316'
    }
  };

  const config = REPORT_CONFIGS[tipo] || REPORT_CONFIGS.relevamiento;

  useEffect(() => {
    // Inicializar opciones seleccionadas
    const initialOptions = {};
    config.incluir.forEach(option => {
      initialOptions[option] = true;
    });
    setSelectedOptions(initialOptions);
  }, [tipo]);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Simular generación de PDF
      console.log('🎯 Generando PDF:', tipo);
      console.log('📋 Configuración:', config);
      console.log('📊 Datos:', datos);
      console.log('⚙️ Opciones:', selectedOptions);

      // Crear contenido del PDF
      const pdfContent = await createPDFContent();
      
      // Simular descarga
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear elemento de descarga simulado
      const fileName = `${config.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // En una implementación real, aquí usarías jsPDF o similar
      console.log('📄 PDF generado:', fileName);
      console.log('📑 Contenido:', pdfContent);
      
      // Simular descarga del archivo
      const blob = new Blob([pdfContent.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      showNotification('✅ PDF generado exitosamente', 'success');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      showNotification('❌ Error al generar PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const createPDFContent = async () => {
    const header = createHeader();
    const content = await createContent();
    const footer = createFooter();
    
    return {
      text: `${header}\n\n${content}\n\n${footer}`,
      html: createHTMLContent(),
      metadata: {
        titulo: config.titulo,
        fecha: new Date().toLocaleDateString('es-AR'),
        empresa: COMPANY_INFO.nombre
      }
    };
  };

  const createHeader = () => {
    return `
╔══════════════════════════════════════════════════════════════════╗
║                          ${COMPANY_INFO.nombre}                           ║
║                                                                  ║
║  📍 ${COMPANY_INFO.direccion}                    ║
║  📞 ${COMPANY_INFO.telefono} | 📧 ${COMPANY_INFO.email}          ║
║  🌐 ${COMPANY_INFO.web} | 🆔 CUIT: ${COMPANY_INFO.cuit}         ║
╚══════════════════════════════════════════════════════════════════╝

${config.titulo}
${config.subtitulo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha de Emisión: ${new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
🕐 Hora: ${new Date().toLocaleTimeString('es-AR')}
👤 Generado por: Administrador del Sistema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const createContent = async () => {
    let content = '';

    // Contenido específico por tipo de reporte
    switch (tipo) {
      case 'relevamiento':
        content = createRelevamientoContent();
        break;
      case 'informe_final':
        content = createInformeFinalContent();
        break;
      case 'presupuesto':
        content = createPresupuestoContent();
        break;
      case 'informe_obra':
        content = createInformeObraContent();
        break;
      case 'reporte_personal':
        content = createReportePersonalContent();
        break;
      case 'estadisticas':
        content = createEstadisticasContent();
        break;
      case 'trabajo_diario':
        content = createTrabajoDiarioContent();
        break;
      case 'informe_obras':
        content = createInformeObrasContent();
        break;
      default:
        content = createGenericContent();
    }

    return content;
  };

  const createRelevamientoContent = () => {
    const obra = datos.obras?.[0] || {};
    let content = `
📋 INFORMACIÓN GENERAL DE LA OBRA
═══════════════════════════════════════════

🏗️  Nombre de la Obra: ${obra.nombre || 'No especificado'}
📍 Ubicación: ${obra.ubicacion || 'No especificada'}
📅 Fecha de Inicio: ${obra.fecha_creacion ? new Date(obra.fecha_creacion).toLocaleDateString('es-AR') : 'No registrada'}
👷 Responsable: ${obra.albanil_nombre || 'No asignado'} ${obra.albanil_apellido || ''}
🛠️  Supervisor: ${obra.jefe_nombre || 'No asignado'} ${obra.jefe_apellido || ''}
📊 Estado Actual: ${obra.estado || 'Sin estado'}

`;

    if (selectedOptions.fotos && datos.fotos?.length > 0) {
      content += `
📸 REGISTRO FOTOGRÁFICO
═══════════════════════════════════════════

Total de fotografías documentadas: ${datos.fotos.length}

`;
      datos.fotos.forEach((foto, index) => {
        content += `
📷 Fotografía ${index + 1}
├─ Descripción: ${foto.descripcion || 'Sin descripción'}
├─ Fecha: ${foto.fecha || 'No registrada'}
├─ Ubicación: ${foto.ubicacion || 'No especificada'}
└─ [IMAGEN INSERTADA AQUÍ]

`;
      });
    }

    if (selectedOptions.observaciones && obra.descripcion) {
      content += `
📝 OBSERVACIONES GENERALES
═══════════════════════════════════════════

${obra.descripcion}

`;
    }

    return content;
  };

  const createInformeFinalContent = () => {
    const obra = datos.obras?.[0] || {};
    let content = `
📊 RESUMEN EJECUTIVO
═══════════════════════════════════════════

✅ Obra Completada: ${obra.nombre || 'No especificado'}
📅 Período de Ejecución: ${obra.fecha_creacion ? new Date(obra.fecha_creacion).toLocaleDateString('es-AR') : 'No registrada'} - ${new Date().toLocaleDateString('es-AR')}
📍 Ubicación del Proyecto: ${obra.ubicacion || 'No especificada'}
👥 Equipo de Trabajo: ${datos.personal?.length || 0} profesionales

`;

    if (selectedOptions.materiales_usados && datos.materiales?.length > 0) {
      content += `
🧱 MATERIALES UTILIZADOS
═══════════════════════════════════════════

`;
      datos.materiales.forEach(material => {
        content += `• ${material.nombre}: ${material.cantidad || 'N/A'} ${material.unidad || 'unidades'}\n`;
      });
      content += '\n';
    }

    if (selectedOptions.personal_participante && datos.personal?.length > 0) {
      content += `
👥 PERSONAL PARTICIPANTE
═══════════════════════════════════════════

`;
      datos.personal.forEach(empleado => {
        content += `• ${empleado.nombre} ${empleado.apellido} - ${empleado.rol}\n`;
      });
      content += '\n';
    }

    content += `
🎯 CONCLUSIONES
═══════════════════════════════════════════

La obra se ha completado satisfactoriamente cumpliendo con los estándares 
de calidad establecidos y en los tiempos previstos.

✅ Objetivos alcanzados
✅ Calidad garantizada
✅ Plazos cumplidos
✅ Seguridad laboral mantenida

`;

    return content;
  };

  const createPresupuestoContent = () => {
    let content = `
💰 DETALLE DE PRESUPUESTO
═══════════════════════════════════════════

Cliente: [Completar con datos del cliente]
Proyecto: ${datos.obras?.[0]?.nombre || 'Proyecto de Construcción'}
Fecha de Cotización: ${new Date().toLocaleDateString('es-AR')}
Validez: 30 días

`;

    if (selectedOptions.detalle_materiales && datos.materiales?.length > 0) {
      content += `
🧱 MATERIALES Y SUMINISTROS
═══════════════════════════════════════════

`;
      let totalMateriales = 0;
      datos.materiales.forEach(material => {
        const precio = material.precio_estimado || 0;
        const cantidad = 1; // Default quantity
        const subtotal = precio * cantidad;
        totalMateriales += subtotal;
        
        content += `• ${material.nombre.padEnd(30)} | $${precio.toFixed(2).padStart(10)} x ${cantidad} = $${subtotal.toFixed(2).padStart(12)}\n`;
      });
      
      content += `${''.padEnd(50, '─')}\n`;
      content += `SUBTOTAL MATERIALES: $${totalMateriales.toFixed(2).padStart(20)}\n\n`;
    }

    if (selectedOptions.costos_mano_obra) {
      const costoManoObra = 50000; // Valor ejemplo
      content += `
👷 MANO DE OBRA
═══════════════════════════════════════════

• Mano de obra especializada          $${costoManoObra.toFixed(2).padStart(12)}
• Supervisión técnica                 $${(costoManoObra * 0.2).toFixed(2).padStart(12)}

SUBTOTAL MANO DE OBRA:               $${(costoManoObra * 1.2).toFixed(2).padStart(12)}

`;
    }

    const subtotal = 100000; // Valor ejemplo
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    content += `
📊 RESUMEN GENERAL
═══════════════════════════════════════════

Subtotal:                            $${subtotal.toFixed(2).padStart(12)}
IVA (21%):                           $${iva.toFixed(2).padStart(12)}
${''.padEnd(50, '═')}
TOTAL GENERAL:                       $${total.toFixed(2).padStart(12)}

💡 CONDICIONES COMERCIALES
═══════════════════════════════════════════

• Forma de pago: 50% anticipado, 50% contra entrega
• Plazo de ejecución: [A determinar según proyecto]
• Garantía: 12 meses sobre trabajos realizados
• Los materiales serán de primera calidad
• El presupuesto incluye limpieza final de obra

`;

    return content;
  };

  const createInformeObraContent = () => {
    const informe = datos;
    let content = `
📅 INFORMACIÓN DEL INFORME DIARIO
═══════════════════════════════════════════

🏗️  Obra: ${informe.obra_nombre || 'No especificada'}
📅 Fecha del Trabajo: ${informe.fecha ? informe.fecha.toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
👷 Jefe de Obra: ${informe.jefe_nombre || 'No especificado'}
🌤️  Condiciones Climáticas: ${informe.clima || 'Normales'}

`;

    if (selectedOptions.personal_presente && informe.personal_presente?.length > 0) {
      content += `
👥 PERSONAL PRESENTE
═══════════════════════════════════════════

`;
      informe.personal_presente.forEach(persona => {
        content += `• ${persona.nombre} - ${persona.rol || 'Operario'}\n`;
      });
      content += '\n';
    }

    if (selectedOptions.tareas_realizadas && informe.avance_descripcion) {
      content += `
🔨 TAREAS REALIZADAS
═══════════════════════════════════════════

${informe.avance_descripcion}

`;
    }

    if (selectedOptions.materiales_utilizados && informe.materiales_usados?.length > 0) {
      content += `
🧱 MATERIALES UTILIZADOS
═══════════════════════════════════════════

`;
      informe.materiales_usados.forEach(material => {
        content += `• ${material.nombre}: ${material.cantidad} ${material.unidad}\n`;
      });
      content += '\n';
    }

    if (selectedOptions.avance_porcentual && informe.porcentaje_avance) {
      content += `
📊 PROGRESO DE LA OBRA
═══════════════════════════════════════════

Avance del día: ${informe.porcentaje_avance}%
${'█'.repeat(Math.floor(informe.porcentaje_avance / 5))}${'░'.repeat(20 - Math.floor(informe.porcentaje_avance / 5))} ${informe.porcentaje_avance}%

`;
    }

    if (selectedOptions.observaciones_diarias && informe.observaciones) {
      content += `
📝 OBSERVACIONES Y NOVEDADES
═══════════════════════════════════════════

${informe.observaciones}

`;
    }

    return content;
  };

  const createReportePersonalContent = () => {
    const { usuarios, albaniles, jefesDeObra, obras } = datos;
    let content = `
👥 ESTADÍSTICAS GENERALES DEL PERSONAL
═══════════════════════════════════════════

📊 Resumen General:
• Total de empleados activos: ${usuarios?.filter(u => u.activo).length || 0}
• Albañiles: ${albaniles?.length || 0}
• Jefes de obra: ${jefesDeObra?.length || 0}
• Obras asignadas: ${obras?.length || 0}

`;

    if (selectedOptions.rendimiento_individual && albaniles?.length > 0) {
      content += `
🎯 RENDIMIENTO POR ALBAÑIL
═══════════════════════════════════════════

`;
      albaniles.forEach(albanil => {
        const obrasAsignadas = obras?.filter(o => o.albanil_asignado === albanil.id).length || 0;
        content += `👷 ${albanil.nombre} ${albanil.apellido}
   ├─ Obras asignadas: ${obrasAsignadas}
   ├─ Estado: ${albanil.activo ? '🟢 Activo' : '🔴 Inactivo'}
   └─ Último acceso: ${albanil.ultima_conexion ? new Date(albanil.ultima_conexion).toLocaleDateString('es-AR') : 'Nunca'}

`;
      });
    }

    if (selectedOptions.asignaciones_actuales && obras?.length > 0) {
      content += `
📋 ASIGNACIONES ACTUALES
═══════════════════════════════════════════

`;
      obras.forEach(obra => {
        content += `🏗️  ${obra.nombre}
   ├─ Ubicación: ${obra.ubicacion}
   ├─ Estado: ${obra.estado}
   ├─ Albañil: ${obra.albanil_nombre} ${obra.albanil_apellido}
   └─ Supervisor: ${obra.jefe_nombre || 'Sin asignar'} ${obra.jefe_apellido || ''}

`;
      });
    }

    return content;
  };

  const createEstadisticasContent = () => {
    const { obras, usuarios, albaniles, jefesDeObra, stats } = datos;
    let content = `
📈 MÉTRICAS PRINCIPALES
═══════════════════════════════════════════

🎯 KPIs Generales:
• Obras completadas: ${obras?.filter(o => o.estado === 'completada').length || 0}
• Obras en progreso: ${obras?.filter(o => o.estado === 'en_progreso').length || 0}
• Tasa de finalización: ${obras?.length > 0 ? Math.round((obras.filter(o => o.estado === 'completada').length / obras.length) * 100) : 0}%
• Personal activo: ${usuarios?.filter(u => u.activo).length || 0}

📊 ANÁLISIS DE PRODUCTIVIDAD
═══════════════════════════════════════════

• Promedio de obras por albañil: ${albaniles?.length > 0 ? Math.round((obras?.length || 0) / albaniles.length * 10) / 10 : 0}
• Supervisores disponibles: ${jefesDeObra?.filter(j => j.activo).length || 0}
• Relación supervisor/obra: ${obras?.length > 0 && jefesDeObra?.length > 0 ? Math.round((obras.length / jefesDeObra.length) * 10) / 10 : 0}

📈 TENDENCIAS
═══════════════════════════════════════════

${obras?.length > 0 ? 
`• Total de proyectos gestionados: ${obras.length}
• Distribución por estado:
  ✅ Completadas: ${obras.filter(o => o.estado === 'completada').length} (${Math.round((obras.filter(o => o.estado === 'completada').length / obras.length) * 100)}%)
  🔄 En progreso: ${obras.filter(o => o.estado === 'en_progreso').length} (${Math.round((obras.filter(o => o.estado === 'en_progreso').length / obras.length) * 100)}%)
  ⏳ Pendientes: ${obras.filter(o => o.estado === 'pendiente').length} (${Math.round((obras.filter(o => o.estado === 'pendiente').length / obras.length) * 100)}%)` 
: '• No hay datos suficientes para generar tendencias'}

`;

    return content;
  };

  const createTrabajoDiarioContent = () => {
    const { informesObra, albaniles, obras } = datos;
    let content = `
📅 ANÁLISIS DE TRABAJOS POR PERÍODO
═══════════════════════════════════════════

🗓️  Período analizado: Últimos 30 días
📊 Total de informes procesados: ${informesObra?.length || 0}
🏗️  Obras activas en el período: ${obras?.filter(o => o.estado === 'en_progreso').length || 0}

`;

    if (selectedOptions.trabajos_por_fecha && informesObra?.length > 0) {
      content += `
📅 TRABAJOS POR FECHA
═══════════════════════════════════════════

`;
      // Agrupar informes por fecha
      const informesPorFecha = {};
      informesObra.forEach(informe => {
        const fecha = informe.fecha ? informe.fecha.toLocaleDateString('es-AR') : 'Sin fecha';
        if (!informesPorFecha[fecha]) {
          informesPorFecha[fecha] = [];
        }
        informesPorFecha[fecha].push(informe);
      });

      Object.entries(informesPorFecha).forEach(([fecha, informes]) => {
        content += `📅 ${fecha} - ${informes.length} informe(s)\n`;
        informes.forEach(informe => {
          content += `   └─ ${informe.obra_nombre} (${informe.jefe_nombre})\n`;
        });
        content += '\n';
      });
    }

    if (selectedOptions.trabajos_por_empleado && albaniles?.length > 0) {
      content += `
👷 ACTIVIDAD POR EMPLEADO
═══════════════════════════════════════════

`;
      albaniles.forEach(albanil => {
        const obrasAsignadas = obras?.filter(o => o.albanil_asignado === albanil.id).length || 0;
        content += `👤 ${albanil.nombre} ${albanil.apellido}
   ├─ Obras asignadas: ${obrasAsignadas}
   └─ Estado: ${albanil.activo ? 'Activo' : 'Inactivo'}

`;
      });
    }

    return content;
  };

  const createInformeObrasContent = () => {
    const { obras, albaniles, jefesDeObra } = datos;
    let content = `
🏗️  ESTADO GENERAL DE OBRAS
═══════════════════════════════════════════

📊 Resumen General:
• Total de obras registradas: ${obras?.length || 0}
• Obras activas: ${obras?.filter(o => o.estado === 'en_progreso').length || 0}
• Obras completadas: ${obras?.filter(o => o.estado === 'completada').length || 0}
• Obras pendientes: ${obras?.filter(o => o.estado === 'pendiente').length || 0}

`;

    if (selectedOptions.obras_activas && obras?.length > 0) {
      const obrasActivas = obras.filter(o => o.estado === 'en_progreso');
      if (obrasActivas.length > 0) {
        content += `
🔄 OBRAS EN PROGRESO
═══════════════════════════════════════════

`;
        obrasActivas.forEach(obra => {
          content += `🏗️  ${obra.nombre}
   ├─ 📍 Ubicación: ${obra.ubicacion}
   ├─ 👷 Albañil: ${obra.albanil_nombre} ${obra.albanil_apellido}
   ├─ 🛠️  Supervisor: ${obra.jefe_nombre || 'Sin asignar'} ${obra.jefe_apellido || ''}
   └─ 📅 Inicio: ${obra.fecha_creacion ? new Date(obra.fecha_creacion).toLocaleDateString('es-AR') : 'No registrada'}

`;
        });
      }
    }

    if (selectedOptions.obras_completadas && obras?.length > 0) {
      const obrasCompletas = obras.filter(o => o.estado === 'completada');
      if (obrasCompletas.length > 0) {
        content += `
✅ OBRAS COMPLETADAS
═══════════════════════════════════════════

`;
        obrasCompletas.forEach(obra => {
          content += `✅ ${obra.nombre}
   ├─ 📍 Ubicación: ${obra.ubicacion}
   ├─ 👷 Ejecutor: ${obra.albanil_nombre} ${obra.albanil_apellido}
   └─ 📅 Finalizada: ${obra.fecha_finalizacion ? new Date(obra.fecha_finalizacion).toLocaleDateString('es-AR') : 'No registrada'}

`;
        });
      }
    }

    if (selectedOptions.asignaciones_personal) {
      content += `
👥 DISTRIBUCIÓN DE PERSONAL
═══════════════════════════════════════════

📊 Asignaciones actuales:
• Albañiles con obras: ${obras?.filter(o => o.albanil_asignado).length || 0}
• Albañiles disponibles: ${(albaniles?.length || 0) - (obras?.filter(o => o.albanil_asignado).length || 0)}
• Supervisores activos: ${jefesDeObra?.filter(j => j.activo).length || 0}

`;
    }

    return content;
  };

  const createGenericContent = () => {
    return `
📋 CONTENIDO DEL REPORTE
═══════════════════════════════════════════

Este es un reporte generado automáticamente por el sistema.

Datos incluidos:
${Object.keys(datos).map(key => `• ${key}: ${typeof datos[key] === 'object' ? JSON.stringify(datos[key]).substring(0, 50) + '...' : datos[key]}`).join('\n')}

Opciones seleccionadas:
${Object.entries(selectedOptions).filter(([key, value]) => value).map(([key]) => `• ${key}`).join('\n')}

`;
  };

  const createHTMLContent = () => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.titulo}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid ${config.color}; padding-bottom: 20px; }
        .logo { width: 120px; height: 80px; margin: 0 auto 20px; }
        .content { margin: 20px 0; }
        .section { margin: 20px 0; }
        .footer { border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">${COMPANY_LOGO_SVG}</div>
        <h1>${config.titulo}</h1>
        <p>${config.subtitulo}</p>
    </div>
    <div class="content">
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
        <p><strong>Generado por:</strong> Sistema Construcción Pro</p>
        <!-- Aquí iría el contenido específico del reporte -->
    </div>
    <div class="footer">
        <p>${COMPANY_INFO.nombre} - ${COMPANY_INFO.direccion}</p>
        <p>${COMPANY_INFO.telefono} | ${COMPANY_INFO.email}</p>
    </div>
</body>
</html>
    `;
  };

  const createFooter = () => {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 INFORMACIÓN DEL DOCUMENTO
═══════════════════════════════════════════

📅 Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}
🕐 Hora de generación: ${new Date().toLocaleTimeString('es-AR')}
🏢 Empresa: ${COMPANY_INFO.nombre}
📧 Contacto: ${COMPANY_INFO.email}
📞 Teléfono: ${COMPANY_INFO.telefono}

───────────────────────────────────────────────────────────────────

Este documento fue generado automáticamente por el Sistema de Gestión 
de Construcción Pro. Para consultas o aclaraciones, contacte a nuestro 
equipo técnico.

🔒 Documento confidencial - Uso interno únicamente
📋 ID del Reporte: ${Date.now().toString(36).toUpperCase()}

╚══════════════════════════════════════════════════════════════════╝`;
  };

  const showNotification = (message, type) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const toggleOption = (option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const getOptionLabel = (option) => {
    const labels = {
      info_obra: 'Información de la obra',
      fotos: 'Registro fotográfico',
      ubicacion: 'Ubicación GPS',
      fecha: 'Fecha y hora',
      observaciones: 'Observaciones',
      personal: 'Personal asignado',
      resumen_ejecutivo: 'Resumen ejecutivo',
      materiales_usados: 'Materiales utilizados',
      personal_participante: 'Personal participante',
      timeline: 'Cronograma',
      fotos_finales: 'Fotografías finales',
      certificaciones: 'Certificaciones',
      detalle_materiales: 'Detalle de materiales',
      costos_mano_obra: 'Costos de mano de obra',
      subtotales: 'Subtotales',
      impuestos: 'Impuestos y retenciones',
      total_general: 'Total general',
      condiciones_comerciales: 'Condiciones comerciales',
      fecha_trabajo: 'Fecha del trabajo',
      personal_presente: 'Personal presente',
      tareas_realizadas: 'Tareas realizadas',
      materiales_utilizados: 'Materiales utilizados',
      avance_porcentual: 'Avance porcentual',
      observaciones_diarias: 'Observaciones diarias',
      estadisticas_generales: 'Estadísticas generales',
      rendimiento_individual: 'Rendimiento individual',
      asignaciones_actuales: 'Asignaciones actuales',
      historial_obras: 'Historial de obras',
      evaluaciones: 'Evaluaciones',
      metricas_obras: 'Métricas de obras',
      eficiencia_personal: 'Eficiencia del personal',
      uso_materiales: 'Uso de materiales',
      tendencias_temporales: 'Tendencias temporales',
      kpis_principales: 'KPIs principales',
      periodo_analizado: 'Período analizado',
      trabajos_por_fecha: 'Trabajos por fecha',
      trabajos_por_empleado: 'Trabajos por empleado',
      resumen_actividades: 'Resumen de actividades',
      conclusiones: 'Conclusiones',
      resumen_general: 'Resumen general',
      obras_activas: 'Obras activas',
      obras_completadas: 'Obras completadas',
      asignaciones_personal: 'Asignaciones de personal',
      cronogramas: 'Cronogramas'
    };
    return labels[option] || option.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            📄 {config.titulo}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Preview del reporte */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
          <div className="text-center mb-4">
            <div className="w-24 h-16 mx-auto mb-2 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">📄</span>
            </div>
            <h3 className="font-bold text-lg" style={{ color: config.color }}>{COMPANY_INFO.nombre}</h3>
            <p className="text-sm text-gray-600">{COMPANY_INFO.direccion}</p>
            <p className="text-sm text-gray-600">{COMPANY_INFO.telefono} | {COMPANY_INFO.email}</p>
          </div>
          
          <hr className="my-4" />
          
          <h4 className="font-bold text-center mb-2" style={{ color: config.color }}>{config.titulo}</h4>
          <p className="text-center text-sm text-gray-600 mb-4">{config.subtitulo}</p>
          
          <div className="space-y-2 text-sm">
            <p><strong>📅 Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>🕐 Hora:</strong> {new Date().toLocaleTimeString('es-AR')}</p>
            <p><strong>📋 Tipo:</strong> {config.titulo}</p>
            
            <div className="mt-4">
              <strong>📊 Contenido incluido:</strong>
              <ul className="list-disc list-inside ml-4 mt-2">
                {Object.entries(selectedOptions)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => (
                    <li key={key} className="text-green-600">✅ {getOptionLabel(key)}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Opciones de configuración */}
        <div className="mb-6">
          <h5 className="font-semibold mb-3 text-gray-800">⚙️ Configurar contenido del reporte:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {config.incluir.map(item => (
              <div key={item} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  id={item}
                  checked={selectedOptions[item] || false}
                  onChange={() => toggleOption(item)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={item} className="text-sm cursor-pointer flex-1">
                  {getOptionLabel(item)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h6 className="font-semibold text-blue-800 mb-2">ℹ️ Información del PDF:</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>📄 Formato:</strong> {config.formato}</p>
              <p><strong>🎨 Color corporativo:</strong> <span style={{ color: config.color }}>●</span> {config.color}</p>
              <p><strong>📋 Páginas estimadas:</strong> 2-5</p>
            </div>
            <div>
              <p><strong>🏢 Logo:</strong> Incluido automáticamente</p>
              <p><strong>📧 Información de contacto:</strong> Incluida</p>
              <p><strong>🔢 ID único:</strong> Generado automáticamente</p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-4">
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              isGenerating 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'text-white hover:opacity-90 transform hover:scale-105'
            }`}
            style={{ backgroundColor: config.color }}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <span className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Generando PDF...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                📄 Generar PDF Profesional
              </span>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Nota técnica */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 <strong>Nota:</strong> En la implementación final, este generador utilizará librerías como jsPDF 
          o Puppeteer para crear PDFs reales con formato profesional.
        </div>
      </div>
    </div>
  );
};

// Hacer disponible globalmente
window.ReportGenerator = ReportGenerator;