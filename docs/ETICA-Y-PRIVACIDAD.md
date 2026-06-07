# Ética, privacidad y seguridad · Ventum (Criterio 7)

## Riesgos identificados y mitigaciones

| Riesgo | Mitigación implementada |
|---|---|
| **La IA se equivoca en una alergia** (riesgo de salud) | La decisión de compatibilidad la toma un **motor determinista** sobre ingredientes reales, no el LLM. Sheila muestra siempre un **disclaimer** ("confirma alergias graves con el personal"). Las alergias se **resaltan en rojo** en cocina. |
| **Exposición de datos sensibles** | El **PIN del personal** y el inventario sólo se acceden vía backend (`stores`, `ingredients` **sin políticas** para el rol anónimo en RLS). El menú es lo único de lectura pública. |
| **Acceso no autorizado del personal** | PIN centralizado (`validateStaffPin`). En producción se recomienda migrar a **Supabase Auth** con roles (documentado en el esquema). |
| **Manipulación de precios/estados desde el cliente** | Las políticas RLS permiten al cliente crear pedidos pero el cálculo de totales y los cambios de estado/cobro se hacen en el backend con `service_role`. |
| **Datos personales del comensal** | No se solicitan datos personales para pedir (sólo mesa + PIN de mesa). No se almacena información sensible del cliente. |
| **Condiciones de carrera en inventario** | Función SQL atómica `decrement_ingredient` para mermas concurrentes. |

## Principios
- **Minimización de datos:** sólo se captura lo necesario para operar.
- **Transparencia:** el cliente sabe que habla con una IA (Sheila se presenta como "mesera digital").
- **Supervisión humana:** la IA asiste, el personal decide en casos críticos (alergias, cobros).
- **Accesibilidad:** alto contraste, textos legibles, controles grandes y compatibilidad móvil.
- **Sin "dark patterns":** las ofertas y sugerencias son claras y no engañosas.

## Pendientes recomendados para producción
- Migrar autenticación de staff a Supabase Auth (eliminar PIN compartido).
- Política de privacidad y consentimiento de notificaciones.
- Auditoría de accesos y cifrado de tokens de notificación.
- Revisión legal de manejo de datos según normativa local (ej. Ley 1581 de 2012 en Colombia).
