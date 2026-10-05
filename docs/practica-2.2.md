# Práctica 2.2 — Citas médicas

## Equipo y objetivo

| Integrante | Jira | Trabajo previsto | Revisión |
| --- | --- | --- | --- |
| marcos7-eri | choqueerick249@gmail.com | SCRUM-5: validación de reservas en backend | PR de SCRUM-6 |
| 19Suga | russelluna4321@gmail.com | SCRUM-6: fechas y horarios en móvil | PR de SCRUM-5 |

El incremento previsto mejora la reserva de citas: validaciones del servidor, selección de fechas locales y manejo de horarios y errores en móvil. La preparación asistida de archivos no sustituye la participación, revisión ni aprobación real de cada integrante.

## Estrategia de ramificación

Se propone GitHub Flow: main contiene el incremento integrado; cada historia se implementa en una rama corta y se integra por pull request. Para dos integrantes y una entrega única, evita mantener ramas develop y release que no corresponden a versiones paralelas del producto.

Se utilizan estas ramas:

- codex/SCRUM-5-validacion-reservas
- codex/SCRUM-6-reserva-movil
- codex/SCRUM-7-flujo-colaborativo

La clave Jira aparece en rama, mensaje del commit y título del PR. Cada PR enlaza su historia y cada historia enlaza la rama y el PR reales. Un enlace propuesto no prueba que una rama haya sido publicada.

No se necesita un fork cuando ambos integrantes tienen permiso de colaboración en el mismo repositorio. Un fork resulta apropiado para una contribución externa sin permiso de escritura. El acceso de 19Suga al repositorio debe comprobarse antes de decidir definitivamente.

## Flujo de trabajo

1. Revisar criterios de aceptación y dependencias en Jira.
2. Actualizar main y crear una rama con la clave de la historia.
3. Implementar y ejecutar las pruebas aplicables.
4. Crear commits que describan los cambios; publicar únicamente archivos revisados.
5. Abrir un PR a main con enlace Jira, explicación y resultados de pruebas.
6. Solicitar revisión al compañero. Resolver observaciones y conflictos.
7. Integrar después de verificar los criterios. Registrar el commit de integración en Jira.
8. Marcar la historia como terminada cuando existan evidencias.

No incluir secretos, archivos .env, node_modules, .next, dist ni datos reales de pacientes en las nuevas entregas. El repositorio ya contiene artefactos generados versionados; su limpieza requiere un cambio dedicado y revisado.

## Sprint y backlog

Tablero: https://choqueerick249.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog

| Clave | Entregable | Puntos iniciales | Dependencias |
| --- | --- | --- | --- |
| SCRUM-5 | Reservas válidas y errores controlados en backend | 5 | — |
| SCRUM-6 | Selección de fecha y horario en móvil | 5 | Contrato de reservas |
| SCRUM-7 | Guía de ramas y plantilla de PR | — | — |
| SCRUM-8 | Revisión cruzada e integración de PR | — | SCRUM-5, SCRUM-6, SCRUM-7 |
| SCRUM-9 | Pruebas, demostración y retrospectiva | — | Incremento integrado |

Los puntos expresan esfuerzo relativo, no horas. Fechas de inicio, cierre y entrega requieren confirmación del equipo. El sprint de la práctica se preparó como futuro: el tablero tenía otro sprint activo y tareas genéricas.

## Definición de terminado

- Criterios de aceptación verificados.
- Pruebas aplicables aprobadas, con comando y resultado registrados.
- PR revisado por la otra persona y observaciones resueltas.
- Cambios integrados en main; enlaces de rama, PR y commit en Jira.
- Demostración con datos ficticios y limitaciones documentadas.

## Guion de presentación

1. Mostrar el objetivo, backlog y responsables del sprint.
2. Explicar GitHub Flow y el criterio para no usar fork.
3. Abrir SCRUM-5 y su rama/PR; mostrar validaciones y pruebas.
4. Abrir SCRUM-6 y su rama/PR; mostrar fechas, horarios y reserva.
5. Mostrar revisión cruzada y commits integrados.
6. Demostrar una reserva válida, campos incompletos y horario no disponible.
7. Presentar qué mejoró, qué problemas se encontraron y una acción concreta para el próximo sprint.

## Evidencias pendientes

La configuración de Jira y esta guía no significan que el sprint esté completado. Registrar aquí los enlaces publicados, resultados de integración y capturas de la demostración cuando estén verificados. No completar Jira ni presentar aprobaciones, pruebas de integración o participación del compañero que todavía no ocurrieron.
